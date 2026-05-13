// pages/EditOpdVisit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OpdVisitForm from './AddUpdateForm';
import { opdVisitByVisitId, updateOpdVisit, deleteOpdVisit } from '../../services/opd.services';

const EditOpdVisit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchVisitData();
  }, [id]);

  const fetchVisitData = async () => {
    try {
      setFetching(true);
      const response = await opdVisitByVisitId(id);
      console.log('Fetched visit data:', response);
      if (response.status === 'success' && response.data) {
        setInitialData(response.data);
      } else {
        alert('Visit not found');
        navigate('/opd/visits');
      }
    } catch (error) {
      console.error('Error fetching visit:', error);
      alert('Error loading visit data');
      navigate('/opd/visits');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const response = await updateOpdVisit(id, formData);
      console.log(response)
      if (response.status === 'success') {
        alert('Visit updated successfully!');
        // Optionally refresh the data
        fetchVisitData();
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      alert(error.message || 'Failed to update visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (visitId) => {
    try {
      setDeleteLoading(true);
      const response = await deleteOpdVisit(visitId);
      if (response.status === 'success') {
        alert('Visit deleted successfully!');
        navigate(`/opd-visit/${initialData.opd_data}`); // Navigate back to OPD visit page
      }
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert(error.message || 'Failed to delete visit. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Visit not found</h3>
          <button
            onClick={() => navigate('/opd/visits')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Visits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <OpdVisitForm
        initialData={initialData}
        isEdit={true}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        loading={loading}
        deleteLoading={deleteLoading}
      />
    </div>
  );
};

export default EditOpdVisit;