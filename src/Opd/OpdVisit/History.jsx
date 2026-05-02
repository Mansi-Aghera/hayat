// components/opd/HistoryForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { pastHistory, createPastHistory } from '../../services/ipd.services';

const HistoryForm = ({ control, watch, setValue }) => {
  const histories = watch('past_history') || [];
  const [historyList, setHistoryList] = useState([]);
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
    history_name: '',
    history_id: null,
    durationNumber: '',
    duration: ''
  });

  const [searchResults, setSearchResults] = useState([]);
  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [historyHighlightIndex, setHistoryHighlightIndex] = useState(-1);
  const [durationHighlightIndex, setDurationHighlightIndex] = useState(-1);

  const historyInputRef = useRef(null);
  const durationInputRef = useRef(null);

  useEffect(() => {
    fetchHistoryList();
  }, []);

  const fetchHistoryList = async () => {
    try {
      setLoading(true);
      const data = await pastHistory();
      
      // Ensure data is an array, handle different response structures
      if (Array.isArray(data)) {
        setHistoryList(data);
      } else if (Array.isArray(data?.data)) {
        setHistoryList(data.data);
      } else if (Array.isArray(data?.results)) {
        setHistoryList(data.results);
      } else {
        console.warn('Unexpected history data format:', data);
        setHistoryList([]);
      }
    } catch (error) {
      console.error('Error fetching past history:', error);
      setHistoryList([]);
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

  // Handle history search in add form
  const handleHistorySearch = (value) => {
    setAddForm(prev => ({ 
      ...prev, 
      history_name: value,
      history_id: null 
    }));
    setHistoryHighlightIndex(-1);

    if (value.trim()) {
      // Ensure historyList is an array before filtering
      if (Array.isArray(historyList)) {
        const filtered = historyList.filter(h => {
          const historyName = h?.name || h?.history_name || '';
          return historyName.toLowerCase().includes(value.toLowerCase());
        });
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
      setShowHistoryDropdown(true);
    } else {
      setSearchResults([]);
      setShowHistoryDropdown(false);
    }
  };

  // Handle duration input in add form
  const handleDurationInput = (value) => {
    // Check if value already includes a unit
    const hasUnit = durationUnits.some(unit => 
      value.toLowerCase().includes(unit.singular) || 
      value.toLowerCase().includes(unit.value)
    );
    
    setDurationHighlightIndex(-1);

    if (hasUnit) {
      setAddForm(prev => ({ 
        ...prev, 
        duration: value,
        durationNumber: value
      }));
      setDurationSuggestions([]);
    } else {
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

  // Select history from dropdown
  const selectHistory = (historyItem) => {
    const historyName = historyItem?.name || historyItem?.history_name || '';
    
    if (historyItem && historyItem.id && historyName) {
      setAddForm(prev => ({
        ...prev,
        history_name: historyName,
        history_id: historyItem.id,
      }));
      setShowHistoryDropdown(false);
      
      // Auto shift focus to duration field
      setTimeout(() => {
        durationInputRef.current?.focus();
      }, 0);
    }
  };

  // Select duration from dropdown
  const selectDuration = (suggestion) => {
    setAddForm(prev => ({
      ...prev,
      duration: suggestion.value,
      durationNumber: suggestion.value,
    }));
    setShowDurationDropdown(false);
  };

  // Create new history if doesn't exist
  const createNewHistory = async (name) => {
    try {
      const response = await createPastHistory({ name });
      
      // Handle different response structures
      const created = response?.data || response;
      
      if (created && created.id) {
        setHistoryList(prev => Array.isArray(prev) ? [...prev, created] : [created]);
        return created.id;
      } else {
        throw new Error('Invalid response from create past history');
      }
    } catch (error) {
      console.error('Error creating past history:', error);
      throw error;
    }
  };

  // Add new history to the list
  const addHistory = async () => {
    if (!addForm.history_name.trim()) {
      alert('Please enter medical history condition');
      return;
    }

    let historyId = addForm.history_id;
    const durationToUse = addForm.duration || addForm.durationNumber;

    // If no ID selected, check if it exists or create new
    if (!historyId) {
      const existing = Array.isArray(historyList) ? historyList.find(
        h => {
          const historyName = h?.name || h?.history_name || '';
          return historyName.toLowerCase() === addForm.history_name.toLowerCase();
        }
      ) : null;

      if (existing) {
        historyId = existing.id;
      } else {
        try {
          historyId = await createNewHistory(addForm.history_name);
        } catch (error) {
          alert('Failed to create new medical history');
          return;
        }
      }
    }

    // Add to form data
    const newHistory = {
      past_history_data: historyId,
      duration: durationToUse
    };

    setValue('past_history', [...histories, newHistory]);

    // Reset add form
    setAddForm({
      history_name: '',
      history_id: null,
      durationNumber: '',
      duration: ''
    });
    setShowHistoryDropdown(false);
    setShowDurationDropdown(false);
    setSearchResults([]);
    setDurationSuggestions([]);
  };

  // Handle Keyboard Navigation for History
  const handleHistoryKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showHistoryDropdown && historyHighlightIndex >= 0 && historyHighlightIndex < searchResults.length) {
        selectHistory(searchResults[historyHighlightIndex]);
      } else if (showHistoryDropdown && historyHighlightIndex === searchResults.length) {
        setShowHistoryDropdown(false);
      } else {
        addHistory();
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
        addHistory();
      }
    }
  };

  // Remove history from list
  const removeHistory = (index) => {
    setValue('past_history', histories.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* Add History Form - Inline title + fields */}
      <div className="flex items-start gap-4 mb-4">
        <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Past History</h3>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* History Input */}
        <div className="relative">
          <input
            ref={historyInputRef}
            type="text"
            placeholder="Type medical history"
            value={addForm.history_name}
            onChange={(e) => handleHistorySearch(e.target.value)}
            onFocus={() => addForm.history_name && handleHistorySearch(addForm.history_name)}
            onBlur={() => setTimeout(() => setShowHistoryDropdown(false), 200)}
            onKeyDown={handleHistoryKeyDown}
            className="w-full px-3 py-2.5 border rounded-md text-sm"
          />
          
          {showHistoryDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((h, index) => {
                const historyName = h?.name || h?.history_name || 'Unknown';
                return (
                  <div
                    key={h.id}
                    onMouseDown={() => selectHistory(h)}
                    onMouseEnter={() => setHistoryHighlightIndex(index)}
                    className={`px-4 py-2 cursor-pointer border-b ${historyHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                  >
                    <div className="font-medium text-sm">{historyName}</div>
                  </div>
                );
              })}
              <div
                onMouseDown={() => setShowHistoryDropdown(false)}
                onMouseEnter={() => setHistoryHighlightIndex(searchResults.length)}
                className={`px-4 py-2 cursor-pointer border-t ${historyHighlightIndex === searchResults.length ? 'bg-emerald-100' : 'hover:bg-emerald-50 bg-gray-50'}`}
              >
                <div className="font-medium text-sm text-emerald-600">
                  Or create new: "{addForm.history_name}"
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
            placeholder="Enter duration (e.g., 2 years)"
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

        {/* Add Button */}
        <button
          type="button"
          onClick={addHistory}
          className="bg-blue-600 text-white rounded-md px-4 py-2.5 hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add History
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

      {/* Added History List - One line format */}
      <div className="mt-2">
        {histories.length === 0 ? (
          ""
        ) : (
          <div className="flex flex-wrap gap-2">
            {histories.map((item, index) => {
              const historyItem = historyList.find(
                h => h.id === item.past_history_data
              );

              const historyId = item.past_history_data || historyItem?.id || null;

              const historyName =
                historyItem?.name || item?.past_history_data.name || "Unknown History";

              return (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2"
                >
                  {/* History Text */}
                  <span className="font-medium text-emerald-800 text-sm">
                    {historyName}
                    {item.duration && ` : ${item.duration}`}
                  </span>

                  {/* Hidden form fields for react-hook-form */}
                  <div className="hidden">
                    <Controller
                      name={`past_history.${index}.past_history_data`}
                      control={control}
                      defaultValue={historyId}
                      render={({ field }) => (
                        <input type="hidden" {...field} value={historyId ?? ""} />
                      )}
                    />
                    <Controller
                      name={`past_history.${index}.duration`}
                      control={control}
                      defaultValue={item.duration}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeHistory(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
                    title="Delete history"
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

export default HistoryForm;