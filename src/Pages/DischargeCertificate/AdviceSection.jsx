import React from 'react';
import AutocompleteInput from "../AutocompleteInput";

const AdviceSection = ({
  adviceInput,
  setAdviceInput,
  opinions,
  formData,
  handleAddAdvice,
  handleRemoveItem
}) => {
  console.log('Form Data:', formData.adviced); // Debugging line

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Advice</h3>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <AutocompleteInput
            value={adviceInput}
            onChange={(value) => setAdviceInput(value)}
            suggestions={opinions}
            label=""
            placeholder="Type advice or select from list"
          />
        </div>
        <button
          type="button"
          onClick={handleAddAdvice}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-end"
        >
          Add
        </button>
      </div>      
      {formData.adviced.length > 0 && (
        <div className="space-y-2">
          {formData.adviced.map((item, index) => {
            // Handle both object and ID formats
            const opinionId = item.opinion_details_data?.id || item.opinion_details_data;
            const advice = opinions.find(o => o.id === opinionId);
            
            return (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span>{advice?.name || advice?.opinion_name || 'Unknown'}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem('adviced', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdviceSection;