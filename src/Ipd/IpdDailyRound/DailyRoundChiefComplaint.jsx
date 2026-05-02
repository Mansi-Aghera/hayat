import React, { useState, useEffect, useRef } from 'react';
import { complaint, createComplaint } from '../../services/ipd.services';
import { Plus, Trash2 } from 'lucide-react';

const DailyChiefComplaints = ({ dailyChiefComplaints, setDailyChiefComplaints }) => {
  const [complaintList, setComplaintList] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [complaintHighlightIndex, setComplaintHighlightIndex] = useState(-1);

  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [durationHighlightIndex, setDurationHighlightIndex] = useState(-1);

  const complaintInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const statusInputRef = useRef(null);
  const addButtonRef = useRef(null);

  // New complaint form
  const [newComplaint, setNewComplaint] = useState({
    duration: '',
    durationNumber: '',
    durationUnit: '',
    complaint_name: '',
    complaint_id: null,
    status: '',
  });

  const durationUnits = [
    { value: 'hours', label: 'Hours', singular: 'hour' },
    { value: 'days', label: 'Days', singular: 'day' },
    { value: 'weeks', label: 'Weeks', singular: 'week' },
    { value: 'months', label: 'Months', singular: 'month' },
    { value: 'years', label: 'Years', singular: 'year' },
  ];

  useEffect(() => {
    fetchComplaintList();
  }, []);

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
      const isPlural = num !== 1;
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
    setNewComplaint(prev => ({ 
      ...prev, 
      durationNumber: value,
      duration: '' // Clear the combined duration when user starts typing
    }));
    
    if (value.trim()) {
      generateDurationSuggestions(value);
      setShowDurationDropdown(true);
      setDurationHighlightIndex(-1);
    } else {
      setDurationSuggestions([]);
      setShowDurationDropdown(false);
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
        setShowDurationDropdown(false);
        statusInputRef.current?.focus();
      }
    }
  };

  // Select duration from dropdown for add form
  const selectDuration = (suggestion) => {
    setNewComplaint({
      ...newComplaint,
      duration: suggestion.value,
      durationNumber: suggestion.number,
      durationUnit: suggestion.unit
    });
    setShowDurationDropdown(false);
    setTimeout(() => statusInputRef.current?.focus(), 10);
  };

  const fetchComplaintList = async () => {
    try {
      const response = await complaint();
      let data = [];

      if (Array.isArray(response)) data = response;
      else if (Array.isArray(response?.results)) data = response.results;
      else if (Array.isArray(response?.data)) data = response.data;

      setComplaintList(data);
    } catch (error) {
      console.error('Error fetching complaint:', error);
      setComplaintList([]);
    }
  };

  const handleSearchInput = (value) => {
    setNewComplaint((prev) => ({ ...prev, complaint_name: value, complaint_id: null }));

    if (value.trim()) {
      const filtered = complaintList.filter((c) =>
        (c?.name || '').toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
      setComplaintHighlightIndex(-1);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
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
      } else if (showDropdown && complaintHighlightIndex === searchResults.length) {
        setShowDropdown(false);
        durationInputRef.current?.focus();
      } else {
        durationInputRef.current?.focus();
      }
    }
  };

  const selectComplaint = (complaintItem) => {
    setNewComplaint((prev) => ({
      ...prev,
      complaint_name: complaintItem.name,
      complaint_id: complaintItem.id,
    }));
    setShowDropdown(false);
    setTimeout(() => durationInputRef.current?.focus(), 10);
  };

  const createNewComplaint = async (name) => {
    const response = await createComplaint({ name });
    const created = response?.data || response;

    setComplaintList((prev) => [...prev, created]);
    return created.id;
  };

  const handleAddComplaint = async () => {
    if (
      !newComplaint.complaint_name.trim() ||
      !newComplaint.duration.trim()
    ) {
      alert('Please fill all complaint fields');
      return;
    }

    let complaintId = newComplaint.complaint_id;

    if (!complaintId) {
      const existing = complaintList.find(
        (c) => (c?.name || '').toLowerCase() === newComplaint.complaint_name.toLowerCase()
      );

      if (existing) {
        complaintId = existing.id;
      } else {
        try {
          complaintId = await createNewComplaint(newComplaint.complaint_name);
        } catch (e) {
          console.error(e);
          alert('Failed to create new complaint');
          return;
        }
      }
    }

    const newComplaintEntry = {
      status: newComplaint.status,
      duration: newComplaint.duration,
      complaints_data: complaintId,
      complaint_name: newComplaint.complaint_name,
    };

    setDailyChiefComplaints((prev) => [...prev, newComplaintEntry]);

    // Reset form
    setNewComplaint({
      duration: '',
      durationNumber: '',
      durationUnit: '',
      complaint_name: '',
      complaint_id: null,
      status: '',
    });
    setShowDropdown(false);
    setShowDurationDropdown(false);
    setSearchResults([]);
    setDurationSuggestions([]);
  };

  const handleRemoveComplaint = (index) => {
    setDailyChiefComplaints((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <div className="flex items-start gap-4 mb-3">
        <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Chief Complaints</h3>
        <div className="flex-1">
          {/* Add Complaint Form */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                {/* 4 fields: Complaint | Duration | Status | Button */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Complaint Input */}
                  <div className="relative">
                    <input
                      ref={complaintInputRef}
                      type="text"
                      placeholder="Type complaint name"
                      value={newComplaint.complaint_name}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onKeyDown={handleComplaintKeyDown}
                      onFocus={() =>
                        newComplaint.complaint_name && handleSearchInput(newComplaint.complaint_name)
                      }
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      className="border border-gray-300 rounded-lg px-3 py-1 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />

                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {searchResults.map((c, index) => (
                          <div
                            key={c.id}
                            onMouseDown={() => selectComplaint(c)}
                            onMouseEnter={() => setComplaintHighlightIndex(index)}
                            className={`px-4 py-1 cursor-pointer border-b border-gray-200 last:border-b-0 ${complaintHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                          >
                            <div className="font-medium text-sm">{c.name}</div>
                          </div>
                        ))}
                        <div
                          onMouseDown={() => setShowDropdown(false)}
                          onMouseEnter={() => setComplaintHighlightIndex(searchResults.length)}
                          className={`px-4 py-1 cursor-pointer border-t border-gray-200 ${complaintHighlightIndex === searchResults.length ? 'bg-emerald-100' : 'hover:bg-emerald-50 bg-gray-50'}`}
                        >
                          <div className="font-medium text-sm text-emerald-600">
                            Or create new: "{newComplaint.complaint_name}"
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Duration Input with Suggestions */}
                  <div className="relative">
                    <input
                      ref={durationInputRef}
                      placeholder="Enter Duration (e.g., 2 days)"
                      value={newComplaint.durationNumber}
                      onChange={(e) => handleDurationInput(e.target.value)}
                      onKeyDown={handleDurationKeyDown}
                      onFocus={() => newComplaint.durationNumber && handleDurationInput(newComplaint.durationNumber)}
                      onBlur={() => setTimeout(() => setShowDurationDropdown(false), 200)}
                      className="border border-gray-300 rounded-lg px-3 py-1 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    
                    {/* Duration Suggestions Dropdown */}
                    {showDurationDropdown && durationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {durationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onMouseDown={() => selectDuration(suggestion)}
                            onMouseEnter={() => setDurationHighlightIndex(index)}
                            className={`px-4 py-1 cursor-pointer border-b border-gray-200 last:border-b-0 ${durationHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                          >
                            <div className="font-medium text-sm">{suggestion.display}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Input */}
                  <div>
                    <input
                      ref={statusInputRef}
                      type="text"
                      placeholder="Status (e.g., Severe)"
                      value={newComplaint.status}
                      onChange={(e) => setNewComplaint((prev) => ({ ...prev, status: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addButtonRef.current?.click();
                        }
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-1 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    ref={addButtonRef}
                    onClick={handleAddComplaint}
                    className="bg-blue-600 text-white rounded-lg px-4 py-1 hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add complaint
                  </button>
                </div>

                {/* Display selected duration */}
                {newComplaint.duration && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected duration: <span className="font-medium">{newComplaint.duration}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Complaints List */}
          <div className="space-y-3">
            {dailyChiefComplaints.map((c, index) => {
              const complaintName =
                complaintList.find((x) => x.id === c.complaints_data)?.name ||
                c.complaint_name ||
                'Unknown Complaint';

              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="font-medium text-gray-900">{complaintName}</div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                        Duration: {c.duration}
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                        Status: {c.status}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveComplaint(index)}
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove complaint"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {dailyChiefComplaints.length === 0 && (
              ""
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChiefComplaints;
