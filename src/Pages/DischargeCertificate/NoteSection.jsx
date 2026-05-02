import React from 'react';
import AutocompleteInput from "../AutocompleteInput";

const NotesSection = ({
  noteInput,
  setNoteInput,
  opinions,
  formData,
  handleAddNote,
  handleRemoveItem
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <AutocompleteInput
            value={noteInput}
            onChange={(value) => setNoteInput(value)}
            suggestions={opinions}
            label=""
            placeholder="Type note or select from list"
          />
        </div>
        <button
          type="button"
          onClick={handleAddNote}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-end"
        >
          Add
        </button>
      </div>
      
      {formData.Note.length > 0 && (
        <div className="space-y-2">
          {formData.Note.map((item, index) => {
            // Handle both object and ID formats
            const opinionId = item.opinion_details_data?.id || item.opinion_details_data;
            const note = opinions.find(o => o.id === opinionId);
            
            return (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span>{note?.name || note?.opinion_name || 'Unknown Note'}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem('Note', index)}
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

export default NotesSection;