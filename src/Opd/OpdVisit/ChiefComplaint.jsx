// components/opd/ChiefComplaintsForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { complaint, createComplaint } from '../../services/ipd.services';

const ChiefComplaintsForm = ({ control, watch, setValue }) => {
  const complaints = watch('chief_complaints') || [];
  const [complaintList, setComplaintList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const durationUnits = [
    { value: 'hours', label: 'Hours', singular: 'hour' },
    { value: 'days', label: 'Days', singular: 'day' },
    { value: 'weeks', label: 'Weeks', singular: 'week' },
    { value: 'months', label: 'Months', singular: 'month' },
    { value: 'years', label: 'Years', singular: 'year' },
  ];

  // State for the add form
  const [addForm, setAddForm] = useState({
    complaint_name: '',
    complaint_id: null,
    durationNumber: '',
    duration: '',
    optional: 'No Opinion'
  });

  const [searchResults, setSearchResults] = useState([]);
  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showComplaintDropdown, setShowComplaintDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [complaintHighlightIndex, setComplaintHighlightIndex] = useState(-1);
  const [durationHighlightIndex, setDurationHighlightIndex] = useState(-1);

  const complaintInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const severityInputRef = useRef(null);

  useEffect(() => {
    fetchComplaintList();
  }, []);

  const fetchComplaintList = async () => {
    try {
      setLoading(true);
      const response = await complaint();
      let data = [];

      if (Array.isArray(response)) data = response;
      else if (Array.isArray(response?.results)) data = response.results;
      else if (Array.isArray(response?.data)) data = response.data;

      setComplaintList(data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaintList([]);
    } finally {
      setLoading(false);
    }
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

  // Handle complaint search in add form
  const handleComplaintSearch = (value) => {
    setAddForm(prev => ({ 
      ...prev, 
      complaint_name: value,
      complaint_id: null 
    }));
    setComplaintHighlightIndex(-1);

    if (value.trim()) {
      const filtered = complaintList.filter(c =>
        (c?.name || '').toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowComplaintDropdown(true);
    } else {
      setSearchResults([]);
      setShowComplaintDropdown(false);
    }
  };

  // Handle duration input in add form
  const handleDurationInput = (value) => {
    // Check if value already includes a unit (e.g., "7 days")
    const hasUnit = durationUnits.some(unit => 
      value.toLowerCase().includes(unit.singular) || 
      value.toLowerCase().includes(unit.value)
    );
    
    setDurationHighlightIndex(-1);

    if (hasUnit) {
      // If it already has a unit, set it as the duration
      setAddForm(prev => ({ 
        ...prev, 
        duration: value,
        durationNumber: value
      }));
      setDurationSuggestions([]);
    } else {
      // Otherwise, treat as number and show suggestions
      setAddForm(prev => ({ 
        ...prev, 
        durationNumber: value,
        duration: ''
      }));
      
      if (value.trim()) {
        generateDurationSuggestions(value);
        setShowDurationDropdown(true);
      } else {
        setDurationSuggestions([]);
        setShowDurationDropdown(false);
      }
    }
  };

  // Select complaint from dropdown
  const selectComplaint = (complaintItem) => {
    setAddForm(prev => ({
      ...prev,
      complaint_name: complaintItem.name,
      complaint_id: complaintItem.id,
    }));
    setShowComplaintDropdown(false);
    
    // Auto shift focus to duration field
    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 0);
  };

  // Select duration from dropdown
  const selectDuration = (suggestion) => {
    setAddForm(prev => ({
      ...prev,
      duration: suggestion.value,
      durationNumber: suggestion.value, // Show full duration in input
    }));
    setShowDurationDropdown(false);
    
    // Auto shift focus to severity field
    setTimeout(() => {
      severityInputRef.current?.focus();
    }, 0);
  };

  // Create new complaint if doesn't exist
  const createNewComplaint = async (name) => {
    try {
      const response = await createComplaint({ name });
      const created = response?.data || response;
      setComplaintList(prev => [...prev, created]);
      return created.id;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  };

  // Add new complaint to the list
  const addComplaint = async () => {
    if (!addForm.complaint_name.trim()) {
      alert('Please enter complaint name');
      return;
    }

    let complaintId = addForm.complaint_id;
    const durationToUse = addForm.duration || addForm.durationNumber;

    // If no ID selected, check if it exists or create new
    if (!complaintId) {
      const existing = complaintList.find(
        c => (c?.name || '').toLowerCase() === addForm.complaint_name.toLowerCase()
      );

      if (existing) {
        complaintId = existing.id;
      } else {
        try {
          complaintId = await createNewComplaint(addForm.complaint_name);
        } catch (error) {
          alert('Failed to create new complaint');
          return;
        }
      }
    }

    // Add to form data
    const newComplaint = {
      complaints_data: complaintId,
      complaint_name: addForm.complaint_name,
      duration: durationToUse,
      optional: addForm.optional || 'No Opinion'
    };

    setValue('chief_complaints', [...complaints, newComplaint]);

    // Reset add form
    setAddForm({
      complaint_name: '',
      complaint_id: null,
      durationNumber: '',
      duration: '',
      optional: 'No Opinion'
    });
    setShowComplaintDropdown(false);
    setShowDurationDropdown(false);
    setSearchResults([]);
    setDurationSuggestions([]);
  };

  // Handle Keyboard Navigation for Complaint
  const handleComplaintKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setComplaintHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setComplaintHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showComplaintDropdown && complaintHighlightIndex >= 0 && complaintHighlightIndex < searchResults.length) {
        selectComplaint(searchResults[complaintHighlightIndex]);
      } else if (showComplaintDropdown && complaintHighlightIndex === searchResults.length) {
        setShowComplaintDropdown(false);
      } else {
        addComplaint();
      }
    }
  };

  // Handle Keyboard Navigation for Duration
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
        addComplaint();
      }
    }
  };

  // Handle Enter key press in any other input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addComplaint();
    }
  };

  // Remove complaint from list
  const removeComplaint = (index) => {
    setValue('chief_complaints', complaints.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* Add Complaint Form - Inline title + fields */}
      <div className="flex items-start gap-4 mb-4">
        <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Chief Complaints</h3>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Complaint Input */}
        <div className="relative">
          <input
            ref={complaintInputRef}
            type="text"
            placeholder="Type complaint name"
            value={addForm.complaint_name}
            onChange={(e) => handleComplaintSearch(e.target.value)}
            onFocus={() => addForm.complaint_name && handleComplaintSearch(addForm.complaint_name)}
            onBlur={() => setTimeout(() => setShowComplaintDropdown(false), 200)}
            onKeyDown={handleComplaintKeyDown}
            className="w-full px-3 py-2.5 border rounded-md text-sm"
          />
          
          {showComplaintDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((c, index) => (
                <div
                  key={c.id}
                  onMouseDown={() => selectComplaint(c)}
                  onMouseEnter={() => setComplaintHighlightIndex(index)}
                  className={`px-4 py-2 cursor-pointer border-b ${complaintHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                >
                  <div className="font-medium text-sm">{c.name}</div>
                </div>
              ))}
              <div
                onMouseDown={() => setShowComplaintDropdown(false)}
                onMouseEnter={() => setComplaintHighlightIndex(searchResults.length)}
                className={`px-4 py-2 cursor-pointer border-t ${complaintHighlightIndex === searchResults.length ? 'bg-emerald-100' : 'hover:bg-emerald-50 bg-gray-50'}`}
              >
                <div className="font-medium text-sm text-emerald-600">
                  Or create new: "{addForm.complaint_name}"
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Duration Input - Shows selected duration */}
        <div className="relative">
          <input
            ref={durationInputRef}
            type="text"
            placeholder="Enter duration (e.g., 7 days)"
            value={addForm.duration || addForm.durationNumber}
            onChange={(e) => handleDurationInput(e.target.value)}
            onFocus={() => (addForm.duration || addForm.durationNumber) && handleDurationInput(addForm.duration || addForm.durationNumber)}
            onBlur={() => setTimeout(() => setShowDurationDropdown(false), 200)}
            onKeyDown={handleDurationKeyDown}
            className="w-full px-3 py-2.5 border rounded-md text-sm"
          />
          
          {showDurationDropdown && durationSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {durationSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => selectDuration(suggestion)}
                  onMouseEnter={() => setDurationHighlightIndex(idx)}
                  className={`px-4 py-2 cursor-pointer border-b ${durationHighlightIndex === idx ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                >
                  <div className="font-medium text-sm">{suggestion.display}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Severity */}
        <div>
          <input
            ref={severityInputRef}
            type="text"
            placeholder="Enter Severity"
            value={addForm.optional}
            onChange={(e) => setAddForm(prev => ({ 
              ...prev, 
              optional: e.target.value 
            }))}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2.5 border rounded-md text-sm"
          />
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={addComplaint}
          className="bg-blue-600 text-white rounded-md px-4 py-2.5 hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Complaint
        </button>
        </div>
      </div>

      {/* Duration unit quick buttons */}
      {addForm.durationNumber && !addForm.duration && !showDurationDropdown && (
        <div className="flex flex-wrap gap-2 mb-4">
          {durationUnits.map(unit => {
            const num = parseFloat(addForm.durationNumber);
            if (isNaN(num) || num <= 0) return null;
            const isPlural = num !== 1;
            const unitLabel = isPlural ? unit.value : unit.singular;
            const durationText = `${num} ${unitLabel}`;
            
            return (
              <button
                key={unit.value}
                type="button"
                onClick={() => {
                  setAddForm(prev => ({
                    ...prev,
                    duration: durationText,
                    durationNumber: durationText
                  }));
                }}
                className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                {durationText}
              </button>
            );
          })}
        </div>
      )}

      {/* Added Complaints List - In one line format */}
      <div className="mt-2">
        {complaints.length === 0 ? (
          ""
        ) : (
          <div className="flex flex-wrap gap-2">
            {complaints.map((item, index) => {
              const complaintItem = complaintList.find(
                c => c.id === item.complaints_data
              );

              const complaintName =
                complaintItem?.name ||
                item.complaint_name ||
                'Unknown Complaint';

              return (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2"
                >
                  {/* Text */}
                  <span className="font-medium text-blue-800 text-sm">
                    {complaintName}
                    {item.duration && ` : ${item.duration}`}
                    {item.optional && ` : ${item.optional}`}
                  </span>

                  {/* Hidden fields (IMPORTANT – DO NOT REMOVE) */}
                  <div className="hidden">
                    <Controller
                      name={`chief_complaints.${index}.complaints_data`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`chief_complaints.${index}.complaint_name`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`chief_complaints.${index}.duration`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`chief_complaints.${index}.optional`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeComplaint(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
                    title="Delete complaint"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChiefComplaintsForm;