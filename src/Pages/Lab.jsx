import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, ChevronRight, X, Pencil, Eye, ArrowLeft, Plus } from "lucide-react";
import { createLabForm, getLabForms, updateLabForm } from "../services/labform.services";
import { getServices, createService } from "../services/service.services";

const extractId = (item) => item?.id || item?._id;

export default function Lab() {
  const navigate = useNavigate();

  const [labForms, setLabForms] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ mobile_no: "", });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingLab, setViewingLab] = useState(null);

  // ✅ SERVICE STATES (kept, simplified)
  const [serviceSearch, setServiceSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addedServices, setAddedServices] = useState([]);
  const [servicePicker, setServicePicker] = useState({
    service_id: "",
    service_name: "",
    amount: "",
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    service_data: [],
    sr_no: "",
    name: "",
    age: "",
    gender: "",
    address: "",
    mobile_no: "",
    date_time: "",
    lab_investigation_fees: "",
    payment_mode: "Cash",
    paid_amount: "0.00",
    unpaid_amount: "",
    total_amount: "",
    is_received: 0,
  });

  const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const formatAmount = (v) => toNumber(v).toFixed(2);

  const resetServicePicker = () => {
    setServicePicker({ service_id: "", service_name: "", amount: "" });
    setServiceSearch("");
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setFormData({
      service_data: [],
      sr_no: "",
      name: "",
      age: "",
      gender: "",
      address: "",
      mobile_no: "",
      date_time: "",
      lab_investigation_fees: "",
      payment_mode: "Cash",
      paid_amount: "0.00",
      unpaid_amount: "",
      total_amount: "",
      is_received: 0,
    });
    setAddedServices([]);
    resetServicePicker();
    setEditingId(null);
    setViewMode(false);
    setViewingLab(null);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [labData, svcData] = await Promise.all([getLabForms(), getServices()]);
      let update = labData.filter(l => !l.is_delete)
      setLabForms(update);
      setServices(svcData?.data || svcData || []);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ SERVICE SUGGESTIONS (unchanged)
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return [];
    return services
      .filter(s => s.service_name?.toLowerCase().includes(serviceSearch.toLowerCase()))
      .slice(0, 5);
  }, [services, serviceSearch]);

  const handleServiceSelect = (service) => {
    setServicePicker({
      service_id: service.id,
      service_name: service.service_name,
      amount: service.service_price || "",
    });
    setServiceSearch(service.service_name);
    setShowSuggestions(false);
  };

  // ✅ CORE FIX — EXISTING + NEW SERVICE IN ONE BUTTON
  const addPickedService = async () => {
    if (!servicePicker.amount || !serviceSearch.trim()) return;

    // check if service already exists
    const existing = services.find(
      s => s.service_name.toLowerCase() === serviceSearch.toLowerCase()
    );

    try {
      setLoading(true);

      let service = existing;

      // create if not exists
      if (!existing) {
        const res = await createService({
          service_name: serviceSearch.trim(),
          service_price: servicePicker.amount,
        });
        service = res.data || res;
        setServices(prev => [...prev, service]);
      }

      // add to selected services
      setAddedServices(prev => {
        if (prev.some(s => Number(s.service_id) === Number(service.id))) {
          return prev.map(s =>
            Number(s.service_id) === Number(service.id)
              ? { ...s, amount: servicePicker.amount }
              : s
          );
        }
        return [...prev, {
          service_id: service.id,
          service_name: service.service_name,
          amount: servicePicker.amount,
        }];
      });

      resetServicePicker();
    } catch {
      alert("Failed to add service");
    } finally {
      setLoading(false);
    }
  };

  const removeAddedService = (id) => {
    setAddedServices(prev => prev.filter(s => Number(s.service_id) !== Number(id)));
  };

  // Computed Totals
  const computedTotals = useMemo(() => {
    const total = addedServices.reduce((s, a) => s + toNumber(a.amount), 0);
    const paid = toNumber(formData.paid_amount);
    return { total, unpaid: Math.max(total - paid, 0) };
  }, [addedServices, formData.paid_amount]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      total_amount: formatAmount(computedTotals.total),
      unpaid_amount: formatAmount(computedTotals.unpaid),
      lab_investigation_fees: formatAmount(computedTotals.total),
    }));
  }, [computedTotals]);

  const normalizePhoneDigits = (value) => String(value ?? "").replace(/\D/g, "");

  const validatePhone = (value) => {
    const digits = normalizePhoneDigits(value);
    if (!digits) return "";
    if (digits.length < 7 || digits.length > 15) {
      return "Mobile number must be between 7 and 15 digits";
    }
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "is_received") {
      setFormData((prev) => ({ ...prev, is_received: checked ? 1 : 0 }));
      return;
    }

    let nextValue = value;
    if (name === "mobile_no") {
      nextValue = String(value ?? "").replace(/[^\d]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    if (name === "mobile_no") {
      setFieldErrors((prev) => ({ ...prev, mobile_no: validatePhone(nextValue) }));
    }
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
    setViewMode(false);
  };

  const handleOpenEditModal = (labItem) => {
    resetForm();
    setEditingId(extractId(labItem));

    // Parse service data
    const serviceData = labItem.service_data || [];
    let servicesList = [];

    if (Array.isArray(serviceData) && serviceData.length > 0) {
      if (typeof serviceData[0] === 'object') {
        servicesList = serviceData.map(s => ({
          service_id: s.id,
          service_name: s.service_name,
          amount: s.service_price?.toString() || "",
        }));
      }
    }
    
    setAddedServices(servicesList);

    setFormData({
      service_data: servicesList.map(s => s.service_id),
      sr_no: labItem.sr_no || "",
      name: labItem.name || "",
      age: labItem.age?.toString() || "",
      gender: labItem.gender || "",
      address: labItem.address || "",
      mobile_no: labItem.mobile_no?.toString() || "",
      date_time: labItem.date_time || "",
      lab_investigation_fees: labItem.lab_investigation_fees?.toString() || "",
      payment_mode: labItem.payment_mode || "Cash",
      paid_amount: labItem.paid_amount?.toString() || "0.00",
      unpaid_amount: labItem.unpaid_amount?.toString() || "",
      total_amount: labItem.total_amount?.toString() || "",
      is_received: Number(labItem.is_received) ? 1 : 0,
    });

    setIsModalOpen(true);
  };

  const handleOpenViewModal = (labItem) => {
    setViewingLab(labItem);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const buildPayload = () => {
    const serviceIds = addedServices.map(s => Number(s.service_id));
    const mobileDigits = normalizePhoneDigits(formData.mobile_no);

    return {
      service_data: serviceIds,
      sr_no: formData.sr_no || undefined,
      name: formData.name || undefined,
      age: formData.age ? Number(formData.age) : undefined,
      gender: formData.gender || undefined,
      address: formData.address || undefined,
      mobile_no: mobileDigits ? Number(mobileDigits) : undefined,
      lab_investigation_fees: formData.lab_investigation_fees || "0",
      payment_mode: formData.payment_mode,
      paid_amount: formData.paid_amount || "0",
      unpaid_amount: formData.unpaid_amount || "0",
      total_amount: formData.total_amount || "0",
      is_received: Number(formData.is_received),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (fieldErrors.mobile_no) return;
    if (addedServices.length === 0) {
      alert("Please add at least one service");
      return;
    }

    setLoading(true);
    const payload = buildPayload();

    try {
      if (editingId) {
        await updateLabForm(editingId, payload);
      } else {
        await createLabForm(payload);
      }
      handleCloseModal();
      fetchAll();
    } catch (err) {
      alert("Failed to save lab form");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    try {
      await updateLabForm(id, { is_delete: true });
      fetchAll();
    } catch (error) {
      alert("Failed to delete lab form");
    }
  };

  // Filter & Pagination
  const filteredLabForms = useMemo(() => {
    return labForms.filter((lab) => {
      const searchText = search.toLowerCase();
      return (
        lab?.sr_no?.toLowerCase().includes(searchText) ||
        lab?.name?.toLowerCase().includes(searchText) ||
        lab?.mobile_no?.toString().includes(searchText)
      );
    });
  }, [labForms, search]);

  const totalPages = Math.ceil(filteredLabForms.length / itemsPerPage);
  const paginatedLabForms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLabForms.slice(start, start + itemsPerPage);
  }, [filteredLabForms, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // View Helpers
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "-";
    const [date, time] = dateTimeStr.split(' ');
    return `${date} ${time}`;
  };

  const getServicesDisplay = (serviceData) => {
    if (!serviceData || !Array.isArray(serviceData)) return [];
    return serviceData.map(s => ({
      name: s.service_name,
      amount: s.service_price
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Lab Management</h1>
          <button
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            + Add Lab
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {viewMode ? "View Lab Details" : editingId ? "Edit Lab" : "Add New Lab"}
                </h2>
                <button onClick={handleCloseModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              {viewMode && viewingLab ? (
                /* View Mode */
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-sm text-gray-500">SR: {viewingLab.sr_no || 'N/A'}</span>
                      <span className="text-sm text-gray-500 ml-4">ID: {viewingLab.id || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">{viewingLab.name || 'N/A'}</h3>
                  </div>

                  <div className="mb-4">
                    <span className="text-gray-700">Age: {viewingLab.age || 'N/A'}</span>
                    <span className="text-gray-700 ml-4">Gender: {viewingLab.gender || 'N/A'}</span>
                  </div>

                  <div className="mb-4">
                    <div className="text-gray-500 text-sm">Address</div>
                    <div className="text-gray-800">{viewingLab.address || 'N/A'}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-gray-500 text-sm">Mobile</div>
                    <div className="text-gray-800">{viewingLab.mobile_no || 'N/A'}</div>
                  </div>

                  <div className="mb-6">
                    <div className="text-gray-500 text-sm">Date & Time</div>
                    <div className="text-gray-800">{formatDateTime(viewingLab.date_time)}</div>
                  </div>

                  <div className="mb-6">
                    <div className="text-gray-500 text-sm mb-2">Services</div>
                    {getServicesDisplay(viewingLab.service_data).map((service, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="text-gray-800">{service.name}</span>
                        <span className="text-gray-800 font-medium">₹{toNumber(service.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Mode</span>
                      <span className="text-gray-800 font-medium">{viewingLab.payment_mode || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="text-gray-800 font-medium">₹{toNumber(viewingLab.total_amount).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Paid Amount</span>
                      <span className="text-gray-800 font-medium">₹{toNumber(viewingLab.paid_amount).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Unpaid Amount</span>
                      <span className="text-gray-800 font-medium text-red-600">
                        ₹{(toNumber(viewingLab.total_amount) - toNumber(viewingLab.paid_amount)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button onClick={handleCloseModal} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Add/Edit Mode */
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">SR No</label>
                      <input
                        type="text"
                        name="sr_no"
                        value={formData.sr_no}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter SR number"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter age"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Mobile Number</label>
                      <input
                        type="tel"
                        name="mobile_no"
                        value={formData.mobile_no}
                        onChange={handleInputChange}
                        onBlur={() => setFieldErrors(prev => ({ ...prev, mobile_no: validatePhone(formData.mobile_no) }))}
                        className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:ring-2 ${
                          fieldErrors.mobile_no ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-indigo-500"
                        }`}
                        placeholder="Enter mobile number"
                      />
                      {fieldErrors.mobile_no && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.mobile_no}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Lab Investigation Fees</label>
                      <input
                        type="number"
                        name="lab_investigation_fees"
                        disabled
                        value={formData.lab_investigation_fees}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter address"
                      />
                    </div>

                    {/* Service Picker with Add New Option */}
                    <div className="md:col-span-2 space-y-4">
                      <label className="block text-sm font-medium text-gray-700">Add Services</label>
                      
                      {/* Service Search Row */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 relative">
                          <input
                            value={serviceSearch}
                            onChange={(e) => {
                              setServiceSearch(e.target.value);
                              setServicePicker({ service_id: "", service_name: e.target.value, amount: servicePicker.amount });
                              setShowSuggestions(true);
                            }}
                            placeholder="Search or type service name..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          />
                          
                          {/* Suggestions Dropdown */}
                          {showSuggestions && filteredServices.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {filteredServices.map(s => (
                                <div
                                  key={s.id}
                                  onClick={() => handleServiceSelect(s)}
                                  className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                                >
                                  {s.service_name} - ₹{s.service_price}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <input
                          type="number"
                          placeholder="Amount"
                          value={servicePicker.amount}
                          onChange={(e) => setServicePicker(p => ({ ...p, amount: e.target.value }))}
                          className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />

                        <button
                          onClick={addPickedService}
                          disabled={!servicePicker.service_name || !servicePicker.amount}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Added Services List */}
                      {addedServices.length > 0 && (
                        <div className="mt-3 border rounded-lg divide-y bg-gray-50">
                          <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-t-lg">
                            Added Services ({addedServices.length})
                          </div>
                          {addedServices.map(s => (
                            <div key={s.service_id} className="flex items-center justify-between px-3 py-2 hover:bg-white transition-colors">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-800">{s.service_name}</span>
                                <span className="text-sm text-gray-600 ml-2">₹{parseFloat(s.amount).toFixed(2)}</span>
                              </div>
                              <button
                                onClick={() => removeAddedService(s.service_id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Payment Mode *</label>
                      <select
                        name="payment_mode"
                        value={formData.payment_mode}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Paid Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        name="paid_amount"
                        value={formData.paid_amount}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="sticky bottom-0 bg-white pt-3 border-t border-gray-200 flex justify-end gap-2">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !!fieldErrors.mobile_no}
                      className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                    >
                      {loading ? "Saving..." : editingId ? "Update" : "Add"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3">
          <input
            type="text"
            placeholder="Search by SR No, name, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600">SR No</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600">Mobile</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600">Payment Mode</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600">Total Amount</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && labForms.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">Loading...</td></tr>
              ) : paginatedLabForms.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">No lab forms found</td></tr>
              ) : (
                paginatedLabForms.map((labItem) => (
                  <tr key={extractId(labItem)} className="hover:bg-purple-50">
                    <td className="px-3 py-3 text-sm font-medium">{labItem.sr_no || "-"}</td>
                    <td className="px-3 py-3 text-sm">{labItem.name || "-"}</td>
                    <td className="px-3 py-3 text-sm">{labItem.mobile_no || "-"}</td>
                    <td className="px-3 py-3 text-sm">{labItem.payment_mode || "-"}</td>
                    <td className="px-3 py-3 text-sm">₹{labItem.total_amount || "0"}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenViewModal(labItem)} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleOpenEditModal(labItem)} className="bg-yellow-600 hover:bg-yellow-700 text-white p-1.5 rounded-lg" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(extractId(labItem))} className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 py-3">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}