import React from 'react';
import AutocompleteInput from "../AutocompleteInput";

const ClinicalNotesSection = ({
  clinicalNoteInput,
  setClinicalNoteInput,
  opinions,
  formData,
  handleAddClinicalNote,
  handleRemoveItem
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Clinical Notes</h3>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <AutocompleteInput
            value={clinicalNoteInput}
            onChange={(value) => setClinicalNoteInput(value)}
            suggestions={opinions}
            label=""
            placeholder="Type clinical note or select from list"
          />
        </div>
        <button
          type="button"
          onClick={handleAddClinicalNote}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-end"
        >
          Add
        </button>
      </div>
      
      {formData.clinical_notes.length > 0 && (
        <div className="space-y-2">
          {formData.clinical_notes.map((item, index) => {
            const note = opinions.find(o => o.id === item.opinion_data);
            return (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span>{note?.name || `Clinical Note ID: ${item.opinion_data}`}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem('clinical_notes', index)}
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

export default ClinicalNotesSection;