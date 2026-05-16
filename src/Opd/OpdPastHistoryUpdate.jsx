import { useEffect, useState, useRef } from "react";
import { getOpdById,pastHistory,updateOpd,createPastHistory,deleteOpdPastHistory,updateOpdPastHistory} from "../services/opd.services";
import { Trash2 } from "lucide-react";

export default function OpdPastHistoryUpdate({id}) {

  const [opd, setOpd] = useState({ past_history: [] });
  const [pastHistoryList, setPastHistoryList] = useState(() => {
    const cached = localStorage.getItem("master_past_history");
    try {
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [isPastHistoryLoading, setIsPastHistoryLoading] = useState(false);
  const [loading, setLoading] = useState({});

  // ADD FORM
  const [form, setForm] = useState({
    duration: "",
    durationNumber: "",
    durationUnit: "",
    past_history_name: "",
    past_history_id: null,
  });

  // SEARCH RESULTS
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [historyHighlightIndex, setHistoryHighlightIndex] = useState(-1);
  const [durationHighlightIndex, setDurationHighlightIndex] = useState(-1);

  // Refs for input fields
  const historyInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const addButtonRef = useRef(null);

  const durationUnits = [
    { value: "hours", label: "Hours", singular: "hour" },
    { value: "days", label: "Days", singular: "day" },
    { value: "weeks", label: "Weeks", singular: "week" },
    { value: "months", label: "Months", singular: "month" },
    { value: "years", label: "Years", singular: "year" }
  ];

  useEffect(() => {
    fetchOpd();
    fetchPastHistory();
  }, [id]);

  // Parse existing duration string to number and unit
  useEffect(() => {
    if (opd.past_history.length > 0) {
      const parsedComplaints = opd.past_history.map(item => {
        const { number, unit } = parseDuration(item.duration);
        return {
          ...item,
          durationNumber: number,
          durationUnit: unit
        };
      });
      setOpd(prev => ({ ...prev, past_history: parsedComplaints }));
    }
  }, [opd.past_history.length]);

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
      addButtonRef.current?.focus();
    }, 100);
  };

  // 🔹 FETCH OPD
  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const opdData = Array.isArray(res.data) ? res.data[0] : res.data;
      
      // Transform the data
      const transformedPastHistory = (opdData?.past_history || []).map((item, index) => ({
        index: index, // Store original index from API
        duration: item.duration,
        durationNumber: "",
        durationUnit: "",
        past_history_id: item.past_history_data?.id,
        past_history_name: item.past_history_data?.name
      }));
      
      setOpd({
        ...opdData,
        past_history: transformedPastHistory,
      });
    } catch (error) {
      console.error("Error fetching OPD:", error);
    }
  };

  // 🔹 FETCH MASTER PAST HISTORY
  const fetchPastHistory = async () => {
    // Already initialized from cache in useState
    const cached = localStorage.getItem("master_past_history");
    if (!cached) {
      setIsPastHistoryLoading(true);
    }

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
      // Update cache
      localStorage.setItem("master_past_history", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching past history:", error);
      if (!cached) setPastHistoryList([]);
    } finally {
      setIsPastHistoryLoading(false);
    }
  };

  // 🔹 HANDLE SEARCH INPUT
  const handleSearchInput = (value) => {
    setForm({ ...form, past_history_name: value });
    setHistoryHighlightIndex(-1);
    
    if (value.trim()) {
      const filtered = pastHistoryList.filter(ph =>
        ph.name?.toLowerCase().includes(value.toLowerCase())
      );
      
      // Filter out duplicates by name
      const uniqueResults = [];
      const seenNames = new Set();
      
      filtered.forEach(ph => {
        const name = ph.name?.toLowerCase().trim();
        if (name && !seenNames.has(name)) {
          seenNames.add(name);
          uniqueResults.push(ph);
        }
      });

      setSearchResults(uniqueResults);
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
    // Focus on duration input after selecting past history
    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 100);
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
      setDurationHighlightIndex(prev => prev < durationSuggestions.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDurationHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDurationDropdown && durationHighlightIndex >= 0 && durationHighlightIndex < durationSuggestions.length) {
        selectDuration(durationSuggestions[durationHighlightIndex]);
      } else {
        addButtonRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      
      switch(nextField) {
        case 'add':
          addButtonRef.current?.click();
          // After adding, focus back to history input
          setTimeout(() => {
            historyInputRef.current?.focus();
          }, 100);
          break;
        default:
          historyInputRef.current?.focus();
      }
    }
  };

const handleAdd = async () => {
  if (!form.past_history_name.trim()) {
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
      past_history_data: result.id,
    };

    // 3️⃣ rebuild full array in backend format
    const updatedPastHistory = [
      newEntry,
    ];

    // 4️⃣ PATCH whole array
    await updateOpd(id, {
      past_history: updatedPastHistory,
    });

    // 5️⃣ reset UI
    setForm({
      duration: "",
      durationNumber: "",
      durationUnit: "",
      past_history_name: "",
      past_history_id: null,
    });
    setSearchResults([]);
    setShowDropdown(false);
    setDurationSuggestions([]);
    setShowDurationDropdown(false);
    await fetchOpd();
    window.dispatchEvent(new Event('opd_info_updated'));
  } catch (error) {
    console.error("Error adding past history:", error);
    alert("Failed to add past history");
  } finally {
    setLoading({ add: false });
  }
};

  // 🔹 DELETE PAST HISTORY ENTRY
  const handleDelete = async (index) => {
      try {
        setLoading({ [index]: true });
        
        // Use the specific delete endpoint
        await deleteOpdPastHistory(id, index);
        
        // Refresh the list
        await fetchOpd();
        window.dispatchEvent(new Event('opd_info_updated'));
        
      } catch (error) {
        console.error("Error deleting past history:", error);
        alert("Failed to delete past history");
      } finally {
        setLoading({ [index]: false });
      }
  };

  return (
    <div className="w-full px-6 py-1">
      {/* ADD SECTION - Inline title + fields */}
        <>
        <div className="">
        <div className="flex items-start gap-4">
          {/* Title - inline */}
          <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 w-[140px] flex-shrink-0">Past History</h2>

          {/* Input fields row */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Past History Input with Dropdown */}
          <div className="relative">
            <input
              ref={historyInputRef}
              placeholder="Type past history name"
              value={form.past_history_name}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={handleHistoryKeyDown}
              onFocus={() => form.past_history_name && handleSearchInput(form.past_history_name)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              autoFocus
            />
            
            {/* Dropdown Suggestions */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                {searchResults.map((ph, index) => (
                  <div
                    key={ph.id}
                    onMouseDown={() => selectPastHistory(ph)}
                    onMouseEnter={() => setHistoryHighlightIndex(index)}
                    className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${historyHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                  >
                    <div className="font-medium">{ph.name}</div>
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {showDropdown && form.past_history_name && searchResults.length === 0 && !isPastHistoryLoading && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
                <div className="text-gray-500 text-sm">
                  No matches found.
                </div>
              </div>
            )}

            {/* Loading message */}
            {showDropdown && isPastHistoryLoading && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
                <div className="text-gray-500 text-sm flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  Searching...
                </div>
              </div>
            )}
          </div>
          {/* Duration Input with Suggestions */}
            <div className="relative">
              <input
                ref={durationInputRef}
                placeholder="Enter Duration"
                value={form.durationNumber}
                onChange={(e) => handleDurationInput(e.target.value)}
                onKeyDown={handleDurationKeyDown}
                onFocus={() => form.durationNumber && handleDurationInput(form.durationNumber)}
                onBlur={() => setTimeout(() => setShowDurationDropdown(false), 200)}
                className="border border-gray-300 rounded-xl px-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              
              {/* Duration Suggestions Dropdown */}
              {showDurationDropdown && durationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {durationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onMouseDown={() => selectDuration(suggestion)}
                      onMouseEnter={() => setDurationHighlightIndex(index)}
                      className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${durationHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
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

          {/* Add Button */}
           <div className="ml-3 w-full">
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
              className="w-full bg-blue-400 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-blue-500 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* LIST REMOVED - NOW IN SIDEBAR */}
      </>
    </div>
  );
}