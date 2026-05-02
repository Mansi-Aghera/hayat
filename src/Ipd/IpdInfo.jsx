import { useEffect, useState, useMemo } from "react";
import { Edit2, X, Check, Plus, Search, Phone } from "lucide-react";
import { getIpdById, updateIpd } from "../services/ipd.services";
import { getBeds, updateBed } from "../services/bed.services";
import { getServices, createService } from "../services/service.services";
import { getDoctors } from "../services/doctor.services";

export default function IpdInfoUpdate({ id, navigate }) {
  const [ipd, setIpd] = useState({
    bed_data: {},
    service_id: [],
    doctor_data: {},
    sr_no: "",
    patient_name: "",
    age: "",
    mobile: "",
    gender: "",
    address: "",
    referred_by: "",
    datetime_admission: "",
    is_discharge: 0,
  });
  
  const [beds, setBeds] = useState([]);
  const [allServices, setAllServices] = useState([]); // All services from API
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);


  // EDIT FORM STATE
  const [editForm, setEditForm] = useState({
    bed_id: null,
    service_id: [],
    doctor_id: null,
    sr_no: "",
    patient_name: "",
    age: "",
    mobile: "",
    gender: "",
    address: "",
    referred_by: "",
  });

  // SERVICES SEARCH STATE
  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    service_name: "",
    service_price: "",
  });
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);

  // GENDER OPTIONS
  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  useEffect(() => {
    fetchIpd();
    fetchServices();
    fetchDoctors();
    fetchBeds();
  }, [id]);

  // 🔹 FETCH IPD DETAILS
  const fetchIpd = async () => {
    try {
      const res = await getIpdById(id);
      
      // Handle potential data structures: { data: { ... } }, { data: [ ... ] }, or { ... }
      let ipdData = res;
      if (res && res.data) {
        ipdData = Array.isArray(res.data) ? res.data[0] : res.data;
      }
      
      console.log("Fetched IPD data:", ipdData);
      
      setIpd({
        bed_data: ipdData.bed_data || {},
        service_id: ipdData.service_id || [],
        doctor_data: ipdData.doctor_data || {},
        sr_no: ipdData.sr_no || "",
        patient_name: ipdData.patient_name || "",
        age: ipdData.age || "",
        mobile: ipdData.mobile || "",
        gender: ipdData.gender || "",
        address: ipdData.address || "",
        referred_by: ipdData.referred_by || "",
        datetime_admission: ipdData.datetime_admission || "",
        is_discharge: ipdData.is_discharge || 0,
      });
      
      // Set edit form with current data
      setEditForm({
        bed_id: ipdData.bed_data?.id || null,
        service_id: (ipdData.service_id || []).map(s => s.id),
        doctor_id: ipdData.doctor_data?.id || null,
        sr_no: ipdData.sr_no || "",
        patient_name: ipdData.patient_name || "",
        age: ipdData.age || "",
        mobile: ipdData.mobile || "",
        gender: ipdData.gender || "",
        address: ipdData.address || "",
        referred_by: ipdData.referred_by || "",
      });
    } catch (error) {
      console.error("Error fetching IPD:", error);
    }
  };   

  // 🔹 FETCH SERVICES
  const fetchServices = async () => {
    try {
      const res = await getServices();
      setAllServices(res.data || res.results || res || []);
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

  // 🔹 FETCH BEDS
  const fetchBeds = async () => {
    try {   
      const res = await getBeds();
      setBeds(res.data || res.results || res || []);
    } catch (error) {
      console.error("Error fetching beds:", error);
    }
  };

  // 🔹 UPDATE BED STATUS
  const updateBedStatuses = async (oldBedId, newBedId) => {
    try {
      // Update old bed status to "vacant" if exists
      if (oldBedId) {
        await updateBed(oldBedId, { status: "vacant" });
        console.log(`Updated bed ${oldBedId} to vacant`);
      }

      // Update new bed status to "occupied"
      if (newBedId) {
        await updateBed(newBedId, { status: "occupied" });
        console.log(`Updated bed ${newBedId} to occupied`);
      }

      // Refresh beds data
      await fetchBeds();
    } catch (error) {
      console.error("Error updating bed statuses:", error);
      throw error;
    }
  };

  // 🔹 FILTERED SERVICES FOR SEARCH
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return allServices;
    
    const searchTerm = serviceSearch.toLowerCase();
    return allServices.filter(service => 
      service.service_name?.toLowerCase().includes(searchTerm) ||
      service.service_price?.toString().includes(searchTerm)
    );
  }, [allServices, serviceSearch]);

  // 🔹 CREATE NEW SERVICE
  const createNewService = async () => {
    try {
      if (!newServiceForm.service_name.trim() || !newServiceForm.service_price) {
        alert("Please enter service name and price");
        return;
      }

      // Create the new service
      const response = await createService({
        service_name: newServiceForm.service_name.trim(),
        service_price: parseFloat(newServiceForm.service_price),
      });

      const newService = response.data || response;
      
      // Add to all services list
      setAllServices(prev => [newService, ...prev]);
      
      // Add to selected services
      setEditForm(prev => ({
        ...prev,
        service_id: [...prev.service_id, newService.id]
      }));

      // Reset form and close
      setNewServiceForm({ service_name: "", service_price: "" });
      setShowNewServiceForm(false);
      setServiceSearch("");

      console.log("New service created:", newService);
    } catch (error) {
      console.error("Error creating service:", error);
      alert("Failed to create new service");
    }
  };

  // 🔹 START EDIT
  const startEdit = () => {
    setEditMode(true);
    setEditForm({
      bed_id: ipd.bed_data?.id || null,
      service_id: ipd.service_id.map(s => s.id),
      doctor_id: ipd.doctor_data?.id || null,
      sr_no: ipd.sr_no || "",
      patient_name: ipd.patient_name || "",
      age: ipd.age || "",
      mobile: ipd.mobile || "",
      gender: ipd.gender || "",
      address: ipd.address || "",
      referred_by: ipd.referred_by || "",
    });
  };

  // 🔹 CANCEL EDIT
  const cancelEdit = () => {
    setEditMode(false);
    setEditForm({
      bed_id: ipd.bed_data?.id || null,
      service_id: ipd.service_id.map(s => s.id),
      doctor_id: ipd.doctor_data?.id || null,
      sr_no: ipd.sr_no || "",
      patient_name: ipd.patient_name || "",
      age: ipd.age || "",
      mobile: ipd.mobile || "",
      gender: ipd.gender || "",
      address: ipd.address || "",
      referred_by: ipd.referred_by || "",
    });
    setServiceSearch("");
    setShowServiceDropdown(false);
    setShowNewServiceForm(false);
  };

  // 🔹 HANDLE INPUT CHANGE
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 🔹 HANDLE SERVICE SELECTION
  const handleServiceChange = (serviceId) => {
    setEditForm((prev) => {
      const isSelected = prev.service_id.includes(serviceId);
      let updatedServiceIds;
      
      if (isSelected) {
        updatedServiceIds = prev.service_id.filter((id) => id !== serviceId);
      } else {
        updatedServiceIds = [...prev.service_id, serviceId];
      }

      return {
        ...prev,
        service_id: updatedServiceIds,
      };
    });
  };

  // 🔹 REMOVE SERVICE
  const removeService = (serviceId) => {
    setEditForm(prev => ({
      ...prev,
      service_id: prev.service_id.filter(id => id !== serviceId)
    }));
  };

  // 🔹 GET SELECTED SERVICES DETAILS
  const getSelectedServices = () => {
    return allServices.filter(service => editForm.service_id.includes(service.id));
  };

  // 🔹 GET BED DISPLAY TEXT
  const getBedDisplayText = (bed) => {
    if (!bed) return "";
    const name = bed.name || "";
    const bedNumber = bed.bed_number ? ` - ${bed.bed_number}` : "";
    const status = bed.status ? ` (${bed.status})` : "";
    return `${name}${bedNumber}${status}`;
  };

  // 🔹 UPDATE IPD INFO
  const handleUpdate = async () => {
    try {
      setLoading(true);

      // Store old bed ID before update
      const oldBedId = ipd.bed_data?.id;
      const newBedId = editForm.bed_id;

      // Prepare payload
      const payload = {
        bed_data: editForm.bed_id,
        service_id: editForm.service_id,
        doctor_data: editForm.doctor_id,
        sr_no: editForm.sr_no,
        patient_name: editForm.patient_name,
        age: editForm.age,
        mobile: editForm.mobile,
        gender: editForm.gender,
        address: editForm.address,
        referred_by: editForm.referred_by,
      };

      console.log("Update payload:", payload);

      // Update bed statuses if bed changed
      if (oldBedId !== newBedId) {
        await updateBedStatuses(oldBedId, newBedId);
      }

      // Update IPD
      await updateIpd(id, payload);

      // Refresh data
      await fetchIpd();
      window.dispatchEvent(new Event('ipd_info_updated'));
      setEditMode(false);
      setServiceSearch("");
      setShowServiceDropdown(false);
      
    } catch (error) {
      console.error("Error updating Ipd info:", error);
      alert("Failed to update information");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      dateString = dateString.replace(/\s+/g, " ").trim();

      const match = dateString.match(
        /(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}) (AM|PM)/i
      );

      if (match) {
        let [, day, month, year, hour, minute, period] = match;

        hour = parseInt(hour, 10);
        if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

        const date = new Date(year, month - 1, day, hour, minute);

        return date.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      const date = new Date(dateString);
      return isNaN(date)
        ? dateString
        : date.toLocaleString("en-IN");

    } catch (error) {
      return dateString;
    }
  };

  // 🔹 GET STATUS COLOR
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'occupied':
        return 'text-red-600 bg-red-50';
      case 'available':
      case 'vacant':
        return 'text-green-600 bg-green-50';
      case 'reserved':
        return 'text-yellow-600 bg-yellow-50';
      case 'maintenance':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm -mx-4">
      {!editMode ? (
        /* SLIM STICKY HEADER - Fully Responsive */
        <>
          {/* Left Section: Patient Primary Info */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-gray-900 truncate leading-none">
                {ipd.patient_name || 'Unknown'}
                <span className="text-gray-500 font-medium ml-1.5 text-sm uppercase">
                  ({ipd.age || 'N/A'} Y, {ipd.gender ? ipd.gender.charAt(0).toUpperCase() : 'N/A'})
                </span>
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm ${
                ipd.is_discharge ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {ipd.is_discharge ? 'DIS' : 'ADM'}
              </span>
            </div>
          </div>

          {/* Middle Section: Metadata */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[13px] font-medium text-gray-500 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0">
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              <span className="text-gray-400 font-bold text-[9px] uppercase tracking-tighter">ID</span>
              <span className="text-gray-800 font-bold">{id}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              <span className="text-blue-400 font-bold text-[9px] uppercase tracking-tighter">Bed</span>
              <span className="text-blue-800 font-bold">
                {ipd.bed_data?.name || "N/A"} {ipd.bed_data?.bed_number && `#${ipd.bed_data.bed_number}`}
              </span>
            </div>
            <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
              <span className="text-gray-400 font-bold text-[10px] uppercase">Doctor</span>
              <span className="text-gray-800 font-bold truncate max-w-[120px]" title={ipd.doctor_data?.doctor_name}>
                {ipd.doctor_data?.doctor_name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
              <span className="text-gray-400 font-bold text-[10px] uppercase">Phone</span>
              <span className="text-gray-800 font-semibold">{ipd.mobile || 'N/A'}</span>
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center justify-end w-full md:w-auto gap-2 border-t md:border-t-0 pt-2 md:pt-0">
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
          </div>
        </>
      ) : (
        /* EDIT MODE - PRESERVED LOGIC WITH REFINED UI */
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Edit IPD Information</h2>
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Bed, Doctor & Services in one line */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {/* Bed Selection */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Bed</label>
                <select
                  value={editForm.bed_id || ""}
                  onChange={(e) => handleInputChange("bed_id", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="">Select Bed</option>
                  {beds
                    .filter((b) => b.status !== "occupied" || b.id === ipd.bed_data?.id)
                    .map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        {bed.name}
                        {bed.bed_number && ` - ${bed.bed_number}`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Doctor</label>
                <select
                  value={editForm.doctor_id || ""}
                  onChange={(e) => handleInputChange("doctor_id", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.doctor_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services Search */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Services ({editForm.service_id.length})
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => {
                      setServiceSearch(e.target.value);
                      setShowServiceDropdown(true);
                    }}
                    onFocus={() => setShowServiceDropdown(true)}
                    placeholder="Search services..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>

                {showServiceDropdown && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {serviceSearch && !allServices.some(s => s.service_name.toLowerCase().includes(serviceSearch.toLowerCase())) && (
                      <button
                        onClick={() => { setShowNewServiceForm(true); setShowServiceDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2 text-sm font-bold"
                      >
                        <Plus size={16} /> Add "{serviceSearch}"
                      </button>
                    )}
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        className={`px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${editForm.service_id.includes(service.id) ? 'bg-blue-50' : ''}`}
                        onClick={() => { handleServiceChange(service.id); setServiceSearch(""); setShowServiceDropdown(false); }}
                      >
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span>{service.service_name}</span>
                          <span className="text-blue-600 font-black tracking-tight">₹{service.service_price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {editForm.service_id.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getSelectedServices().map(service => (
                      <div key={service.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-[10px] font-bold">
                        <span>{service.service_name}</span>
                        <button onClick={() => removeService(service.id)} className="text-blue-600"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Details */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-black text-gray-800 mb-6 uppercase tracking-[0.2em] border-b border-gray-200 pb-2">Patient Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
                  <input
                    type="text" value={editForm.patient_name}
                    onChange={(e) => handleInputChange("patient_name", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Age</label>
                  <input
                    type="number" value={editForm.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                  >
                    <option value="">Select</option>
                    {genderOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number</label>
                  <input
                    type="tel" value={editForm.mobile}
                    onChange={(e) => handleInputChange("mobile", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Referred By</label>
                  <input
                    type="text" value={editForm.referred_by}
                    onChange={(e) => handleInputChange("referred_by", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2 lg:col-span-4">
                  <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows="2"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-4">
              <button
                onClick={cancelEdit}
                className="px-8 py-3 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="px-8 py-3 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Check size={18} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Service Form Modal - Preserved */}
      {showNewServiceForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl scale-in-center">
            <h3 className="font-black text-2xl text-gray-900 mb-6">Add New Service</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Service Name</label>
                <input
                  type="text" value={newServiceForm.service_name}
                  onChange={(e) => setNewServiceForm(prev => ({ ...prev, service_name: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-500 outline-none text-gray-900 font-bold"
                  placeholder="EX: Blood Test" autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Price (₹)</label>
                <input
                  type="number" value={newServiceForm.service_price}
                  onChange={(e) => setNewServiceForm(prev => ({ ...prev, service_price: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-500 outline-none text-gray-900 font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={createNewService}
                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                Add Service
              </button>
              <button
                onClick={() => { setShowNewServiceForm(false); setServiceSearch(""); }}
                className="flex-1 bg-gray-50 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95 border border-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}