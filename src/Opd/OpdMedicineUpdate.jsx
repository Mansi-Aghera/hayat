import { useEffect, useState, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import { getOpdById, medicine, updateOpd, createMedicine, deleteOpdMedicine, updateOpdMedicine } from "../services/opd.services";

export default function OpdMedicineUpdate({ id }) {
  const [opd, setOpd] = useState({ given_medicine: [] });
  const [medicineList, setMedicineList] = useState([]);
  const [loading, setLoading] = useState({});

  // ADD FORM
  const [form, setForm] = useState({
    medicine_name: "",
    medicine_id: null,
    quantity: "",
    doses: "",
    intake_type: "",
  });

  const [addResults, setAddResults] = useState([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [medicineHighlightIndex, setMedicineHighlightIndex] = useState(-1);

  // Refs for input fields
  const medicineInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const dosesInputRef = useRef(null);
  const intakeTypeInputRef = useRef(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    fetchOpd();
    fetchMedicine();
  }, [id]);

  // 🔹 FETCH OPD
  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const opdData = Array.isArray(res.data) ? res.data[0] : res.data;
      
      // Transform the data
      const transformedMedicine = (opdData?.given_medicine || []).map((item, index) => {
        const rawMedData = item.medicine_data;
        const extractedId = typeof rawMedData === "object" && rawMedData !== null ? rawMedData.id : rawMedData;
        const extractedName = typeof rawMedData === "object" && rawMedData !== null ? rawMedData.medicine_name : null;

        const med = medicineList.find(m => m.id === extractedId || m.id === Number(extractedId));

        return {
          index: index,
          medicine_id: extractedId || med?.id,
          medicine_name: extractedName || med?.medicine_name || item.medicine_name || "",
          quantity: item.quantity,
          doses: item.doses,
          intake_type: item.intake_type,
        };
      });
      
      setOpd({
        ...opdData,
        given_medicine: transformedMedicine,
      });
    } catch (error) {
      console.error("Error fetching OPD:", error);
    }
  };

  // 🔹 FETCH MASTER MEDICINE
  const fetchMedicine = async () => {
    try {
      const res = await medicine();
      let data = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (Array.isArray(res.results)) {
        data = res.results;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }

      setMedicineList(data);
      
      if (opd.given_medicine && opd.given_medicine.length > 0) {
        fetchOpd();
      }
    } catch (error) {
      console.error("Error fetching medicine:", error);
      setMedicineList([]);
    }
  };

  const handleSearchInput = (value) => {
    setForm({ ...form, medicine_name: value });
    setMedicineHighlightIndex(-1);

    if (value.trim()) {
        const filtered = medicineList.filter(m =>
        m.medicine_name?.toLowerCase().includes(value.toLowerCase())
        );
        setAddResults(filtered);
        setShowAddDropdown(true);
    } else {
        setAddResults([]);
        setShowAddDropdown(false);
    }
  };

  const selectMedicine = (med) => {
    setForm({
      medicine_name: med.medicine_name,
      medicine_id: med.id,
      quantity: med.quantity || "",        
      doses: med.dosage || "",            
      intake_type: med.meal_time || ""    
    });
    setShowAddDropdown(false);
    
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 100);
  };

  const findOrCreateMedicine = async (name, quantity, doses, intake_type) => {
    const existing = medicineList.find(
      m => m.medicine_name?.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) {
      return { id: existing.id, medicine_name: existing.medicine_name, isNew: false };
    }
    
    try {
      const newMedicine = await createMedicine({ 
        medicine_name: name,
        dosage: doses || "1-0-1",
        meal_time: intake_type || "After Meal",
        quantity: quantity || "10"
      });
      const createdMedicine = newMedicine.data || newMedicine;
      setMedicineList(prev => [...prev, createdMedicine]);
      return { id: createdMedicine.id, medicine_name: createdMedicine.medicine_name, isNew: true };
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
        quantityInputRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch(nextField) {
        case 'quantity': quantityInputRef.current?.focus(); break;
        case 'doses': dosesInputRef.current?.focus(); break;
        case 'intake_type': intakeTypeInputRef.current?.focus(); break;
        case 'add': addButtonRef.current?.click(); break;
        default: medicineInputRef.current?.focus();
      }
    }
  };

  const handleAdd = async () => {
    if (!form.medicine_name.trim() || !form.quantity || !form.doses || !form.intake_type) {
      alert("Please fill all fields: Medicine, Quantity, Doses, and Intake Type");
      return;
    }

    try {
      setLoading({ add: true });
      const result = await findOrCreateMedicine(form.medicine_name, form.quantity, form.doses, form.intake_type);
      const newEntry = {
        medicine_data: result.id,
        quantity: form.quantity,
        doses: form.doses,
        intake_type: form.intake_type
      };

      // The backend appends new entries when using updateOpd with given_medicine,
      // so we only send the new entry in a list.
      await updateOpd(id, {
        given_medicine: [newEntry],
      });

      setForm({ medicine_name: "", medicine_id: null, quantity: "", doses: "", intake_type: "" });
      setAddResults([]);
      setShowAddDropdown(false);
      await fetchOpd();
      medicineInputRef.current?.focus();
    } catch (error) {
      console.error("Error adding medicine:", error);
      alert("Failed to add medicine");
    } finally {
      setLoading({ add: false });
    }
  };

  const handleDelete = async (index) => {
      try {
        setLoading({ [index]: true });
        await deleteOpdMedicine(id, index);
        await fetchOpd();
      } catch (error) {
        console.error("Error deleting medicine:", error);
        alert("Failed to delete medicine");
      } finally {
        setLoading({ [index]: false });
      }
    };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-6">
        <h2 className="text-base font-bold text-gray-700 uppercase tracking-tight">Rx (Prescription)</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border-y border-gray-100">
          <thead>
            <tr className="bg-gray-50/50">
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Medicine Name</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32">Doses</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-44">Intake Type</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-24">Qty</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-24">Action</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-100 italic">
              {/* INPUT ROW */}
              <tr className="bg-blue-50/30 border-b-2 border-blue-100">
                <td className="px-4 py-3 text-sm font-bold text-blue-600">NEW</td>
                <td className="px-4 py-3 relative">
                  <input
                    ref={medicineInputRef}
                    placeholder="Search medicine..."
                    value={form.medicine_name}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={handleMedicineKeyDown}
                    onBlur={() => setTimeout(() => setShowAddDropdown(false), 200)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
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
                          <div className={`text-[10px] ${medicineHighlightIndex === index ? 'text-blue-100' : 'text-gray-500'}`}>
                            {med.dosage && <span className="mr-2">Dose: {med.dosage}</span>}
                            {med.meal_time && <span className="mr-2">• {med.meal_time}</span>}
                            {med.quantity && <span>• Qty: {med.quantity}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    ref={dosesInputRef}
                    value={form.doses}
                    onChange={(e) => setForm({ ...form, doses: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, 'intake_type')}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="" disabled>Dose</option>
                    {["1-1-0", "1-1-1", "1-0-1", "0-1-1", "0-0-1", "0-1-0", "1-0-0", "SOS", "STAT", "PRN", "HS", "AC", "PC", "BID", "TID", "QID", "QD", "BBF", "BD"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    ref={intakeTypeInputRef}
                    value={form.intake_type}
                    onChange={(e) => setForm({ ...form, intake_type: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, 'add')}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="" disabled>Type</option>
                    {["Before Meal", "After Meal", "With Meal", "Anytime"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    ref={quantityInputRef}
                    type="number"
                    placeholder="Qty"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, 'doses')}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-center"
                    min="1"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    ref={addButtonRef}
                    onClick={handleAdd}
                    disabled={loading.add}
                    className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 active:scale-95 flex items-center justify-center w-10 h-10 ml-auto"
                    title="Add Medicine"
                  >
                    {loading.add ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Plus size={20} />
                    )}
                  </button>
                </td>
              </tr>

              {/* DATA ROWS */}
              {opd.given_medicine.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-400 italic bg-gray-50/30">
                    No medicines registered. Use the row above to add medicines.
                  </td>
                </tr>
              ) : (
                opd.given_medicine.map((item, index) => (
                  <tr key={item.index || index} className="hover:bg-blue-50/40 transition-colors not-italic">
                    <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">
                      {item.medicine_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-100">
                        {item.doses}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                      {item.intake_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-black text-center">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(item.index)}
                        disabled={loading[item.index]}
                        className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-90 disabled:opacity-50"
                        title="Delete medicine"
                      >
                        {loading[item.index] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };