import React from 'react';

const dischargeTypes = [
  { value: 'discharge', label: 'Discharge' },
  { value: 'discharge_on_request', label: 'Discharge on Request' },
  { value: 'lama', label: 'LAMA (Leave Against Medical Advice)' },
  { value: 'refer', label: 'Refer' },
  { value: 'absconded', label: 'Absconded' },
  { value: 'death', label: 'Death' },
];

const DischargeBasicInfo = ({ formData, setFormData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type of Discharge *
        </label>
        <select
          value={formData.discharge_type}
          onChange={(e) => setFormData(prev => ({ ...prev, discharge_type: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          {dischargeTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discharge Date & Time *
        </label>
        <input
          type="datetime-local"
          value={formData.datetime_discharge}
          onChange={(e) => setFormData(prev => ({ ...prev, datetime_discharge: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
    </div>
  );
};

export default DischargeBasicInfo;