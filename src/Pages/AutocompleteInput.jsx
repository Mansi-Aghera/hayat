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
  const inputRef = useRef(null);

  // Handle initial value and updates
  useEffect(() => {
    if (value) {
      if (typeof value === 'object' && value !== null) {
        // If value is an object
        const displayName = value.name || value.medicine_name || value.label || '';
        setInputValue(displayName);
      } else if (typeof value === 'number' || typeof value === 'string') {
        // If value is an ID or string, find the corresponding item
        const selectedItem = suggestions.find(item => 
          item.id === value || item.value === value
        );
        setInputValue(selectedItem?.name || selectedItem?.medicine_name || selectedItem?.label || value || '');
      }
    } else {
      setInputValue('');
    }
  }, [value, suggestions]);

  // Filter suggestions based on input
  useEffect(() => {
    if (!suggestions || suggestions.length === 0) {
      setFilteredSuggestions([]);
      return;
    }

    const searchTerm = String(inputValue || '').toLowerCase().trim();
    
    if (searchTerm) {
      const filtered = suggestions.filter(item => {
        const itemName = String(item.name || item.medicine_name || item.label || '').toLowerCase();
        return itemName.includes(searchTerm);
      });
      setFilteredSuggestions(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      // Show first 10 suggestions when no search term
      setFilteredSuggestions(suggestions.slice(0, 10));
    }
  }, [inputValue, suggestions]);

  // Handle click outside
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
    setShowSuggestions(true);
    
    // Pass the string value to parent
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSelectSuggestion = (item) => {
    const displayName = item.name || item.medicine_name || item.label || '';
    setInputValue(displayName);
    
    // Pass the selected item object to parent
    if (onChange) {
      onChange({
        id: item.id,
        name: displayName,
        ...item
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

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  // Check if we should show "Add new" option
  const shouldShowAddNew = () => {
    const trimmedValue = String(inputValue || '').trim();
    if (!trimmedValue || !onCreateNew) return false;
    
    return !filteredSuggestions.some(item => {
      const itemName = String(item.name || item.medicine_name || item.label || '').toLowerCase();
      return itemName === trimmedValue.toLowerCase();
    });
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          autoComplete="off"
        />
        
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Dropdown indicator */}
        <div className="absolute right-3 top-2.5 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-center text-gray-500">
              No items available
            </div>
          ) : filteredSuggestions.length > 0 ? (
            <>
              {filteredSuggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-800">
                    {item.name || item.medicine_name || item.label}
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add new option */}
              {shouldShowAddNew() && (
                <div
                  onClick={handleCreateNew}
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer border-t border-gray-200"
                >
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add "{String(inputValue || '').trim()}"</span>
                  </div>
                </div>
              )}
            </>
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