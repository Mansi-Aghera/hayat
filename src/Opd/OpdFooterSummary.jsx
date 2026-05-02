import { useState, useEffect, useMemo } from "react";
import { X, Check, Trash2, Printer } from "lucide-react";
import { getOpdById, updateOpd } from "../services/opd.services";
import { getServices, createService } from "../services/service.services";
import { useNavigate } from "react-router-dom";

export default function OpdFooterSummary({ id }) {
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

      setForm(prev => ({
        ...prev,
        service_ids: [...prev.service_ids, serviceId],
        total_amount: (parseFloat(prev.total_amount || 0) + servicePrice).toString(),
        newServiceName: "",
        newServiceCharge: ""
      }));
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service. Please check your connection or if the service name is valid.");
    }
  };

  const removeService = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    setForm(prev => ({
      ...prev,
      service_ids: prev.service_ids.filter(id => id !== serviceId),
      total_amount: Math.max(0, parseFloat(prev.total_amount) - parseFloat(service.service_price)).toString()
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Ensure all IDs are numbers and total_amount is a number for the API
      // Backend requires prescription to NOT be blank
      const payload = {
        service_id: form.service_ids.map(id => Number(id)),
        total_amount: parseFloat(form.total_amount),
        payment_mode: form.payment_mode,
        is_received: form.is_received,
        prescription: form.prescription.trim() || " " // Use a space if blank to satisfy backend
      };

      // 🔹 Trigger global save for other components (Vitals, Examination, etc.)
      window.dispatchEvent(new Event('opd_save_all_requested'));

      console.log("Saving OPD payload:", payload);
      
      const response = await updateOpd(id, payload);
      
      // The API usually returns the updated object. 
      // We handle both { data: {...} } and {...} structures.
      const updatedData = response?.data || response;
      
      if (updatedData) {
        // Sync local state with the actual data returned by the server
        setOpd(updatedData);
        setForm(prev => ({
          ...prev,
          service_ids: (updatedData.service_id || []).map(s => s.id),
          total_amount: (updatedData.total_amount || "0").toString(),
          payment_mode: updatedData.payment_mode || "",
          is_received: updatedData.is_received || 0,
          prescription: updatedData.prescription || "",
        }));
        
        window.dispatchEvent(new Event('opd_info_updated'));
        alert("Changes saved successfully!");
        navigate("/opd");
      } else {
        // Fallback to re-fetching if response is empty
        await fetchOpd();
        alert("Changes saved!");
        navigate("/opd");
      }
    } catch (error) {
      console.error("Error saving OPD summary:", error);
      const errorMsg = error.response?.data?.errors?.prescription 
        ? "Prescription notes cannot be blank." 
        : "Failed to save changes. Please verify all fields.";
      alert(errorMsg);
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
    <div className="space-y-6 mt-6 mb-8 max-w-7xl mx-auto">

      {/* TARGET UI (IMAGE 2) */}
      <div className="bg-[#f8faff] rounded-2xl p-8 border border-blue-50/50 shadow-sm relative">
        
        {/* SECTION 1: SERVICES */}
        <div className="mb-10">
          <h3 className="text-[17px] font-bold text-gray-800 mb-6 flex items-center">
            Services ({form.service_ids.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-2">
            <div className="md:col-span-5 relative">
              <label className="text-[13px] font-bold text-gray-700 mb-2 block">Service Name *</label>
              <input
                type="text"
                value={form.newServiceName}
                onChange={(e) => { handleChange("newServiceName", e.target.value); setShowSuggestions(true); }}
                placeholder="Type service name..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-400"
              />
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

            <div className="md:col-span-4">
              <label className="text-[13px] font-bold text-gray-700 mb-2 block">Service Price *</label>
              <input
                type="text"
                value={form.newServiceCharge}
                onChange={(e) => handleChange("newServiceCharge", e.target.value)}
                placeholder="₹0.00"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="md:col-span-3 pt-[28px]">
              <button onClick={handleAddService} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-all active:scale-[0.98] shadow-sm text-[15px]">
                Add Service
              </button>
            </div>
          </div>
          
          <p className="text-[12px] text-gray-400 mb-8 font-medium">
            Type service name, select from suggestions or enter new, then add price and click Add Service
          </p>

          <div className="flex flex-wrap gap-2">
            {selectedServicesData.map((service) => (
              <div 
                key={service.id} 
                className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 transition-all hover:bg-blue-100/50"
              >
                <span className="text-sm font-medium text-blue-800">
                  {service.service_name} <span className="mx-1">:</span> ₹{service.service_price}
                </span>
                <button 
                  onClick={() => removeService(service.id)} 
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  title="Remove Service"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: PAYMENT DETAILS */}
        <div className="pt-10 border-t border-gray-100 mb-10">
          <h3 className="text-[17px] font-bold text-gray-800 mb-6">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-700 block">Payment Mode</label>
              <select value={form.payment_mode} onChange={(e) => handleChange("payment_mode", e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[14px] font-medium text-gray-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:12px_12px] bg-[right_15px_center] bg-no-repeat">
                <option value="">Select Payment Mode</option>
                {paymentModeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-700 block">Total Amount</label>
              <input type="text" readOnly value={form.total_amount} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-[14px] font-bold text-gray-800 outline-none" />
              <p className="text-[11px] text-gray-400 font-medium">Auto-calculated from services</p>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-700 block">Payment Status</label>
              <select value={form.is_received} onChange={(e) => handleChange("is_received", parseInt(e.target.value))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[14px] font-medium text-gray-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:12px_12px] bg-[right_15px_center] bg-no-repeat">
                {receivedOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRESCRIPTION NOTES */}
        <div className="pt-10 border-t border-gray-100">
          <h3 className="text-[17px] font-bold text-gray-800 mb-6">Prescription Notes</h3>
          <textarea value={form.prescription} onChange={(e) => handleChange("prescription", e.target.value)} placeholder="Enter prescription details" rows={6} className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-[14px] outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-300 resize-none" />
        </div>

        {/* FOOTER ACTIONS - Fixed at bottom, respecting sidebar */}
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] md:ml-[200px]">
          <div className="max-w-7xl mx-auto flex justify-end gap-3 px-4">
            <button 
              onClick={() => navigate(`/opd-prescription/${id}`)} 
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-[0.98]"
            >
              <Printer size={18} /> Print Prescription
            </button>
            <button onClick={() => fetchOpd()} className="px-8 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-bold text-[14px] transition-all flex items-center gap-2">
              <X size={18} /> Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="px-10 py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[14px] transition-all flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-[0.98]">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : <Check size={18} />}
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
