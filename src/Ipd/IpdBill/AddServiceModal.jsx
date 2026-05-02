import React, { useState, useEffect } from 'react';
import { calculateServiceTotal } from './serviceUtils';

const AddServiceModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading,
  hospitalServices = [],
  editMode = false,
  editData = null,
  onCreateNewService
}) => {
  const [formData, setFormData] = useState({
    hospital_service_data: '',
    service_name: '',
    fees: '',
    quantity: '1'
  });
  
  const [showNewService, setShowNewService] = useState(false);
  const [filteredServices, setFilteredServices] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (editMode && editData) {
        // In edit mode, populate form with existing data
        setFormData({
          hospital_service_data: editData.hospital_service_data?.id || '',
          service_name: editData.hospital_service_data?.name || '',
          fees: editData.fees || '',
          quantity: editData.quantity || '1'
        });
        setShowNewService(false);
      } else {
        // Reset form for add mode
        setFormData({
          hospital_service_data: '',
          service_name: '',
          fees: '',
          quantity: '1'
        });
        setShowNewService(false);
      }
    }
  }, [isOpen, editMode, editData]);

  useEffect(() => {
    if (formData.service_name) {
      const filtered = hospitalServices.filter(service =>
        service.name.toLowerCase().includes(formData.service_name.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices([]);
    }
  }, [formData.service_name, hospitalServices]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Auto-calculate total when fees or quantity changes
      if (name === 'fees' || name === 'quantity') {
        const total = calculateServiceTotal(
          name === 'fees' ? value : prev.fees,
          name === 'quantity' ? value : prev.quantity
        );
        newData.total = total;
      }
      
      return newData;
    });
  };

  const handleServiceSelect = (service) => {
    setFormData(prev => ({
      ...prev,
      hospital_service_data: service.id,
      service_name: service.name,
      fees: '',
      showNewService: false
    }));
    setFilteredServices([]);
  };

  const handleSubmit = () => {
    if (!formData.service_name) {
      alert('Service name is required');
      return;
    }

    if (!formData.fees || parseFloat(formData.fees) <= 0) {
      alert('Valid fees amount is required');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      alert('Valid quantity is required');
      return;
    }

    const total = calculateServiceTotal(formData.fees, formData.quantity);
    
    const serviceData = {
      fees: parseFloat(formData.fees),
      quantity: formData.quantity.toString(),
      total: total
    };

    // If we have an existing service ID, use it
    if (formData.hospital_service_data) {
      serviceData.hospital_service_data = {
        id: formData.hospital_service_data,
        name: formData.service_name
      };
    } else {
      // New service, will be created
      serviceData.service_name = formData.service_name;
    }

    onSubmit(serviceData);
  };

  const handleCreateNewService = async () => {
    if (!formData.service_name) {
      alert('Please enter a service name');
      return;
    }

    try {
      const newService = await onCreateNewService({
        name: formData.service_name
      });
      
      if (newService) {
        setFormData(prev => ({
          ...prev,
          hospital_service_data: newService.id,
          service_name: newService.name
        }));
        setShowNewService(false);
        alert('New service created successfully!');
      }
    } catch (error) {
      alert('Failed to create new service');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {editMode ? 'Edit Service' : 'Add New Service'}
        </h3>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Service Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="service_name"
                value={formData.service_name}
                onChange={handleChange}
                placeholder="Type service name or select from list..."
                required
                className="w-full px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoComplete="off"
              />
              
              {filteredServices.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="px-4 py-1 hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="font-medium text-slate-800">{service.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {!formData.hospital_service_data && formData.service_name && (
              <button
                type="button"
                onClick={handleCreateNewService}
                className="mt-2 px-3 py-1 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors"
              >
                + Create new service: "{formData.service_name}"
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Fees (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleChange}
                min="1"
                step="1"
                required
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter fees"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                step="1"
                required
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter quantity"
              />
            </div>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-sm text-slate-600 mb-1">Total:</div>
            <div className="text-lg font-bold text-emerald-600">
              ₹{calculateServiceTotal(formData.fees, formData.quantity).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : (editMode ? 'Update Service' : 'Add Service')}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;