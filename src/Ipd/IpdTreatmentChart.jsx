import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  updateIpd,
  getIpdById,
  updateTreatmentChart,
  deleteTreatmentChart,
  medicine,
  createMedicine
} from '../services/ipd.services';
import IpdPatientInfo from './IpdCommonInfo';

const TreatmentChartTable = () => {
  const { id } = useParams();
  let navigate = useNavigate();
  const [treatments, setTreatments] = useState([]);
  const [originalTreatments, setOriginalTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [medicineLoading, setMedicineLoading] = useState(false);
  
  // Separate search states for add mode and edit mode
  const [medicineSearch, setMedicineSearch] = useState('');
  const [editMedicineSearch, setEditMedicineSearch] = useState({});
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEditSuggestions, setShowEditSuggestions] = useState({});
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [editFilteredMedicines, setEditFilteredMedicines] = useState({});
  
  const [isCreatingNewMedicine, setIsCreatingNewMedicine] = useState(false);
  const [isCreatingEditMedicine, setIsCreatingEditMedicine] = useState({});
  
  const searchRef = useRef(null);
  const editSearchRefs = useRef({});
  
  // Common dosage options
  const dosageOptions = [
    "1-1-0","1-1-1","1-0-1","0-1-1","0-0-1","0-1-0","1-0-0","SOS","STAT","PRN","HS","AC","PC","BID","TID","QID","QD","BBF","BD"
  ];

  const [newEntry, setNewEntry] = useState({
    date_time: '',
    dosage: '',
    medicine_data: '',
    medicine_name: ''
  });

  // State for grouped treatments table
  const [groupedTreatments, setGroupedTreatments] = useState({});
  const [uniqueDates, setUniqueDates] = useState([]);

  useEffect(() => {
    if (id) {
      fetchTreatmentData();
      fetchMedicines();
    }
  }, [id]);

  useEffect(() => {
    // Group treatments by medicine name when treatments change
    if (treatments.length > 0) {
      groupTreatmentsByMedicine();
    }
  }, [treatments]);

  useEffect(() => {
    // Close suggestions when clicking outside for add mode
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      
      // Close edit mode suggestions
      Object.keys(editSearchRefs.current).forEach(key => {
        const ref = editSearchRefs.current[key];
        if (ref && !ref.contains(event.target)) {
          setShowEditSuggestions(prev => ({...prev, [key]: false}));
        }
      });
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Group treatments by medicine name for table display
  const groupTreatmentsByMedicine = () => {
    const grouped = {};
    const dates = [];
    
    // First, collect all unique dates
    treatments.forEach(entry => {
      const displayDate = formatDateForDisplay(entry.date_time);
      if (!dates.includes(displayDate)) {
        dates.push(displayDate);
      }
    });
    
    // Sort dates chronologically
    dates.sort((a, b) => {
      const dateA = new Date(a.split(' ')[0].split('-').reverse().join('-'));
      const dateB = new Date(b.split(' ')[0].split('-').reverse().join('-'));
      return dateA - dateB;
    });
    
    setUniqueDates(dates);
    
    // Group treatments by medicine name
    treatments.forEach(entry => {
      const medicineName = entry.medicine_name || getMedicineNameById(entry.medicine_data);
      const displayDate = formatDateForDisplay(entry.date_time);
      
      if (!grouped[medicineName]) {
        grouped[medicineName] = {
          medicine_name: medicineName,
          dosages: {}
        };
      }
      
      grouped[medicineName].dosages[displayDate] = entry.dosage || '-';
    });
    
    setGroupedTreatments(grouped);
  };

  // Filter medicines for add mode
  useEffect(() => {
    if (medicineSearch.trim() === '') {
      setFilteredMedicines([]);
      setIsCreatingNewMedicine(false);
      return;
    }

    const filtered = medicines.filter(med =>
      med.medicine_name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(medicineSearch.toLowerCase()))
    );

    setFilteredMedicines(filtered);
    
    const exactMatch = medicines.some(med => 
      med.medicine_name.toLowerCase() === medicineSearch.toLowerCase()
    );
    setIsCreatingNewMedicine(!exactMatch && medicineSearch.trim().length > 0);
  }, [medicineSearch, medicines]);

  // Filter medicines for edit mode
  const updateEditFilter = (index, searchText) => {
    if (searchText.trim() === '') {
      setEditFilteredMedicines(prev => ({...prev, [index]: []}));
      setIsCreatingEditMedicine(prev => ({...prev, [index]: false}));
      return;
    }

    const filtered = medicines.filter(med =>
      med.medicine_name.toLowerCase().includes(searchText.toLowerCase()) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(searchText.toLowerCase()))
    );

    setEditFilteredMedicines(prev => ({...prev, [index]: filtered}));
    
    const exactMatch = medicines.some(med => 
      med.medicine_name.toLowerCase() === searchText.toLowerCase()
    );
    setIsCreatingEditMedicine(prev => ({...prev, [index]: !exactMatch && searchText.trim().length > 0}));
  };

  const fetchTreatmentData = async () => {
    setFetchLoading(true);
    try {
      const response = await getIpdById(id);
      if (response.data && response.data.treatment_chart) {
        const formattedTreatments = response.data.treatment_chart.map(treatment => ({
          ...treatment,
          medicine_name: typeof treatment.medicine_data === 'object' 
            ? treatment.medicine_data.medicine_name 
            : getMedicineNameById(treatment.medicine_data)
        }));
        setTreatments(formattedTreatments);
        setOriginalTreatments(formattedTreatments);
      } else {
        setTreatments([]);
        setOriginalTreatments([]);
      }
    } catch (error) {
      console.error('Error fetching treatment data:', error);
      alert('Failed to fetch treatment data');
      setTreatments([]);
      setOriginalTreatments([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchMedicines = async () => {
    setMedicineLoading(true);
    try {
      const response = await medicine();
      const medicineList = Array.isArray(response) ? response : [];
      setMedicines(medicineList);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      alert('Failed to fetch medicines');
      setMedicines([]);
    } finally {
      setMedicineLoading(false);
    }
  };

  const createNewMedicine = async (medicineName) => {
    try {
      const payload = {
        medicine_name: medicineName,
        generic_name: '',
      };
      
      const response = await createMedicine(payload);
      
      const newMedicine = response;
      setMedicines(prev => [...prev, newMedicine]);
      
      return newMedicine;
    } catch (error) {
      console.error('Error creating medicine:', error);
      alert('Failed to create new medicine');
      return null;
    }
  };

  const handleMedicineSelect = (selectedMedicine) => {
    setNewEntry(prev => ({
      ...prev,
      medicine_data: selectedMedicine.id,
      medicine_name: selectedMedicine.medicine_name,
      dosage: selectedMedicine.dosage || prev.dosage // Auto-fill dosage if available
    }));
    setMedicineSearch(selectedMedicine.medicine_name);
    setShowSuggestions(false);
    setIsCreatingNewMedicine(false);
  };

  // Update the handleEditMedicineSelect function for EDIT mode
  const handleEditMedicineSelect = (index, selectedMedicine) => {
    setTreatments(prev => 
      prev.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              medicine_data: selectedMedicine.id,
              medicine_name: selectedMedicine.medicine_name,
              dosage: selectedMedicine.dosage || item.dosage // Auto-fill dosage if available
            } 
          : item
      )
    );
    setEditMedicineSearch(prev => ({...prev, [index]: selectedMedicine.medicine_name}));
    setShowEditSuggestions(prev => ({...prev, [index]: false}));
    setIsCreatingEditMedicine(prev => ({...prev, [index]: false}));
  };

  const handleNewEntryChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'medicine_name') {
      setMedicineSearch(value);
      setNewEntry(prev => ({
        ...prev,
        medicine_name: value,
        medicine_data: ''
      }));
      setShowSuggestions(true);
    } else {
      setNewEntry(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditChange = (e, index) => {
    const { name, value } = e.target;
    
    if (name === 'medicine_name') {
      setEditMedicineSearch(prev => ({...prev, [index]: value}));
      updateEditFilter(index, value);
      
      setTreatments(prev => 
        prev.map((item, i) => 
          i === index 
            ? { 
                ...item, 
                medicine_name: value,
                medicine_data: ''
              } 
            : item
        )
      );
      setShowEditSuggestions(prev => ({...prev, [index]: true}));
    } else {
      setTreatments(prev => 
        prev.map((item, i) => 
          i === index ? { ...item, [name]: value } : item
        )
      );
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.date_time || !newEntry.medicine_name) {
      alert('Date and Medicine are required');
      return;
    }

    setLoading(true);
    try {
      let medicineId = newEntry.medicine_data;
      
      if (medicineId && typeof medicineId === 'object') {
        medicineId = medicineId.id;
      }
      
      if (!medicineId && newEntry.medicine_name) {
        const existingMedicine = medicines.find(med => 
          med.medicine_name.toLowerCase() === newEntry.medicine_name.toLowerCase()
        );
        
        if (existingMedicine) {
          medicineId = existingMedicine.id;
        } else {
          const newMedicine = await createNewMedicine(newEntry.medicine_name);
          if (newMedicine) {
            medicineId = newMedicine.id;
          } else {
            throw new Error('Failed to create new medicine');
          }
        }
      }

      const formattedEntry = {
        dosage: newEntry.dosage || '',
        date_time: formatDateForAPI(newEntry.date_time),
        status: null,
        quantity: 0,
        medicine_data: parseInt(medicineId),
      };
      
      const updatedTreatments = [formattedEntry];
      
      const payload = { 
        treatment_chart: updatedTreatments 
      };
      
      let res = await updateIpd(id, payload);
      console.log(res);
      
      await fetchTreatmentData();
      
      setNewEntry({
        date_time: '',
        dosage: '',
        medicine_data: '',
        medicine_name: ''
      });
      setMedicineSearch('');
      
      alert('Treatment added successfully!');
      
    } catch (error) {
      console.error('Error adding treatment:', error);
      alert('Failed to add treatment');
      fetchTreatmentData();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (index) => {
    setLoading(true);
    try {
      const entryToUpdate = treatments[index];
      const originalDate = originalTreatments[index]?.date_time || entryToUpdate.date_time;
      
      let medicineId = entryToUpdate.medicine_data;
      const medicineName = entryToUpdate.medicine_name;
      
      if (!medicineId && medicineName) {
        const existingMedicine = medicines.find(med => 
          med.medicine_name.toLowerCase() === medicineName.toLowerCase()
        );
        
        if (existingMedicine) {
          medicineId = existingMedicine.id;
        } else {
          const newMedicine = await createNewMedicine(medicineName);
          if (newMedicine) {
            medicineId = newMedicine.id;
          } else {
            throw new Error('Failed to create new medicine');
          }
        }
      }

      const isAlreadyApiFormat = /^\d{2}-\d{2}-\d{4}$/.test(entryToUpdate.date_time);
      
      const formattedEntry = {
        date_time: isAlreadyApiFormat ? entryToUpdate.date_time : formatDateForAPI(entryToUpdate.date_time),
        dosage: entryToUpdate.dosage,
        status: null,
        quantity: 0,
        medicine_data: parseInt(medicineId),
      };
      
      if (!formattedEntry.date_time || formattedEntry.date_time.trim() === '') {
        formattedEntry.date_time = originalDate;
      }
      
      await updateTreatmentChart(id, index, formattedEntry);
      
      const updatedTreatments = treatments.map((item, i) => 
        i === index ? { ...formattedEntry, medicine_name: medicineName } : item
      );
      
      setTreatments(updatedTreatments);
      setOriginalTreatments(updatedTreatments);
      
      setEditingIndex(null);
      setEditMedicineSearch(prev => ({...prev, [index]: ''}));
      setShowEditSuggestions(prev => ({...prev, [index]: false}));
      
      alert('Treatment updated successfully!');
    } catch (error) {
      console.error('Error updating treatment:', error);
      alert('Failed to update treatment');
      fetchTreatmentData();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (index) => {
    if (!window.confirm('Are you sure you want to delete this treatment?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteTreatmentChart(id, index);
      
      const updatedTreatments = treatments.filter((_, i) => i !== index);
      setTreatments(updatedTreatments);
      setOriginalTreatments(updatedTreatments);
      
      alert('Treatment deleted successfully!');
    } catch (error) {
      console.error('Error deleting treatment:', error);
      alert('Failed to delete treatment');
      fetchTreatmentData();
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (index) => {
    const currentItem = treatments[index];
    const currentMedicineName = currentItem.medicine_name || getMedicineNameById(currentItem.medicine_data);
    
    setTreatments(prev => 
      prev.map((item, i) => 
        i === index 
          ? {
              ...item,
              date_time: item.date_time ? formatDateForInput(item.date_time) : '',
              medicine_name: currentMedicineName
            }
          : item
      )
    );
    
    setEditMedicineSearch(prev => ({...prev, [index]: currentMedicineName}));
    setEditingIndex(index);
  };

  const cancelEditing = () => {
    setTreatments([...originalTreatments]);
    setEditingIndex(null);
    setEditMedicineSearch({});
    setShowEditSuggestions({});
  };

  // Format date for display (shows as "DD MMM YYYY")
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    
    try {
      if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
        const [year, month, day] = dateString.split('-');
        dateString = `${day}-${month}-${year}`;
      }
      
      const dateParts = dateString.split('-');
      
      if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        
        const date = new Date(`${year}-${month}-${day}`);
        
        const options = { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric'
        };
        return date.toLocaleDateString('en-GB', options).replace(/\//g, '-');
      }
    } catch (error) {
      console.error('Error formatting date for display:', error);
    }
    
    return dateString;
  };

  // Format date for input field (convert to YYYY-MM-DD for date input)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
        return dateString;
      }
      
      const dateParts = dateString.split('-');
      
      if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error formatting date for input:', error);
    }
    
    return '';
  };

  // Format date for API (convert YYYY-MM-DD to DD-MM-YYYY)
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    
    try {
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        return dateString;
      }
      
      const dateParts = dateString.split('-');
      
      if (dateParts.length === 3 && dateParts[0].length === 4) {
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        
        return `${day}-${month}-${year}`;
      }
    } catch (error) {
      console.error('Error formatting date for API:', error);
    }
    
    return dateString;
  };

  // Get medicine name by ID (for display)
  const getMedicineNameById = (medicineId) => {
    if (!medicineId) return 'Unknown Medicine';
    
    if (typeof medicineId === 'object' && medicineId.medicine_name) {
      return medicineId.medicine_name;
    }
    
    const medicineObj = medicines.find(m => m.id === medicineId || m.id === parseInt(medicineId));
    return medicineObj ? medicineObj.medicine_name : `Medicine ID: ${medicineId}`;
  };

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading treatment data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-5 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center flex justify-between">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Treatment Chart</h2>
        <button className='border rounded-3xl px-4' onClick={() => navigate(-1)}>Back</button>
      </div>
      
      <IpdPatientInfo ipdId={id} />

      {/* Add New Entry Form */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <span className="text-2xl">➕</span> Add New Treatment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date_time"
              value={newEntry.date_time}
              onChange={handleNewEntryChange}
              required
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          
          <div className="flex flex-col gap-1.5 relative" ref={searchRef}>
            <label className="text-sm font-medium text-slate-700">
              Medicine <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="medicine_name"
              value={medicineSearch}
              onChange={handleNewEntryChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Type medicine name..."
              required
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              autoComplete="off"
            />
            
            {medicineLoading && (
              <div className="absolute right-3 top-10">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            
            {showSuggestions && (filteredMedicines.length > 0 || isCreatingNewMedicine) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto top-full">
                {filteredMedicines.map((med) => (
                  <div
                    key={med.id}
                    className="px-4 py-1 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                    onClick={() => handleMedicineSelect(med)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-slate-800">{med.medicine_name}</div>
                      {med.dosage && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {med.dosage}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Dosage (Morning-Afternoon-Night)</label>
            <select
              name="dosage"
              value={newEntry.dosage}
              onChange={handleNewEntryChange}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Select Dosage</option>
              {dosageOptions.map((dosage) => (
                <option key={dosage} value={dosage}>
                  {dosage}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAddEntry}
          disabled={loading || !newEntry.date_time || !newEntry.medicine_name}
          className={`px-5 py-1 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
            loading || !newEntry.date_time || !newEntry.medicine_name
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-sm hover:shadow-md'
          }`}
        >
          {loading ? '⏳ Adding...' : '✓ Add Treatment'}
        </button>
      </div>

      {/* Treatment Table - New Layout Matching Image */}
      {Object.keys(groupedTreatments).length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-slate-300">
          <div className="text-6xl mb-4 opacity-50">💊</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No Treatment Records</h3>
          <p className="text-slate-600">Add your first treatment entry using the form above</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">
              Treatment Records ({treatments.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">
                    Sr No.
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">
                    Medicine
                  </th>
                  {uniqueDates.map((date, idx) => (
                    <th key={idx} className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">
                      {date}
                    </th>
                  ))}
                  <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Object.values(groupedTreatments).map((medicine, medIndex) => (
                  <tr key={medIndex} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-300 px-4 py-3 text-slate-800 font-medium">
                      {medIndex + 1}
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-slate-700 font-medium">
                      {medicine.medicine_name}
                    </td>
                    {uniqueDates.map((date, dateIdx) => (
                      <td key={dateIdx} className="border border-slate-300 px-4 py-3 text-slate-600">
                        {medicine.dosages[date] || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-300 px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Find the first treatment with this medicine name to edit
                            const treatmentIndex = treatments.findIndex(
                              t => (t.medicine_name || getMedicineNameById(t.medicine_data)) === medicine.medicine_name
                            );
                            if (treatmentIndex !== -1) {
                              startEditing(treatmentIndex);
                            }
                          }}
                          className="px-2 py-1 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            // Find all treatments with this medicine name to delete
                            const treatmentIndices = treatments
                              .map((t, idx) => ({ ...t, idx }))
                              .filter(t => (t.medicine_name || getMedicineNameById(t.medicine_data)) === medicine.medicine_name)
                              .map(t => t.idx);
                            
                            // Delete the first one (or implement batch delete)
                            if (treatmentIndices.length > 0) {
                              handleDeleteEntry(treatmentIndices[0]);
                            }
                          }}
                          className="px-2 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal for better UX */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Edit Treatment</h3>
              <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Date</label>
                <input
                  type="date"
                  name="date_time"
                  value={treatments[editingIndex]?.date_time || ''}
                  onChange={(e) => handleEditChange(e, editingIndex)}
                  className="w-full px-3 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div ref={el => editSearchRefs.current[editingIndex] = el}>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Medicine</label>
                <input
                  type="text"
                  name="medicine_name"
                  value={editMedicineSearch[editingIndex] || treatments[editingIndex]?.medicine_name || ''}
                  onChange={(e) => handleEditChange(e, editingIndex)}
                  onFocus={() => setShowEditSuggestions(prev => ({...prev, [editingIndex]: true}))}
                  placeholder="Type medicine name..."
                  className="w-full px-3 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                />
                
                {showEditSuggestions[editingIndex] && 
                  (editFilteredMedicines[editingIndex]?.length > 0 || isCreatingEditMedicine[editingIndex]) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{width: 'inherit'}}>
                      {editFilteredMedicines[editingIndex]?.map((med) => (
                        <div
                          key={med.id}
                          className="px-3 py-1 hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                          onClick={() => handleEditMedicineSelect(editingIndex, med)}
                        >
                          <div className="font-medium text-slate-800 text-sm">{med.medicine_name}</div>
                          {med.dosage && (
                            <span className="text-xs text-blue-600">{med.dosage}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Dosage</label>
                <select
                  name="dosage"
                  value={treatments[editingIndex]?.dosage || ''}
                  onChange={(e) => handleEditChange(e, editingIndex)}
                  className="w-full px-3 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Dosage</option>
                  {dosageOptions.map((dosage) => (
                    <option key={dosage} value={dosage}>{dosage}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={cancelEditing}
                className="px-4 py-1 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateEntry(editingIndex)}
                disabled={loading}
                className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentChartTable;