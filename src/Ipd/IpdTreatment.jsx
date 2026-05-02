import { useEffect, useState, useRef } from "react";
import { Trash2, Edit2, X, Check, Plus } from "lucide-react";
import { getIpdById, medicine, updateIpd, createMedicine, deleteIpddMedicine, updateIpdMedicine } from "../services/ipd.services";

export default function IpdTreatmentUpdate({ id }) {
  const [flattenedTreatments, setFlattenedTreatments] = useState([]);
  const [medicineList, setMedicineList] = useState([]);
  const [loading, setLoading] = useState({});
  const [editMode, setEditMode] = useState({ dateIndex: null, treatmentIndex: null });

  // ADD FORM
  const [form, setForm] = useState({
    medicine_name: "",
    medicine_id: null,
    dosage: "",
  });

  // EDIT FORM STATE
  const [editForm, setEditForm] = useState({
    medicine_name: "",
    medicine_id: null,
    dosage: "",
  });

  const [addResults, setAddResults] = useState([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [medicineHighlightIndex, setMedicineHighlightIndex] = useState(-1);
  const [editResults, setEditResults] = useState([]);
  const [showEditDropdown, setShowEditDropdown] = useState(false);

  // Refs for input fields
  const medicineInputRef = useRef(null);
  const dosageSelectRef = useRef(null);
  const addButtonRef = useRef(null);

  // Dosage options
  const dosageOptions = ["1-1-0", "1-1-1", "1-0-1", "0-1-1", "0-0-1", "0-1-0", "1-0-0", "0.5-0-0.5", "SOS", "STAT", "PRN", "HS", "AC", "PC", "BID", "TID", "QID", "QD", "BBF", "BD", "Custom"];

  useEffect(() => {
    const loadAll = async () => {
      const masterList = await fetchMedicine();
      await fetchTreatments(masterList);
    };
    loadAll();
  }, [id]);

  const resolveMedicineName = (id, currentList = medicineList) => {
    if (!id) return "-";
    const list = Array.isArray(currentList) ? currentList : [];
    const found = list.find(m => String(m.id) === String(id));
    return found ? found.medicine_name : "-";
  };

  const fetchTreatments = async (currentMasterList = medicineList) => {
    try {
      const res = await getIpdById(id);
      let ipdData = res;
      if (res && res.data) {
        ipdData = Array.isArray(res.data) ? res.data[0] : res.data;
      }
      const treatments = ipdData?.daily_given_treatment || [];
      const flatList = [];

      treatments.forEach((dateEntry, dateIndex) => {
        (dateEntry.given_treatment || []).forEach((treatment, treatmentIndex) => {
          const mId = treatment.medicine_data?.id || treatment.medicine_data;
          const mName = treatment.medicine_data?.medicine_name || resolveMedicineName(mId, currentMasterList);
          const dateObj = new Date(dateEntry.datetime);

          flatList.push({
            dateIndex,
            treatmentIndex,
            medicine_id: mId,
            medicine_name: mName,
            dosage: treatment.dosage,
            datetime: dateEntry.datetime,
            formatted_date: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            formatted_time: dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            intake_type: treatment.intake_type || ""
          });
        });
      });

      // Sort by datetime descending
      flatList.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
      setFlattenedTreatments(flatList);
    } catch (error) {
      console.error("Error fetching treatments:", error);
      setFlattenedTreatments([]);
    }
  };

  const fetchMedicine = async () => {
    try {
      const res = await medicine();
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (Array.isArray(res.results)) data = res.results;
      else if (Array.isArray(res.data)) data = res.data;
      setMedicineList(data);
      return data;
    } catch (error) {
      console.error("Error fetching medicine:", error);
      setMedicineList([]);
      return [];
    }
  };

  const handleSearchInput = (value) => {
    setForm({ ...form, medicine_name: value });
    setMedicineHighlightIndex(-1);
    if (value.trim()) {
      const filtered = medicineList.filter(m => m.medicine_name?.toLowerCase().includes(value.toLowerCase()));
      setAddResults(filtered);
      setShowAddDropdown(true);
    } else {
      setAddResults([]);
      setShowAddDropdown(false);
    }
  };

  const selectMedicine = (med) => {
    setForm({
      ...form,
      medicine_name: med.medicine_name,
      medicine_id: med.id,
      dosage: med.dosage || "1-0-1",
    });
    setShowAddDropdown(false);
    setTimeout(() => { dosageSelectRef.current?.focus(); }, 100);
  };

  const findOrCreateMedicine = async (name, dosage) => {
    const existing = medicineList.find(m => m.medicine_name?.toLowerCase() === name.toLowerCase());
    if (existing) return { id: existing.id, isNew: false };
    try {
      const newMedicine = await createMedicine({ medicine_name: name, dosage: dosage || "1-0-1" });
      const createdMedicine = newMedicine.data || newMedicine;
      setMedicineList(prev => [...prev, createdMedicine]);
      return { id: createdMedicine.id, isNew: true };
    } catch (error) {
      console.error("Error creating medicine:", error);
      throw error;
    }
  };

  const handleMedicineKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMedicineHighlightIndex(prev => prev < addResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMedicineHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showAddDropdown && medicineHighlightIndex >= 0 && medicineHighlightIndex < addResults.length) {
        selectMedicine(addResults[medicineHighlightIndex]);
      } else {
        dosageSelectRef.current?.focus();
      }
    }
  };

  const handleAdd = async () => {
    if (!form.medicine_name.trim() || !form.dosage) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading({ add: true });
      const result = await findOrCreateMedicine(form.medicine_name, form.dosage);
      const newTreatment = { dosage: form.dosage, medicine_data: result.id };
      const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const payload = { datetime: currentDateTime, given_treatment: [newTreatment] };

      await updateIpd(id, { daily_given_treatment: [payload] });
      setForm({ medicine_name: "", medicine_id: null, dosage: "" });
      await fetchTreatments();
      medicineInputRef.current?.focus();
    } catch (error) {
      console.error("Error adding treatment:", error);
      alert("Failed to add treatment");
    } finally {
      setLoading({ add: false });
    }
  };

  const handleDelete = async (dateIndex, treatmentIndex, label) => {
    if (!window.confirm(`Delete this treatment row: ${label}?`)) return;
    try {
      setLoading({ [`delete-${dateIndex}-${treatmentIndex}`]: true });
      await deleteIpddMedicine(id, dateIndex);
      await fetchTreatments();
    } catch (error) {
      console.error("Error deleting treatment:", error);
      alert("Failed to delete treatment");
    } finally {
      setLoading({ [`delete-${dateIndex}-${treatmentIndex}`]: false });
    }
  };

  const startEdit = (treatment) => {
    setEditMode({ dateIndex: treatment.dateIndex, treatmentIndex: treatment.treatmentIndex });
    setEditForm({
      medicine_name: treatment.medicine_name || "",
      medicine_id: treatment.medicine_id,
      dosage: treatment.dosage || "",
    });
  };

  const cancelEdit = () => {
    setEditMode({ dateIndex: null, treatmentIndex: null });
    setEditForm({ medicine_name: "", medicine_id: null, dosage: "" });
    setShowEditDropdown(false);
  };

  const handleEditSearchInput = (value) => {
    setEditForm({ ...editForm, medicine_name: value });
    if (value.trim()) {
      const filtered = medicineList.filter(m => m.medicine_name?.toLowerCase().includes(value.toLowerCase()));
      setEditResults(filtered);
      setShowEditDropdown(true);
    } else {
      setEditResults([]);
      setShowEditDropdown(false);
    }
  };

  const selectMedicineForEdit = (med) => {
    setEditForm({ ...editForm, medicine_name: med.medicine_name, medicine_id: med.id, dosage: med.dosage || "1-0-1" });
    setShowEditDropdown(false);
  };

  const handleUpdate = async (originalDateIndex, originalTreatmentIndex) => {
    if (!editForm.medicine_name.trim() || !editForm.dosage) {
      alert("Please fill all required fields");
      return;
    }
    try {
      setLoading({ update: true });
      const result = await findOrCreateMedicine(editForm.medicine_name, editForm.dosage);
      const payload = { dosage: editForm.dosage, medicine_data: result.id };
      await updateIpdMedicine(id, originalDateIndex, payload);
      cancelEdit();
      await fetchTreatments();
    } catch (error) {
      console.error("Error updating treatment:", error);
      alert("Failed to update treatment");
    } finally {
      setLoading({ update: false });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-gray-800">Rx (IPD Treatment)</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-44">Date / Time</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Medicine Name</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-40">Dosage</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-24">Action</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 italic">
              <tr className="bg-blue-50/30 border-b-2 border-blue-100">
                <td className="px-4 py-3 text-sm font-bold text-blue-600">NEW</td>
                <td className="px-4 py-3 text-xs text-gray-500 font-bold">
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • Just Now
                </td>
                <td className="px-4 py-3 relative">
                  <input
                    ref={medicineInputRef}
                    placeholder="Search medicine..."
                    value={form.medicine_name}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={handleMedicineKeyDown}
                    onBlur={() => setTimeout(() => setShowAddDropdown(false), 200)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none h-9 mt-1"
                  />
                  {showAddDropdown && addResults.length > 0 && (
                    <div className="absolute z-50 w-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                      {addResults.map((med, index) => (
                        <div
                          key={med.id}
                          onMouseDown={() => selectMedicine(med)}
                          onMouseEnter={() => setMedicineHighlightIndex(index)}
                          className={`px-4 py-3 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${medicineHighlightIndex === index ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                        >
                          <div className="font-semibold">{med.medicine_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    ref={dosageSelectRef}
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none h-9 mt-1"
                  >
                    <option value="" disabled>Dosage</option>
                    {dosageOptions.map((dosage, idx) => (
                      <option key={idx} value={dosage}>{dosage}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    ref={addButtonRef}
                    onClick={handleAdd}
                    disabled={loading.add}
                    className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 active:scale-95 flex items-center justify-center w-9 h-9 ml-auto"
                    title="Add Treatment"
                  >
                    {loading.add ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Plus size={18} />}
                  </button>
                </td>
              </tr>

              {flattenedTreatments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-gray-400 italic bg-gray-50/30">
                    No treatments recorded. Use the "NEW" row above to add medicines.
                  </td>
                </tr>
              ) : (
                flattenedTreatments.map((item, idx) => (
                  <tr key={`${item.dateIndex}-${item.treatmentIndex}`} className="hover:bg-blue-50/40 transition-colors not-italic">
                    <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{item.formatted_date}</span>
                        <span className="text-[10px] text-gray-500">{item.formatted_time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editMode.dateIndex === item.dateIndex && editMode.treatmentIndex === item.treatmentIndex ? (
                        <div className="relative">
                          <input
                            value={editForm.medicine_name}
                            onChange={(e) => handleEditSearchInput(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-8"
                            autoFocus
                          />
                          {showEditDropdown && editResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                              {editResults.map((med) => (
                                <div
                                  key={med.id}
                                  onMouseDown={() => selectMedicineForEdit(med)}
                                  className="px-3 py-2 hover:bg-blue-600 hover:text-white cursor-pointer text-sm transition-colors font-medium"
                                >
                                  {med.medicine_name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-800">{item.medicine_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editMode.dateIndex === item.dateIndex && editMode.treatmentIndex === item.treatmentIndex ? (
                        <select
                          value={editForm.dosage}
                          onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-8"
                        >
                          {dosageOptions.map((d, i) => <option key={i} value={d}>{d}</option>)}
                        </select>
                      ) : (
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-100 uppercase">
                          {item.dosage}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editMode.dateIndex === item.dateIndex && editMode.treatmentIndex === item.treatmentIndex ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleUpdate(item.dateIndex, item.treatmentIndex)}
                            disabled={loading.update}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.dateIndex, item.treatmentIndex, item.medicine_name)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                            disabled={loading[`delete-${item.dateIndex}-${item.treatmentIndex}`]}
                          >
                            {loading[`delete-${item.dateIndex}-${item.treatmentIndex}`] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}