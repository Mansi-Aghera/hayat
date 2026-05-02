import React, { useState, useEffect, useRef } from "react";
import { medicine, createMedicine } from "../../services/ipd.services";
import { Plus, Trash2 } from "lucide-react";

const DailyGivenTreatment = ({ dailyGivenTreatment, setDailyGivenTreatment }) => {
  const [medicineList, setMedicineList] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [medicineHighlightIndex, setMedicineHighlightIndex] = useState(-1);

  const medicineInputRef = useRef(null);
  const dosageSelectRef = useRef(null);
  const addButtonRef = useRef(null);

  const [newTreatment, setNewTreatment] = useState({
    medicine_name: "",
    medicine_id: null,
    dosage: "",
  });

  const dosageOptions = [
    "1-1-0","1-1-1","1-0-1","0-1-1","0-0-1","0-1-0","1-0-0",
    "SOS","STAT","PRN","HS","AC","PC","BID","TID","QID","QD","BBF","BD"
  ];

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    const res = await medicine();
    setMedicineList(Array.isArray(res) ? res : []);
  };

  // 🔎 search medicine
  const handleMedicineSearch = (value) => {
    setNewTreatment((prev) => ({ ...prev, medicine_name: value, medicine_id: null }));

    if (value.trim()) {
      const filtered = medicineList.filter((m) =>
        (m?.medicine_name || m?.name || "")
          .toLowerCase()
          .includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
      setMedicineHighlightIndex(-1);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  const handleMedicineKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMedicineHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMedicineHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && medicineHighlightIndex >= 0 && medicineHighlightIndex < searchResults.length) {
        selectMedicine(searchResults[medicineHighlightIndex]);
      } else if (showDropdown && medicineHighlightIndex === searchResults.length) {
        setShowDropdown(false);
        dosageSelectRef.current?.focus();
      } else {
        dosageSelectRef.current?.focus();
      }
    }
  };

  // ✔ select medicine → auto fill dosage
  const selectMedicine = (med) => {
    setNewTreatment({
      medicine_name: med.medicine_name || med.name,
      medicine_id: med.id,
      dosage: med?.dosage || ""   // auto fill if API provides
    });

    setShowDropdown(false);
    setTimeout(() => dosageSelectRef.current?.focus(), 10);
  };

  // ➕ Add treatment entry
  const handleAddTreatment = async () => {
    if (!newTreatment.medicine_name.trim() || !newTreatment.dosage.trim()) {
      alert("Please select medicine & dosage");
      return;
    }

    let medId = newTreatment.medicine_id;

    // create new medicine if not exists
    if (!medId) {
      const existing = medicineList.find(
        (m) => (m?.medicine_name || "").toLowerCase() ===
               newTreatment.medicine_name.toLowerCase()
      );

      if (existing) {
        medId = existing.id;
      } else {
        const created = await createMedicine({
          medicine_name: newTreatment.medicine_name
        });
        medId = created?.id || created;
        setMedicineList((prev) => [...prev, created]);
      }
    }

    const treatmentEntry = {
      given_treatment: [
        {
          dosage: newTreatment.dosage,
          medicine_data: medId
        }
      ],
      medicine_name: newTreatment.medicine_name
    };

    setDailyGivenTreatment((prev) => [...prev, treatmentEntry]);

    setNewTreatment({
      medicine_name: "",
      medicine_id: null,
      dosage: ""
    });

    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleRemoveTreatment = (index) => {
    setDailyGivenTreatment((prev) => prev.filter((_, i) => i !== index));
  };

  return (
  <div className="bg-gray-50 p-6 rounded-lg">
    <div className="flex items-start gap-4 mb-3">
      <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 min-w-[140px]">Rx</h3>
      <div className="flex-1">
        {/* Add Treatment Card - Matches Daily Chief layout */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Medicine Search Input */}
        <div className="relative">
          <input
            ref={medicineInputRef}
            type="text"
            placeholder="Type medicine name"
            value={newTreatment.medicine_name}
            onChange={(e) => handleMedicineSearch(e.target.value)}
            onKeyDown={handleMedicineKeyDown}
            onFocus={() =>
              newTreatment.medicine_name &&
              handleMedicineSearch(newTreatment.medicine_name)
            }
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="border border-gray-300 rounded-lg px-3 py-1 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {searchResults.map((m, index) => (
                <div
                  key={m.id}
                  onMouseDown={() => selectMedicine(m)}
                  onMouseEnter={() => setMedicineHighlightIndex(index)}
                  className={`px-4 py-1 cursor-pointer border-b border-gray-200 last:border-b-0 text-sm ${medicineHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                >
                  {m.medicine_name || m.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dosage Select */}
        <select
          ref={dosageSelectRef}
          value={newTreatment.dosage}
          onChange={(e) =>
            setNewTreatment((prev) => ({ ...prev, dosage: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addButtonRef.current?.click();
            }
          }}
          className="border border-gray-300 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Select Dosage</option>
          {dosageOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

                {/* Add Button */}
                <button
                  ref={addButtonRef}
                  onClick={handleAddTreatment}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  Add Treatment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* List of Added Treatments - Shown as cards below */}
        <div className="space-y-3">
          {dailyGivenTreatment.map((treatmentGroup, index) => {
            const treatment = treatmentGroup?.given_treatment?.[0] || {};
            const medicineName = treatment.medicine_name || treatmentGroup.medicine_name || "Medicine";
            
            if (!medicineName && !treatment.dosage) return null;
              
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="font-medium text-gray-800">
                    {medicineName}
                  </div>
                  {treatment.dosage && (
                    <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                      {treatment.dosage}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveTreatment(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Remove treatment"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}

          {dailyGivenTreatment.length === 0 && (
            ""
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default DailyGivenTreatment;
