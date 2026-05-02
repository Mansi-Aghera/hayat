import { useEffect, useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { getOpdById, diagnosis, updateOpd, createDiagnosis, deleteOpdDiagnosis, updateOpdDiagnosis } from "../services/opd.services";

export default function OpdDiagnosisUpdate({ id }) {
  const [opd, setOpd] = useState({ diagnosis_detail: [] });
  const [diagnosisList, setDiagnosisList] = useState([]);
  const [loading, setLoading] = useState({});

  // ADD FORM
  const [form, setForm] = useState({
    duration: "",
    durationNumber: "",
    durationUnit: "",
    diagnosis_name: "",
    diagnosis_id: null,
  });

  // SEARCH RESULTS
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);

  // Keyboard navigation states
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(-1);

  // Refs for input fields
  const diagnosisInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const addButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  const durationDropdownRef = useRef(null);
  const suggestionRefs = useRef([]);
  const durationSuggestionRefs = useRef([]);

  const durationUnits = [
    { value: "hours", label: "Hours", singular: "hour" },
    { value: "days", label: "Days", singular: "day" },
    { value: "weeks", label: "Weeks", singular: "week" },
    { value: "months", label: "Months", singular: "month" },
    { value: "years", label: "Years", singular: "year" }
  ];

  useEffect(() => {
    fetchOpd();
    fetchDiagnosis();
  }, [id]);

  // Parse existing duration string to number and unit
  useEffect(() => {
    if (opd.diagnosis_detail.length > 0) {
      const parsedComplaints = opd.diagnosis_detail.map(item => {
        const { number, unit } = parseDuration(item.duration);
        return {
          ...item,
          durationNumber: number,
          durationUnit: unit
        };
      });
      setOpd(prev => ({ ...prev, diagnosis_detail: parsedComplaints }));
    }
  }, [opd.diagnosis_detail.length]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
    // Reset refs array when search results change
    suggestionRefs.current = suggestionRefs.current.slice(0, searchResults.length);
  }, [searchResults]);

  // Reset selected duration index when duration suggestions change
  useEffect(() => {
    setSelectedDurationIndex(-1);
    durationSuggestionRefs.current = durationSuggestionRefs.current.slice(0, durationSuggestions.length);
  }, [durationSuggestions]);

  // Scroll selected suggestion into view for diagnosis
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionRefs.current[selectedSuggestionIndex]) {
      suggestionRefs.current[selectedSuggestionIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedSuggestionIndex]);

  // Scroll selected duration suggestion into view
  useEffect(() => {
    if (selectedDurationIndex >= 0 && durationSuggestionRefs.current[selectedDurationIndex]) {
      durationSuggestionRefs.current[selectedDurationIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedDurationIndex]);

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

    if (value.trim()) {
      generateDurationSuggestions(value);
      setShowDurationDropdown(true);
      setSelectedDurationIndex(-1);
    } else {
      setDurationSuggestions([]);
      setShowDurationDropdown(false);
      setSelectedDurationIndex(-1);
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
    setSelectedDurationIndex(-1);
    // Focus on add button after selecting duration
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
      const transformedDiagnosis = (opdData?.diagnosis_detail || []).map((item, index) => ({
        index: index,
        duration: item.duration,
        durationNumber: "",
        durationUnit: "",
        diagnosis_id: item.diagnosis_data?.id,
        diagnosis_name: item.diagnosis_data?.diagnosis_name
      }));

      setOpd({
        ...opdData,
        diagnosis_detail: transformedDiagnosis,
      });
    } catch (error) {
      console.error("Error fetching OPD:", error);
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
    } catch (error) {
      console.error("Error fetching diagnosis:", error);
      setDiagnosisList([]);
    }
  };

  // 🔹 HANDLE SEARCH INPUT
  const handleSearchInput = (value) => {
    setForm({ ...form, diagnosis_name: value });
    setSelectedSuggestionIndex(-1);

    if (value.trim()) {
      const filtered = diagnosisList.filter(d =>
        d.diagnosis_name?.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // 🔹 SELECT FROM DROPDOWN
  const selectDiagnosis = (diag) => {
    setForm({
      ...form,
      diagnosis_name: diag.diagnosis_name,
      diagnosis_id: diag.id,
    });
    setShowDropdown(false);
    setSelectedSuggestionIndex(-1);
    // Focus on duration input after selecting diagnosis
    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 100);
  };

  // 🔹 KEYBOARD NAVIGATION FOR DIAGNOSIS DROPDOWN
  const handleDiagnosisKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) {
      // If no dropdown, handle Enter to move to duration field
      if (e.key === 'Enter' && form.diagnosis_name.trim()) {
        e.preventDefault();
        durationInputRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchResults.length) {
          selectDiagnosis(searchResults[selectedSuggestionIndex]);
        } else if (form.diagnosis_name.trim()) {
          // If no suggestion selected, move to duration field
          durationInputRef.current?.focus();
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;

      case 'Tab':
        // Allow tab to work normally
        setShowDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;

      default:
        break;
    }
  };

  // 🔹 KEYBOARD NAVIGATION FOR DURATION DROPDOWN
  const handleDurationKeyDown = (e) => {
    if (!showDurationDropdown || durationSuggestions.length === 0) {
      // If no dropdown, handle Enter to move to add button
      if (e.key === 'Enter' && form.durationNumber) {
        e.preventDefault();
        addButtonRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedDurationIndex(prev =>
          prev < durationSuggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedDurationIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedDurationIndex >= 0 && selectedDurationIndex < durationSuggestions.length) {
          selectDuration(durationSuggestions[selectedDurationIndex]);
        } else if (form.durationNumber) {
          // If no suggestion selected, move to add button
          addButtonRef.current?.focus();
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowDurationDropdown(false);
        setSelectedDurationIndex(-1);
        break;

      case 'Tab':
        // Allow tab to work normally
        setShowDurationDropdown(false);
        setSelectedDurationIndex(-1);
        break;

      default:
        break;
    }
  };

  // 🔹 FIND OR CREATE DIAGNOSIS
  const findOrCreateDiagnosis = async (name) => {
    // Check if it exists locally
    const existing = diagnosisList.find(
      d => d.diagnosis_name?.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return { id: existing.id, isNew: false };
    }

    // Create new
    try {
      const newDiagnosis = await createDiagnosis({ diagnosis_name: name });
      const createdDiagnosis = newDiagnosis.data || newDiagnosis;

      // Add to local list
      setDiagnosisList(prev => [...prev, createdDiagnosis]);

      return { id: createdDiagnosis.id, isNew: true };
    } catch (error) {
      console.error("Error creating diagnosis:", error);
      throw error;
    }
  };

  // 🔹 ENTER KEY HANDLER FOR OTHER FIELDS
  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission

      switch (nextField) {
        case 'duration':
          durationInputRef.current?.focus();
          break;
        case 'add':
          addButtonRef.current?.click();
          // After adding, focus back to diagnosis input
          setTimeout(() => {
            diagnosisInputRef.current?.focus();
          }, 100);
          break;
        default:
          diagnosisInputRef.current?.focus();
      }
    }
  };

  // 🔹 ADD NEW DIAGNOSIS ENTRY
  const handleAdd = async () => {
    if (!form.diagnosis_name.trim()) {
      alert("Please enter diagnosis");
      return;
    }

    try {
      setLoading({ add: true });

      // 1️⃣ get diagnosis id (existing or new)
      const result = await findOrCreateDiagnosis(form.diagnosis_name);

      // 2️⃣ build new entry
      const newEntry = {
        duration: form.duration || "",
        diagnosis_data: result.id,
      };

      const updatedDiagnosis = [newEntry];

      // 4️⃣ PATCH whole array
      await updateOpd(id, {
        diagnosis_detail: updatedDiagnosis,
      });

      // 5️⃣ reset UI
      setForm({
        duration: "",
        durationNumber: "",
        durationUnit: "",
        diagnosis_name: "",
        diagnosis_id: null,
      });
      setSearchResults([]);
      setShowDropdown(false);
      setDurationSuggestions([]);
      setShowDurationDropdown(false);
      setSelectedSuggestionIndex(-1);
      setSelectedDurationIndex(-1);

      await fetchOpd();
    } catch (error) {
      console.error("Error adding diagnosis:", error);
      alert("Failed to add diagnosis");
    } finally {
      setLoading({ add: false });
    }
  };

  // 🔹 DELETE DIAGNOSIS ENTRY
  const handleDelete = async (index) => {
    try {
      setLoading({ [index]: true });

      // Use the specific delete endpoint
      await deleteOpdDiagnosis(id, index);

      // Refresh the list
      await fetchOpd();

    } catch (error) {
      console.error("Error deleting diagnosis:", error);
      alert("Failed to delete diagnosis");
    } finally {
      setLoading({ [index]: false });
    }
  };

  return (
    <div className="px-6 pb-2">
      <>
        {/* ADD SECTION - Inline title + fields */}
        <div className="">
          <div className="flex items-start gap-4">
            {/* Title - inline */}
            <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[140px]">Diagnosis Detail</h2>

            {/* Input fields row */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Diagnosis Input with Dropdown */}
              <div className="relative">
                <input
                  ref={diagnosisInputRef}
                  placeholder="Type diagnosis name"
                  value={form.diagnosis_name}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleDiagnosisKeyDown}
                  onFocus={() => {
                    if (form.diagnosis_name) {
                      handleSearchInput(form.diagnosis_name);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="border rounded-lg px-4 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />

                {/* Dropdown Suggestions */}
                {showDropdown && searchResults.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
                  >
                    {searchResults.map((d, idx) => (
                      <div
                        key={d.id}
                        ref={el => suggestionRefs.current[idx] = el}
                        onMouseDown={() => selectDiagnosis(d)}
                        onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                        className={`diagnosis-suggestion-item px-4 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${idx === selectedSuggestionIndex
                            ? 'bg-blue-100'
                            : 'hover:bg-blue-50'
                          }`}
                      >
                        <div className="font-medium">{d.diagnosis_name}</div>
                        {d.description && (
                          <div className="text-sm text-gray-500">{d.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {showDropdown && form.diagnosis_name && searchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
                    <div className="text-gray-500">
                      No matches found. Press "Enter" to move to duration, or click "Add" to create "{form.diagnosis_name}"
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
                  onFocus={() => {
                    if (form.durationNumber) {
                      handleDurationInput(form.durationNumber);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowDurationDropdown(false), 200)}
                  className="border rounded-lg px-4 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Duration Suggestions Dropdown */}
                {showDurationDropdown && durationSuggestions.length > 0 && (
                  <div
                    ref={durationDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
                  >
                    {durationSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        ref={el => durationSuggestionRefs.current[idx] = el}
                        onMouseDown={() => selectDuration(suggestion)}
                        onMouseEnter={() => setSelectedDurationIndex(idx)}
                        className={`duration-suggestion-item px-4 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${idx === selectedDurationIndex
                            ? 'bg-blue-100'
                            : 'hover:bg-blue-50'
                          }`}
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
                  className="w-full bg-blue-600 text-white rounded-lg px-4 py-1 
                        hover:bg-blue-700 disabled:opacity-50 
                        disabled:cursor-not-allowed flex items-center justify-center gap-2
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* LIST OF DIAGNOSES - In one line like complaints */}
        <div className="mt-2">
          {opd.diagnosis_detail.length === 0 ? (
            ""
          ) : (
            <div className="flex flex-wrap gap-2">
              {opd.diagnosis_detail.map((item) => (
                <div
                  key={item.index}
                  className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2"
                >
                  <span className="font-medium text-blue-800 text-sm">
                    {item.diagnosis_name}
                    {item.duration && (
                      <span className="text-blue-600 ml-2">
                        : {item.duration}
                      </span>
                    )}
                  </span>

                  <button
                    onClick={() => handleDelete(item.index)}
                    disabled={loading[item.index]}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Delete diagnosis"
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