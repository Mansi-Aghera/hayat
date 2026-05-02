// components/opd/ExaminationForm.jsx
import React, { useRef } from 'react';
import { Controller } from 'react-hook-form';

const ExaminationForm = ({ control }) => {
  const inputRefs = useRef([]);

  const fields = [
    { name: 'examination.RS', label: 'RS', placeholder: '90' },
    { name: 'examination.CVS', label: 'CVS', placeholder: '90' },
    { name: 'examination.CNS', label: 'CNS', placeholder: '90' },
    { name: 'examination.PA', label: 'PA', placeholder: '90' },
    { name: 'examination.Others', label: 'Others', placeholder: 'Additional notes' },
  ];

  // Handle Enter key press - move to next field
  const handleKeyPress = (e, currentIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Find next input field
      const nextIndex = currentIndex + 1;
      if (nextIndex < inputRefs.current.length) {
        inputRefs.current[nextIndex]?.focus();
      } else {
        // If it's the last field, blur to exit
        e.target.blur();
      }
    }
  };

  return (
    <div>
      {/* All fields in one row - Inline title + fields */}
      <div className="flex items-start gap-4">
        <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Examination</h3>
      
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
        {fields.map((field, index) => (
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
                  type="text"
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

export default ExaminationForm;