// components/opd/MedicationsForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { medicine, createMedicine } from '../../services/ipd.services';

const MedicationsForm = ({ control, watch, setValue }) => {
  const medications = watch('given_medicine') || [];
  const [medicineList, setMedicineList] = useState([]);
  const [loading, setLoading] = useState(true);

  const dosageOptions = [
    { value: '1-1-0', label: '1-1-0' },
    { value: '1-1-1', label: '1-1-1' },
    { value: '1-0-1', label: '1-0-1' },
    { value: '0-1-1', label: '0-1-1' },
    { value: '0-0-1', label: '0-0-1' },
    { value: '0-1-0', label: '0-1-0' },
    { value: '1-0-0', label: '1-0-0' },
    { value: 'SOS', label: 'SOS' },
    { value: 'STAT', label: 'STAT' },
    { value: 'PRN', label: 'PRN' },
    { value: 'HS', label: 'HS' },
    { value: 'AC', label: 'AC' },
    { value: 'PC', label: 'PC' },
    { value: 'BID', label: 'BID' },
    { value: 'TID', label: 'TID' },
    { value: 'QID', label: 'QID' },
    { value: 'QD', label: 'QD' },
    { value: 'BBF', label: 'BBF' },
    { value: 'BD', label: 'BD' },
  ];

  // State for the add form
  const [addForm, setAddForm] = useState({
    medicine_name: '',
    medicine_id: null,
    quantity: '',
    doses: '',
    intake_type: 'After Meal'
  });

  const [searchResults, setSearchResults] = useState([]);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [showDosageDropdown, setShowDosageDropdown] = useState(false);
  const [medicineHighlightIndex, setMedicineHighlightIndex] = useState(-1);
  const [dosageHighlightIndex, setDosageHighlightIndex] = useState(-1);

  const medicineInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const dosageInputRef = useRef(null);

  useEffect(() => {
    fetchMedicineList();
  }, []);

  const fetchMedicineList = async () => {
    try {
      setLoading(true);
      const data = await medicine();
      setMedicineList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMedicineList([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle medicine search in add form
  const handleMedicineSearch = (value) => {
    setAddForm(prev => ({
      ...prev,
      medicine_name: value,
      medicine_id: null
    }));
    setMedicineHighlightIndex(-1);

    if (value.trim()) {
      const filtered = medicineList.filter(m =>
        (m?.medicine_name || '').toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowMedicineDropdown(true);
    } else {
      setSearchResults([]);
      setShowMedicineDropdown(false);
    }
  };

  // Select medicine from dropdown
  const selectMedicine = (medicineItem) => {
    setAddForm(prev => ({
      ...prev,
      medicine_name: medicineItem.medicine_name,
      medicine_id: medicineItem.id,
      doses: medicineItem.dosage || '', // Auto-fill dosage from medicine data
      quantity: medicineItem.quantity || '' // Auto-fill quantity from medicine data
    }));
    setShowMedicineDropdown(false);

    // Auto shift focus to quantity field
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 0);
  };

  // Create new medicine if doesn't exist
  const createNewMedicine = async (name) => {
    try {
      const payload = {
        medicine_name: name,
        dosage: addForm.doses || '', // Include dosage if available
        quantity: addForm.quantity || '' // Include quantity if available
      };
      const response = await createMedicine(payload);
      const created = response?.data || response;
      setMedicineList(prev => [...prev, created]);
      return created.id;
    } catch (error) {
      console.error('Error creating medicine:', error);
      throw error;
    }
  };

  // Add new medicine to the list
  const addMedication = async () => {
    if (!addForm.medicine_name.trim()) {
      alert('Please enter medicine name');
      return;
    }

    if (!addForm.quantity.trim()) {
      alert('Please enter quantity');
      return;
    }

    if (!addForm.doses.trim()) {
      alert('Please select dosage');
      return;
    }

    let medicineId = addForm.medicine_id;

    // If no ID selected, check if it exists or create new
    if (!medicineId) {
      const existing = medicineList.find(
        m => (m?.medicine_name || '').toLowerCase() === addForm.medicine_name.toLowerCase()
      );

      if (existing) {
        medicineId = existing.id;
      } else {
        try {
          medicineId = await createNewMedicine(addForm.medicine_name);
        } catch (error) {
          alert('Failed to create new medicine');
          return;
        }
      }
    }

    // Add to form data
    const newMedication = {
      medicine_data: medicineId,
      name: addForm.medicine_name,
      quantity: parseInt(addForm.quantity) || 0,
      doses: addForm.doses,
      intake_type: addForm.intake_type
    };

    setValue('given_medicine', [...medications, newMedication]);

    // Reset add form
    setAddForm({
      medicine_name: '',
      medicine_id: null,
      quantity: '',
      doses: '',
      intake_type: 'After Meal'
    });
    setShowMedicineDropdown(false);
    setShowDosageDropdown(false);
    setSearchResults([]);
  };

  // Handle Keyboard Navigation for Medicine
  const handleMedicineKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMedicineHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMedicineHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showMedicineDropdown && medicineHighlightIndex >= 0 && medicineHighlightIndex < searchResults.length) {
        selectMedicine(searchResults[medicineHighlightIndex]);
      } else if (showMedicineDropdown && medicineHighlightIndex === searchResults.length) {
        setShowMedicineDropdown(false);
      } else {
        addMedication();
      }
    }
  };

  // Handle Keyboard Navigation for Dosage
  const handleDosageKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDosageHighlightIndex(prev => prev < dosageOptions.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDosageHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDosageDropdown && dosageHighlightIndex >= 0 && dosageHighlightIndex < dosageOptions.length) {
        setAddForm(prev => ({ ...prev, doses: dosageOptions[dosageHighlightIndex].value }));
        setShowDosageDropdown(false);
      } else {
        addMedication();
      }
    }
  };

  // Handle Enter key press in other inputs
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMedication();
    }
  };

  // Remove medication from list
  const removeMedication = (index) => {
    setValue('given_medicine', medications.filter((_, i) => i !== index));
  };

  // Format medicine display name
  const formatMedicineName = (medicineItem) => {
    if (!medicineItem) return '';

    let displayName = medicineItem.medicine_name || '';

    // Add brand name if available
    if (medicineItem.brand_name) {
      displayName += ` (${medicineItem.brand_name})`;
    }

    // Add composition if available
    if (medicineItem.composition) {
      displayName += ` - ${medicineItem.composition}`;
    }

    return displayName;
  };

  return (
    <div>
      {/* Add Medication Form - Inline title + fields */}
      <div className="flex items-start gap-4 mb-4">
        <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">RX:</h3>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Medicine Input */}
          <div className="relative">
            <input
              ref={medicineInputRef}
              type="text"
              placeholder="Type medicine name"
              value={addForm.medicine_name}
              onChange={(e) => handleMedicineSearch(e.target.value)}
              onFocus={() => addForm.medicine_name && handleMedicineSearch(addForm.medicine_name)}
              onBlur={() => setTimeout(() => setShowMedicineDropdown(false), 200)}
              onKeyDown={handleMedicineKeyDown}
              className="w-full px-3 py-2.5 border rounded-md text-sm"
            />

            {showMedicineDropdown && searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((m, index) => (
                  <div
                    key={m.id}
                    onMouseDown={() => selectMedicine(m)}
                    onMouseEnter={() => setMedicineHighlightIndex(index)}
                    className={`px-4 py-2 cursor-pointer border-b ${medicineHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                  >
                    <div className="font-medium text-sm">{m.medicine_name}</div>
                    {(m.brand_name || m.composition) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {m.brand_name && <span>Brand: {m.brand_name}</span>}
                        {m.composition && <span> • Composition: {m.composition}</span>}
                        {m.dosage && <span> • Dosage: {m.dosage}</span>}
                      </div>
                    )}
                  </div>
                ))}
                <div
                  onMouseDown={() => setShowMedicineDropdown(false)}
                  onMouseEnter={() => setMedicineHighlightIndex(searchResults.length)}
                  className={`px-4 py-2 cursor-pointer border-t ${medicineHighlightIndex === searchResults.length ? 'bg-emerald-100' : 'hover:bg-emerald-50 bg-gray-50'}`}
                >
                  <div className="font-medium text-sm text-emerald-600">
                    Or create new: "{addForm.medicine_name}"
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quantity Input */}
          <div>
            <input
              ref={quantityInputRef}
              type="number"
              placeholder="Quantity"
              value={addForm.quantity}
              onChange={(e) => setAddForm(prev => ({
                ...prev,
                quantity: e.target.value
              }))}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2.5 border rounded-md text-sm"
            />
          </div>

          {/* Dosage Input with Dropdown */}
          <div className="relative">
            <input
              ref={dosageInputRef}
              type="text"
              placeholder="Select dosage"
              value={addForm.doses}
              onChange={(e) => {
                setAddForm(prev => ({ ...prev, doses: e.target.value }));
                setShowDosageDropdown(true);
              }}
              onFocus={() => {
                setShowDosageDropdown(true);
                setDosageHighlightIndex(-1);
              }}
              onBlur={() => setTimeout(() => setShowDosageDropdown(false), 200)}
              onKeyDown={handleDosageKeyDown}
              className="w-full px-3 py-2.5 border rounded-md text-sm"
            />

            {showDosageDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {dosageOptions.map((option, index) => (
                  <div
                    key={option.value}
                    onMouseDown={() => {
                      setAddForm(prev => ({ ...prev, doses: option.value }));
                      setShowDosageDropdown(false);
                    }}
                    onMouseEnter={() => setDosageHighlightIndex(index)}
                    className={`px-4 py-2 cursor-pointer border-b ${dosageHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Intake Type Dropdown */}
          <div>
            <select
              value={addForm.intake_type}
              onChange={(e) => setAddForm(prev => ({
                ...prev,
                intake_type: e.target.value
              }))}
              className="w-full px-3 py-2.5 border rounded-md text-sm"
            >
              <option value="After Meal">After Meal</option>
              <option value="Before Meal">Before Meal</option>
              <option value="With Meal">With Meal</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={addMedication}
            className="bg-blue-600 text-white rounded-md px-4 py-2.5 hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Medication
          </button>
        </div>
      </div>

      {/* Added Medications List - Table Format */}
      <div className="mt-6">
        {medications.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/50 border border-dashed rounded-xl">
             <p className="text-gray-400 italic text-sm">No medicines added yet. Use the form above to prescribe.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Medicine Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest w-28 text-center">Doses</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest w-36">Intake Type</th>
                  <th className="px-4 py-3 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest w-20">Qty</th>
                  <th className="px-4 py-3 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest w-20">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {medications.map((item, index) => {
                  const medicineItem = medicineList.find(m => m.id === item.medicine_data);
                  const medicineName = formatMedicineName(medicineItem) || item.name || 'Unknown';

                  return (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-gray-400 text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-800 text-sm leading-tight uppercase">{medicineName}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${item.doses === 'STAT' || item.doses === 'SOS' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {item.doses}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-gray-500">
                        {item.intake_type}
                      </td>
                      <td className="px-4 py-3 text-sm font-black text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {/* Hidden fields – REQUIRED for form submit */}
                        <div className="hidden">
                          <Controller
                            name={`given_medicine.${index}.medicine_data`}
                            control={control}
                            render={({ field }) => <input type="hidden" {...field} />}
                          />
                          <Controller
                            name={`given_medicine.${index}.name`}
                            control={control}
                            render={({ field }) => <input type="hidden" {...field} />}
                          />
                          <Controller
                            name={`given_medicine.${index}.quantity`}
                            control={control}
                            render={({ field }) => <input type="hidden" {...field} />}
                          />
                          <Controller
                            name={`given_medicine.${index}.doses`}
                            control={control}
                            render={({ field }) => <input type="hidden" {...field} />}
                          />
                          <Controller
                            name={`given_medicine.${index}.intake_type`}
                            control={control}
                            render={({ field }) => <input type="hidden" {...field} />}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90 ml-auto flex items-center justify-center border border-transparent hover:border-red-100"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationsForm;