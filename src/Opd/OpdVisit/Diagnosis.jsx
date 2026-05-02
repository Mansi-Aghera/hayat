// components/opd/DiagnosisForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { diagnosis, createDiagnosis } from '../../services/ipd.services';

const DiagnosisForm = ({ control, watch, setValue }) => {
  const diagnoses = watch('diagnosis_detail') || [];
  const [diagnosisList, setDiagnosisList] = useState([]);
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
    diagnosis_name: '',
    diagnosis_id: null,
    durationNumber: '',
    duration: ''
  });

  const [searchResults, setSearchResults] = useState([]);
  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [diagnosisHighlightIndex, setDiagnosisHighlightIndex] = useState(-1);
  const [durationHighlightIndex, setDurationHighlightIndex] = useState(-1);

  const diagnosisInputRef = useRef(null);
  const durationInputRef = useRef(null);

  useEffect(() => {
    fetchDiagnosisList();
  }, []);

  const fetchDiagnosisList = async () => {
    try {
      setLoading(true);
      const data = await diagnosis();
      
      // Ensure data is an array, handle different response structures
      if (Array.isArray(data)) {
        setDiagnosisList(data);
      } else if (Array.isArray(data?.data)) {
        setDiagnosisList(data.data);
      } else if (Array.isArray(data?.results)) {
        setDiagnosisList(data.results);
      } else {
        console.warn('Unexpected diagnosis data format:', data);
        setDiagnosisList([]);
      }
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      setDiagnosisList([]);
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

  // Handle diagnosis search in add form
  const handleDiagnosisSearch = (value) => {
    setAddForm(prev => ({ 
      ...prev, 
      diagnosis_name: value,
      diagnosis_id: null 
    }));
    setDiagnosisHighlightIndex(-1);

    if (value.trim()) {
      // Ensure diagnosisList is an array before filtering
      if (Array.isArray(diagnosisList)) {
        const filtered = diagnosisList.filter(d => {
          const diagnosisName = d?.diagnosis_name || d?.name || '';
          return diagnosisName.toLowerCase().includes(value.toLowerCase());
        });
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
      setShowDiagnosisDropdown(true);
    } else {
      setSearchResults([]);
      setShowDiagnosisDropdown(false);
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

  // Select diagnosis from dropdown
  const selectDiagnosis = (diagnosisItem) => {
    const diagnosisName = diagnosisItem?.diagnosis_name || diagnosisItem?.name || '';
    
    if (diagnosisItem && diagnosisItem.id && diagnosisName) {
      setAddForm(prev => ({
        ...prev,
        diagnosis_name: diagnosisName,
        diagnosis_id: diagnosisItem.id,
      }));
      setShowDiagnosisDropdown(false);
      
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

  // Create new diagnosis if doesn't exist
  const createNewDiagnosis = async (name) => {
    try {
      const response = await createDiagnosis({ diagnosis_name: name });
      
      // Handle different response structures
      const created = response?.data || response;
      
      if (created && created.id) {
        setDiagnosisList(prev => Array.isArray(prev) ? [...prev, created] : [created]);
        return created.id;
      } else {
        throw new Error('Invalid response from create diagnosis');
      }
    } catch (error) {
      console.error('Error creating diagnosis:', error);
      throw error;
    }
  };

  // Add new diagnosis to the list
  const addDiagnosis = async () => {
    if (!addForm.diagnosis_name.trim()) {
      alert('Please enter diagnosis name');
      return;
    }

    let diagnosisId = addForm.diagnosis_id;
    const durationToUse = addForm.duration || addForm.durationNumber;

    // If no ID selected, check if it exists or create new
    if (!diagnosisId) {
      const existing = diagnosisList.find(
        d => (d?.diagnosis_name || '').toLowerCase() === addForm.diagnosis_name.toLowerCase()
      );

      if (existing) {
        diagnosisId = existing.id;
      } else {
        try {
          diagnosisId = await createNewDiagnosis(addForm.diagnosis_name);
        } catch (error) {
          alert('Failed to create new diagnosis');
          return;
        }
      }
    }

    // Add to form data
    const newDiagnosis = {
      diagnosis_data: diagnosisId,
      name: addForm.diagnosis_name,
      duration: durationToUse
    };

    setValue('diagnosis_detail', [...diagnoses, newDiagnosis]);

    // Reset add form
    setAddForm({
      diagnosis_name: '',
      diagnosis_id: null,
      durationNumber: '',
      duration: ''
    });
    setShowDiagnosisDropdown(false);
    setShowDurationDropdown(false);
    setSearchResults([]);
    setDurationSuggestions([]);
  };

  // Handle Keyboard Navigation for Diagnosis
  const handleDiagnosisKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDiagnosisHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDiagnosisHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDiagnosisDropdown && diagnosisHighlightIndex >= 0 && diagnosisHighlightIndex < searchResults.length) {
        selectDiagnosis(searchResults[diagnosisHighlightIndex]);
      } else if (showDiagnosisDropdown && diagnosisHighlightIndex === searchResults.length) {
        setShowDiagnosisDropdown(false);
      } else {
        addDiagnosis();
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
        addDiagnosis();
      }
    }
  };

  // Remove diagnosis from list
  const removeDiagnosis = (index) => {
    setValue('diagnosis_detail', diagnoses.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* Add Diagnosis Form - Inline title + fields */}
      <div className="flex items-start gap-4 mb-4">
        <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Diagnosis</h3>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Diagnosis Input */}
        <div className="relative">
          <input
            ref={diagnosisInputRef}
            type="text"
            placeholder="Type diagnosis name"
            value={addForm.diagnosis_name}
            onChange={(e) => handleDiagnosisSearch(e.target.value)}
            onFocus={() => addForm.diagnosis_name && handleDiagnosisSearch(addForm.diagnosis_name)}
            onBlur={() => setTimeout(() => setShowDiagnosisDropdown(false), 200)}
            onKeyDown={handleDiagnosisKeyDown}
            className="w-full px-3 py-2.5 border rounded-md text-sm"
          />
          
          {showDiagnosisDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((d, index) => {
                const diagnosisName = d?.diagnosis_name || d?.name || 'Unknown';
                return (
                  <div
                    key={d.id}
                    onMouseDown={() => selectDiagnosis(d)}
                    onMouseEnter={() => setDiagnosisHighlightIndex(index)}
                    className={`px-4 py-2 cursor-pointer border-b ${diagnosisHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                  >
                    <div className="font-medium text-sm">{diagnosisName}</div>
                  </div>
                );
              })}
              <div
                onMouseDown={() => setShowDiagnosisDropdown(false)}
                onMouseEnter={() => setDiagnosisHighlightIndex(searchResults.length)}
                className={`px-4 py-2 cursor-pointer border-t ${diagnosisHighlightIndex === searchResults.length ? 'bg-emerald-100' : 'hover:bg-emerald-50 bg-gray-50'}`}
              >
                <div className="font-medium text-sm text-emerald-600">
                  Or create new: "{addForm.diagnosis_name}"
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

        {/* Add Button */}
        <button
          type="button"
          onClick={addDiagnosis}
          className="bg-blue-600 text-white rounded-md px-4 py-2.5 hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Diagnosis
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

      {/* Added Diagnosis List - One line format */}
      <div className="mt-2">
        {diagnoses.length === 0 ? (
          <p className="text-gray-500 text-center py-2">
            No diagnosis added yet. Add your first entry above.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {diagnoses.map((item, index) => {
              const diagnosisItem = diagnosisList.find(
                d => d.id === item.diagnosis_data
              );

              const diagnosisId =
                item.diagnosis_data || diagnosisItem?.id || null;

              const diagnosisName =
                diagnosisItem?.diagnosis_name || item.name || "Unknown Diagnosis";

              return (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2"
                >
                  {/* Diagnosis Text */}
                  <span className="font-medium text-purple-800 text-sm">
                    {diagnosisName}
                    {item.duration && ` : ${item.duration}`}
                  </span>

                  {/* Hidden form fields for react-hook-form */}
                  <div className="hidden">
                    <Controller
                      name={`diagnosis_detail.${index}.diagnosis_data`}
                      control={control}
                      defaultValue={diagnosisId}
                      render={({ field }) => (
                        <input type="hidden" {...field} value={diagnosisId ?? ""} />
                      )}
                    />
                    <Controller
                      name={`diagnosis_detail.${index}.name`}
                      control={control}
                      defaultValue={diagnosisName}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`diagnosis_detail.${index}.duration`}
                      control={control}
                      defaultValue={item.duration}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeDiagnosis(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition-colors"
                    title="Delete diagnosis"
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

export default DiagnosisForm;