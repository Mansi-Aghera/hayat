import React from 'react';
import AutocompleteInput from "../AutocompleteInput";

const DiagnosisSection = ({
  diagnosisInput,
  setDiagnosisInput,
  diagnoses,
  formData,
  handleAddDiagnosis,
  handleRemoveItem
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Diagnosis</h3>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <AutocompleteInput
            value={diagnosisInput.name}
            onChange={(value) => {
              // If value is an object (from selection), set the whole object
              if (value && typeof value === 'object') {
                setDiagnosisInput(value);
              } else {
                // If it's a string (typing), update just the name
                setDiagnosisInput(prev => ({ ...prev, name: value }));
              }
            }}
            suggestions={diagnoses}
            label=""
            placeholder="Type diagnosis or select from list"
          />
        </div>
        <button
          type="button"
          onClick={handleAddDiagnosis}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-end"
        >
          Add
        </button>
      </div>
      
      {formData.diagnosis.length > 0 && (
        <div className="space-y-2">
          {formData.diagnosis.map((item, index) => {
            const diagnosis = diagnoses.find(d => d.id === item.diagnosis_data);
            return (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span>{diagnosis?.name || `Diagnosis ID: ${item.diagnosis_data}`}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem('diagnosis', index)}
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

export default DiagnosisSection;