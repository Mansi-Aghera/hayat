import { useEffect, useState, useRef } from "react";
import { getOpdById, complaint, updateOpd, createComplaint, deleteOpdComplaint, updateOpdChiefComplaint } from "../services/opd.services";
import { Trash2 } from "lucide-react";

export default function OpdComplaintsUpdate({ id }) {

  const [opd, setOpd] = useState({ chief_complaints: [] });
  const [complaintList, setComplaintList] = useState([]);
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
    fetchOpd();
    fetchComplaints();
  }, [id]);

  // Parse existing duration string to number and unit
  useEffect(() => {
    if (opd.chief_complaints.length > 0) {
      const parsedComplaints = opd.chief_complaints.map(item => {
        const { number, unit } = parseDuration(item.duration);
        return {
          ...item,
          durationNumber: number,
          durationUnit: unit
        };
      });
      setOpd(prev => ({ ...prev, chief_complaints: parsedComplaints }));
    }
  }, [opd.chief_complaints.length]);

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
  };

  // 🔹 FETCH OPD
  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const opdData = Array.isArray(res.data) ? res.data[0] : res.data;
      
      // Transform the data - Use chief_complaints not complaints_data
      const transformedComplaints = (opdData?.chief_complaints || []).map((item, index) => ({
        index: index,
        duration: item.duration,
        durationNumber: "",
        durationUnit: "",
        optional: item.optional,
        complaints_data_id: item.complaints_data?.id,
        complaints_data_name: item.complaints_data?.name
      }));
      
      setOpd({
        ...opdData,
        chief_complaints: transformedComplaints,
      });
    } catch (error) {
      console.error("Error fetching OPD:", error);
    }
  };

  // 🔹 FETCH MASTER COMPLAINTS
  const fetchComplaints = async () => {
    try {
      const res = await complaint();
      let data = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (Array.isArray(res.results)) {
        data = res.results;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }

      setComplaintList(data);
      console.log("Complaint list loaded:", data.length);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setComplaintList([]);
    }
  };

  // 🔹 HANDLE SEARCH INPUT
  const handleSearchInput = (value) => {
    setForm({ ...form, complaints_data_name: value });
    setComplaintHighlightIndex(-1);
    
    if (value.trim()) {
      const filtered = complaintList.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // 🔹 SELECT FROM DROPDOWN
  const selectComplaint = (complaint) => {
    setForm({
      ...form,
      complaints_data_name: complaint.name,
      complaints_data_id: complaint.id,
    });
    setShowDropdown(false);
    // Focus on duration input after selecting complaint
    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 100);
  };

  // 🔹 FIND OR CREATE COMPLAINT
  const findOrCreateComplaint = async (name) => {
    // Check if it exists locally
    const existing = complaintList.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) {
      return { id: existing.id, isNew: false };
    }
    
    // Create new
    try {
      const newComplaint = await createComplaint({ name });
      const createdComplaint = newComplaint.data || newComplaint;
      
      // Add to local list
      setComplaintList(prev => [...prev, createdComplaint]);
      
      return { id: createdComplaint.id, isNew: true };
    } catch (error) {
      console.error("Error creating complaint:", error);
      throw error;
    }
  };

  // 🔹 KEYBOARD NAVIGATION HANDLERS
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
      } else if (showDropdown && complaintHighlightIndex === searchResults.length) {
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
        severityInputRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      
      switch(nextField) {
        case 'add':
          addButtonRef.current?.click();
          // After adding, focus back to complaint input
          setTimeout(() => {
            complaintInputRef.current?.focus();
          }, 100);
          break;
        default:
          complaintInputRef.current?.focus();
      }
    }
  };

  // 🔹 ADD NEW COMPLAINT ENTRY
  const handleAdd = async () => {
    if (!form.complaints_data_name.trim()) {
      alert("Please fill duration and complaint");
      return;
    }

    try {
      setLoading({ add: true });

      // Step 1: Get the ID (find existing or create new)
      const result = await findOrCreateComplaint(form.complaints_data_name);
      
      // Step 2: Create new entry with ID
      const newEntry = {
        duration: form.duration,
        optional: form.optional || "",
        complaints_data: result.id
      };
      
      // Step 3: Create updated array by adding new entry to existing ones
      
      const updatedComplaints = [newEntry];
      
      // Step 4: Use updateOpd to update the entire chief_complaints array
      await updateOpd(id, { chief_complaints: updatedComplaints });
      
      // Step 5: Reset form and refresh data
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
      
      await fetchOpd();
      
    } catch (error) {
      console.error("Error adding complaint:", error);
      alert("Failed to add complaint");
    } finally {
      setLoading({ add: false });
    }
  };

  // 🔹 DELETE COMPLAINT ENTRY
  const handleDelete = async (index) => {
      try {
        setLoading({ [index]: true });
        
        // Try using the specific delete endpoint first
        await deleteOpdComplaint(id, index);
        
        // Refresh the list
        await fetchOpd();
        
      } catch (error) {
        console.error("Error deleting complaint:", error);
        
        // If specific delete fails, fallback to updateOpd
        try {
          // Create updated array without the deleted item
          const updatedEntries = opd.chief_complaints
            .filter((_, i) => i !== index)
            .map(item => ({
              duration: item.duration,
              optional: item.optional || "",
              complaints_data: item.complaints_data_id
            }));
          
          await updateOpd(id, { chief_complaints: updatedEntries });
          await fetchOpd();
        } catch (fallbackError) {
          alert("Failed to delete complaint");
        }
      } finally {
        setLoading({ [index]: false });
      }
  };

  return (
    <div className="px-6">
      {/* INLINE HEADER + ADD SECTION */}
        <>
            <div className="">
            <div className="flex items-start gap-4">
              {/* Title - inline */}
              <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[140px]">Chief Complaints</h2>

              {/* Input fields row */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Complaints Data Input with Dropdown */}
                <div className="relative">
                    <input
                    ref={complaintInputRef}
                    placeholder="Complaint name"
                    value={form.complaints_data_name}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={handleComplaintKeyDown}
                    onFocus={() => {
                        if (form.complaints_data_name) {
                        handleSearchInput(form.complaints_data_name);
                        }
                    }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="border rounded-lg px-4 py-1.5 w-full text-sm"
                    autoFocus
                    />
                    
                    {/* Dropdown Suggestions */}
                    {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {searchResults.map((c, index) => (
                        <div
                            key={c.id}
                            onMouseDown={() => selectComplaint(c)}
                            onMouseEnter={() => setComplaintHighlightIndex(index)}
                            className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${complaintHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                        >
                            <div className="font-medium">{c.name}</div>
                        </div>
                        ))}
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
                    className="border rounded-lg px-4 py-1.5 w-full text-sm"
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
               <div>
                 <input
                    ref={severityInputRef}
                    placeholder="Severity (optional)"
                    value={form.optional}
                    onChange={(e) =>
                    setForm({ ...form, optional: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, 'add')}
                    className="border rounded-lg px-4 py-1.5 w-full text-sm"
                />
               </div>

                {/* Add Button */}
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
                  className="w-full bg-blue-600 text-white rounded-lg px-4 py-1.5 text-sm
                            hover:bg-blue-700 disabled:opacity-50 
                            disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* LIST OF COMPLAINTS */}
        <div className="mt-2">
            
            {opd.chief_complaints.length === 0 ? (
            ""
            ) : (
            <div className="flex flex-wrap gap-2">
              {opd.chief_complaints.map((item) => (
                <div
                  key={item.index}
                  className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2"
                >
                  <span className="font-medium text-blue-800 text-sm">
                    {item.complaints_data_name} {item.duration &&  ` : ${item.duration}`}
                    {item.optional && ` : ${item.optional}`}
                  </span>
                  
                  <button
                    onClick={() => handleDelete(item.index)}
                    disabled={loading[item.index]}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
                    title="Delete complaint"
                  >
                    {loading[item.index] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
            )}
        </div>
        </>
    </div>
  );
}