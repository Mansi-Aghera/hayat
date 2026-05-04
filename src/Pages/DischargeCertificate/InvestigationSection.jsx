import React from 'react';
import AutocompleteInput from "../AutocompleteInput";

const InvestigationSection = ({
  investigationInput,
  setInvestigationInput,
  opinions,
  formData,
  handleAddInvestigation,
  handleRemoveItem
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Investigation</h3>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <AutocompleteInput
            value={investigationInput}
            onChange={(value) => setInvestigationInput(value)}
            suggestions={opinions}
            label=""
            placeholder="Type investigation or select from list"
          />
        </div>
        <button
          type="button"
          onClick={handleAddInvestigation}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-end"
        >
          Add
        </button>
      </div>
      
      {formData.investigations && formData.investigations.length > 0 && (
        <div className="space-y-2">
          {formData.investigations.map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem('investigations', index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvestigationSection;
