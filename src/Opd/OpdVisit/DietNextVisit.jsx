// components/opd/DietNextVisitForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Check, Plus, Trash2, Calendar } from 'lucide-react';
import { diet, createDiet } from '../../services/opd.services';

const DietNextVisitForm = ({ control, watch, setValue }) => {
  const selectedDiets = watch('suggested_diet') || [];
  const nextVisits = watch('nextVisit') || [];
  const [dietList, setDietList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for Next Visit Suggestions
  const [nextVisitInput, setNextVisitInput] = useState('');
  const [visitSuggestions, setVisitSuggestions] = useState([]);
  const [showVisitSuggestions, setShowVisitSuggestions] = useState(false);
  const visitInputRef = useRef(null);
  const timeUnits = ["hours", "days", "weeks", "months", "years"];

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

  const handleVisitSelect = (suggestion) => {
    const futureDate = calculateFutureDate(suggestion.value, suggestion.unit);
    const dateString = futureDate.toISOString().split('T')[0];
    addNextVisit(dateString, suggestion.text);
    setNextVisitInput('');
    setShowVisitSuggestions(false);
  };

  // State for new diet
  const [newDietName, setNewDietName] = useState('');
  const [dietSearchResults, setDietSearchResults] = useState([]);
  const [showDietDropdown, setShowDietDropdown] = useState(false);
  const [dietHighlightIndex, setDietHighlightIndex] = useState(-1);
  const dietInputRef = useRef(null);

  useEffect(() => {
    fetchDietList();
  }, []);

  const fetchDietList = async () => {
    try {
      setLoading(true);
      const data = await diet();
      
      if (Array.isArray(data)) {
        setDietList(data);
      } else if (Array.isArray(data?.data)) {
        setDietList(data.data);
      } else if (Array.isArray(data?.results)) {
        setDietList(data.results);
      } else {
        setDietList([]);
      }
    } catch (error) {
      console.error('Error fetching diets:', error);
      setDietList([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display and API
  const formatVisitDate = (dateString) => {
    if (!dateString) return { visit: '', datetime: '' };
    
    const date = new Date(dateString);
    
    // Format: "16/01/2026 (Friday)"
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const visit = `${day}/${month}/${year} (${dayName})`;
    
    // Format: "01/16/2026 12:38 PM"
    const datetimeMonth = String(date.getMonth() + 1).padStart(2, '0');
    const datetimeDay = String(date.getDate()).padStart(2, '0');
    const datetimeYear = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const datetime = `${datetimeMonth}/${datetimeDay}/${datetimeYear} ${hours}:${minutes} ${ampm}`;
    
    return { visit, datetime };
  };

  // Handle diet search
  const handleDietSearch = (value) => {
    setNewDietName(value);
    setDietHighlightIndex(-1);
    
    if (value.trim()) {
      if (Array.isArray(dietList)) {
        const filtered = dietList.filter(d => {
          const dietName = d?.name || d?.diet_name || '';
          return dietName.toLowerCase().includes(value.toLowerCase());
        });
        setDietSearchResults(filtered);
      }
      setShowDietDropdown(true);
    } else {
      setDietSearchResults([]);
      setShowDietDropdown(false);
    }
  };

  // Select diet from dropdown
  const selectDiet = (dietItem) => {
    const dietName = dietItem?.name || dietItem?.diet_name || '';
    
    if (dietItem && dietItem.id && dietName) {
      toggleDiet(dietItem.id);
      setNewDietName('');
      setShowDietDropdown(false);
    }
  };

  // Create new diet if doesn't exist
  const createNewDiet = async (name) => {
    try {
      const response = await createDiet({ name });
      const created = response?.data || response;
      
      if (created && created.id) {
        setDietList(prev => Array.isArray(prev) ? [...prev, created] : [created]);
        return created.id;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error creating diet:', error);
      throw error;
    }
  };

  // Add new diet to selection
  const addNewDiet = async () => {
    if (!newDietName.trim()) {
      alert('Please enter diet name');
      return;
    }

    let dietId = null;

    // Check if it exists or create new
    const existing = Array.isArray(dietList) ? dietList.find(
      d => {
        const dietName = d?.name || d?.diet_name || '';
        return dietName.toLowerCase() === newDietName.toLowerCase();
      }
    ) : null;

    if (existing) {
      dietId = existing.id;
      toggleDiet(dietId);
    } else {
      try {
        dietId = await createNewDiet(newDietName);
        toggleDiet(dietId);
      } catch (error) {
        alert('Failed to create new diet');
        return;
      }
    }

    setNewDietName('');
    setShowDietDropdown(false);
    setDietSearchResults([]);
  };

  // Toggle diet selection
  const toggleDiet = (dietId) => {
    if (selectedDiets.includes(dietId)) {
      setValue('suggested_diet', selectedDiets.filter(id => id !== dietId));
    } else {
      setValue('suggested_diet', [...selectedDiets, dietId]);
    }
  };

  // Handle Keyboard Navigation for Diet
  const handleDietKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDietHighlightIndex(prev => prev < dietSearchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDietHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDietDropdown && dietHighlightIndex >= 0 && dietHighlightIndex < dietSearchResults.length) {
        selectDiet(dietSearchResults[dietHighlightIndex]);
      } else if (showDietDropdown && dietHighlightIndex === dietSearchResults.length) {
        setShowDietDropdown(false);
      } else {
        addNewDiet();
      }
    }
  };

  // Add next visit
  const addNextVisit = (dateString = '', visitLabel = '') => {
    const formattedDate = dateString ? formatVisitDate(dateString) : { visit: '', datetime: '' };
    
    // If we have a custom label (like "4 days"), use it for 'visit' instead of the formatted date
    if (visitLabel) {
      formattedDate.visit = visitLabel;
    }
    
    setValue('nextVisit', [...nextVisits, formattedDate]);
  };

  // Update next visit date
  const updateNextVisit = (index, dateString) => {
    if (!dateString) return;
    
    const formattedDate = formatVisitDate(dateString);
    const updatedVisits = [...nextVisits];
    updatedVisits[index] = formattedDate;
    setValue('nextVisit', updatedVisits);
  };

  // Remove next visit
  const removeNextVisit = (index) => {
    setValue('nextVisit', nextVisits.filter((_, i) => i !== index));
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Handle Enter key press for next visit date
  const handleDateKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNextVisit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Diet Section */}
      <div>
        <div className="flex items-start gap-4 mb-3">
          <h4 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Add Diet</h4>
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <input
                ref={dietInputRef}
                type="text"
                placeholder="Type diet name"
                value={newDietName}
                onChange={(e) => handleDietSearch(e.target.value)}
                onFocus={() => newDietName && handleDietSearch(newDietName)}
                onBlur={() => setTimeout(() => setShowDietDropdown(false), 200)}
                onKeyDown={handleDietKeyDown}
                className="w-full px-3 py-2.5 border rounded-md text-sm"
              />
              
              {showDietDropdown && dietSearchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {dietSearchResults.map((d, index) => {
                    const dietName = d?.name || d?.diet_name || 'Unknown';
                    return (
                      <div
                        key={d.id}
                        onMouseDown={() => selectDiet(d)}
                        onMouseEnter={() => setDietHighlightIndex(index)}
                        className={`px-4 py-2 cursor-pointer border-b ${dietHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                      >
                        <div className="font-medium text-sm">{dietName}</div>
                      </div>
                    );
                  })}
                  <div
                    onMouseDown={() => setShowDietDropdown(false)}
                    onMouseEnter={() => setDietHighlightIndex(dietSearchResults.length)}
                    className={`px-4 py-2 cursor-pointer border-t ${dietHighlightIndex === dietSearchResults.length ? 'bg-emerald-100' : 'hover:bg-emerald-50 bg-gray-50'}`}
                  >
                    <div className="font-medium text-sm text-emerald-600">
                      Or create new: "{newDietName}"
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={addNewDiet}
              className="bg-blue-600 text-white rounded-md px-4 py-2.5 hover:bg-blue-700 text-sm font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Selected Diets List */}
        {selectedDiets.length > 0 && (
          <div className="ml-[156px] space-y-2">
            {selectedDiets.map((dietId, index) => {
              const dietItem = Array.isArray(dietList) ? dietList.find(d => d.id === dietId) : null;
              const dietName = dietItem?.name || dietId.name || 'Unknown Diet';

              return (
                <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div className="font-medium text-gray-900">{dietName}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleDiet(dietId)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    title="Remove diet"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Visit Section */}
      <div>
        <div className="flex items-start gap-4 mb-3">
          <h4 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Next Visit</h4>
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <input
                ref={visitInputRef}
                type="text"
                placeholder="Enter number (e.g., 6)"
                value={nextVisitInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setNextVisitInput(val);
                  const num = parseInt(val);
                  if (val && !isNaN(num) && num > 0) {
                    setVisitSuggestions(timeUnits.map(u => ({ text: `${num} ${u}`, unit: u, value: num })));
                    setShowVisitSuggestions(true);
                  } else {
                    setShowVisitSuggestions(false);
                  }
                }}
                onBlur={() => setTimeout(() => setShowVisitSuggestions(false), 200)}
                className="w-full px-3 py-2.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              
              {showVisitSuggestions && visitSuggestions.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {visitSuggestions.map((s, i) => (
                    <div
                      key={i}
                      onMouseDown={() => handleVisitSelect(s)}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b last:border-0 font-medium text-sm"
                    >
                      {s.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Visit Dates List */}
        {nextVisits.length > 0 && (
          <div className="ml-[156px] flex flex-wrap gap-2">
            {nextVisits.map((visit, index) => {
              const dateValue = visit.datetime ? 
                new Date(
                  parseInt(visit.datetime.split('/')[2].split(' ')[0]), // year
                  parseInt(visit.datetime.split('/')[0]) - 1, // month (0-indexed)
                  parseInt(visit.datetime.split('/')[1]) // day
                ).toISOString().split('T')[0] : '';

              return (
                <div key={index} className="inline-flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-full px-5 py-2 transition-all hover:bg-purple-100/50">
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold text-gray-800 uppercase">Next Visit : {visit.visit}</span>
                    <span className="text-[10px] text-purple-600 font-bold">{visit.datetime}</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeNextVisit(index)}
                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                    title="Remove date"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="hidden">
                    <Controller
                      name={`nextVisit.${index}.visit`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`nextVisit.${index}.datetime`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DietNextVisitForm;