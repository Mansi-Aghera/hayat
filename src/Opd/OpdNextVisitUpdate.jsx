import { useEffect, useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  getOpdById,
  updateOpd,
  deleteOpdNextVisit,
} from "../services/opd.services";

export default function OpdNextVisitUpdate({ id }) {
  const [opd, setOpd] = useState({ nextVisit: [] });
  const [loading, setLoading] = useState({});

  // ADD FORM
  const [form, setForm] = useState({
    visit: "",
  });

  // SUGGESTIONS STATE
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDatetime, setSelectedDatetime] = useState(null); // Store datetime separately

  // SUGGESTION OPTIONS
  const timeUnits = ["hours", "days", "weeks", "months","years"];
  
  // Refs for handling blur events
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    fetchOpd();
  }, [id]);

  // 🔹 CALCULATE FUTURE DATE
  const calculateFutureDate = (value, unit) => {
    const now = new Date();
    const futureDate = new Date(now);
    
    switch(unit.toLowerCase()) {
      case 'hours':
        futureDate.setHours(now.getHours() + parseInt(value));
        break;
      case 'days':
        futureDate.setDate(now.getDate() + parseInt(value));
        break;
      case 'weeks':
        futureDate.setDate(now.getDate() + (parseInt(value) * 7));
        break;
      case 'months':
        futureDate.setMonth(now.getMonth() + parseInt(value));
        break;
      case 'years':
        futureDate.setFullYear(now.getFullYear() + parseInt(value));
        break;
      default:
        return now;
    }
    
    return futureDate;
  };

  // 🔹 FORMAT DATE FOR STORAGE
  const formatDateForStorage = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 🔹 GENERATE SUGGESTIONS BASED ON INPUT
  const generateSuggestions = (value) => {
    if (!value || isNaN(value) || parseInt(value) <= 0) {
      setSuggestions([]);
      return;
    }
    
    const numericValue = parseInt(value);
    const newSuggestions = timeUnits.map(unit => {
      const calculatedDate = calculateFutureDate(numericValue, unit);
      const formattedDate = formatDateForStorage(calculatedDate);
      const displayDate = formatDateTimeForDisplay(formattedDate);
      
      return {
        text: `${numericValue} ${unit}`,
        value: `${numericValue} ${unit}`,
        datetime: formattedDate,
        displayDate: displayDate,
        unit: unit
      };
    });
    
    setSuggestions(newSuggestions);
    setShowSuggestions(true);
  };

  // 🔹 HANDLE INPUT CHANGE WITH SUGGESTIONS
  const handleInputChange = (value, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => ({ ...prev, visit: value }));
    } else {
      setForm(prev => ({ ...prev, visit: value }));
    }
    
    // Check if input is a valid number
    const numericValue = parseInt(value);
    if (value && !isNaN(numericValue) && numericValue > 0) {
      generateSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // 🔹 SELECT SUGGESTION
  const selectSuggestion = (suggestion, isEdit = false) => {
    if (isEdit) {
      setEditForm({
        visit: suggestion.text,
      });
    } else {
      setForm({
        visit: suggestion.text,
      });
    }
    
    // Store the datetime for later use
    setSelectedDatetime(suggestion.datetime);
    
    // Close suggestions
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // 🔹 FORMAT DATETIME FOR DISPLAY
  const formatDateTimeForDisplay = (datetime) => {
    if (!datetime) return "";

    try {
      let date;
      if (datetime.includes("T")) {
        date = new Date(datetime);
      } else {
        try {
          const [datePart, timePart] = datetime.split(" ");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hours, minutes, seconds] = timePart
            ? timePart.split(":").map(Number)
            : [0, 0, 0];
          date = new Date(year, month - 1, day, hours, minutes, seconds);
        } catch {
          return datetime;
        }
      }

      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return datetime;
    }
  };

  // 🔹 FETCH OPD
  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const opdData = Array.isArray(res.data) ? res.data[0] : res.data;

      const transformedVisits = (opdData?.nextVisit || []).map((item, index) => ({
        index,
        visit: item.visit || "",
        datetime: item.datetime || "",
        formatted_datetime: formatDateTimeForDisplay(item.datetime),
      }));

      setOpd({
        ...opdData,
        nextVisit: transformedVisits,
      });
    } catch (error) {
      console.error("Error fetching OPD:", error);
    }
  };

  // 🔹 PARSE VISIT STRING TO GET DATETIME
  const parseVisitToDatetime = (visitText) => {
    if (!visitText) return formatDateForStorage(new Date());
    
    // Check if it's already a date string
    if (visitText.includes('-') && (visitText.includes(':') || visitText.includes(' '))) {
      return visitText;
    }
    
    // Parse patterns like "6 days", "2 weeks", "3 months", "24 hours"
    const match = visitText.match(/^(\d+)\s+(day|week|month|hour)s?$/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      const futureDate = calculateFutureDate(value, unit);
      return formatDateForStorage(futureDate);
    }
    
    // Default to current date
    return formatDateForStorage(new Date());
  };

  // 🔹 ADD NEW NEXT VISIT ENTRY
  const handleAdd = async () => {
    if (!form.visit.trim()) {
      alert("Please enter next visit details");
      return;
    }

    try {
      setLoading({ add: true });

      // Use selected datetime or calculate it
      let datetime = selectedDatetime;
      if (!datetime) {
        datetime = parseVisitToDatetime(form.visit);
      }

      const newEntry = {
        visit: form.visit,
        datetime: datetime,
      };

      const existingEntries = opd.nextVisit.map((item) => ({
        visit: item.visit,
        datetime: item.datetime,
      }));

      const updatedNextVisit = [...existingEntries, newEntry];

      await updateOpd(id, {
        nextVisit: updatedNextVisit,
      });

      // Clear form and state
      setForm({ visit: "" });
      setSelectedDatetime(null);
      setSuggestions([]);
      setShowSuggestions(false);

      await fetchOpd();
    } catch (error) {
      console.error("Error adding next visit:", error);
      alert("Failed to add next visit");
    } finally {
      setLoading({ add: false });
    }
  };

  // 🔹 DELETE NEXT VISIT ENTRY
  const handleDelete = async (index) => { 
      try {
        setLoading({ [index]: true });

        await deleteOpdNextVisit(id, index);

        await fetchOpd();
      } catch (error) {
        console.error("Error deleting next visit:", error);
        alert("Failed to delete next visit");
      } finally {
        setLoading({ [index]: false });
      }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full pl-4">
        <>
          {/* ADD SECTION - Inline title + fields */}
          <div className="">{/* INPUT WITH SUGGESTIONS */}
            <div className="flex items-start gap-4 w-full">
              {/* Title - inline */}
              <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[100px]">Next Visit</h2>

              {/* Input + Button row */}
              <div className="flex-1 flex flex-col md:flex-row gap-3 items-center w-full">
              <div className="relative w-full md:w-4/5" ref={suggestionsRef}>
                <input
                  ref={inputRef}
                  placeholder="Enter number (e.g., 6)"
                  value={form.visit}
                  onChange={(e) => handleInputChange(e.target.value, false)}
                  onFocus={() => {
                    const value = form.visit;
                    const numericValue = parseInt(value);
                    if (value && !isNaN(numericValue) && numericValue > 0) {
                      generateSuggestions(value);
                    }
                  }}
                  className="border rounded-lg px-4 py-1 w-full"
                />
                
                {/* SUGGESTIONS DROPDOWN */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSuggestion(suggestion, false)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{suggestion.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleAdd}
                disabled={loading.add}
                className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-1/5 h-[42px] md:h-auto"
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

          {/* LIST OF NEXT VISITS */}
          <div className="mt-2">
            {opd.nextVisit.length === 0 ? (
              ""
            ) : (
              <div className="space-y-3">
                {opd.nextVisit.map((item) => (
                  <div key={item.index}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="font-medium text-gray-900 text-md">
                              {item.visit}
                            </div>
                            {item.datetime && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded">
                                  Scheduled for:
                                </span>
                                <span className="text-sm text-gray-600">
                                  {item.formatted_datetime ||
                                    formatDateTimeForDisplay(item.datetime)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(item.index)}
                            disabled={loading[item.index]}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            {loading[item.index] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
    </div>
  );
}