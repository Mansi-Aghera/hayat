// DischargeForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Import child components
import DischargeConditionSection from './DischargeConditionSection';
import DiagnosisSection from './DiagnosisSection';
import ClinicalNotesSection from './ClinicalNotesSection';
import TreatmentChartSection from './TreatmentChartSection';
import RxSection from './RxSection';
import AdviceSection from './AdviceSection';
import NotesSection from './NoteSection';
import AdditionalFieldsSection from './AdditionalFieldsSection';

// Import services
import { useDischargeForm } from './useDischargeForm';
import { createDischargeIpd, getDischargeByIpdId, updateDischargeIpd } from '../../services/ipd.services';
import { getBeds } from '../../services/bed.services';
import { getDoctors } from '../../services/doctor.services';

const DischargeForm = () => {
  const { ipdId, dischargeId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [beds, setBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isIpdMode, setIsIpdMode] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/edit/')) {
      setIsEditMode(true);
      setIsIpdMode(false);
    } else if (path.includes('/ipd/')) {
      setIsIpdMode(true);
      setIsEditMode(false);
    } else {
      // New discharge
      setIsIpdMode(false);
      setIsEditMode(false);
    }
  }, [location]);
  
  // Use custom hook for form state and handlers
  const {
    formData,
    setFormData,
    opinions,
    diagnoses,
    medicines,
    ipdLoading,
    handlers
  } = useDischargeForm(ipdId, dischargeId, !!dischargeId);

  // Fetch beds and doctors on component mount
  useEffect(() => {
    fetchBeds();
    fetchDoctors();
    checkEditMode();
  }, []);

  const checkEditMode = () => {
    if (dischargeId) {
      setIsEditMode(true);
      fetchDischargeData(dischargeId);
    }
  };

  const fetchDischargeData = async (id) => {
    try {
      setFetchLoading(true);
      const response = await getDischargeByIpdId(id);
      const data = response.data || response;
      
      console.log('Fetched discharge data:', data);
      
      // Format dates for datetime-local inputs
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const [date, time] = dateString.split(' ');
        return `${date}T${time.substring(0, 5)}`;
      }; 
      setFormData({
        ...formData,
        ...data,
        datetime_admission: formatDateForInput(data.datetime_admission) || getCurrentDateTimeLocal(),
        date: formatDateForInput(data.date) || getCurrentDateTimeLocal(),
        sr_no: data.sr_no || '',
        bed_data: data.bed_data?.id || null,
        doctor_data: data.doctor_data?.id || null,
        staff_data: data.staff_data?.id || null,
        patient_name: data.patient_name || '',
        age: data.age || '',
        gender: data.gender || '',
        address: data.address || '',
        mobile: data.mobile || '',
        diagnosis: data.diagnosis?.map(d => ({ diagnosis_data: d.id })) || [],
        clinical_notes: data.clinical_notes?.map(c => ({ opinion_data: c.id })) || [],
        adviced: data.adviced?.map(a => ({ 
          opinion_details_data: a.opinion_details_data?.id || a.opinion_details_data 
        })) || [],
        // FIX: Extract just the IDs from opinion_details_data objects
        Note: data.Note?.map(n => ({ 
          opinion_details_data: n.opinion_details_data?.id || n.opinion_details_data 
        })) || [],
        treatment_chart: data.treatment_chart?.map(t => ({
          medicine_data: t.medicine_data?.id || t.medicine_data,
          dosage: t.dosage,
          date_time: t.date_time,
          status: t.status,
          quantity: t.quantity
        })) || [],
        Rx: data.Rx?.map(r => ({
          medicine_data: r.medicine_data?.id || r.medicine_data,
          doses: r.doses,
          intake_type: r.intake_type,
          quantity: r.quantity
        })) || []
      });
    } catch (error) {
      console.error('Error fetching discharge data:', error);
      toast.error('Failed to fetch discharge data');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchBeds = async () => {
    try {
      const response = await getBeds();
      const bedsData = response.data || response;
      setBeds(Array.isArray(bedsData) ? bedsData : []);
    } catch (error) {
      console.error('Error fetching beds:', error);
      toast.error('Failed to fetch beds');
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await getDoctors();
      const doctorsData = response.data || response;
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctors');
    }
  };

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateForAPI = (datetimeLocal, includeSeconds = false) => {
    if (!datetimeLocal) return null;
    const [date, time] = datetimeLocal.split('T');
    if (includeSeconds) {
      return `${date} ${time}:00`;
    }
    return `${date} ${time}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBedChange = (e) => {
    const bedId = parseInt(e.target.value);
    const selectedBed = beds.find(bed => bed.id === bedId);
    setFormData(prev => ({
      ...prev,
      bed_data: selectedBed.id || null
    }));
  };

  const handleDoctorChange = (e) => {
    const doctorId = parseInt(e.target.value);
    const selectedDoctor = doctors.find(doc => doc.id === doctorId);
    setFormData(prev => ({
      ...prev,
      doctor_data: selectedDoctor.id || null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.patient_name || !formData.age || !formData.gender || !formData.mobile || !formData.address || !formData.bed_data || !formData.doctor_data) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      // Prepare payload
      const payload = {
        ...formData,
        ipd_data: ipdId ? parseInt(ipdId) : null,
        datetime_admission: formatDateForAPI(formData.datetime_admission, false),
        date: formatDateForAPI(formData.date, true),
        sr_no: formData.sr_no || '',
        investigation: formData.investigation || null,
        dd_note: formData.dd_note || null,
        age: parseInt(formData.age),
        mobile: formData.mobile.toString(),
        // Ensure these are properly formatted
        diagnosis: formData.diagnosis.map(d => ({ diagnosis_data: d.diagnosis_data })),
        clinical_notes: formData.clinical_notes.map(c => ({ opinion_data: c.opinion_data })),
        adviced: formData.adviced.map(a => ({ opinion_details_data: a.opinion_details_data })),
        Note: formData.Note.map(n => ({ opinion_details_data: n.opinion_details_data })),
        treatment_chart: formData.treatment_chart.map(t => ({
          medicine_data: t.medicine_data,
          dosage: t.dosage,
          date_time: t.date_time,
          status: t.status || "",
          quantity: t.quantity || ""
        })),
        Rx: formData.Rx.map(r => ({
          medicine_data: r.medicine_data,
          doses: r.doses,
          intake_type: r.intake_type || "After Meal",
          quantity: r.quantity || "2"
        }))
      };

      // Remove any undefined or null values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      console.log('Submitting payload:', payload);

      let res;
      if (isEditMode) {
        res = await updateDischargeIpd(dischargeId, payload);
        toast.success('Discharge certificate updated successfully!');
      } else {
        res = await createDischargeIpd(payload);
        toast.success('Patient discharged successfully!');
      }
      
      console.log('Response:', res);
      
      setTimeout(() => {
        navigate(`/discharge-ipd`);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving discharge:', error);
      toast.error(error.response?.data?.message || 'Failed to save discharge');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (fetchLoading || ipdLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {ipdLoading ? 'Loading IPD patient data...' : 'Loading discharge data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Discharge Certificate' : ipdId ? 'Discharge IPD Patient' : 'New Discharge Certificate'}
            </h2>
            {ipdId && !isEditMode && (
              <p className="text-sm text-green-600 mt-1">
                ✨ Patient data auto-filled from IPD record
              </p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Main Form Section - All fields in one grid */}
          <div className="bg-gray-50 p-4 rounded-xl mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Patient & Admission Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Patient Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Patient Name *</label>
                <input
                  type="text"
                  name="patient_name"
                  value={formData.patient_name || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter patient name"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="150"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter age"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mobile *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile || ''}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10 digit mobile"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>

              {/* Bed Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bed *</label>
                <select
                  value={formData.bed_data || ''}
                  onChange={handleBedChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Bed</option>
                  {beds
                    .map(bed => (
                      <option key={bed.id} value={bed.id}>
                        {bed.name} - {bed.bed_number} ({bed.status})
                      </option>
                    ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Doctor *</label>
                <select
                  value={formData.doctor_data || ''}
                  onChange={handleDoctorChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.doctor_name} {doctor.specialization_id ? `- ${doctor.specialization_id.specialization_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admission Date/Time */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Admission Date *</label>
                <input
                  type="datetime-local"
                  name="datetime_admission"
                  value={formData.datetime_admission || ""}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Discharge Date/Time */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discharge Date *</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date || getCurrentDateTimeLocal()}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* SR No. (optional) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SR No.</label>
                <input
                  type="text"
                  name="sr_no"
                  value={formData.sr_no || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter SR number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Type Of Discharge
                </label>

                <select
                  name="type_of_discharge"
                  value={formData.type_of_discharge || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select discharge type
                  </option>
                  <option value="Discharge">Discharge</option>
                  <option value="Discharge on Request">Discharge on Request</option>
                  <option value="LAMA">LAMA(left again medical advice)</option>
                  <option value="Refer">Refer</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Other Sections */}
          <div className="space-y-4">
            <DischargeConditionSection 
              formData={formData}
              setFormData={setFormData}
            />
            
            <DiagnosisSection 
              diagnosisInput={handlers.diagnosisInput}
              setDiagnosisInput={handlers.setDiagnosisInput}
              diagnoses={diagnoses}
              formData={formData}
              handleAddDiagnosis={handlers.handleAddDiagnosis}
              handleRemoveItem={handlers.handleRemoveItem}
            />
            
            <ClinicalNotesSection 
              clinicalNoteInput={handlers.clinicalNoteInput}
              setClinicalNoteInput={handlers.setClinicalNoteInput}
              opinions={opinions}
              formData={formData}
              handleAddClinicalNote={handlers.handleAddClinicalNote}
              handleRemoveItem={handlers.handleRemoveItem}
            />
            
            <TreatmentChartSection 
              treatmentForm={handlers.treatmentForm}
              handleTreatmentChange={handlers.handleTreatmentChange}
              medicines={medicines}
              formData={formData}
              handleAddTreatment={handlers.handleAddTreatment}
              handleRemoveItem={handlers.handleRemoveItem}
            />
            
            <RxSection 
              rxForm={handlers.rxForm}
              handleRxChange={handlers.handleRxChange}
              medicines={medicines}
              formData={formData}
              handleAddRx={handlers.handleAddRx}
              handleRemoveItem={handlers.handleRemoveItem}
            />
            
            <AdviceSection 
              adviceInput={handlers.adviceInput}
              setAdviceInput={handlers.setAdviceInput}
              opinions={opinions}
              formData={formData}
              handleAddAdvice={handlers.handleAddAdvice}
              handleRemoveItem={handlers.handleRemoveItem}
            />
            
            <NotesSection 
              noteInput={handlers.noteInput}
              setNoteInput={handlers.setNoteInput}
              opinions={opinions}
              formData={formData}
              handleAddNote={handlers.handleAddNote}
              handleRemoveItem={handlers.handleRemoveItem}
            />
            
            <AdditionalFieldsSection 
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                isEditMode ? 'Update Discharge' : 'Discharge Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DischargeForm;