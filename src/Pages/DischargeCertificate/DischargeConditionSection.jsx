import React from 'react';

const DischargeConditionSection = ({ formData, setFormData }) => {
  const fields = ['GC', 'BP', 'PR', 'RSB/L', 'CVS', 'CNS'];

  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Discharge Condition</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field}
            </label>
            <input
              type="text"
              value={formData.discharge_condition[field] || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                discharge_condition: { ...prev.discharge_condition, [field]: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Enter ${field}`}
            />
          </div>
        ))}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition Date
          </label>
          <input
            type="date"
            value={formData.discharge_condition.date_time}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              discharge_condition: { ...prev.discharge_condition, date_time: e.target.value }
            }))}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default DischargeConditionSection;