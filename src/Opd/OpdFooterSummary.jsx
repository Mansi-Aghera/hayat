import { useState, useEffect, useMemo } from "react";
import { X, Check, Trash2, Printer } from "lucide-react";
import { getOpdById, updateOpd } from "../services/opd.services";
import { getServices, createService } from "../services/service.services";
import { useNavigate } from "react-router-dom";

export default function OpdFooterSummary({ id, localOpd }) {
  const [loading, setLoading] = useState(false);
  const [opd, setOpd] = useState(null);
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  // Form state (Matching Logic from Image 1)
  const [form, setForm] = useState({
    service_ids: [],
    total_amount: "0",
    payment_mode: "",
    is_received: 0,
    prescription: "",
    newServiceName: "",
    newServiceCharge: "",
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

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

    // Listen for updates from other components
    window.addEventListener('opd_info_updated', fetchOpd);
    return () => window.removeEventListener('opd_info_updated', fetchOpd);
  }, [id]);

  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      setOpd(data);
      
      // Sync form with data
      setForm(prev => ({
        ...prev,
        service_ids: (data.service_id || []).map(s => s.id),
        total_amount: (data.total_amount || "0").toString(),
        payment_mode: data.payment_mode || "",
        is_received: data.is_received || 0,
        prescription: data.prescription || "",
      }));
    } catch (error) {
      console.error("Error fetching OPD for summary:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await getServices();
      setServices(res.data || res.results || res || []);
    } catch (error) {
       console.error("Error fetching services:", error);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      s.service_name?.toLowerCase().includes(form.newServiceName.toLowerCase())
    );
  }, [services, form.newServiceName]);

  const selectedServicesData = useMemo(() => {
    // Normalize IDs to strings for robust comparison
    const selectedIds = form.service_ids.map(id => String(id));
    return services.filter(s => selectedIds.includes(String(s.id)));
  }, [form.service_ids, services]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAddService = async () => {
    const serviceName = form.newServiceName.trim();
    const servicePriceStr = form.newServiceCharge;

    if (!serviceName || servicePriceStr === "") {
      alert("Please enter both service name and price");
      return;
    }

    try {
      let serviceId;
      const servicePrice = parseFloat(servicePriceStr);
      
      const existing = services.find(s => s.service_name.toLowerCase() === serviceName.toLowerCase());
      
      if (existing) {
        serviceId = existing.id;
        // Use existing service ID, but we'll use the price entered in the form if needed
        // Note: The current backend structure might store price in the service object itself
      } else {
        const res = await createService({ service_name: serviceName, service_price: servicePrice });
        const newS = res.data || res;
        serviceId = newS.id;
        setServices(prev => [newS, ...prev]);
      }

      // Check if service is already added (normalized check)
      const isAlreadyAdded = form.service_ids.some(id => String(id) === String(serviceId));
      if (isAlreadyAdded) {
        alert("This service is already in the list");
        return;
      }

      setForm(prev => {
        const currentTotal = parseFloat(prev.total_amount || 0);
        const newTotal = currentTotal + servicePrice;
        return {
          ...prev,
          service_ids: [...prev.service_ids, serviceId],
          total_amount: newTotal.toString(),
          newServiceName: "",
          newServiceCharge: ""
        };
      });
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service. Please check your connection or if the service name is valid.");
    }
  };

  const removeService = (serviceId) => {
    const service = services.find(s => String(s.id) === String(serviceId));
    if (!service) return;
    setForm(prev => {
      const updatedIds = prev.service_ids.filter(id => String(id) !== String(serviceId));
      const currentTotal = parseFloat(prev.total_amount || 0);
      const servicePrice = parseFloat(service.service_price || 0);
      return {
        ...prev,
        service_ids: updatedIds,
        total_amount: Math.max(0, currentTotal - servicePrice).toString()
      };
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // 🔹 Transform complex objects back to IDs for the backend
      const chiefComplaints = (localOpd.chief_complaints || []).map(c => ({
        duration: c.duration,
        optional: c.optional,
        complaints_data: c.complaints_data?.id || c.complaints_data
      }));

      const pastHistory = (localOpd.past_history || []).map(h => ({
        duration: h.duration,
        past_history_data: h.past_history_data?.id || h.past_history_data
      }));

      const payload = {
        // Form fields (Services & Payment)
        service_id: form.service_ids.map(id => Number(id)),
        total_amount: parseFloat(form.total_amount),
        payment_mode: form.payment_mode,
        is_received: form.is_received,
        prescription: form.prescription,

        // Gathered from localOpd (Deferred saves)
        chief_complaints: chiefComplaints,
        past_history: pastHistory,
        vitals: localOpd.vitals,
        examination: localOpd.examination,
        diagnosis_detail: localOpd.diagnosis_detail,
        Note: localOpd.Note,
        suggested_diet: localOpd.suggested_diet,
        adviced: localOpd.adviced
      };

      console.log("Saving full OPD payload:", payload);
      
      const response = await updateOpd(id, payload);
      const updatedData = Array.isArray(response?.data) ? response.data[0] : (response?.data || response);
      
      if (updatedData) {
        alert("Changes saved successfully!");
        navigate("/opd");
      } else {
        alert("Changes saved!");
        navigate("/opd");
      }
    } catch (error) {
      console.error("Error saving OPD summary:", error);
      alert("Failed to save changes. Please verify all fields.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!opd) return null;

  return (
    <div className="w-full px-4 py-1 pb-24">
      {/* TARGET UI - COMPACT INLINE GRID STYLE */}
      <div className="">
        
        {/* SECTION 1: SERVICES */}
        <div className="border-b border-gray-50 py-3">
          <div className="flex items-start gap-4">
            <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 w-[150px] flex-shrink-0">
              Services ({form.service_ids.length})
            </h2>

            <div className="flex-1 w-full flex flex-col gap-2">
              <div className="flex flex-col md:flex-row gap-3 items-center w-full">
                <div className="relative w-full md:w-3/5">
                  <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Service Name</span>
                    <input
                      type="text"
                      value={form.newServiceName}
                      onChange={(e) => { handleChange("newServiceName", e.target.value); setShowSuggestions(true); }}
                      placeholder="Type service name..."
                      className="w-full outline-none text-sm bg-transparent"
                    />
                  </div>
                  {showSuggestions && filteredServices.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredServices.map(s => (
                        <div 
                          key={s.id}
                          onClick={() => { handleChange("newServiceName", s.service_name); handleChange("newServiceCharge", s.service_price.toString()); setShowSuggestions(false); }}
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between"
                        >
                          <span className="font-bold text-sm text-gray-800">{s.service_name}</span>
                          <span className="text-blue-600 font-black text-xs">₹{s.service_price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative w-full md:w-1/5">
                  <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Price (₹)</span>
                    <input
                      type="text"
                      value={form.newServiceCharge}
                      onChange={(e) => handleChange("newServiceCharge", e.target.value)}
                      placeholder="0.00"
                      className="w-full outline-none text-sm bg-transparent"
                    />
                  </div>
                </div>

                <button onClick={handleAddService} className="bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2 transition-all shadow-sm text-sm w-full md:w-1/5 h-[42px] md:h-auto focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  Add Service
                </button>
              </div>

              {/* Service Badges */}
              {selectedServicesData.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedServicesData.map((service) => (
                    <div 
                      key={service.id} 
                      className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 transition-all hover:bg-blue-100/50"
                    >
                      <span className="text-xs font-medium text-blue-800">
                        {service.service_name} <span className="mx-1">:</span> ₹{service.service_price}
                      </span>
                      <button 
                        onClick={() => removeService(service.id)} 
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Remove Service"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: PAYMENT DETAILS */}
        <div className="border-b border-gray-50 py-3 bg-gray-50/30">
          <div className="flex items-start gap-4">
            <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 w-[150px] flex-shrink-0">Payment Details</h2>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Mode</span>
                <select value={form.payment_mode} onChange={(e) => handleChange("payment_mode", e.target.value)} className="w-full outline-none text-sm bg-transparent appearance-none">
                  <option value="">Select</option>
                  {paymentModeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Total</span>
                <input type="text" readOnly value={form.total_amount} className="w-full outline-none text-sm bg-transparent font-bold text-gray-800 cursor-not-allowed" />
              </div>

              <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Status</span>
                <select value={form.is_received} onChange={(e) => handleChange("is_received", parseInt(e.target.value))} className="w-full outline-none text-sm bg-transparent appearance-none">
                  {receivedOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* SECTION 3: PRESCRIPTION NOTES */}
        <div className="border-b border-gray-50 py-3">
          <div className="flex items-start gap-4">
            <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 w-[150px] flex-shrink-0">Prescription Notes</h2>
            <div className="flex-1 w-full">
              <textarea 
                value={form.prescription} 
                onChange={(e) => handleChange("prescription", e.target.value)} 
                placeholder="Enter prescription details" 
                rows={3} 
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" 
              />
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS - Fixed at bottom, respecting sidebar */}
        <div className="fixed bottom-0 left-0 right-0 z-[9999] py-2 px-4 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] md:ml-[200px]">
          <div className="max-w-7xl mx-auto flex justify-end gap-3 px-4">
            <button 
              onClick={() => navigate(`/opd-prescription/${id}`)} 
              className="px-5 py-2 rounded-xl bg-indigo-400 hover:bg-indigo-500 text-white font-bold text-[13px] transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <Printer size={16} /> Print Prescription
            </button>
            <button onClick={() => navigate("/opd")} className="px-6 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-bold text-[13px] transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500/10">
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="px-8 py-2 rounded-xl bg-blue-400 hover:bg-blue-500 text-white font-bold text-[13px] transition-all flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : <Check size={16} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ORIGINAL VISIT INFORMATION (KEPT AS IT WAS) */}
      {/* <div className="border-2 border-gray-200 rounded-xl p-5 bg-white">
        <h4 className="font-semibold text-lg text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
          Visit Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Visit Date</div>
            <div className="font-semibold text-gray-900">{formatDate(opd.date)}</div>
          </div>
          <div className="">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Serial Number</div>
            <div className="font-semibold text-gray-900">{opd.sr_no || 'N/A'}</div>
          </div>
        </div>
      </div> */}

    </div>
  );
}
