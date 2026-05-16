import { useEffect, useState, useRef } from "react";
import { complaint, updateOpd, createComplaint } from "../services/opd.services";
import { Trash2 } from "lucide-react";

export default function OpdComplaintsUpdate({ id, data, onUpdate }) {

  const [complaintList, setComplaintList] = useState(() => {
    const cached = localStorage.getItem("master_complaints");
    try {
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [isComplaintsLoading, setIsComplaintsLoading] = useState(false);
  const [loading, setLoading] = useState({});

  // ADD FORM
  const [form, setForm] = useState({
    duration: "",
    durationNumber: "",
    durationUnit: "",
    optional: "",
    complaints_data_name: "",
    complaints_data_id: null,
  });

  // SEARCH RESULTS
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [complaintHighlightIndex, setComplaintHighlightIndex] = useState(-1);
  const [durationHighlightIndex, setDurationHighlightIndex] = useState(-1);

  // Refs for input fields
  const complaintInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const severityInputRef = useRef(null);
  const addButtonRef = useRef(null);

  const durationUnits = [
    { value: "hours", label: "Hours", singular: "hour" },
    { value: "days", label: "Days", singular: "day" },
    { value: "weeks", label: "Weeks", singular: "week" },
    { value: "months", label: "Months", singular: "month" },
    { value: "years", label: "Years", singular: "year" }
  ];

  useEffect(() => {
    fetchComplaints();
    
    // Listen for global save
    const handleGlobalSave = async () => {
        // Data is already in parent state via onUpdate
        // The Footer handleSave will call updateOpd with all gathered data
    };
    window.addEventListener('opd_save_all_requested', handleGlobalSave);
    return () => window.removeEventListener('opd_save_all_requested', handleGlobalSave);
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
  };

  const fetchComplaints = async () => {
    const cached = localStorage.getItem("master_complaints");
    if (!cached) {
      setIsComplaintsLoading(true);
    }

    try {
      const res = await complaint();
      let data = Array.isArray(res) ? res : (res.results || res.data || []);
      setComplaintList(data);
      localStorage.setItem("master_complaints", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setIsComplaintsLoading(false);
    }
  };

  const handleSearchInput = (value) => {
    setForm({ ...form, complaints_data_name: value });
    setComplaintHighlightIndex(-1);
    
    if (value.trim()) {
      const searchTerm = value.toLowerCase();
      const filtered = complaintList
        .filter(c => (c.name || "").toLowerCase().includes(searchTerm))
        .slice(0, 50);
      
      const uniqueResults = [];
      const seenNames = new Set();
      filtered.forEach(c => {
        const name = c.name?.toLowerCase().trim();
        if (name && !seenNames.has(name)) {
          seenNames.add(name);
          uniqueResults.push(c);
        }
      });
      
      setSearchResults(uniqueResults);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const selectComplaint = (complaint) => {
    setForm({
      ...form,
      complaints_data_name: complaint.name,
      complaints_data_id: complaint.id,
    });
    setShowDropdown(false);
    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 100);
  };

  const findOrCreateComplaint = async (name) => {
    const existing = complaintList.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return { id: existing.id };
    
    try {
      const res = await createComplaint({ name });
      const created = res.data || res;
      setComplaintList(prev => [...prev, created]);
      return { id: created.id };
    } catch (error) {
      console.error("Error creating complaint:", error);
      throw error;
    }
  };

  const handleComplaintKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setComplaintHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setComplaintHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && complaintHighlightIndex >= 0 && complaintHighlightIndex < searchResults.length) {
        selectComplaint(searchResults[complaintHighlightIndex]);
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
        severityInputRef.current?.focus();
      }
    }
  };

  const handleAdd = async () => {
    if (!form.complaints_data_name.trim()) {
      alert("Please enter complaint name");
      return;
    }

    try {
      setLoading({ add: true });
      const result = await findOrCreateComplaint(form.complaints_data_name);
      
      const newEntry = {
        duration: form.duration,
        optional: form.optional || "",
        complaints_data: { id: result.id, name: form.complaints_data_name }
      };
      
      const updatedList = [...(data || []), newEntry];
      onUpdate(updatedList);
      
      setForm({
        duration: "",
        durationNumber: "",
        durationUnit: "",
        optional: "",
        complaints_data_name: "",
        complaints_data_id: null,
      });
      setSearchResults([]);
      setShowDropdown(false);
      setDurationSuggestions([]);
      setShowDurationDropdown(false);
      
    } catch (error) {
      console.error("Error adding complaint:", error);
      alert("Failed to add complaint");
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
            <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 w-[140px] flex-shrink-0">Chief Complaints</h2>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
                <input
                ref={complaintInputRef}
                placeholder="Complaint name"
                value={form.complaints_data_name}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleComplaintKeyDown}
                onFocus={() => handleSearchInput(form.complaints_data_name || "")}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="border border-gray-300 rounded-xl px-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-[999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                    {searchResults.map((c, index) => (
                    <div
                        key={c.id}
                        onMouseDown={() => selectComplaint(c)}
                        onMouseEnter={() => setComplaintHighlightIndex(index)}
                        className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${complaintHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                    >
                        <div className="font-medium text-sm">{c.name}</div>
                    </div>
                    ))}
                </div>
                )}
            </div>
            <div className="relative">
                <input
                ref={durationInputRef}
                placeholder="Duration"
                value={form.durationNumber}
                onChange={(e) => handleDurationInput(e.target.value)}
                onKeyDown={handleDurationKeyDown}
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
            <input
                ref={severityInputRef}
                placeholder="Severity"
                value={form.optional}
                onChange={(e) => setForm({ ...form, optional: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="border border-gray-300 rounded-xl px-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button
                onClick={handleAdd}
                disabled={loading.add}
                className="w-full bg-blue-400 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {loading.add ? "Adding..." : "Add"}
            </button>
            </div>
        </div>
    </div>
  );
}