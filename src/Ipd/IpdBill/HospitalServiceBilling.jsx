import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  updateIpd,
  getIpdById,
  hospitalServices,
  createHospitalServices
} from '../../services/ipd.services';
import IpdPatientInfo from '../IpdCommonInfo';
import ServiceList from './ServiceList';
import AddServiceModal from './AddServiceModal';
import BillingSummary from './BillingSummary';
import PDFGenerator from './BillPdfGenerate';
import { calculateTotals } from './serviceUtils';

const HospitalServiceBilling = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [billingData, setBillingData] = useState(null);
  const [patientData, setPatientData] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [hospitalServicesList, setHospitalServicesList] = useState([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editServiceIndex, setEditServiceIndex] = useState(null);
  const [editServiceData, setEditServiceData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchBillingData();
      fetchHospitalServices();
    }
  }, [id]);

  const fetchBillingData = async () => {
    setFetchLoading(true);
    try {
      const response = await getIpdById(id);
      console.log('Billing data from API:', response.data);
      
      // Extract patient data from response
      if (response.data) {
        setPatientData({
          patient_name: response.data.patient_name || 'Not Available',
          mobile: response.data.mobile || 'Not Available',
          address: response.data.address || 'Not Available',
          admission_date: response.data.datetime_admission || 'Not Available',
          bed_number: `${response.data.bed_data.name}-${response.data.bed_data.bed_number}` || 'Not Available',
          discharge_date: response.data.datetime_discharge || 'Pending'
        });
        
        if (response.data.hospital_service_data) {
          setBillingData(response.data.hospital_service_data);
        } else {
          // Initialize empty billing data
          setBillingData({
            gross_total: 0,
            advanced_paid: 0,
            discount_total: 0,
            net_total: 0,
            balance: 0,
            bill_type: 'Provisional Bill',
            total_paid: 0,
            total_due: 0,
            is_settled: false,
            is_receive: 0,
            services: []
          });
        }
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      alert('Failed to fetch billing data');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchHospitalServices = async () => {
    try {
      const response = await hospitalServices();
      const servicesList = Array.isArray(response) ? response : [];
      setHospitalServicesList(servicesList);
    } catch (error) {
      console.error('Error fetching hospital services:', error);
      alert('Failed to fetch hospital services');
    }
  };

  const createNewService = async (serviceData) => {
    try {
      const payload = {
        name: serviceData.name
      };
      
      const response = await createHospitalServices(payload);
      console.log('New service created:', response);
      
      // Add new service to the list
      const newService = response;
      setHospitalServicesList(prev => [...prev, newService]);
      
      return newService;
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Failed to create new service');
      throw error;
    }
  };

  const updateBillingData = async (updatedData) => {
    setLoading(true);
    try {
      // Calculate totals based on current services and updated discounts/advance
      const currentServices = billingData.services || [];
      const { netTotal, totalDue } = calculateTotals(
        currentServices,
        updatedData.discount_total || billingData.discount_total,
        updatedData.advanced_paid || billingData.advanced_paid
      );
      
      const grossTotal = currentServices.reduce((sum, service) => 
        sum + (parseFloat(service.total) || 0), 0
      );
      
      const finalBillingData = {
        ...billingData,
        ...updatedData,
        gross_total: grossTotal,
        net_total: netTotal,
        total_due: totalDue,
        balance: totalDue,
        total_paid: updatedData.advanced_paid || billingData.advanced_paid,
        is_settled: false,
        is_receive: 0
      };
      
      console.log('Updating billing data:', finalBillingData);
      
      const payload = {
        hospital_service_data: finalBillingData
      };
      
      const response = await updateIpd(id, payload);
      console.log('Update response:', response);
      
      setBillingData(finalBillingData);
      alert('Billing data updated successfully!');
      
    } catch (error) {
      console.error('Error updating billing data:', error);
      alert('Failed to update billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (serviceData) => {
    setLoading(true);
    try {
      let serviceToAdd = serviceData;
      
      // If it's a new service (no ID), create it first
      if (!serviceData.hospital_service_data && serviceData.service_name) {
        const newService = await createNewService({
          name: serviceData.service_name
        });
        
        serviceToAdd = {
          ...serviceData,
          hospital_service_data: {
            id: newService.id,
            name: newService.name
          }
        };
        delete serviceToAdd.service_name;
      }
      
      const updatedServices = editServiceIndex !== null
        ? billingData.services.map((service, index) => 
            index === editServiceIndex ? serviceToAdd : service
          )
        : [...(billingData.services || []), serviceToAdd];
      
      // Calculate new totals
      const { grossTotal, netTotal, totalDue } = calculateTotals(
        updatedServices,
        billingData.discount_total,
        billingData.advanced_paid
      );
      
      const updatedBillingData = {
        ...billingData,
        gross_total: grossTotal,
        net_total: netTotal,
        total_due: totalDue,
        balance: totalDue,
        services: updatedServices
      };
      
      // Update via API
      const payload = {
        hospital_service_data: updatedBillingData
      };
      
      const response = await updateIpd(id, payload);
      console.log('Service update response:', response);
      
      setBillingData(updatedBillingData);
      setShowAddServiceModal(false);
      setEditServiceIndex(null);
      setEditServiceData(null);
      
      alert(editServiceIndex !== null ? 'Service updated successfully!' : 'Service added successfully!');
      
    } catch (error) {
      console.error('Error adding/updating service:', error);
      alert('Failed to add/update service');
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (index, service) => {
    setEditServiceIndex(index);
    setEditServiceData(service);
    setShowAddServiceModal(true);
  };

  const handleDeleteService = async (index) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    setLoading(true);
    try {
      const updatedServices = billingData.services.filter((_, i) => i !== index);
      
      // Calculate new totals
      const { grossTotal, netTotal, totalDue } = calculateTotals(
        updatedServices,
        billingData.discount_total,
        billingData.advanced_paid
      );
      
      const updatedBillingData = {
        ...billingData,
        gross_total: grossTotal,
        net_total: netTotal,
        total_due: totalDue,
        balance: totalDue,
        services: updatedServices
      };
      
      // Update via API
      const payload = {
        hospital_service_data: updatedBillingData
      };
      
      const response = await updateIpd(id, payload);
      console.log('Delete service response:', response);
      
      setBillingData(updatedBillingData);
      alert('Service deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading billing data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-5 bg-slate-50 min-h-screen">
      {/* Header with PDF Generator */}
      <div className="mb-8 text-center flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Hospital Service Billing</h2>
        <div className="flex gap-3">
          {billingData && (
            <PDFGenerator
              billingData={billingData}
              patientInfo={patientData}
              ipdId={id}
              services={billingData?.services || []}
            />
          )}
          <button 
            className="border rounded-3xl px-4 py-1 hover:bg-slate-100 transition"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
      
      <IpdPatientInfo ipdId={id} />

      {/* Service Management */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Service Management</h3>
          <button
            onClick={() => {
              setEditServiceIndex(null);
              setEditServiceData(null);
              setShowAddServiceModal(true);
            }}
            className="px-4 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            + Add Service
          </button>
        </div>
        
        <ServiceList
          services={billingData?.services || []}
          onEditService={handleEditService}
          onDeleteService={handleDeleteService}
          loading={loading}
        />
      </div>

      {/* Billing Summary */}
      {billingData && (
        <BillingSummary
          billingData={billingData}
          onUpdate={updateBillingData}
          loading={loading}
        />
      )}

      {/* Add/Edit Service Modal */}
      <AddServiceModal
        isOpen={showAddServiceModal}
        onClose={() => {
          setShowAddServiceModal(false);
          setEditServiceIndex(null);
          setEditServiceData(null);
        }}
        onSubmit={handleAddService}
        loading={loading}
        hospitalServices={hospitalServicesList}
        editMode={editServiceIndex !== null}
        editData={editServiceData}
        onCreateNewService={createNewService}
      />
    </div>
  );
};

export default HospitalServiceBilling;