import React, { useState, useEffect, useRef } from 'react';

const AutocompleteInput = ({
  label,
  value,
  onChange,
  suggestions = [],
  onCreateNew,
  placeholder = "Type to search or add new",
  loading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  // Handle initial value - can be string, object, or number
  useEffect(() => {
    if (value) {
      if (typeof value === 'object' && value !== null) {
        // If value is an object
        const displayName = value.name || value.medicine_name || '';
        setInputValue(displayName);
      } else if (typeof value === 'number' || typeof value === 'string') {
        // If value is an ID or string
        const selectedItem = suggestions.find(item => 
          item.id === value || item.name === value || item.medicine_name === value
        );
        setInputValue(selectedItem?.name || selectedItem?.medicine_name || value || '');
      } else {
        setInputValue('');
      }
    } else {
      setInputValue('');
    }
  }, [value, suggestions]);

  useEffect(() => {
    // Ensure inputValue is string before using .toLowerCase()
    const searchTerm = String(inputValue || '').toLowerCase();
    
    if (searchTerm) {
      const filtered = suggestions.filter(item => {
        const name = String(item.name || item.medicine_name || '').toLowerCase();
        return name.includes(searchTerm);
      });
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(suggestions.slice(0, 10));
      setShowSuggestions(true);
    }
  }, [inputValue, suggestions]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Pass the string value or clear selection
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSelectSuggestion = (item) => {
    const displayName = item.name || item.medicine_name || '';
    setInputValue(displayName);
    
    // Pass the selected item to parent
    if (onChange) {
      // You can pass either the ID or the whole object
      // Depending on what your parent expects
      onChange({
        id: item.id,
        name: displayName
      });
    }
    setShowSuggestions(false);
  };

  const handleCreateNew = () => {
    const trimmedValue = String(inputValue || '').trim();
    if (trimmedValue && onCreateNew) {
      onCreateNew(trimmedValue);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  // Check if we should show "Add new" option
  const shouldShowAddNew = () => {
    const trimmedValue = String(inputValue || '').trim();
    if (!trimmedValue) return false;
    
    return !filteredSuggestions.some(item => {
      const itemName = String(item.name || item.medicine_name || '').toLowerCase();
      return itemName === trimmedValue.toLowerCase();
    });
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={String(inputValue || '')}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
        
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            <>
              {filteredSuggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="px-4 py-1 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-800">
                    {item.name || item.medicine_name}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-500 truncate">
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add new option */}
              {shouldShowAddNew() && (
                <div
                  onClick={handleCreateNew}
                  className="px-4 py-1 hover:bg-green-50 cursor-pointer border-t border-gray-200"
                >
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add "{String(inputValue || '').trim()}"
                  </div>
                </div>
              )}
            </>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-center text-gray-500">
              No suggestions available
            </div>
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;