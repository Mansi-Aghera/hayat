import React from 'react';
import AutocompleteInput from "../AutocompleteInput";

const RxSection = ({
  rxForm,
  handleRxChange,
  medicines,
  formData,
  handleAddRx,
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
      handleRxChange('medicine_id', selectedMedicine.id);
      handleRxChange('medicine_name', selectedMedicine.name || selectedMedicine.medicine_name || '');
      
      // Auto-fill dosage if they exist in the medicine object
      if (selectedMedicine.dosage) {
        handleRxChange('doses', selectedMedicine.dosage);
      }
      
      // Auto-fill intake type if it exists
      if (selectedMedicine.meal_time) {
        handleRxChange('intake_type', selectedMedicine.meal_time);
      }
    } else {
      // When typing manually - clear medicine_id but keep the typed text
      console.log('Manual input for medicine:', value);
      handleRxChange('medicine_id', '');
      handleRxChange('medicine_name', typeof value === 'string' ? value : '');
    }
  };
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Rx (Prescription)</h3>
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <AutocompleteInput
              label="Medicine"
              value={rxForm.medicine_name || ''}  // Use medicine_name, not medicine_id
              onChange={handleMedicineChange}
              onCreateNew={handleCreateNewMedicine}  // Pass the create function
              suggestions={medicines}
              placeholder="Search or add medicine"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doses</label>
            <input
              type="text"
              value={rxForm.doses}
              onChange={(e) => handleRxChange('doses', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1-0-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intake Type</label>
            <select
              value={rxForm.intake_type}
              onChange={(e) => handleRxChange('intake_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Intake Type</option>
              <option value="Before Meal">Before Meal</option>
              <option value="After Meal">After Meal</option>
              <option value="With Food">With Food</option>
              <option value="Empty Stomach">Empty Stomach</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddRx}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add Rx
            </button>
          </div>
        </div>
      </div>
      
      {formData.Rx.length > 0 && (
        <div className="space-y-2">
          {formData.Rx.map((item, index) => {
            const medicine = medicines.find(m => m.id === item.medicine_data);
            return (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{medicine?.medicine_name || medicine?.name || `Medicine ID: ${item.medicine_data}`}</span>
                  <span className="text-sm text-gray-600 ml-3">Doses: {item.doses}</span>
                  <span className="text-sm text-gray-600 ml-3">Intake: {item.intake_type}</span>
                  <span className="text-sm text-gray-600 ml-3">Qty: {item.quantity}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem('Rx', index)}
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

export default RxSection;