// components/opd/AdviceForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { opinion, createOpinion } from '../../services/opd.services';

const AdviceForm = ({ control, watch, setValue }) => {
  const advices = watch('adviced') || [];
  const notes = watch('Note') || [];
  const [opinionList, setOpinionList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for the add forms
  const [adviceForm, setAdviceForm] = useState({
    opinion_name: '',
    opinion_id: null
  });

  const [noteForm, setNoteForm] = useState({
    opinion_name: '',
    opinion_id: null
  });

  const [adviceSearchResults, setAdviceSearchResults] = useState([]);
  const [noteSearchResults, setNoteSearchResults] = useState([]);
  const [showAdviceDropdown, setShowAdviceDropdown] = useState(false);
  const [showNoteDropdown, setShowNoteDropdown] = useState(false);
  const [adviceHighlightIndex, setAdviceHighlightIndex] = useState(-1);
  const [noteHighlightIndex, setNoteHighlightIndex] = useState(-1);

  const adviceInputRef = useRef(null);
  const noteInputRef = useRef(null);

  useEffect(() => {
    fetchOpinionList();
  }, []);

  const fetchOpinionList = async () => {
    try {
      setLoading(true);
      const data = await opinion();
      
      if (Array.isArray(data)) {
        setOpinionList(data);
      } else if (Array.isArray(data?.data)) {
        setOpinionList(data.data);
      } else if (Array.isArray(data?.results)) {
        setOpinionList(data.results);
      } else {
        setOpinionList([]);
      }
    } catch (error) {
      console.error('Error fetching opinions:', error);
      setOpinionList([]);
    } finally {
      setLoading(false);
    }
  };

  // Get current datetime in required format
  const getCurrentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  };

  // Handle advice search
  const handleAdviceSearch = (value) => {
    setAdviceForm(prev => ({ 
      ...prev, 
      opinion_name: value,
      opinion_id: null 
    }));
    setAdviceHighlightIndex(-1);

    if (value.trim()) {
      if (Array.isArray(opinionList)) {
        const filtered = opinionList.filter(o => {
          const opinionName = o?.opinion_name || o?.name || '';
          return opinionName.toLowerCase().includes(value.toLowerCase());
        });
        setAdviceSearchResults(filtered);
      }
      setShowAdviceDropdown(true);
    } else {
      setAdviceSearchResults([]);
      setShowAdviceDropdown(false);
    }
  };

  // Handle note search
  const handleNoteSearch = (value) => {
    setNoteForm(prev => ({ 
      ...prev, 
      opinion_name: value,
      opinion_id: null 
    }));
    setNoteHighlightIndex(-1);

    if (value.trim()) {
      if (Array.isArray(opinionList)) {
        const filtered = opinionList.filter(o => {
          const opinionName = o?.opinion_name || o?.name || '';
          return opinionName.toLowerCase().includes(value.toLowerCase());
        });
        setNoteSearchResults(filtered);
      }
      setShowNoteDropdown(true);
    } else {
      setNoteSearchResults([]);
      setShowNoteDropdown(false);
    }
  };

  // Select advice from dropdown
  const selectAdvice = (opinionItem) => {
    const opinionName = opinionItem?.opinion_name || opinionItem?.name || '';
    
    if (opinionItem && opinionItem.id && opinionName) {
      setAdviceForm(prev => ({
        ...prev,
        opinion_name: opinionName,
        opinion_id: opinionItem.id,
      }));
      setShowAdviceDropdown(false);
    }
  };

  // Select note from dropdown
  const selectNote = (opinionItem) => {
    const opinionName = opinionItem?.opinion_name || opinionItem?.name || '';
    
    if (opinionItem && opinionItem.id && opinionName) {
      setNoteForm(prev => ({
        ...prev,
        opinion_name: opinionName,
        opinion_id: opinionItem.id,
      }));
      setShowNoteDropdown(false);
    }
  };

  // Create new opinion if doesn't exist
  const createNewOpinion = async (name) => {
    try {
      const response = await createOpinion({ opinion_name: name });
      const created = response?.data || response;
      
      if (created && created.id) {
        setOpinionList(prev => Array.isArray(prev) ? [...prev, created] : [created]);
        return created.id;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error creating opinion:', error);
      throw error;
    }
  };

  // Add new advice to the list
  const addAdvice = async () => {
    if (!adviceForm.opinion_name.trim()) {
      alert('Please enter advice');
      return;
    }

    let opinionId = adviceForm.opinion_id;

    // If no ID selected, check if it exists or create new
    if (!opinionId) {
      const existing = Array.isArray(opinionList) ? opinionList.find(
        o => {
          const opinionName = o?.opinion_name || o?.name || '';
          return opinionName.toLowerCase() === adviceForm.opinion_name.toLowerCase();
        }
      ) : null;

      if (existing) {
        opinionId = existing.id;
      } else {
        try {
          opinionId = await createNewOpinion(adviceForm.opinion_name);
        } catch (error) {
          alert('Failed to create new advice');
          return;
        }
      }
    }

    // Add to form data with datetime
    const newAdvice = {
      datetime: getCurrentDateTime(),
      opinion_details_data: opinionId,
      opinion_name: adviceForm.opinion_name
    };

    setValue('adviced', [...advices, newAdvice]);

    // Reset advice form
    setAdviceForm({
      opinion_name: '',
      opinion_id: null
    });
    setShowAdviceDropdown(false);
    setAdviceSearchResults([]);
  };

  // Add new note to the list
  const addNote = async () => {
    if (!noteForm.opinion_name.trim()) {
      alert('Please enter note');
      return;
    }

    let opinionId = noteForm.opinion_id;

    // If no ID selected, check if it exists or create new
    if (!opinionId) {
      const existing = Array.isArray(opinionList) ? opinionList.find(
        o => {
          const opinionName = o?.opinion_name || o?.name || '';
          return opinionName.toLowerCase() === noteForm.opinion_name.toLowerCase();
        }
      ) : null;

      if (existing) {
        opinionId = existing.id;
      } else {
        try {
          opinionId = await createNewOpinion(noteForm.opinion_name);
        } catch (error) {
          alert('Failed to create new note');
          return;
        }
      }
    }

    // Add to form data with datetime
    const newNote = {
      datetime: getCurrentDateTime(),
      opinion_details_data: opinionId,
      opinion_name: noteForm.opinion_name
    };

    setValue('Note', [...notes, newNote]);

    // Reset note form
    setNoteForm({
      opinion_name: '',
      opinion_id: null
    });
    setShowNoteDropdown(false);
    setNoteSearchResults([]);
  };

  // Handle Keyboard Navigation for Advice
  const handleAdviceKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAdviceHighlightIndex(prev => prev < adviceSearchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAdviceHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showAdviceDropdown && adviceHighlightIndex >= 0 && adviceHighlightIndex < adviceSearchResults.length) {
        selectAdvice(adviceSearchResults[adviceHighlightIndex]);
      } else if (showAdviceDropdown && adviceHighlightIndex === adviceSearchResults.length) {
        setShowAdviceDropdown(false);
      } else {
        addAdvice();
      }
    }
  };

  // Handle Keyboard Navigation for Note
  const handleNoteKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setNoteHighlightIndex(prev => prev < noteSearchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setNoteHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showNoteDropdown && noteHighlightIndex >= 0 && noteHighlightIndex < noteSearchResults.length) {
        selectNote(noteSearchResults[noteHighlightIndex]);
      } else if (showNoteDropdown && noteHighlightIndex === noteSearchResults.length) {
        setShowNoteDropdown(false);
      } else {
        addNote();
      }
    }
  };

  // Remove advice from list
  const removeAdvice = (index) => {
    setValue('adviced', advices.filter((_, i) => i !== index));
  };

  // Remove note from list
  const removeNote = (index) => {
    setValue('Note', notes.filter((_, i) => i !== index));
  };

  // Find the maximum length to align both sections
  const maxLength = Math.max(advices.length, notes.length);

  return (
    <div className="space-y-6">
      {/* Advice Section */}
      <div>
        <div className="flex items-start gap-4 mb-3">
          <h4 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Advice</h4>
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <input
                ref={adviceInputRef}
                type="text"
                placeholder="Type advice"
                value={adviceForm.opinion_name}
                onChange={(e) => handleAdviceSearch(e.target.value)}
                onFocus={() => adviceForm.opinion_name && handleAdviceSearch(adviceForm.opinion_name)}
                onBlur={() => setTimeout(() => setShowAdviceDropdown(false), 200)}
                onKeyDown={handleAdviceKeyDown}
                className="w-full px-3 py-2.5 border rounded-md text-sm"
              />
              
              {showAdviceDropdown && adviceSearchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {adviceSearchResults.map((o, index) => {
                    const opinionName = o?.opinion_name || o?.name || 'Unknown';
                    return (
                      <div
                        key={o.id}
                        onMouseDown={() => selectAdvice(o)}
                        onMouseEnter={() => setAdviceHighlightIndex(index)}
                        className={`px-4 py-2 cursor-pointer border-b ${adviceHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                      >
                        <div className="font-medium text-sm">{opinionName}</div>
                      </div>
                    );
                  })}
                  <div
                    onMouseDown={() => setShowAdviceDropdown(false)}
                    onMouseEnter={() => setAdviceHighlightIndex(adviceSearchResults.length)}
                    className={`px-4 py-2 cursor-pointer border-t ${adviceHighlightIndex === adviceSearchResults.length ? 'bg-emerald-100' : 'hover:bg-emerald-50 bg-gray-50'}`}
                  >
                    <div className="font-medium text-sm text-emerald-600">
                      Or create new: "{adviceForm.opinion_name}"
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={addAdvice}
              className="bg-blue-600 text-white rounded-md px-4 py-2.5 hover:bg-blue-700 text-sm font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
        
        {/* Advice List */}
        {advices.length > 0 && (
          <div className="ml-[156px] space-y-2">
            {advices.map((item, index) => {
              const opinionItem = Array.isArray(opinionList) ? opinionList.find(o => o.id === item.opinion_details_data) : null;
              const opinionName = opinionItem?.opinion_name || item.opinion_details_data.opinion_name || 'Unknown Advice';

              return (
                <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="font-medium text-gray-900 flex-1 truncate">{opinionName}</div>
                    {item.datetime && (
                      <div className="text-blue-600 text-xs whitespace-nowrap">{item.datetime}</div>
                    )}
                  </div>

                  <div className="hidden">
                    <Controller
                      name={`adviced.${index}.datetime`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`adviced.${index}.opinion_details_data`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`adviced.${index}.opinion_name`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeAdvice(index)}
                    className="ml-2 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    title="Remove advice"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div>
        <div className="flex items-start gap-4 mb-3">
          <h4 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Notes</h4>
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <input
                ref={noteInputRef}
                type="text"
                placeholder="Type note"
                value={noteForm.opinion_name}
                onChange={(e) => handleNoteSearch(e.target.value)}
                onFocus={() => noteForm.opinion_name && handleNoteSearch(noteForm.opinion_name)}
                onBlur={() => setTimeout(() => setShowNoteDropdown(false), 200)}
                onKeyDown={handleNoteKeyDown}
                className="w-full px-3 py-2.5 border rounded-md text-sm"
              />
              
              {showNoteDropdown && noteSearchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {noteSearchResults.map((o, index) => {
                    const opinionName = o?.opinion_name || o?.name || 'Unknown';
                    return (
                      <div
                        key={o.id}
                        onMouseDown={() => selectNote(o)}
                        onMouseEnter={() => setNoteHighlightIndex(index)}
                        className={`px-4 py-2 cursor-pointer border-b ${noteHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                      >
                        <div className="font-medium text-sm">{opinionName}</div>
                      </div>
                    );
                  })}
                  <div
                    onMouseDown={() => setShowNoteDropdown(false)}
                    onMouseEnter={() => setNoteHighlightIndex(noteSearchResults.length)}
                    className={`px-4 py-2 cursor-pointer border-t ${noteHighlightIndex === noteSearchResults.length ? 'bg-emerald-100' : 'hover:bg-emerald-50 bg-gray-50'}`}
                  >
                    <div className="font-medium text-sm text-emerald-600">
                      Or create new: "{noteForm.opinion_name}"
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={addNote}
              className="bg-blue-600 text-white rounded-md px-4 py-2.5 hover:bg-blue-700 text-sm font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Notes List */}
        {notes.length > 0 && (
          <div className="ml-[156px] space-y-2">
            {notes.map((item, index) => {
              const opinionItem = Array.isArray(opinionList) ? opinionList.find(o => o.id === item.opinion_details_data) : null;
              const opinionName = opinionItem?.opinion_name || item.opinion_details_data.opinion_name || 'Unknown Note';

              return (
                <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="font-medium text-gray-900 flex-1 truncate">{opinionName}</div>
                    {item.datetime && (
                      <div className="text-green-600 text-xs whitespace-nowrap">{item.datetime}</div>
                    )}
                  </div>

                  <div className="hidden">
                    <Controller
                      name={`Note.${index}.datetime`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`Note.${index}.opinion_details_data`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                    <Controller
                      name={`Note.${index}.opinion_name`}
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeNote(index)}
                    className="ml-2 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    title="Remove note"
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

export default AdviceForm;