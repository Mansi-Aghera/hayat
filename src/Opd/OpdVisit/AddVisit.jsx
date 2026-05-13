// pages/AddOpdVisit.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate,useParams } from 'react-router-dom';
import OpdVisitForm from './AddUpdateForm';
import { createOpdVisit, getOpdById } from '../../services/opd.services';

const AddOpdVisit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingPatient, setFetchingPatient] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [prefillData, setPrefillData] = useState(null);
  
  // Extract opdId from query parameters
  let {id} = useParams();
  const opdId = id;

  useEffect(() => {
    // 🔹 If data is passed via navigation state, use it immediately to avoid "loading"
    if (location.state?.prefillData) {
      setPatientName(location.state.patientName);
      setPrefillData(location.state.prefillData);
      setFetchingPatient(false);
    } else if (opdId) {
      fetchPatientInfo();
    } else {
      setFetchingPatient(false);
    }
  }, [opdId, location.state]);

  const fetchPatientInfo = async () => {
    try {
      setFetchingPatient(true);
      const res = await getOpdById(opdId);
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      setPatientName(data?.patient_name || "");
      
      // Extract data for pre-filling
      setPrefillData({
        opd_data: parseInt(opdId),
        diagnosis_detail: data.diagnosis_detail || [],
        past_history: data.past_history || [],
        given_medicine: data.given_medicine || [],
      });
    } catch (error) {
      console.error('Error fetching patient info:', error);
    } finally {
      setFetchingPatient(false);
    }
  };

  if (fetchingPatient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      // If opdId is available from URL, use it
      if (opdId) {
        formData.opd_data = parseInt(opdId);
      }
      
      await createOpdVisit(formData);
      alert('Visit created successfully!');
      // Navigate back to OPD visit page
      navigate(`/opd-visit/${opdId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <OpdVisitForm
        opdId={opdId} 
        patientName={patientName}
        initialData={prefillData}
        isEdit={false}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default AddOpdVisit;