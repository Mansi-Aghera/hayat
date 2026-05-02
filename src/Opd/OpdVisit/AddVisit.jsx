// pages/AddOpdVisit.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate,useParams } from 'react-router-dom';
import OpdVisitForm from './AddUpdateForm';
import { createOpdVisit } from '../../services/opd.services';

const AddOpdVisit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Extract opdId from query parameters
  let {id} = useParams();
  const opdId = id;

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
        opdId={opdId} // Pass opdId as prop
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default AddOpdVisit;