import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { getBeds, updateBed } from '../services/bed.services';
import { getIpdById, updateIpd } from '../services/ipd.services';

const BedSwitchSection = () => {
  const { id } = useParams();
  const [beds, setBeds] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [currentBed, setCurrentBed] = useState(null);
  const [selectedBed, setSelectedBed] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [vacantBeds, setVacantBeds] = useState([]);
  let navigate = useNavigate()

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setFetchLoading(true);
    try {
      // Fetch patient data
      const patientResponse = await getIpdById(id);
      if (patientResponse.data) {
        setPatientData(patientResponse.data);
        
        // Check if patient has bed_data field
        if (patientResponse.data.bed_data) {
          // bed_data could be an ID or an object
          if (typeof patientResponse.data.bed_data === 'object' && patientResponse.data.bed_data !== null) {
            setCurrentBed(patientResponse.data.bed_data);
          }
        }
      }

      // Fetch all beds (your function handles pagination)
      const allBeds = await getBeds();
      setBeds(allBeds);
      
      // Filter vacant beds (case-insensitive check)
      const vacant = allBeds.filter(bed => 
        bed.status && bed.status.toLowerCase() === 'vacant'
      );
      
      // Update current bed with complete data if we only have ID
      if (currentBed && currentBed.id && !currentBed.name) {
        const fullCurrentBed = allBeds.find(bed => bed.id === currentBed.id);
        if (fullCurrentBed) {
          setCurrentBed(fullCurrentBed);
        }
      }
      
      // If patient has current bed, remove it from vacant beds list
      let filteredVacant = vacant;
      if (currentBed && currentBed.id) {
        filteredVacant = vacant.filter(bed => 
          bed.id !== currentBed.id
        );
      }
      
      setVacantBeds(filteredVacant);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Please try again.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleBedChange = (e) => {
    setSelectedBed(e.target.value);
  };

  const handleSwitchBed = async () => {
    if (!selectedBed) {
      alert('Please select a bed');
      return;
    }

    const selectedBedId = parseInt(selectedBed);
    
    // Check if patient is already in this bed
    if (currentBed && selectedBedId === currentBed.id) {
      alert('Patient is already in this bed');
      return;
    }

    if (!window.confirm('Are you sure you want to switch beds?')) {
      return;
    }

    setLoading(true);
    try {
      const selectedBedData = beds.find(bed => bed.id === selectedBedId);
      
      if (!selectedBedData) {
        throw new Error('Selected bed not found');
      }

      // Step 1: If patient has a current bed, update it to vacant
      if (currentBed && currentBed.id) {
        try {
          await updateBed(currentBed.id, {
            status: 'vacant'
          });
          console.log(`Bed ${currentBed.id} set to vacant`);
        } catch (error) {
          console.error('Error updating current bed:', error);
          // Continue anyway, don't fail the whole operation
        }
      }

      // Step 2: Update the selected bed status to occupied
      await updateBed(selectedBedId, {
        status: 'occupied'
      });
      console.log(`Bed ${selectedBedId} set to occupied`);

      // Step 3: Update patient IPD record with new bed_data
      // Send only the bed ID as integer
      const updatePayload = {
        bed_data: selectedBedId
      };
      
      await updateIpd(id, updatePayload);
      console.log(`IPD record updated with bed_data: ${selectedBedId}`);

      // Step 4: Update local state
      setCurrentBed(selectedBedData);
      
      // Update beds list with new statuses
      const updatedBeds = beds.map(bed => {
        if (bed.id === selectedBedId) {
          return { ...bed, status: 'occupied' };
        }
        if (currentBed && bed.id === currentBed.id) {
          return { ...bed, status: 'vacant' };
        }
        return bed;
      });
      
      setBeds(updatedBeds);
      
      // Update vacant beds list for dropdown
      const newVacantBeds = updatedBeds.filter(bed => 
        bed.status && bed.status.toLowerCase() === 'vacant'
      );
      
      // Remove the newly occupied bed from vacant list
      const finalVacantBeds = newVacantBeds.filter(bed => 
        bed.id !== selectedBedId
      );
      
      setVacantBeds(finalVacantBeds);
      
      // Reset selected bed
      setSelectedBed('');
      
      alert('Bed switched successfully!');
      
    } catch (error) {
      console.error('Error switching bed:', error);
      
      // If there's an error, refetch data to ensure consistency
      await fetchData();
      
      alert(`Failed to switch bed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format bed display name
  const formatBedName = (bed) => {
    if (!bed) return 'Not Assigned';
    if (bed.name && bed.bed_number) {
      return `${bed.name} - Bed ${bed.bed_number}`;
    }
    if (bed.name) {
      return bed.name;
    }
    if (bed.bed_number) {
      return `Bed ${bed.bed_number}`;
    }
    return `Bed ID: ${bed.id}`;
  };

  // Get bed status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'occupied') {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (statusLower === 'vacant') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading bed information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-5">
      {/* Header */}
      <div className="mb-8 text-center flex justify-between">
       <h2 className="text-3xl font-bold text-slate-800 mb-2">Switch Patient Bed</h2>
       <button className='border rounded-3xl px-4' onClick={()=>navigate(-1)}>Back</button>
      </div>
      
      {/* Main Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        {/* Patient Information */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-xl">👤</span> Patient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient Name
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                {patientData?.patient_name || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sr Number
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                {patientData?.sr_no|| 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Current Bed Information */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🛏️</span> Current Bed Assignment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Bed
              </label>
              <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-medium">
                {formatBedName(currentBed)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <div className={`px-4 py-3 border rounded-lg font-medium text-center ${getStatusBadgeClass(currentBed?.status)}`}>
                {currentBed ? 'Occupied' : 'No Bed Assigned'}
              </div>
            </div>
          </div>
        </div>

        {/* Bed Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🔄</span> Select New Bed
          </h3>
          
          {vacantBeds.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-amber-500 text-xl">⚠️</div>
                <div>
                  <p className="font-medium text-amber-800">No vacant beds available</p>
                  <p className="text-sm text-amber-700 mt-1">
                    All {beds.length} beds are currently occupied. Please check back later or contact administration.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Vacant Bed ({vacantBeds.length} available)
                </label>
                <select
                  value={selectedBed}
                  onChange={handleBedChange}
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={loading}
                >
                  <option value="">-- Choose a vacant bed --</option>
                  {vacantBeds
                    .sort((a, b) => {
                      // Sort by name, then by bed number
                      if (a.name < b.name) return -1;
                      if (a.name > b.name) return 1;
                      return parseInt(a.bed_number) - parseInt(b.bed_number);
                    })
                    .map(bed => (
                      <option key={bed.id} value={bed.id}>
                        {bed.name} - Bed {bed.bed_number} ({bed.status})
                      </option>
                    ))}
                </select>
              </div>

              {selectedBed && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-6 h-6 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 text-sm font-bold">✓</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-800 mb-1">Ready to Switch</p>
                      <p className="font-semibold text-emerald-900 text-lg mb-2">
                        {(() => {
                          const bed = beds.find(b => b.id.toString() === selectedBed);
                          return bed ? formatBedName(bed) : 'N/A';
                        })()}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 rounded">
                            Current: Vacant
                          </div>
                          <span className="text-emerald-600 font-bold">→</span>
                          <div className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 border border-red-200 rounded">
                            Will Be: Occupied
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-5 py-1 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↻ Refresh Data
          </button>
          
          {vacantBeds.length > 0 && (
            <button
              onClick={handleSwitchBed}
              disabled={loading || !selectedBed}
              className={`px-6 py-1 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                loading || !selectedBed
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-sm hover:shadow-md'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="text-lg">🔄</span>
                  Switch Bed
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bed Status Dashboard */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Bed Status Dashboard</h3>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Total Beds</p>
            <p className="text-3xl font-bold text-blue-800">{beds.length}</p>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-700">Vacant Beds</p>
            <p className="text-3xl font-bold text-emerald-800">{vacantBeds.length}</p>
            <p className="text-xs text-emerald-600 mt-1">
              {beds.length > 0 ? `${Math.round((vacantBeds.length / beds.length) * 100)}% availability` : 'No beds'}
            </p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700">Occupied Beds</p>
            <p className="text-3xl font-bold text-red-800">{beds.length - vacantBeds.length}</p>
            <p className="text-xs text-red-600 mt-1">
              {beds.length > 0 ? `${Math.round(((beds.length - vacantBeds.length) / beds.length) * 100)}% occupancy` : 'No beds'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BedSwitchSection;