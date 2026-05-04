import React, { useEffect, useState, useRef } from 'react';
import { getStaff } from '../../services/staff.services';
import { Trash2 } from 'lucide-react';

const AdditionalFieldsSection = ({ 
  formData, 
  setFormData, 
  nextVisitInput, 
  setNextVisitInput, 
  handleAddNextVisit, 
  handleRemoveItem 
}) => {
  const [staff, setStaff] = useState([]);
  
  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const timeUnits = ["hours", "days", "weeks", "months", "years"];

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        selectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        handleAddNextVisit();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const response = await getStaff();
      setStaff(response);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  const calculateFutureDate = (value, unit) => {
    const now = new Date();
    const futureDate = new Date(now);
    const num = parseInt(value);
    
    switch(unit.toLowerCase()) {
      case 'hours': futureDate.setHours(now.getHours() + num); break;
      case 'days': futureDate.setDate(now.getDate() + num); break;
      case 'weeks': futureDate.setDate(now.getDate() + (num * 7)); break;
      case 'months': futureDate.setMonth(now.getMonth() + num); break;
      case 'years': futureDate.setFullYear(now.getFullYear() + num); break;
      default: break;
    }
    return futureDate;
  };

  const formatDateForStorage = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const formatDateTimeForDisplay = (datetime) => {
    if (!datetime) return "";
    try {
      let date;
      if (datetime.includes("|")) {
        date = new Date(datetime.split(' | ')[1]);
      } else {
        date = new Date(datetime);
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

  const handleInputChange = (value) => {
    setNextVisitInput(value);

    const numericValue = parseInt(value);
    if (value && !isNaN(numericValue) && numericValue > 0) {
      const newSuggestions = timeUnits.map(unit => {
        const calculatedDate = calculateFutureDate(numericValue, unit);
        return {
          text: `${numericValue} ${unit}`,
          date: formatDateForStorage(calculatedDate)
        };
      });
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    // Store in a way that matches OPD logic (text | date)
    setNextVisitInput(`${suggestion.text} | ${suggestion.date}`);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Row Layout for Next Visit */}
      <div className="flex items-start gap-4">
        <label className="text-base font-bold text-gray-900 whitespace-nowrap pt-2 w-[150px] flex-shrink-0">
          Next Visit
        </label>
        
        <div className="flex-1 flex flex-col md:flex-row gap-3 items-start w-full">
          <div className="relative w-full md:w-4/5" ref={suggestionsRef}>
            <input
              ref={inputRef}
              type="text"
              value={nextVisitInput.split(' | ')[0]} // Show only the text part in input
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                const numericValue = parseInt(nextVisitInput);
                if (nextVisitInput && !isNaN(numericValue) && numericValue > 0) {
                  handleInputChange(nextVisitInput);
                }
              }}
              onKeyDown={handleKeyDown}
              className="border rounded-lg px-4 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter number (e.g., 5)"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className={`px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-sm font-medium text-gray-700 ${
                      index === activeSuggestionIndex ? 'bg-blue-100' : ''
                    }`}
                  >
                    {suggestion.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddNextVisit}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-bold hover:bg-blue-700 transition-colors w-full md:w-1/5 min-h-[42px]"
          >
            Add
          </button>
        </div>
      </div>

      {/* List of Visits Below the Input Row */}
      <div className="pl-[150px] space-y-2">
        {formData.next_visit?.map((visit, index) => {
          const parts = visit.split(' | ');
          const visitText = parts[0];
          const dateText = parts[1];

          return (
            <div key={index} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 group">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 text-sm">{visitText}</span>
                {dateText && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase">
                      Scheduled for:
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDateTimeForDisplay(dateText)}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveItem('next_visit', index)}
                className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* DD Note Row */}
      <div className="flex items-start gap-4">
        <label className="text-base font-bold text-gray-900 whitespace-nowrap pt-2 w-[150px] flex-shrink-0">
          DD Note
        </label>
        <textarea
          value={formData.dd_note || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, dd_note: e.target.value }))}
          rows="1"
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
          placeholder="Enter DD notes here..."
        />
      </div>

      {/* Staff Member Row */}
      <div className="flex items-center gap-4">
        <label className="text-base font-bold text-gray-900 whitespace-nowrap w-[150px] flex-shrink-0">
          Staff Member
        </label>
        <select
          name="staff_data"
          value={formData.staff_data || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, staff_data: e.target.value }))}
          required
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        >
          <option value="">Select Staff Member</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.staff_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AdditionalFieldsSection;