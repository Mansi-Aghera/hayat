import { useEffect, useState, useRef } from "react";
import { getIpdById, updateIpd, updateSystemeticExamination, deleteSystemeticExamination } from "../services/ipd.services";
import { Trash2, Edit2, X, Check, Plus } from "lucide-react";

export default function SystemeticExaminationUpdate({ id }) {
  const [systemeticExaminations, setSystemeticExaminations] = useState([]);
  const [loading, setLoading] = useState({});
  const [editMode, setEditMode] = useState(null);



  // Refs for keyboard navigation
  const paRef = useRef(null);
  const rsRef = useRef(null);
  const cnsRef = useRef(null);
  const cvsRef = useRef(null);
  const dateRef = useRef(null);
  const addButtonRef = useRef(null);

  // ADD FORM
  const [form, setForm] = useState({
    PA: "",
    RS: "",
    CNS: "",
    CVS: "",
    date_time: new Date().toISOString().slice(0, 16) // Current datetime for form
  });

  // EDIT FORM STATE
  const [editForm, setEditForm] = useState({
    PA: "",
    RS: "",
    CNS: "",
    CVS: "",
    date_time: ""
  });

  useEffect(() => {
    fetchSystemeticExaminations();
  }, [id]);

  // 🔹 FETCH SYSTEMETIC EXAMINATIONS
  const fetchSystemeticExaminations = async () => {
    try {
      const res = await getIpdById(id);
      
      // Handle potential data structures: { data: { ... } }, { data: [ ... ] }, or { ... }
      let ipdData = res;
      if (res && res.data) {
        ipdData = Array.isArray(res.data) ? res.data[0] : res.data;
      }
      
      const exams = ipdData?.systemetic_examination || [];
      
      // Format date_time for display
      const formattedExams = exams.map((exam, index) => ({
        ...exam,
        index: index,
        formatted_date: exam.date_time 
          ? new Date(exam.date_time).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'No date'
      }));
      
      setSystemeticExaminations(formattedExams);
    } catch (error) {
      console.error("Error fetching systematic examinations:", error);
      setSystemeticExaminations([]);
    }
  };

  // 🔹 HANDLE INPUT CHANGE FOR ADD FORM
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // 🔹 HANDLE INPUT CHANGE FOR EDIT FORM
  const handleEditInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 🔹 HANDLE KEYBOARD NAVIGATION
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  // 🔹 ADD NEW SYSTEMETIC EXAMINATION
  const handleAdd = async () => {
    // Validate required fields
    if (!form.PA || !form.RS || !form.CNS || !form.CVS) {
      alert("Please fill all fields (PA, RS, CNS, CVS)");
      return;
    }

    try {
      setLoading({ add: true });

      // Prepare payload with current date_time if not provided
      const payload = {
        ...form,
        date_time: form.date_time || new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      // Get current examinations
      const currentExams = [payload];

      // Update via updateIpd endpoint
      await updateIpd(id, {
        systemetic_examination: currentExams
      });

      // Reset form and refresh
      setForm({
        PA: "",
        RS: "",
        CNS: "",
        CVS: "",
        date_time: new Date().toISOString().slice(0, 16)
      });
      await fetchSystemeticExaminations();
      
      setTimeout(() => {
        paRef.current?.focus();
      }, 100);
      
      
    } catch (error) {
      console.error("Error adding systematic examination:", error);
      alert("Failed to add systematic examination");
    } finally {
      setLoading({ add: false });
    }
  };

  // 🔹 DELETE SYSTEMETIC EXAMINATION
  const handleDelete = async (index) => {
    if (window.confirm("Are you sure you want to delete this systematic examination?")) {
      try {
        setLoading({ [`delete-${index}`]: true });
        
        // Use specific delete endpoint
        await deleteSystemeticExamination(id, index);
        
        // Refresh the list
        await fetchSystemeticExaminations();

      } catch (error) {
        console.error("Error deleting systematic examination:", error);
        alert("Failed to delete systematic examination");
      } finally {
        setLoading({ [`delete-${index}`]: false });
      }
    }
  };

  // 🔹 START EDIT
  const startEdit = (exam, originalIndex) => {
    setEditMode(originalIndex);
    setEditForm({
      PA: exam.PA.toString(),
      RS: exam.RS.toString(),
      CNS: exam.CNS.toString(),
      CVS: exam.CVS.toString(),
      date_time: exam.date_time ? exam.date_time.slice(0, 16) : new Date().toISOString().slice(0, 16)
    });
  };

  // 🔹 CANCEL EDIT
  const cancelEdit = () => {
    setEditMode(null);
    setEditForm({
      PA: "",
      RS: "",
      CNS: "",
      CVS: "",
      date_time: ""
    });
  };

  // 🔹 UPDATE SYSTEMETIC EXAMINATION
  const handleUpdate = async (originalIndex) => {
    // Validate required fields
    if (!editForm.PA || !editForm.RS || !editForm.CNS || !editForm.CVS) {
      alert("Please fill all fields (PA, RS, CNS, CVS)");
      return;
    }

    try {
      setLoading({ update: true });
      
      // Prepare payload with current date_time if not provided
      const payload = {
        PA: editForm.PA,
        RS: editForm.RS,
        CNS: editForm.CNS,
        CVS: editForm.CVS,
        date_time: editForm.date_time 
          ? editForm.date_time.slice(0, 19).replace('T', ' ')
          : new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
    console.log(payload)
    console.log(id, originalIndex)
      // Use specific update endpoint
      let res = await updateSystemeticExamination(id, originalIndex, payload);
      console.log("Update response:", res);
      // Reset and refresh
      cancelEdit();
      await fetchSystemeticExaminations();
      
    } catch (error) {
      console.error("Error updating systematic examination:", error);
      alert("Failed to update systematic examination");
    } finally {
      setLoading({ update: false });
    }
  };

  // 🔹 RESET ADD FORM
  const resetAddForm = () => {
    setForm({
      PA: "",
      RS: "",
      CNS: "",
      CVS: "",
      date_time: new Date().toISOString().slice(0, 16)
    });
  };

  return (
    <div className="max-w-6xl">
      {/* INLINE HEADER + ADD SECTION */}
      <div className="">
        <div className="flex items-start gap-4 mb-4">
          {/* Title - inline */}
          <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[140px]">Systemic Examination</h2>

          {/* Form fields */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 items-end">
                {/* RS Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    RS (Respiratory System)
                  </label>
                  <input
                    ref={rsRef}
                    type="text"
                    placeholder="e.g. Clear breath sounds, no wheeze"
                    value={form.RS}
                    onChange={(e) => handleInputChange('RS', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, cvsRef)}
                    className="border rounded-lg px-3 py-1 w-full"
                    autoFocus
                  />
                </div>

                {/* CVS Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    CVS (Cardiovascular System)
                  </label>
                  <input
                    ref={cvsRef}
                    type="text"
                    placeholder="e.g. S1 S2 normal, no murmur"
                    value={form.CVS}
                    onChange={(e) => handleInputChange('CVS', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, cnsRef)}
                    className="border rounded-lg px-3 py-1 w-full"
                  />
                </div>

                {/* CNS Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    CNS (Central Nervous System)
                  </label>
                  <input
                    ref={cnsRef}
                    type="text"
                    placeholder="e.g. Conscious, oriented"
                    value={form.CNS}
                    onChange={(e) => handleInputChange('CNS', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, paRef)}
                    className="border rounded-lg px-3 py-1 w-full"
                  />
                </div>

                {/* PA Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    PA (Per Abdomen)
                  </label>
                  <input
                    ref={paRef}
                    type="text"
                    placeholder="e.g. Soft, non-tender"
                    value={form.PA}
                    onChange={(e) => handleInputChange('PA', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, dateRef)}
                    className="border rounded-lg px-3 py-1 w-full"
                  />
                </div>

                {/* Date Time Input */}
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Date & Time
                  </label>
                  <input
                    ref={dateRef}
                    type="datetime-local"
                    value={form.date_time}
                    onChange={(e) => handleInputChange('date_time', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, addButtonRef)}
                    className="border rounded-lg px-3 py-1 w-full"
                  />
                </div>

                {/* Action Button */}
                <div className="">
                  <button
                    ref={addButtonRef}
                    onClick={handleAdd}
                    disabled={loading.add}
                    className="w-full bg-blue-600 text-white h-[34px] rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-bold text-sm shadow-sm transition-all active:scale-95"
                  >
                    {loading.add ? "..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* LIST OF SYSTEMIC EXAMINATIONS - ALWAYS VISIBLE */}
      <div>
            
        {systemeticExaminations.length === 0 ? (
          ""
            ) : (
              <div className="space-y-4">
                {systemeticExaminations.map((exam) => (
                  <div
                    key={exam.index}
                    className=""
                  >
                    {editMode === exam.index ? (
                      // EDIT MODE
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* RS Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              RS
                            </label>
                            <input
                              type="text"
                              value={editForm.RS}
                              onChange={(e) => handleEditInputChange('RS', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="Enter RS"
                            />
                          </div>

                          {/* CVS Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              CVS
                            </label>
                            <input
                              type="text"
                              value={editForm.CVS}
                              onChange={(e) => handleEditInputChange('CVS', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="Enter CVS"
                            />
                          </div>

                          {/* CNS Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              CNS
                            </label>
                            <input
                              type="text"
                              value={editForm.CNS}
                              onChange={(e) => handleEditInputChange('CNS', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="Enter CNS"
                            />
                          </div>

                          {/* PA Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              PA
                            </label>
                            <input
                              type="text"
                              value={editForm.PA}
                              onChange={(e) => handleEditInputChange('PA', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="Enter PA"
                            />
                          </div>

                          {/* Date Time Edit */}
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Date & Time
                            </label>
                            <input
                              type="datetime-local"
                              value={editForm.date_time}
                              onChange={(e) => handleEditInputChange('date_time', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleUpdate(exam.index)}
                            disabled={loading.update}
                            className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {loading.update ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check size={16} />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="border border-gray-300 px-4 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // VIEW MODE
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-700">RS: {exam.RS}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-700">CVS: {exam.CVS}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-700">CNS: {exam.CNS}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-700">PA: {exam.PA}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-[11px] text-gray-500 flex gap-1 px-1">
                              <span>Recorded on:</span>
                              <span className="">{exam.formatted_date}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(exam, exam.index)}
                              disabled={loading[`edit-${exam.index}`]}
                              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(exam.index)}
                              disabled={loading[`delete-${exam.index}`]}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              {loading[`delete-${exam.index}`] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}