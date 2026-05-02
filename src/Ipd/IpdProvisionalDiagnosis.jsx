import { useEffect, useState, useRef } from "react";
import {
  getIpdById,
  diagnosis,
  updateIpd,
  createDiagnosis,
  deleteIpdDiagnosis,
  updateIpdDiagnosis,
} from "../services/ipd.services";
import { Trash2, Edit2, X, Check, Plus } from "lucide-react";

export default function IpdProvisionalDiagnosisUpdate({ id }) {
  const [ipd, setIpd] = useState({ provisional_diagnosis: [] });
  const [diagnosisList, setDiagnosisList] = useState([]);
  const [loading, setLoading] = useState({});
  const [editMode, setEditMode] = useState(null);

  // ADD FORM
  const [form, setForm] = useState({
    diagnosis_name: "",
    diagnosis_id: null,
  });

  // EDIT FORM STATE
  const [editForm, setEditForm] = useState({
    diagnosis_name: "",
    diagnosis_id: null,
  });

  // SEARCH RESULTS
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [diagnosisHighlightIndex, setDiagnosisHighlightIndex] = useState(-1);

  // Refs for input fields
  const diagnosisInputRef = useRef(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    const loadAll = async () => {
      const masterList = await fetchDiagnosis();
      await fetchIpd(masterList);
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Helper to resolve name from master list
  const resolveDiagnosisName = (id, currentList = diagnosisList) => {
    if (!id) return "-";
    const list = Array.isArray(currentList) ? currentList : [];
    const found = list.find(d => String(d.id) === String(id));
    return found ? found.diagnosis_name : "-";
  };

  // 🔹 FETCH IPD
  const fetchIpd = async (currentMasterList = diagnosisList) => {
    try {
      const res = await getIpdById(id);
      
      // Handle potential data structures: { data: { ... } }, { data: [ ... ] }, or { ... }
      let ipdData = res;
      if (res && res.data) {
        ipdData = Array.isArray(res.data) ? res.data[0] : res.data;
      }

      // Transform the data
      const transformedDiagnosis = (ipdData?.provisional_diagnosis || []).map(
        (item, index) => {
          const dId = item.diagnosis_data?.id || item.diagnosis_data;
          // Resolve name if missing
          let dName = item.diagnosis_data?.diagnosis_name || item.diagnosis_data?.name;
          if (!dName || dName === "-") {
            dName = resolveDiagnosisName(dId, currentMasterList);
          }

          return {
            index: index,
            diagnosis_id: dId,
            diagnosis_name: dName,
          };
        }
      );

      setIpd({
        ...ipdData,
        provisional_diagnosis: transformedDiagnosis,
      });
    } catch (error) {
      console.error("Error fetching IPD:", error);
    }
  };

  // 🔹 FETCH MASTER DIAGNOSIS
  const fetchDiagnosis = async () => {
    try {
      const res = await diagnosis();
      let data = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (Array.isArray(res.results)) {
        data = res.results;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }

      setDiagnosisList(data);
      return data;
    } catch (error) {
      console.error("Error fetching diagnosis:", error);
      setDiagnosisList([]);
      return [];
    }
  };

  // 🔹 HANDLE SEARCH INPUT
  const handleSearchInput = (value) => {
    setForm({ ...form, diagnosis_name: value });
    setDiagnosisHighlightIndex(-1);

    if (value.trim()) {
      const filtered = diagnosisList.filter((ph) =>
        ph.diagnosis_name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // 🔹 SELECT FROM DROPDOWN
  const selectDiagnosis = (history) => {
    setForm({
      ...form,
      diagnosis_name: history.diagnosis_name,
      diagnosis_id: history.id,
    });
    setShowDropdown(false);
    setTimeout(() => {
      addButtonRef.current?.focus();
    }, 100);
  };

  // 🔹 KEYBOARD NAVIGATION HANDLERS
  const handleDiagnosisKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDiagnosisHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDiagnosisHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && diagnosisHighlightIndex >= 0 && diagnosisHighlightIndex < searchResults.length) {
        selectDiagnosis(searchResults[diagnosisHighlightIndex]);
      } else if (showDropdown && diagnosisHighlightIndex === searchResults.length) {
        setShowDropdown(false);
        addButtonRef.current?.focus();
      } else {
        addButtonRef.current?.focus();
      }
    }
  };

  // 🔹 FIND OR CREATE DIAGNOSIS
  const findOrCreateDiagnosis = async (name) => {
    // Check if it exists locally
    const existing = diagnosisList.find(
      (ph) => ph.diagnosis_name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return { id: existing.id, isNew: false };
    }

    // Create new
    try {
      const newDiagnosis = await createDiagnosis({ diagnosis_name: name });
      const createdDiagnosis = newDiagnosis.data || newDiagnosis;

      // Add to local list
      setDiagnosisList((prev) => [...prev, createdDiagnosis]);

      return { id: createdDiagnosis.id, isNew: true };
    } catch (error) {
      console.error("Error creating Diagnosis:", error);
      throw error;
    }
  };

  const handleAdd = async () => {
    if (!form.diagnosis_name.trim()) {
      alert("Please enter diagnosis name");
      return;
    }

    try {
      setLoading({ add: true });

      // 1️⃣ Get diagnosis id (existing or new)
      const result = await findOrCreateDiagnosis(form.diagnosis_name);

      // 2️⃣ Build new entry
      const newEntry = {
        diagnosis_data: result.id,
      };

      // 3️⃣ Rebuild full array in backend format
      const updatedDiagnosis = [newEntry];

      // 4️⃣ PATCH whole array
      await updateIpd(id, {
        provisional_diagnosis: updatedDiagnosis,
      });

      // 5️⃣ Reset UI
      setForm({
        diagnosis_name: "",
        diagnosis_id: null,
      });
      setSearchResults([]);
      setShowDropdown(false);

      await fetchIpd();
      
      setTimeout(() => {
        diagnosisInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error("Error adding diagnosis:", error);
      alert("Failed to add diagnosis");
    } finally {
      setLoading({ add: false });
    }
  };

  // 🔹 DELETE DIAGNOSIS ENTRY
  const handleDelete = async (index) => {
    if (window.confirm("Are you sure you want to delete this diagnosis?")) {
      try {
        setLoading({ [index]: true });

        // Use the specific delete endpoint
        await deleteIpdDiagnosis(id, index);

        // Refresh the list
        await fetchIpd();
      } catch (error) {
        console.error("Error deleting diagnosis:", error);
        alert("Failed to delete diagnosis");
      } finally {
        setLoading({ [index]: false });
      }
    }
  };

  // 🔹 START EDIT
  const startEdit = (item, originalIndex) => {
    setEditForm({
      diagnosis_name: item.diagnosis_name || "",
      diagnosis_id: item.diagnosis_id,
    });
    setEditMode(originalIndex);
  };

  // 🔹 CANCEL EDIT
  const cancelEdit = () => {
    setEditMode(null);
    setEditForm({
      diagnosis_name: "",
      diagnosis_id: null,
    });
  };

  // 🔹 UPDATE DIAGNOSIS ENTRY
  const handleUpdate = async (originalIndex) => {
    if (!editForm.diagnosis_name.trim()) {
      alert("Please enter diagnosis name");
      return;
    }

    try {
      setLoading({ update: true });

      // Step 1: Get the ID (find existing or create new)
      const result = await findOrCreateDiagnosis(editForm.diagnosis_name);

      // Step 2: Prepare payload
      const payload = {
        diagnosis_data: result.id,
      };

      // Step 3: Use the specific update endpoint
      await updateIpdDiagnosis(id, originalIndex, payload);

      // Step 4: Reset and refresh
      cancelEdit();
      await fetchIpd();
    } catch (error) {
      console.error("Error updating Diagnosis:", error);
      alert("Failed to update diagnosis");
    } finally {
      setLoading({ update: false });
    }
  };

  // 🔹 HANDLE EDIT INPUT CHANGE
  const handleEditInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full">
      {/* INLINE HEADER + ADD SECTION */}
      <div className="mb-4">
        <div className="flex items-start gap-4">
          {/* Title - inline */}
          <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[140px]">Provisional Diagnosis</h2>

          {/* Input fields row */}
          <div className="flex-1 flex gap-3">

            <div className="relative flex-1">
                <input
                  ref={diagnosisInputRef}
                  placeholder="Diagnosis name"
                  value={form.diagnosis_name}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleDiagnosisKeyDown}
                  onFocus={() =>
                    form.diagnosis_name &&
                    handleSearchInput(form.diagnosis_name)
                  }
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="border rounded-lg px-4 py-1 w-full text-sm"
                autoFocus
                />

              {/* Dropdown Suggestions */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((ph, index) => (
                    <div
                      key={ph.id}
                      onMouseDown={() => selectDiagnosis(ph)}
                      onMouseEnter={() => setDiagnosisHighlightIndex(index)}
                      className={`px-4 py-1 cursor-pointer border-b last:border-b-0 ${diagnosisHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                    >
                      <div className="font-medium">{ph.diagnosis_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              ref={addButtonRef}
              onClick={handleAdd}
              disabled={loading.add}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="bg-blue-600 text-white rounded-lg px-4 py-1 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-32"
            >
              {loading.add ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* LIST OF DIAGNOSES - Compact Pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ipd.provisional_diagnosis.map((item, originalIndex) => (
          <div
            key={originalIndex}
            className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 animate-fadeIn"
          >
            <span className="text-sm font-medium text-blue-800">
              {item.diagnosis_name}
            </span>
            <button
              onClick={() => handleDelete(originalIndex)}
              disabled={loading[originalIndex]}
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {ipd.provisional_diagnosis.length === 0 && (
""        )}
      </div>
    </div>
  );
}