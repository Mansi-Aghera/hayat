import { useEffect, useState, useRef } from "react";
import { getIpdById, updateIpd, updateGeneralExamination, deleteGeneralExamination } from "../services/ipd.services";
import { Trash2, Edit2, X, Check, Plus } from "lucide-react";

export default function GeneralExaminationUpdate({ id }) {
  const [generalExaminations, setGeneralExaminations] = useState([]);
  const [loading, setLoading] = useState({});
  const [editMode, setEditMode] = useState(null);



  // Refs for keyboard navigation
  const tempRef = useRef(null);
  const pulseRef = useRef(null);
  const rrRef = useRef(null);
  const bpSysRef = useRef(null);
  const bpDiaRef = useRef(null);
  const spo2Ref = useRef(null);
  const sugarRef = useRef(null);
  const dateRef = useRef(null);
  const addButtonRef = useRef(null);

  // ADD FORM
  const [form, setForm] = useState({
    temperature: "",
    pulse: "",
    RR: "",
    bp_systolic: "",
    bp_diastolic: "",
    SPO2: "",
    sugar: "",
    date_time: new Date().toISOString().slice(0, 16)
  });

  // EDIT FORM STATE
  const [editForm, setEditForm] = useState({
    temperature: "",
    pulse: "",
    RR: "",
    bp_systolic: "",
    bp_diastolic: "",
    SPO2: "",
    sugar: "",
    date_time: ""
  });

  useEffect(() => {
    fetchGeneralExaminations();
  }, [id]);

  // 🔹 FETCH GENERAL EXAMINATIONS
  const fetchGeneralExaminations = async () => {
    try {
      const res = await getIpdById(id);
      
      // Handle potential data structures: { data: { ... } }, { data: [ ... ] }, or { ... }
      let ipdData = res;
      if (res && res.data) {
        ipdData = Array.isArray(res.data) ? res.data[0] : res.data;
      }
      
      const exams = ipdData?.general_examination || [];
      
      console.log("Fetched general exams:", exams);
      
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
      
      setGeneralExaminations(formattedExams);
    } catch (error) {
      console.error("Error fetching general examinations:", error);
      setGeneralExaminations([]);
    }
  };

  // 🔹 HANDLE INPUT CHANGE FOR ADD FORM
  const handleInputChange = (field, value) => {
    const numericFields = ['temperature', 'pulse', 'RR', 'bp_systolic','bp_diastolic', 'SPO2', 'sugar'];
    
    if (numericFields.includes(field)) {
      // Allow empty string or numbers
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setForm(prev => ({ ...prev, [field]: value }));
      }
    } else if (field === 'date_time') {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // 🔹 HANDLE INPUT CHANGE FOR EDIT FORM
  const handleEditInputChange = (field, value) => {
      const numericFields = ['temperature', 'pulse', 'RR', 'bp_systolic','bp_diastolic', 'SPO2', 'sugar']
    
    if (numericFields.includes(field)) {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setEditForm(prev => ({ ...prev, [field]: value }));
      }
    } else if (field === 'date_time') {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // 🔹 HANDLE KEYBOARD NAVIGATION
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  // 🔹 ADD NEW GENERAL EXAMINATION
  const handleAdd = async () => {
    // Validate required fields
    const requiredFields = ['temperature', 'pulse', 'RR', 'bp_systolic','bp_diastolic', 'SPO2', 'sugar']
    const missingFields = requiredFields.filter(field => !form[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading({ add: true });

      // Prepare payload with current date_time if not provided
      const payload = {
        temperature: form.temperature,
        pulse: form.pulse,
        RR: form.RR,
        BP: `${form.bp_systolic}/${form.bp_diastolic}`,
        SPO2: form.SPO2,
        sugar: form.sugar,
        date_time: form.date_time || new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      // Get current examinations
      const currentExams = [payload];

      // Update via updateIpd endpoint
      await updateIpd(id, {
        general_examination: currentExams
      });

      // Reset form and refresh
      setForm({
        temperature: "",
        pulse: "",
        RR: "",
        bp_systolic: "",
        bp_diastolic: "",
        SPO2: "",
        sugar: "",
        date_time: new Date().toISOString().slice(0, 16)
      });
      await fetchGeneralExaminations();
      
      setTimeout(() => {
        tempRef.current?.focus();
      }, 100);
      
      
    } catch (error) {
      console.error("Error adding general examination:", error);
      alert("Failed to add general examination");
    } finally {
      setLoading({ add: false });
    }
  };

  // 🔹 DELETE GENERAL EXAMINATION
  const handleDelete = async (index) => {
    if (window.confirm("Are you sure you want to delete this general examination?")) {
      try {
        setLoading({ [`delete-${index}`]: true });
        
        // Use specific delete endpoint (assuming it exists)
        await deleteGeneralExamination(id, index);
        
        // Refresh the list
        await fetchGeneralExaminations();

      } catch (error) {
        console.error("Error deleting general examination:", error);
        alert("Failed to delete general examination");
      } finally {
        setLoading({ [`delete-${index}`]: false });
      }
    }
  };

  // 🔹 START EDIT
  const startEdit = (exam, originalIndex) => {
    console.log("Starting edit for exam:", exam);
    setEditMode(originalIndex);
    setEditForm({
      temperature: exam.temperature ? exam.temperature.toString() : "",
      pulse: exam.pulse ? exam.pulse.toString() : "",
      RR: exam.RR ? exam.RR.toString() : "",
      bp_systolic: exam.BP ? exam.BP.split('/')[0] : "",
      bp_diastolic: exam.BP ? exam.BP.split('/')[1] : "",
      SPO2: exam.SPO2 ? exam.SPO2.toString() : "",
      sugar: exam.sugar ? exam.sugar.toString() : "",
      date_time: exam.date_time 
        ? new Date(exam.date_time).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)
    });
  };

  // 🔹 CANCEL EDIT
  const cancelEdit = () => {
    setEditMode(null);
    setEditForm({
      temperature: "",
      pulse: "",
      RR: "",
      bp_systolic: "",
      bp_diastolic: "",
      SPO2: "",
      sugar: "",
      date_time: ""
    });
  };

  // 🔹 UPDATE GENERAL EXAMINATION
  const handleUpdate = async (originalIndex) => {
    // Validate required fields
    const requiredFields = ['temperature', 'pulse', 'RR', 'bp_systolic','bp_diastolic', 'SPO2', 'sugar'];
    const missingFields = requiredFields.filter(field => !editForm[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading({ update: true });
      
      // Prepare payload
      const payload = {
        temperature: editForm.temperature,
        pulse: editForm.pulse,
        RR: editForm.RR,
        BP: `${editForm.bp_systolic}/${editForm.bp_diastolic}`,
        SPO2: editForm.SPO2,
        sugar: editForm.sugar,
        date_time: editForm.date_time 
          ? editForm.date_time.slice(0, 19).replace('T', ' ')
          : new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      
      console.log("Update payload:", payload);
      console.log("Updating at index:", originalIndex);

      // Use specific update endpoint
      let res = await updateGeneralExamination(id, originalIndex, payload);
      console.log("Update response:", res);
      
      // Reset and refresh
      cancelEdit();
      await fetchGeneralExaminations();
      
    } catch (error) {
      console.error("Error updating general examination:", error);
      
      // Try fallback method if specific endpoint fails
      if (error.response && error.response.status === 403) {
        try {
          console.log("Trying fallback update via main endpoint...");
          
          // Update via main updateIpd endpoint
          const updatedExams = [...generalExaminations.map(exam => ({
            temperature: exam.temperature,
            pulse: exam.pulse,
            RR: exam.RR,
            BP: `${exam.bp_systolic}/${exam.bp_diastolic}`,
            SPO2: exam.SPO2,
            sugar: exam.sugar,
            date_time: exam.date_time
          }))];
          
          // Update at the specific index
          updatedExams[originalIndex] = {
            temperature: editForm.temperature,
            pulse: editForm.pulse,
            RR: editForm.RR,
            BP: `${editForm.bp_systolic}/${editForm.bp_diastolic}`,
            SPO2: editForm.SPO2,
            sugar: editForm.sugar,
            date_time: editForm.date_time 
              ? editForm.date_time.slice(0, 19).replace('T', ' ')
              : new Date().toISOString().slice(0, 19).replace('T', ' ')
          };
          
          await updateIpd(id, {
            general_examination: updatedExams
          });
          
          console.log("Fallback update successful");
          cancelEdit();
          await fetchGeneralExaminations();
          return;
          
        } catch (fallbackError) {
          console.error("Fallback update also failed:", fallbackError);
        }
      }
      
      alert("Failed to update general examination");
    } finally {
      setLoading({ update: false });
    }
  };

  // 🔹 RESET ADD FORM
  const resetAddForm = () => {
    setForm({
      temperature: "",
      pulse: "",
      RR: "",
      bp_diastolic: "",
      bp_systolic: "",
      SPO2: "",
      sugar: "",
      date_time: new Date().toISOString().slice(0, 16)
    });
  };

  return (
    <div className="max-w-6xl">
      {/* INLINE HEADER + ADD SECTION */}
      <div className="">
        <div className="flex items-start gap-4 mb-4">
          {/* Title - inline */}
          <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[140px]">General Examination</h2>

          {/* Form fields */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-2 items-end">
                {/* BP Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    BP (mmHg)
                  </label>

                  <div className="flex items-center gap-1">
                    <input
                      ref={bpSysRef}
                      type="text"
                      placeholder="120"
                      value={form.bp_systolic}
                      onChange={(e) => handleInputChange('bp_systolic', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, bpDiaRef)}
                      className="border rounded-lg  py-1 w-full"
                      autoFocus
                    />

                    <span className="text-gray-400">/</span>

                    <input
                      ref={bpDiaRef}
                      type="text"
                      placeholder="80"
                      value={form.bp_diastolic}
                      onChange={(e) => handleInputChange('bp_diastolic', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, pulseRef)}
                      className="border rounded-lg py-1 w-full"
                    />
                  </div>
                </div>

                {/* Pulse Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Pulse (bpm)
                  </label>
                  <input
                    ref={pulseRef}
                    type="text"
                    placeholder="Pulse"
                    value={form.pulse}
                    onChange={(e) => handleInputChange('pulse', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, spo2Ref)}
                    className="border rounded-lg px-3 py-1 w-full"
                  />
                </div>

                {/* SPO2 Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    SPO2 (%)
                  </label>
                  <input
                    ref={spo2Ref}
                    type="text"
                    placeholder="SPO2"
                    value={form.SPO2}
                    onChange={(e) => handleInputChange('SPO2', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, sugarRef)}
                    className="border rounded-lg px-3 py-1 w-full"
                  />
                </div>

                {/* Sugar Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Sugar (mg/dL)
                  </label>
                  <input
                    ref={sugarRef}
                    type="text"
                    placeholder="Sugar"
                    value={form.sugar}
                    onChange={(e) => handleInputChange('sugar', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rrRef)}
                    className="border rounded-lg px-3 py-1 w-full"
                  />
                </div>

                {/* RR Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    RR (breaths/min)
                  </label>
                  <input
                    ref={rrRef}
                    type="text"
                    placeholder="RR"
                    value={form.RR}
                    onChange={(e) => handleInputChange('RR', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, tempRef)}
                    className="border rounded-lg px-3 py-1 w-full"
                  />
                </div>

                {/* Temperature Input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Temperature (°F)
                  </label>
                  <input
                    ref={tempRef}
                    type="text"
                    placeholder="Temp"
                    value={form.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
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
                <div className="lg:col-span-1">
                  <button
                    ref={addButtonRef}
                    onClick={handleAdd}
                    disabled={loading.add}
                    className="w-full bg-blue-600 text-white h-[32px] rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-bold text-xs shadow-sm transition-all active:scale-95"
                  >
                    {loading.add ? "..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* LIST OF GENERAL EXAMINATIONS - ALWAYS VISIBLE */}
      <div>
            
        {generalExaminations.length === 0 ? (
          ""
            ) : (
              <div className="space-y-4">
                {generalExaminations.map((exam) => (
                  <div
                    key={exam.index}
                    className=""
                  >
                    {editMode === exam.index ? (
                      // EDIT MODE
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          {/* BP Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              BP
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="120"
                                value={editForm.bp_systolic}
                                onChange={(e) => handleEditInputChange('bp_systolic', e.target.value)}
                                className="border rounded-lg px-3 py-1 w-full text-center"
                              />

                              <span className="text-gray-600 font-medium">/</span>

                              <input
                                type="text"
                                placeholder="80"
                                value={editForm.bp_diastolic}
                                onChange={(e) => handleEditInputChange('bp_diastolic', e.target.value)}
                                className="border rounded-lg px-3 py-1 w-full text-center"
                              />
                            </div>

                            <p className="text-[11px] text-gray-500 mt-1">
                              Systolic / Diastolic
                            </p>
                          </div>

                          {/* Pulse Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Pulse
                            </label>
                            <input
                              type="text"
                              value={editForm.pulse}
                              onChange={(e) => handleEditInputChange('pulse', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="Pulse"
                            />
                          </div>

                          {/* SPO2 Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              SPO2
                            </label>
                            <input
                              type="text"
                              value={editForm.SPO2}
                              onChange={(e) => handleEditInputChange('SPO2', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="SPO2"
                            />
                          </div>

                          {/* Sugar Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Sugar
                            </label>
                            <input
                              type="text"
                              value={editForm.sugar}
                              onChange={(e) => handleEditInputChange('sugar', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="Sugar"
                            />
                          </div>

                          {/* RR Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              RR
                            </label>
                            <input
                              type="text"
                              value={editForm.RR}
                              onChange={(e) => handleEditInputChange('RR', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="RR"
                            />
                          </div>

                          {/* Temperature Edit */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Temperature
                            </label>
                            <input
                              type="text"
                              value={editForm.temperature}
                              onChange={(e) => handleEditInputChange('temperature', e.target.value)}
                              className="border rounded-lg px-3 py-1 w-full"
                              placeholder="Temperature"
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
                      // VIEW MODE - Blue bar style matching OPD vitals
                      <>
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 grid grid-cols-3 md:grid-cols-6 gap-3">
                              <div className="text-center">
                                <span className="text-lg font-bold text-blue-700">BP: {exam.BP} mmHg</span>
                              </div>
                              <div className="text-center">
                                <span className="text-lg font-bold text-blue-700">Pulse: {exam.pulse} bpm</span>
                              </div>
                              <div className="text-center">
                                <span className="text-lg font-bold text-blue-700">SPO2: {exam.SPO2}%</span>
                              </div>
                              <div className="text-center">
                                <span className="text-lg font-bold text-blue-700">Sugar: {exam.sugar} mg/dL</span>
                              </div>
                              <div className="text-center">
                                <span className="text-lg font-bold text-blue-700">RR: {exam.RR}</span>
                              </div>
                              <div className="text-center">
                                <span className="text-lg font-bold text-blue-700">Temperature: {exam.temperature}°F</span>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-3">
                              <button
                                onClick={() => startEdit(exam, exam.index)}
                                disabled={loading[`edit-${exam.index}`]}
                                className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(exam.index)}
                                disabled={loading[`delete-${exam.index}`]}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                {loading[`delete-${exam.index}`] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Recorded on: <span className="font-medium text-gray-700">{exam.formatted_date}</span>
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