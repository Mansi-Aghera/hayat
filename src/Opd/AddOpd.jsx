import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOpd } from "../services/opd.services";
import { getServices, createService } from "../services/service.services";
import { getDoctors } from "../services/doctor.services";

export default function AddOpd() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [newService, setNewService] = useState({
    name: "",
    charge: ""
  });
  const [serviceSuggestions, setServiceSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    mobile_no: "",
  });

  // Format current date for default value
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateTimeForApi = (datetimeLocal) => {
    if (!datetimeLocal) return "";

    const date = new Date(datetimeLocal);

    const pad = (n) => String(n).padStart(2, "0");

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  };

  const [form, setForm] = useState({
    sr_no: "",
    date: getCurrentDateTime(),
    patient_name: "",
    age: "",
    gender: "",
    address: "",
    mobile_no: "",
    doctor_id: "",
    payment_mode: "",
  });

  // --- Validation helpers ---
  const normalizePhone = (value) => String(value ?? "").trim();

  // Accepts digits with optional + at start, spaces/dashes/() allowed
  // Validates based on count of digits (7..15 typical range)
  const validatePhoneRequired = (value) => {
    const v = normalizePhone(value);
    if (!v) return "Mobile number is required";
    if (!/^\+?[0-9()\-\s]+$/.test(v)) {
      return "Mobile number can contain only digits, spaces, +, -, ( )";
    }
    const digits = v.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      return "Mobile number must be between 7 and 15 digits";
    }
    return "";
  };

  const validateForm = (data) => {
    const next = {
      mobile_no: validatePhoneRequired(data.mobile_no),
    };
    setFieldErrors(next);
    return !next.mobile_no;
  };

  /* ---------------- FETCH DROPDOWNS ---------------- */
  useEffect(() => {
    fetchDoctors();
    fetchServices();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res?.data || res || []);
    } catch (err) {
      console.error("Doctor fetch error", err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await getServices();
      setServices(res?.data || res || []);
    } catch (err) {
      console.error("Services fetch error", err);
    }
  };

  /* ---------------- SERVICE HANDLERS ---------------- */
  const handleServiceNameChange = (e) => {
    const value = e.target.value;
    setNewService(prev => ({ ...prev, name: value }));
    
    if (value.trim() === "") {
      setServiceSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = services.filter(service =>
      service.service_name.toLowerCase().includes(value.toLowerCase())
    );
    setServiceSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleServiceChargeChange = (e) => {
    const value = e.target.value;
    setNewService(prev => ({ ...prev, charge: value }));
  };

  const handleServiceSelect = (service) => {
    setNewService({
      name: service.service_name,
      charge: service.service_price.toString()
    });
    setShowSuggestions(false);
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) {
      alert("Please enter service name");
      return;
    }

    const charge = parseFloat(newService.charge);

    try {
      // Check if service already exists
      const existingService = services.find(s => 
        s.service_name.toLowerCase() === newService.name.toLowerCase().trim()
      );

      let serviceToAdd;

      if (existingService) {
        // Use existing service
        serviceToAdd = existingService;
      } else {
        // Create new service
        const serviceData = {
          service_name: newService.name.trim(),
          service_price: charge,
        };

        const createdServiceRes = await createService(serviceData);
        const createdService = createdServiceRes.data || createdServiceRes;
        serviceToAdd = createdService;
        setServices(prev => [...prev, createdService]);

      }

      // Add to selected services
      if (!selectedServices.find(s => s.id === serviceToAdd.id)) {
        const serviceWithAmount = {
          ...serviceToAdd,
          service_price: charge, // 
          total: charge
        };
        setSelectedServices([...selectedServices, serviceWithAmount]);
        
        // Reset form
        setNewService({
          name: "",
          charge: ""
        });
        
        if (!existingService) {
          alert("New service created and added!");
        }
      } else {
        alert("Service already added");
      }
      
      setShowSuggestions(false);
    } catch (err) {
      console.error("Failed to add service", err);
      alert("Failed to add service");
    }
  };

  const handleRemoveService = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const updateServiceCharge = (serviceId, newCharge) => {
    const charge = parseFloat(newCharge) || 0;
    setSelectedServices(selectedServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          service_price: charge,
          total: charge
        };
      }
      return service;
    }));
  };

  /* ---------------- CALCULATE TOTAL AMOUNT ---------------- */
  const calculateTotalAmount = () => {
    return selectedServices.reduce((total, service) => {
      return total + (service.total || service.service_price || 0);
    }, 0);
  };

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextValue = value;
    if (name === "mobile_no") {
      nextValue = String(value ?? "").replace(/[^\d+\-\s()]/g, "");
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));

    if (name === "mobile_no") {
      setFieldErrors((prev) => ({
        ...prev,
        mobile_no: validatePhoneRequired(nextValue),
      }));
    }
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (name === "mobile_no") {
      setFieldErrors((prev) => ({
        ...prev,
        mobile_no: validatePhoneRequired(value),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patient_name || !form.mobile_no || !form.doctor_id || !form.payment_mode) {
      alert("Please fill all required fields");
      return;
    }

    const ok = validateForm(form);
    if (!ok) return;

    if (selectedServices.length === 0) {
      alert("Please add at least one service");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        sr_no: form.sr_no,
        date: formatDateTimeForApi(form.date), // Already in datetime-local format
        patient_name: form.patient_name,
        age: Number(form.age),
        gender: form.gender,
        address: form.address,
        mobile_no: form.mobile_no,
        payment_mode: form.payment_mode,
        doctor_data: Number(form.doctor_id),
        service_id: selectedServices.map(service => service.id), // Just IDs array like [23,45]
        total_amount: calculateTotalAmount()
      };

      console.log("Payload:", payload);
      let res = await createOpd(payload);
      console.log("Response:", res);
      alert("OPD created successfully");
      navigate("/opd");
    } catch (err) {
      console.error("Error creating OPD:", err);
      alert("Failed to create OPD");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Add OPD</h2>
            <button
              type="button"
              onClick={() => navigate("/opd")}
              className="text-gray-600 border rounded-full p-2 hover:text-gray-800 font-medium cursor-pointer"
            >
              Back to List
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: SR No & Patient Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sr No *
                </label>
                <input
                  name="sr_no"
                  value={form.sr_no}
                  onChange={handleChange}
                  placeholder="Sr No *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name *
                </label>
                <input
                  name="patient_name"
                  value={form.patient_name}
                  onChange={handleChange}
                  placeholder="Patient Name *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Row 2: Age & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
                >
                  <option value="">Select Gender *</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Row 3: Address & Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile *
                </label>
                <input
                  name="mobile_no"
                  value={form.mobile_no}
                  onChange={handleChange}
                  onBlur={handleFieldBlur}
                  placeholder="Mobile *"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.mobile_no
                      ? "border-red-400 focus:ring-red-400"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                  inputMode="tel"
                  autoComplete="tel"
                />
                {fieldErrors.mobile_no ? (
                  <div className="mt-2 text-sm text-red-600">{fieldErrors.mobile_no}</div>
                ) : null}
              </div>
            </div>

            {/* Row 4: Date & Payment Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode *
                </label>
                <select
                  name="payment_mode"
                  value={form.payment_mode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
                >
                  <option value="">Select Payment Mode *</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>

            {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor *
                </label>
                <select
                  name="doctor_id"
                  value={form.doctor_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
                >
                  <option value="">Select Doctor *</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.doctor_name} (
                      {doc.specialization_id?.specialization_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Services Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services *
                </label>
                <div className="flex gap-3">
                  {/* Service Name Input with Suggestions */}
                  <div className="flex-1 relative">
                    <label className="text-sm font-medium text-gray-700">Service Name</label>
                    <input
                      type="text"
                      value={newService.name}
                      onChange={handleServiceNameChange}
                      placeholder="Service name..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {showSuggestions && serviceSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {serviceSuggestions.map(service => (
                          <div
                            key={service.id}
                            onClick={() => handleServiceSelect(service)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{service.service_name}</div>
                            <div className="text-sm text-gray-600">
                              Price: ₹{service.service_price}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Service Charge Input */}
                  <div className="w-50">
                    <label className="text-sm font-medium text-gray-700">Service Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newService.charge}
                      onChange={handleServiceChargeChange}
                      placeholder="Charge ₹"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  {/* Add Service Button */}
                  <div className="w-36">
                    <br></br>
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Add Service
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Type service name (suggestions will appear) and enter charge
                </p>
              </div>
              

            {/* Selected Services Table */}
            {selectedServices.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Selected Services ({selectedServices.length})
                </h3>
                
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Charge (₹)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedServices.map((service) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {service.service_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {service.service_price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveService(service.id)}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Amount Display */}
                <div className="mt-4 flex justify-end">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-lg font-semibold text-gray-700">
                      Total Amount: ₹{calculateTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate("/opd")}
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !!fieldErrors.mobile_no}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {loading ? "Saving..." : "Add OPD"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}