import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIpdById, updateIpd } from '../services/ipd.services';

const DischargePatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [dischargeDateTime, setDischargeDateTime] = useState('');
  const [dischargeError, setDischargeError] = useState('');
  const [isAlreadyDischarged, setIsAlreadyDischarged] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    setFetchLoading(true);
    try {
      const response = await getIpdById(id);
      if (response.data) {
        setPatientData(response.data);
        
        // Check if patient is already discharged
        if (response.data.is_discharge === 1 || response.data.is_discharge === true) {
          setIsAlreadyDischarged(true);
        }
        
        // If patient already has discharge datetime, set it
        if (response.data.datetime_discharge) {
          setDischargeDateTime(formatApiDateTimeToInput(response.data.datetime_discharge));
        } else {
          // Set default to current datetime
          const now = new Date();
          const formattedNow = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
          setDischargeDateTime(formattedNow);
        }
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      alert('Failed to fetch patient data');
    } finally {
      setFetchLoading(false);
    }
  };

  // Parse API date format (DD-MM-YYYY HH:MM AM/PM or DD/MM/YYYY HH:MM AM/PM)
  const parseApiDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    
    try {
      // Replace any separators with /
      let normalized = dateTimeString.replace(/-/g, '/');
      
      // Parse the date string
      const [datePart, timePart, period] = normalized.split(' ');
      
      if (!datePart) return null;
      
      const [day, month, year] = datePart.split('/').map(Number);
      
      let hour = 0;
      let minute = 0;
      
      if (timePart) {
        const [timeHour, timeMinute] = timePart.split(':').map(Number);
        hour = timeHour || 0;
        minute = timeMinute || 0;
      }
      
      // Adjust for AM/PM
      if (period && period.toLowerCase() === 'pm' && hour < 12) {
        hour += 12;
      }
      if (period && period.toLowerCase() === 'am' && hour === 12) {
        hour = 0;
      }
      
      return new Date(year, month - 1, day, hour, minute);
    } catch (error) {
      console.error('Error parsing API datetime:', error, dateTimeString);
      return null;
    }
  };

  // Format API datetime to input format (YYYY-MM-DDTHH:MM)
  const formatApiDateTimeToInput = (apiDateTime) => {
    const date = parseApiDateTime(apiDateTime);
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format datetime for API (convert YYYY-MM-DDTHH:MM to DD/MM/YYYY HH:MM AM/PM)
  const formatDateTimeForAPI = (inputDateTime) => {
    if (!inputDateTime) return '';
    
    try {
      const [datePart, timePart] = inputDateTime.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      
      // Convert to 12-hour format with AM/PM
      let displayHour = hour;
      let period = 'AM';
      
      if (hour >= 12) {
        period = 'PM';
        if (hour > 12) {
          displayHour = hour - 12;
        }
      }
      if (hour === 0) {
        displayHour = 12;
      }
      
      const formattedDay = String(day).padStart(2, '0');
      const formattedMonth = String(month).padStart(2, '0');
      const formattedHour = String(displayHour).padStart(2, '0');
      const formattedMinute = String(minute).padStart(2, '0');
      
      return `${formattedDay}/${formattedMonth}/${year} ${formattedHour}:${formattedMinute} ${period}`;
    } catch (error) {
      console.error('Error formatting date for API:', error);
      return '';
    }
  };

  // Format date for display
  const formatDateForDisplay = (apiDateTime) => {
    const date = parseApiDateTime(apiDateTime);
    if (!date || isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDateTimeChange = (e) => {
    setDischargeDateTime(e.target.value);
    setDischargeError('');
  };

  const validateDischarge = () => {
    if (!dischargeDateTime) {
      setDischargeError('Please select discharge date and time');
      return false;
    }

    const selectedDateTime = parseApiDateTime(formatDateTimeForAPI(dischargeDateTime));
    const currentDateTime = new Date();
    
    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      setDischargeError('Invalid date selected');
      return false;
    }
    
    // Optional: Validate that discharge datetime is not in the future
    if (selectedDateTime > currentDateTime) {
      setDischargeError('Discharge date and time cannot be in the future');
      return false;
    }

    // Optional: Validate that discharge datetime is after admission
    if (patientData?.datetime_admission) {
      const admissionDateTime = parseApiDateTime(patientData.datetime_admission);
      if (admissionDateTime && selectedDateTime < admissionDateTime) {
        setDischargeError('Discharge date must be after admission date');
        return false;
      }
    }

    return true;
  };

  const handleConfirmDischarge = async () => {
    if (!validateDischarge()) {
      return;
    }

    if (!window.confirm('Are you sure you want to discharge this patient?')) {
      return;
    }

    setLoading(true);
    try {
      // Format datetime for API
      const formattedDateTime = formatDateTimeForAPI(dischargeDateTime);
      
      // Prepare discharge data
      const dischargeData = {
        datetime_discharge: formattedDateTime,
        is_discharge: 1
      };

      // Optional: Add status field if your API supports it
      if (patientData.hasOwnProperty('status')) {
        dischargeData.status = 'Discharged';
      }

      await updateIpd(id, dischargeData);
      
      // Update local state
      setPatientData(prev => ({
        ...prev,
        ...dischargeData,
        is_discharge: 1
      }));
      setIsAlreadyDischarged(true);
      
      alert('Patient discharged successfully!');
      
      // Optional: Navigate back or to patient list after delay
      setTimeout(() => {
        navigate('/ipd'); // Adjust the route as needed
      }, 2000);
      
    } catch (error) {
      console.error('Error discharging patient:', error);
      alert('Failed to discharge patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate length of stay
  const calculateLengthOfStay = () => {
    if (!patientData?.datetime_admission) return 'N/A';
    
    const admissionDate = parseApiDateTime(patientData.datetime_admission);
    if (!admissionDate || isNaN(admissionDate.getTime())) return 'N/A';
    
    const dischargeDate = isAlreadyDischarged 
      ? parseApiDateTime(patientData.datetime_discharge)
      : dischargeDateTime
        ? parseApiDateTime(formatDateTimeForAPI(dischargeDateTime))
        : new Date();
    
    if (!dischargeDate || isNaN(dischargeDate.getTime())) return 'N/A';
    
    const diffTime = Math.abs(dischargeDate - admissionDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let result = '';
    if (diffDays > 0) {
      result += `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    }
    if (diffHours > 0) {
      if (result) result += ', ';
      result += `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    }
    
    return result || 'Less than 1 hour';
  };

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading patient information...</p>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4 opacity-50">❌</div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Patient Not Found</h3>
        <p className="text-slate-600">The patient record could not be loaded.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5">
      {/* Header */}
      <div className="mb-8 text-center flex justify-between">
       <h2 className="text-3xl font-bold text-slate-800 mb-2">Patient Discharge</h2>
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
                Patient ID
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                {patientData?.id || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient Name
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                {patientData?.patient_name || 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Additional patient info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Admission Date
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                {formatDateForDisplay(patientData?.datetime_admission)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Status
              </label>
              <div className={`px-4 py-3 border rounded-lg font-medium text-center ${
                patientData?.is_discharge === 1 || patientData?.is_discharge === true
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {patientData?.is_discharge === 1 || patientData?.is_discharge === true
                  ? 'DISCHARGED'
                  : 'ADMITTED'}
              </div>
            </div>
          </div>
        </div>

        {/* Discharge Information */}
        {isAlreadyDischarged ? (
          <div className="mb-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-emerald-500 text-2xl">✅</div>
                <div>
                  <h4 className="text-lg font-semibold text-emerald-800 mb-2">
                    Patient Already Discharged
                  </h4>
                  <p className="text-emerald-700">
                    This patient has already been discharged from the hospital.
                  </p>
                  <div className="mt-4 p-3 bg-white border border-emerald-100 rounded">
                    <p className="text-sm font-medium text-emerald-800">Discharge Details:</p>
                    <p className="font-semibold text-emerald-900 mt-1">
                      {formatDateForDisplay(patientData?.datetime_discharge)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📝</span> Discharge Details
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Discharge Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dischargeDateTime}
                onChange={handleDateTimeChange}
                className={`w-full px-4 py-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  dischargeError ? 'border-red-300' : 'border-slate-300'
                }`}
                disabled={loading}
              />
              {dischargeError && (
                <p className="text-red-500 text-sm mt-1">{dischargeError}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Select the exact date and time when the patient was discharged
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={() => navigate(-1)}
            disabled={loading}
            className="px-5 py-1 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          {!isAlreadyDischarged && (
            <button
              onClick={handleConfirmDischarge}
              disabled={loading || !dischargeDateTime}
              className={`px-6 py-1 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                loading || !dischargeDateTime
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-sm hover:shadow-md'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="text-lg">✅</span>
                  Confirm Discharge
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Patient Stay Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Admission Date</p>
            <p className="text-xl font-bold text-blue-800">
              {formatDateForDisplay(patientData?.datetime_admission)}
            </p>
          </div>
          
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-700">
              {isAlreadyDischarged ? 'Discharge Date' : 'Planned Discharge'}
            </p>
            <p className="text-xl font-bold text-emerald-800">
              {isAlreadyDischarged 
                ? formatDateForDisplay(patientData?.datetime_discharge)
                : dischargeDateTime 
                  ? formatDateForDisplay(formatDateTimeForAPI(dischargeDateTime))
                  : 'Not set'}
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm font-medium text-purple-700">Length of Stay</p>
            <p className="text-xl font-bold text-purple-800">
              {calculateLengthOfStay()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DischargePatient;