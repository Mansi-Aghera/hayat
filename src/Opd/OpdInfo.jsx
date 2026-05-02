import React, { useEffect, useState, useMemo, Fragment } from "react";
import { ChevronUp, ChevronDown, Edit2, X, Check, Search, Calendar, Activity, Plus, Phone } from "lucide-react";
import { getOpdById, updateOpd, opdVisitById } from "../services/opd.services";
import { getServices, createService } from "../services/service.services";
import { getDoctors } from "../services/doctor.services";

export default function OpdInfoUpdate({ id, navigate }) {
  const [opd, setOpd] = useState({
    service_id: [],
    doctor_data: {},
    sr_no: "",
    patient_name: "",
    age: "",
    mobile_no: "",
    gender: "",
    address: "",
    payment_mode: "",
    prescription: "",
    date: "",
    total_amount: "",
    is_received: 0,
  });

  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [visitHistory, setVisitHistory] = useState([]);
  const [visitCount, setVisitCount] = useState(0);

  // EDIT FORM STATE
  const [editForm, setEditForm] = useState({
    service_id: [],
    doctor_id: null,
    sr_no: "",
    patient_name: "",
    age: "",
    mobile_no: "",
    gender: "",
    address: "",
    payment_mode: "",
    prescription: "",
    total_amount: "",
    is_received: 0,
    newServiceName: "",
    newServiceCharge: "",
  });

  // SERVICES SEARCH STATE
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);

  // GENDER OPTIONS
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  // PAYMENT MODE OPTIONS
  const paymentModeOptions = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "cheque", label: "Cheque" },
    { value: "insurance", label: "Insurance" },
    { value: "other", label: "Other" },
  ];

  // RECEIVED STATUS OPTIONS
  const receivedOptions = [
    { value: 0, label: "Not Received" },
    { value: 1, label: "Received" },
  ];

  useEffect(() => {
    fetchOpd();
    fetchServices();
    fetchDoctors();
  }, [id]);

  // 🔹 FILTERED SERVICES FOR SUGGESTIONS
  const filteredServices = useMemo(() => {
    if (!editForm.newServiceName.trim()) return [];

    const searchTerm = editForm.newServiceName.toLowerCase();
    return services.filter(service =>
      service.service_name?.toLowerCase().includes(searchTerm)
    );
  }, [services, editForm.newServiceName]);

  // 🔹 GET SELECTED SERVICES DETAILS
  const getSelectedServices = () => {
    return services.filter(service => editForm.service_id.includes(service.id));
  };

  // 🔹 FETCH OPD DETAILS
  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const opdData = Array.isArray(res.data) ? res.data[0] : res.data;

      setOpd({
        service_id: opdData.service_id || [],
        doctor_data: opdData.doctor_data || {},
        sr_no: opdData.sr_no || "",
        patient_name: opdData.patient_name || "",
        age: opdData.age || "",
        mobile_no: opdData.mobile_no || "",
        gender: opdData.gender || "",
        address: opdData.address || "",
        payment_mode: opdData.payment_mode || "",
        prescription: opdData.prescription || "",
        date: opdData.date || "",
        total_amount: opdData.total_amount || "",
        is_received: opdData.is_received || 0,
        vitals: opdData.vitals || {},
        nextVisit: opdData.nextVisit || [],
      });

      // Also fetch visit history for count and specific status
      const visitRes = await opdVisitById(id);
      if (visitRes.status === 'success' && visitRes.data) {
        setVisitHistory(visitRes.data);
        setVisitCount(visitRes.data.length);
      }
    } catch (error) {
      console.error("Error fetching OPD:", error);
    }
  };

  // 🔹 FETCH SERVICES
  const fetchServices = async () => {
    try {
      const res = await getServices();
      setServices(res.data || res.results || res || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  // 🔹 FETCH DOCTORS
  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res.data || res.results || res || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // 🔹 START EDIT
  const startEdit = () => {
    setEditMode(true);
    setEditForm({
      service_id: opd.service_id.map(s => s.id),
      doctor_id: opd.doctor_data?.id || null,
      sr_no: opd.sr_no,
      patient_name: opd.patient_name,
      age: opd.age,
      mobile_no: opd.mobile_no,
      gender: opd.gender,
      address: opd.address,
      payment_mode: opd.payment_mode,
      prescription: opd.prescription,
      total_amount: opd.total_amount,
      is_received: opd.is_received,
      newServiceName: "",
      newServiceCharge: "",
    });
  };

  // 🔹 CANCEL EDIT
  const cancelEdit = () => {
    setEditMode(false);
    setEditForm({
      service_id: [],
      doctor_id: null,
      sr_no: "",
      patient_name: "",
      age: "",
      mobile_no: "",
      gender: "",
      address: "",
      payment_mode: "",
      prescription: "",
      total_amount: "",
      is_received: 0,
      newServiceName: "",
      newServiceCharge: "",
    });
    setShowServiceSuggestions(false);
  };

  // 🔹 HANDLE INPUT CHANGE
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 🔹 HANDLE SERVICE NAME CHANGE
  const handleServiceNameChange = (e) => {
    const value = e.target.value;
    handleInputChange("newServiceName", value);
    if (value.trim()) {
      setShowServiceSuggestions(true);
    } else {
      setShowServiceSuggestions(false);
    }
  };

  // 🔹 SELECT SERVICE FROM SUGGESTIONS
  const handleServiceSelect = (service) => {
    setEditForm(prev => ({
      ...prev,
      newServiceName: service.service_name,
      newServiceCharge: service.service_price.toString(),
    }));
    setShowServiceSuggestions(false);
  };

  // 🔹 ADD NEW SERVICE
  const handleAddService = async () => {
    if (!editForm.newServiceName.trim() || !editForm.newServiceCharge) {
      alert("Please enter both service name and price");
      return;
    }

    try {
      // Check if service already exists
      const existingService = services.find(s =>
        s.service_name.toLowerCase() === editForm.newServiceName.trim().toLowerCase()
      );

      let serviceId;
      let servicePrice = parseFloat(editForm.newServiceCharge);

      if (existingService) {
        // Use existing service
        serviceId = existingService.id;
        servicePrice = parseFloat(existingService.service_price);
      } else {
        // Create new service
        const response = await createService({
          service_name: editForm.newServiceName.trim(),
          service_price: servicePrice,
        });
        const newService = response.data || response;
        serviceId = newService.id;

        // Add to services list
        setServices(prev => [newService, ...prev]);
      }

      // Check if service is already added
      if (editForm.service_id.includes(serviceId)) {
        alert("This service is already added");
        return;
      }

      // Add to selected services
      setEditForm(prev => ({
        ...prev,
        service_id: [...prev.service_id, serviceId],
        total_amount: (parseFloat(prev.total_amount || 0) + servicePrice).toString(),
        newServiceName: "",
        newServiceCharge: "",
      }));

      setShowServiceSuggestions(false);

    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service");
    }
  };

  // 🔹 REMOVE SELECTED SERVICE
  const removeSelectedService = (serviceId) => {
    const serviceToRemove = services.find(s => s.id === serviceId);
    if (serviceToRemove) {
      setEditForm(prev => ({
        ...prev,
        service_id: prev.service_id.filter(id => id !== serviceId),
        total_amount: (parseFloat(prev.total_amount || 0) - parseFloat(serviceToRemove.service_price || 0)).toString()
      }));
    }
  };

  // 🔹 UPDATE OPD INFO
  const handleUpdate = async () => {
    if (editForm.service_id.length === 0) {
      alert("Please add at least one service");
      return;
    }

    try {
      setLoading(true);

      // Prepare payload
      const payload = {
        service_id: editForm.service_id,
        doctor_data: editForm.doctor_id,
        sr_no: editForm.sr_no,
        patient_name: editForm.patient_name,
        age: editForm.age,
        mobile_no: editForm.mobile_no,
        gender: editForm.gender,
        address: editForm.address,
        payment_mode: editForm.payment_mode,
        total_amount: editForm.total_amount,
        is_received: editForm.is_received,
      };

      // Only add prescription if it has value
      if (editForm.prescription?.trim()) {
        payload.prescription = editForm.prescription;
      }

      // Update OPD
      await updateOpd(id, payload);

      // Refresh data
      await fetchOpd();
      window.dispatchEvent(new Event('opd_info_updated'));
      setEditMode(false);

      alert("OPD information updated successfully!");

    } catch (error) {
      console.error("Error updating OPD info:", error);
      alert("Failed to update information");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
  
    <div className="max-w-full overflow-x-hidden pt-0 pb-2">
      {/* SLIM STICKY HEADER - Fully Responsive */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        
        {/* Left Section: Patient Primary Info */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-bold text-gray-900 truncate leading-none">
              {opd.patient_name || 'Unknown'}
              <span className="text-gray-500 font-medium ml-1.5 text-sm uppercase">
                ({opd.age || 'N/A'} Y, {opd.gender || 'N/A'})
              </span>
            </h1>
          </div>
        </div>

        {/* Middle Section: Metadata (ID, SR, Phone, Visit, Doctor) */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[13px] font-medium text-gray-500 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-tighter">ID</span>
            <span className="text-gray-800 font-bold">{id}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-tighter">SR</span>
            <span className="text-gray-800 font-bold">{opd.sr_no || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            <span className="text-blue-400 font-bold text-[9px] uppercase tracking-tighter">Visit</span>
            <span className="text-blue-700 font-bold">{visitCount}{visitCount === 1 ? 'st' : visitCount === 2 ? 'nd' : visitCount === 3 ? 'rd' : 'th'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 font-bold text-[10px] uppercase">Phone</span>
            <span className="text-gray-800 font-semibold">{opd.mobile_no || 'N/A'}</span>
          </div>
          {opd.doctor_data?.doctor_name && (
            <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
              <span className="text-gray-400 font-bold text-[10px] uppercase">Doctor</span>
              <span className="text-blue-600 font-bold truncate max-w-[120px]" title={opd.doctor_data.doctor_name}>
                {opd.doctor_data.doctor_name.toLowerCase().startsWith('dr') ? opd.doctor_data.doctor_name : `Dr ${opd.doctor_data.doctor_name}`}
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Page Actions */}
        <div className="flex items-center justify-end w-full md:w-auto gap-2 border-t md:border-t-0 pt-2 md:pt-0">
          {!editMode ? (
            <>
              <button
                onClick={startEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded font-bold text-xs transition-all uppercase flex items-center gap-1.5 shadow-sm"
              >
                <Edit2 size={13} />
                Edit
              </button>
              <button
                onClick={() => navigate && navigate(-1)}
                className="bg-white hover:bg-gray-50 border border-gray-300 px-5 py-1.5 rounded text-gray-600 font-bold text-xs transition-all uppercase shadow-sm"
              >
                Back
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(false)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-1.5 rounded font-bold text-xs transition-all uppercase shadow-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE CONTENT */}
      {editMode && (
        <div className="mt-3 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Edit Patient & Service Information</h3>
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full px-3">Update Mode</span>
          </div>

          <div className="divide-y divide-gray-100">
            {/* 1. Doctor Selection Section */}
            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight mb-3">
                Primary Doctor
              </label>
              <select
                value={editForm.doctor_id || ""}
                onChange={(e) => handleInputChange("doctor_id", e.target.value)}
                className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.doctor_name} -{" "}
                    {doctor.specialization_id?.specialization_name || "General"}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Patient Information Section */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-tight mb-4">
                Patient Demographics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.patient_name}
                    onChange={(e) =>
                      handleInputChange("patient_name", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">
                    Age
                  </label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">
                    Gender
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.mobile_no}
                    onChange={(e) =>
                      handleInputChange("mobile_no", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Mobile number"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">
                    Residential Address
                  </label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>

            {/* End of Demographics Section */}

            {/* Final Actions Area */}
            <div className="p-6 bg-gray-50/80 flex justify-end gap-3 border-t border-gray-100">
              <button
                onClick={cancelEdit}
                className="px-6 py-2 rounded-lg border-2 border-gray-200 hover:bg-white hover:border-gray-300 flex items-center gap-2 font-bold text-gray-500 transition-all"
              >
                <X size={18} /> Discard Changes
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading || editForm.service_id.length === 0}
                className="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-bold transition-all shadow-md active:scale-95"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Check size={18} />
                )}
                {loading ? "Optimizing Database..." : "Save Encouter Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}