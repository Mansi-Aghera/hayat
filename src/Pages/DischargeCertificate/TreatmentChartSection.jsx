import React from 'react';
import AutocompleteInput from "../AutocompleteInput";

const TreatmentChartSection = ({
  treatmentForm,
  handleTreatmentChange,
  medicines,
  formData,
  handleAddTreatment,
  handleRemoveItem,
  handleCreateNewMedicine  // Add this prop
}) => {
  const handleMedicineChange = (value) => {
    // Check if value is an object (selected from dropdown) or string (typed)
    if (typeof value === 'object' && value !== null && value.id) {
      // When selecting from dropdown - get the complete medicine object
      const selectedMedicine = medicines.find(m => m.id === value.id) || value;
      console.log('Selected medicine from dropdown:', selectedMedicine);
      
      // Set medicine ID and name
      handleTreatmentChange('medicine_id', selectedMedicine.id);
      handleTreatmentChange('medicine_name', selectedMedicine.name || selectedMedicine.medicine_name || '');
      
      // Auto-fill dosage if they exist in the medicine object
      if (selectedMedicine.dosage) {
        handleTreatmentChange('dosage', selectedMedicine.dosage);
      }

    } else {
      // When typing manually - clear medicine_id but keep the typed text
      handleTreatmentChange('medicine_id', '');
      handleTreatmentChange('medicine_name', typeof value === 'string' ? value : '');
    }
  };
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Treatment Chart</h3>
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <AutocompleteInput
              label="Medicine"
              value={treatmentForm.medicine_name || ''}
              onChange={handleMedicineChange}
              onCreateNew={handleCreateNewMedicine}
              suggestions={medicines}
              placeholder="Search or add medicine"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
            <input
              type="text"
              value={treatmentForm.dosage}
              onChange={(e) => handleTreatmentChange('dosage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1-0-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={treatmentForm.date_time}
              onChange={(e) => handleTreatmentChange('date_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <input
              type="text"
              value={treatmentForm.status}
              onChange={(e) => handleTreatmentChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Status"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddTreatment}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Treatment
            </button>
          </div>
        </div>
      </div>
      
      {formData.treatment_chart.length > 0 && (
        <div className="space-y-2">
          {formData.treatment_chart.map((item, index) => {
            const medicine = medicines.find(m => m.id === item.medicine_data);
            return (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{medicine?.medicine_name || medicine?.name || `Medicine ID: ${item.medicine_data}`}</span>
                  <span className="text-sm text-gray-600 ml-3">Dosage: {item.dosage}</span>
                  <span className="text-sm text-gray-600 ml-3">Date: {item.date_time}</span>
                  {item.status && <span className="text-sm text-gray-600 ml-3">Status: {item.status}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem('treatment_chart', index)}
                  className="text-red-600 hover:text-red-800 ml-4"
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

export default TreatmentChartSection;