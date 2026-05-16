import { useEffect, useState, useRef } from "react";
import { pastHistory, createPastHistory } from "../services/opd.services";
import { Trash2 } from "lucide-react";

export default function OpdPastHistoryUpdate({id, data, onUpdate}) {

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
    fetchPastHistory();
  }, []);

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

  const fetchPastHistory = async () => {
    const cached = localStorage.getItem("master_past_history");
    if (!cached) {
      setIsPastHistoryLoading(true);
    }

    try {
      const res = await pastHistory();
      let data = Array.isArray(res) ? res : (res.results || res.data || []);
      setPastHistoryList(data);
      localStorage.setItem("master_past_history", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching past history:", error);
    } finally {
      setIsPastHistoryLoading(false);
    }
  };

  const handleSearchInput = (value) => {
    setForm({ ...form, past_history_name: value });
    setHistoryHighlightIndex(-1);
    
    if (value.trim()) {
      const filtered = pastHistoryList.filter(ph =>
        ph.name?.toLowerCase().includes(value.toLowerCase())
      );
      
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

  const findOrCreatePastHistory = async (name) => {
    const existing = pastHistoryList.find(ph => ph.name.toLowerCase() === name.toLowerCase());
    if (existing) return { id: existing.id };
    
    try {
      const res = await createPastHistory({ name });
      const created = res.data || res;
      setPastHistoryList(prev => [...prev, created]);
      return { id: created.id };
    } catch (error) {
      console.error("Error creating past history:", error);
      throw error;
    }
  };

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

const handleAdd = async () => {
  if (!form.past_history_name.trim()) {
    alert("Please enter past history name");
    return;
  }

  try {
    setLoading({ add: true });
    const result = await findOrCreatePastHistory(form.past_history_name);

    const newEntry = {
      duration: form.duration,
      past_history_data: { id: result.id, name: form.past_history_name },
    };

    const updatedList = [...(data || []), newEntry];
    onUpdate(updatedList);

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
  } catch (error) {
    console.error("Error adding past history:", error);
    alert("Failed to add past history");
  } finally {
    setLoading({ add: false });
  }
};

  const handleDelete = (index) => {
    const updatedList = (data || []).filter((_, i) => i !== index);
    onUpdate(updatedList);
  };

  return (
    <div className="w-full px-6 py-1">
        <div className="flex items-start gap-4">
          <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 w-[140px] flex-shrink-0">Past History</h2>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
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
            />
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
          </div>
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
            </div>
           <div className="ml-3 w-full">
            <button
              ref={addButtonRef}
              onClick={handleAdd}
              disabled={loading.add}
              className="w-full bg-blue-400 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading.add ? "Adding..." : "Add"}
            </button>
          </div>
          </div>
        </div>
    </div>
  );
}