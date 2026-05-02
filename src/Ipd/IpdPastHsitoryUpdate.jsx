import { useEffect, useState, useRef } from "react";
import { getIpdById,pastHistory,updateIpd,createPastHistory,deleteIpdPastHistory,updateIpdPastHistory} from "../services/ipd.services";
import { Trash2, Edit2, X, Check, Plus } from "lucide-react";

export default function IpdPastHistoryUpdate({id}) {

  const [ipd, setIpd] = useState({ past_historys: [] });
  const [pastHistoryList, setPastHistoryList] = useState([]);
  const [loading, setLoading] = useState({});
  const [editMode, setEditMode] = useState(null);

  // ADD FORM
  const [form, setForm] = useState({
    duration: "",
    durationNumber: "",
    durationUnit: "",
    optional: "",
    past_history_name: "",
    past_history_id: null,
  });

  // EDIT FORM STATE
  const [editForm, setEditForm] = useState({
    duration: "",
    durationNumber: "",
    durationUnit: "",
    optional: "",
    past_history_name: "",
    past_history_id: null,
  });

  // SEARCH RESULTS
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [historyHighlightIndex, setHistoryHighlightIndex] = useState(-1);
  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [durationHighlightIndex, setDurationHighlightIndex] = useState(-1);

  // Refs for input fields
  const pastHistoryInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const optionalInputRef = useRef(null);
  const addButtonRef = useRef(null);

  const durationUnits = [
    { value: "hours", label: "Hours", singular: "hour" },
    { value: "days", label: "Days", singular: "day" },
    { value: "weeks", label: "Weeks", singular: "week" },
    { value: "months", label: "Months", singular: "month" },
    { value: "years", label: "Years", singular: "year" }
  ];

  useEffect(() => {
    const loadAll = async () => {
      const masterList = await fetchPastHistory();
      await fetchIpd(masterList);
    };
    loadAll();
  }, [id]);

  // Parse existing duration string to number and unit
  useEffect(() => {
    if (ipd.past_historys.length > 0) {
      const parsedHistories = ipd.past_historys.map(item => {
        const { number, unit } = parseDuration(item.duration);
        return {
          ...item,
          durationNumber: number,
          durationUnit: unit
        };
      });
      setIpd(prev => ({ ...prev, past_historys: parsedHistories }));
    }
  }, [ipd.past_historys.length]);

  // Parse duration string into number and unit
  const parseDuration = (duration) => {
    if (!duration) return { number: "", unit: "" };
    
    const match = duration.match(/^(\d+(?:\.\d+)?)\s*(hour|day|week|month|year|hours|days|weeks|months|years)s?$/i);
    if (match) {
      const number = match[1];
      const rawUnit = match[2].toLowerCase();
      
      // Normalize unit to singular form
      let unit = rawUnit;
      if (rawUnit.endsWith('s')) {
        unit = rawUnit.slice(0, -1);
      }
      
      return { number, unit };
    }
    return { number: "", unit: "" };
  };

  // Format duration for display
  const formatDuration = (number, unit) => {
    if (!number || !unit) return "";
    
    const isPlural = number === "1" ? false : true;
    const unitLabel = isPlural ? `${unit}s` : unit;
    return `${number} ${unitLabel}`;
  };

  // Generate duration suggestions
  const generateDurationSuggestions = (value) => {
    if (!value.trim() || isNaN(value)) {
      setDurationSuggestions([]);
      return;
    }
    
    const num = parseFloat(value);
    if (num <= 0) {
      setDurationSuggestions([]);
      return;
    }
    
    const suggestions = durationUnits.map(unit => {
      const isPlural = num === 1 ? false : true;
      const unitLabel = isPlural ? unit.value : unit.singular;
      return {
        value: `${num} ${unitLabel}`,
        display: `${num} ${unitLabel}`,
        number: num.toString(),
        unit: unit.value
      };
    });
    
    setDurationSuggestions(suggestions);
  };

  // Handle duration input for add form
  const handleDurationInput = (value) => {
    setForm(prev => ({ ...prev, durationNumber: value }));
    setDurationHighlightIndex(-1);
    
    if (value.trim()) {
      generateDurationSuggestions(value);
      setShowDurationDropdown(true);
    } else {
      setDurationSuggestions([]);
      setShowDurationDropdown(false);
    }
  };

  // Handle duration input for edit form
  const handleEditDurationInput = (value) => {
    setEditForm(prev => ({ ...prev, durationNumber: value }));
    
    if (value.trim()) {
      generateDurationSuggestions(value);
      setShowDurationDropdown(true);
    } else {
      setDurationSuggestions([]);
      setShowDurationDropdown(false);
    }
  };

  // Select duration from dropdown for add form
  const selectDuration = (suggestion) => {
    setForm({
      ...form,
      duration: suggestion.value,
      durationNumber: suggestion.number,
      durationUnit: suggestion.unit
    });
    setShowDurationDropdown(false);
    setTimeout(() => {
      optionalInputRef.current?.focus();
    }, 100);
  };

  // Select duration from dropdown for edit form
  const selectEditDuration = (suggestion) => {
    setEditForm({
      ...editForm,
      duration: suggestion.value,
      durationNumber: suggestion.number,
      durationUnit: suggestion.unit
    });
    setShowDurationDropdown(false);
  };

  // 🔹 FETCH IPD
  const fetchIpd = async (currentMasterList = pastHistoryList) => {
    try {
      const res = await getIpdById(id);
      
      // Handle potential data structures: { data: { ... } }, { data: [ ... ] }, or { ... }
      let ipdData = res;
      if (res && res.data) {
        ipdData = Array.isArray(res.data) ? res.data[0] : res.data;
      }
      
      // Transform the data
      const transformedPastHistory = (ipdData?.past_historys || []).map((item, index) => {
        const hId = item.past_history_data?.id || item.past_history_data;
        // Resolve name if missing
        let hName = item.past_history_data?.name;
        if (!hName || hName === "-") {
          const list = Array.isArray(currentMasterList) ? currentMasterList : [];
          const found = list.find(h => String(h.id) === String(hId));
          hName = found ? found.name : "-";
        }

        return {
          index: index, 
          duration: item.duration,
          durationNumber: "",
          durationUnit: "",
          optional: item.optional,
          past_history_id: hId,
          past_history_name: hName
        };
      });
      
      setIpd({
        ...ipdData,
        past_historys: transformedPastHistory,
      });
    } catch (error) {
      console.error("Error fetching IPD:", error);
    }
  };

  // 🔹 FETCH MASTER PAST HISTORY
  const fetchPastHistory = async () => {
    try {
      const res = await pastHistory();
      let data = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (Array.isArray(res.results)) {
        data = res.results;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }

      setPastHistoryList(data);
    } catch (error) {
      console.error("Error fetching past history:", error);
      setPastHistoryList([]);
      return [];
    }
  };

  // 🔹 HANDLE SEARCH INPUT
  const handleSearchInput = (value) => {
    setForm({ ...form, past_history_name: value });
    setHistoryHighlightIndex(-1);
    
    if (value.trim()) {
      const filtered = pastHistoryList.filter(ph =>
        ph.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // 🔹 SELECT FROM DROPDOWN
  const selectPastHistory = (history) => {
    setForm({
      ...form,
      past_history_name: history.name,
      past_history_id: history.id,
    });
    setShowDropdown(false);
    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 100);
  };

  // 🔹 KEYBOARD NAVIGATION HANDLERS
  const handleHistoryKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && historyHighlightIndex >= 0 && historyHighlightIndex < searchResults.length) {
        selectPastHistory(searchResults[historyHighlightIndex]);
      } else if (showDropdown && historyHighlightIndex === searchResults.length) {
        setShowDropdown(false);
        durationInputRef.current?.focus();
      } else {
        durationInputRef.current?.focus();
      }
    }
  };

  const handleDurationKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDurationHighlightIndex(prev => prev < durationSuggestions.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDurationHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDurationDropdown && durationHighlightIndex >= 0 && durationHighlightIndex < durationSuggestions.length) {
        selectDuration(durationSuggestions[durationHighlightIndex]);
      } else if (showDurationDropdown && durationHighlightIndex === durationSuggestions.length) {
        setShowDurationDropdown(false);
        optionalInputRef.current?.focus();
      } else {
        optionalInputRef.current?.focus();
      }
    }
  };

  const handleOptionalKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addButtonRef.current?.focus();
    }
  };

  // 🔹 FIND OR CREATE PAST HISTORY
  const findOrCreatePastHistory = async (name) => {
    // Check if it exists locally
    const existing = pastHistoryList.find(
      ph => ph.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) {
      return { id: existing.id, isNew: false };
    }
    
    // Create new
    try {
      const newHistory = await createPastHistory({ name });
      const createdHistory = newHistory.data || newHistory;
      
      // Add to local list
      setPastHistoryList(prev => [...prev, createdHistory]);
      
      return { id: createdHistory.id, isNew: true };
    } catch (error) {
      console.error("Error creating past history:", error);
      throw error;
    }
  };

  const handleAdd = async () => {
    if (!form.duration || !form.past_history_name.trim()) {
      alert("Please fill duration and past history");
      return;
    }

    try {
      setLoading({ add: true });

      // 1️⃣ get past history id (existing or new)
      const result = await findOrCreatePastHistory(form.past_history_name);

      // 2️⃣ build new entry (ID ONLY ✅)
      const newEntry = {
        duration: form.duration,
        optional: form.optional,
        past_history_data: result.id,
      };

      // 3️⃣ rebuild full array in backend format
      const updatedPastHistory = [
        newEntry,
      ];

      // 4️⃣ PATCH whole array
      await updateIpd(id, {
        past_historys: updatedPastHistory,
      });

      // 5️⃣ reset UI
      setForm({
        duration: "",
        durationNumber: "",
        durationUnit: "",
        optional: "",
        past_history_name: "",
        past_history_id: null,
      });
      setSearchResults([]);
      setShowDropdown(false);
      setDurationSuggestions([]);
      setShowDurationDropdown(false);

      await fetchIpd();
      
      setTimeout(() => {
        pastHistoryInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error("Error adding past history:", error);
      alert("Failed to add past history");
    } finally {
      setLoading({ add: false });
    }
  };

  // 🔹 DELETE PAST HISTORY ENTRY
  const handleDelete = async (index) => {
    if (window.confirm("Are you sure you want to delete this past history?")) {
      try {
        setLoading({ [index]: true });
        
        // Use the specific delete endpoint
        await deleteIpdPastHistory(id, index);
        
        // Refresh the list
        await fetchIpd();

      } catch (error) {
        console.error("Error deleting past history:", error);
        alert("Failed to delete past history");
      } finally {
        setLoading({ [index]: false });
      }
    }
  };

  // 🔹 START EDIT
  const startEdit = (item, originalIndex) => {
    const { number, unit } = parseDuration(item.duration);
    setEditMode(originalIndex);
    setEditForm({
      duration: item.duration,
      durationNumber: number,
      durationUnit: unit,
      optional: item.optional,
      past_history_name: item.past_history_name || "",
      past_history_id: item.past_history_id,
    });
  };

  // 🔹 CANCEL EDIT
  const cancelEdit = () => {
    setEditMode(null);
    setEditForm({
      duration: "",
      durationNumber: "",
      durationUnit: "",
      optional: "",
      past_history_name: "",
      past_history_id: null,
    });
    setDurationSuggestions([]);
    setShowDurationDropdown(false);
  };

  // 🔹 UPDATE PAST HISTORY ENTRY
  const handleUpdate = async (originalIndex) => {
    if (!editForm.duration || !editForm.past_history_name.trim()) {
      alert("Please fill duration and past history");
      return;
    }

    try {
      setLoading({ update: true });
      
      // Step 1: Get the ID (find existing or create new)
      const result = await findOrCreatePastHistory(editForm.past_history_name);
      
      // Step 2: Prepare payload
      const payload = {
        duration: editForm.duration,
        optional: editForm.optional,
        past_history_data: result.id
      };
      
      // Step 3: Use the specific update endpoint
      await updateIpdPastHistory(id, originalIndex, payload);

      // Step 4: Reset and refresh
      cancelEdit();
      await fetchIpd();
      
    } catch (error) {
      console.error("Error updating past history:", error);
      alert("Failed to update past history");
    } finally {
      setLoading({ update: false });
    }
  };

  // 🔹 HANDLE EDIT INPUT CHANGE
  const handleEditInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full">
      {/* INLINE HEADER + ADD SECTION */}
      <div className="mb-4">
        <div className="flex items-start gap-4">
          {/* Title - inline */}
          <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[140px]">Past History</h2>

          {/* Input fields row */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Past History Input with Dropdown */}
            <div className="relative">
              <input
                ref={pastHistoryInputRef}
                placeholder="Past history name"
                value={form.past_history_name}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleHistoryKeyDown}
                onFocus={() => form.past_history_name && handleSearchInput(form.past_history_name)}
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
                      onMouseDown={() => selectPastHistory(ph)}
                      onMouseEnter={() => setHistoryHighlightIndex(index)}
                      className={`px-4 py-1 cursor-pointer border-b last:border-b-0 ${historyHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                    >
                      <div className="font-medium">{ph.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duration Input with Suggestions */}
            <div className="relative">
              <input
                ref={durationInputRef}
                placeholder="Enter duration"
                value={form.durationNumber}
                onChange={(e) => handleDurationInput(e.target.value)}
                onKeyDown={handleDurationKeyDown}
                onFocus={() => form.durationNumber && handleDurationInput(form.durationNumber)}
                onBlur={() => setTimeout(() => setShowDurationDropdown(false), 200)}
                className="border rounded-lg px-4 py-1 w-full text-sm"
              />
              
              {/* Duration Suggestions Dropdown */}
              {showDurationDropdown && durationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {durationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onMouseDown={() => selectDuration(suggestion)}
                      onMouseEnter={() => setDurationHighlightIndex(index)}
                      className={`px-4 py-1 cursor-pointer border-b last:border-b-0 ${durationHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                    >
                      <div className="font-medium">{suggestion.display}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Display selected duration */}
              {form.duration && (
                <div className="mt-1 text-sm text-gray-600">
                  Selected: <span className="font-medium">{form.duration}</span>
                </div>
              )}
            </div>

            <div>
              <input
                ref={optionalInputRef}
                placeholder="Optional details"
                value={form.optional}
                onChange={(e) => setForm({...form,optional:e.target.value})}
                onKeyDown={handleOptionalKeyDown}
                className="border rounded-lg px-4 py-1 w-full text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div>
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
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-1 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      </div>

      {/* LIST OF PAST HISTORIES - Compact Pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ipd.past_historys.map((item, originalIndex) => (
          <div
            key={originalIndex}
            className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 animate-fadeIn"
          >
            <span className="text-sm font-medium text-blue-800">
              {item.past_history_name} {item.duration && `: ${item.duration}`} {item.optional && `(${item.optional})`}
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
        {ipd.past_historys.length === 0 && (
""        )}
      </div>
    </div>
  );
}