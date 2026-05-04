import React from 'react';
import AutocompleteInput from "../AutocompleteInput";
import { Trash2 } from 'lucide-react';

const NotesSection = ({
  noteInput,
  setNoteInput,
  opinions,
  formData,
  handleAddNote,
  handleRemoveItem
}) => {
  return (
    <div className="space-y-4">
      {/* Row Layout for Note */}
      <div className="flex items-start gap-4">
        <label className="text-base font-bold text-gray-900 whitespace-nowrap pt-2 w-[150px] flex-shrink-0">
          Note
        </label>
        
        <div className="flex-1 flex gap-3 items-start">
          <div className="flex-1">
            <AutocompleteInput
              value={noteInput}
              onChange={(value) => setNoteInput(value)}
              suggestions={opinions}
              label=""
              placeholder="Type note or select from list"
              className="w-full text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddNote}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-bold hover:bg-blue-700 transition-colors h-[42px]"
          >
            Add
          </button>
        </div>
      </div>
      
      {/* List of Notes Below Input */}
      <div className="pl-[150px] space-y-2">
        {formData.Note.map((item, index) => {
          const opinionId = item.opinion_details_data?.id || item.opinion_details_data;
          const note = opinions.find(o => o.id === opinionId);
          
          return (
            <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 group">
              <span className="text-sm font-medium text-gray-700">
                {note?.name || note?.opinion_name || 'Unknown Note'}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveItem('Note', index)}
                className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotesSection;