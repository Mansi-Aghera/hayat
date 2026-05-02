// components/opd/VitalsForm.jsx
import React, { useRef } from 'react';
import { Controller } from 'react-hook-form';

const VitalsForm = ({ control, onSubmit }) => {
  const inputRefs = useRef([]);

  const vitalFields = [
    { name: 'vitals.BP', label: 'BP (mmHg)', placeholder: '120/80' },
    { name: 'vitals.PR', label: 'PR (bpm)', placeholder: '89'},
    { name: 'vitals.SPO', label: 'SPO₂ (%)', placeholder: '98' },
    { name: 'vitals.Sugar', label: 'Blood Sugar', placeholder: 'F: 98' },
    { name: 'vitals.Temp', label: 'Temperature', placeholder: '98.6F' },
    { name: 'vitals.Weight', label: 'Weight', placeholder: '57kg' },
  ];

  // Handle Enter key press - submit form on last field
  const handleKeyPress = (e, currentIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (currentIndex === vitalFields.length - 1) {
        // If it's the last field, trigger form submission
        if (onSubmit) {
          onSubmit();
        }
      } else {
        // Move to next field
        const nextIndex = currentIndex + 1;
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div>
      <div className="flex items-start gap-4">
        <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Vitals</h3>
      
        <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4">
        {vitalFields.map((field, index) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <input
                  {...controllerField}
                  ref={el => inputRefs.current[index] = el}
                  type={field.type || 'text'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={field.placeholder}
                  onKeyDown={(e) => handleKeyPress(e, index)}
                />
              )}
            />
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default VitalsForm;