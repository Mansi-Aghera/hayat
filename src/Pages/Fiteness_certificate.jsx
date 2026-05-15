import { useEffect, useMemo, useState } from "react";
import { Trash2, ChevronLeft, ChevronRight, X, Pencil, ArrowLeft, Printer, Eye } from "lucide-react";
import { getFC, updateFC, createFC, getFCComplaints, getFCPastHistory, getFCPersonalHO } from "../services/certificates.services";
import { useNavigate } from "react-router-dom";
import { handleFitnessPrint } from "../utils/fitnessPrint";

/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

export default function Staff() {
  /* ------------------ State ------------------ */
  const [fc, setFc] = useState([]);
  const [personalHOList, setPersonalHOList] = useState([]);
  const [fcComplaints, setFcComplaints] = useState([]); // New state for FC complaints
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  let navigate = useNavigate();
  const [fcPastHistory,setFcPastHistory] = useState([])

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    referrer: "",
    patient_name: "",
    date: "", // Will store datetime-local format (YYYY-MM-DDTHH:MM)
    age: "",
    gender: "Male",
    address: "",
    mobile_no: "",
    patient_condition: {
      complaints: [],
      past_history: [],
      personal_H_O: [],
      PA: "Soft, non-tender", // Prefilled value
      RS: "Bilateral air entry equal", // Prefilled value
      CNS: "Conscious and oriented", // Prefilled value
      CVS: "S1 S2 heard", // Prefilled value
      datetime: null,
      blood_pressure: "120/80", // Normal blood pressure
      pulse: "72", // Normal pulse rate (beats per minute)
      blood_sugar: "100", // Normal fasting blood sugar (mg/dL)
      ECG: "Normal sinus rhythm", // Normal ECG finding
      temperature: "98.6", // Normal body temperature (°F)
      poller: false,
      icterus: false,
      LAP: false,
      edema_feet: false,
      clubbing: false,
      cyanosis: false
    },
    Opinion: "",
    posted_for: null
  });

  // search & filter
  const [search, setSearch] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset form function
  const resetForm = () => {
    setFormData({
      referrer: "",
      patient_name: "",
      date: getCurrentDateTimeLocal(),
      age: "",
      gender: "Male",
      address: "",
      mobile_no: "",
      patient_condition: {
        complaints: [],
        past_history: [],
        personal_H_O: [],
        PA: "Soft, non-tender", // Prefilled value
        RS: "Bilateral air entry equal", // Prefilled value
        CNS: "Conscious and oriented", // Prefilled value
        CVS: "S1 S2 heard", // Prefilled value
        datetime: null,
        blood_pressure: "120/80", // Normal blood pressure
        pulse: "72", // Normal pulse rate (beats per minute)
        blood_sugar: "100", // Normal fasting blood sugar (mg/dL)
        ECG: "Normal sinus rhythm", // Normal ECG finding
        temperature: "98.6", // Normal body temperature (°F)
        poller: false,
        icterus: false,
        LAP: false,
        edema_feet: false,
        clubbing: false,
        cyanosis: false
      },
      Opinion: "",
      posted_for: null
    });
    setEditingId(null);
  };
  
  /* ------------------ Date Conversion Functions ------------------ */
  // Convert datetime-local to API format (DD-MM-YYYY HH:MM AM/PM)
  const convertToAPIFormat = (datetimeLocal) => {
    if (!datetimeLocal) return getCurrentDateTime();
    
    const [datePart, timePart] = datetimeLocal.split('T');
    const [year, month, day] = datePart.split('-');
    let [hours, minutes] = timePart.split(':');
    
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    
    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  // Convert API format to datetime-local (YYYY-MM-DDTHH:MM)
  const convertToDateTimeLocal = (apiDate) => {
    if (!apiDate) return getCurrentDateTimeLocal();
    
    try {
      const [datePart, timePart, ampm] = apiDate.split(' ');
      const [day, month, year] = datePart.split('-');
      let [hours, minutes] = timePart.split(':');
      
      hours = parseInt(hours);
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const formattedHours = String(hours).padStart(2, '0');
      return `${year}-${month}-${day}T${formattedHours}:${minutes}`;
    } catch (e) {
      return getCurrentDateTimeLocal();
    }
  };

  // Get current date in datetime-local format
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get current date in API format
  const getCurrentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  /* ------------------ Fetch data ------------------ */
  useEffect(() => {
    fetchFC();
    fetchFCPersonalHO();
    fetchFCPastHistory();
    fetchFCComplaints(); // Fetch FC complaints
  }, []);

  // Set default date
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: getCurrentDateTimeLocal()
    }));
  }, []);

  const fetchFC = async () => {
    try {
      setLoading(true);
      const data = await getFC();
      let fcData = Array.isArray(data.data) ? data.data : data
      let filteredData = fcData.filter(item => !item.is_delete);
      setFc(filteredData);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch fc");
    } finally {
      setLoading(false);
    }
  };

  const fetchFCComplaints = async () => {
    try {
      const data = await getFCComplaints();
      setFcComplaints(data);
    } catch (error) {
      console.error("Failed to fetch FC complaints:", error);
    }
  };

  const fetchFCPastHistory = async () => {
    try {
      const data = await getFCPastHistory();
      setFcPastHistory(data);
    } catch (error) {
      console.error("Failed to fetch FC complaints:", error);
    }
  };

  const fetchFCPersonalHO = async () => {
    try {
      const data = await getFCPersonalHO();
      setPersonalHOList(data);
    } catch (error) {
      console.error("Failed to fetch FC complaints:", error);
    }
  };

  /* ------------------ Form Handlers ------------------ */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('patient_condition.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        patient_condition: {
          ...prev.patient_condition,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    if (name.includes('patient_condition.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        patient_condition: {
          ...prev.patient_condition,
          [field]: checked
        }
      }));
    }
  };


  const handleFCComplaintCheckbox = (e, complaintId) => {
    const { checked } = e.target;
    
    setFormData(prev => {
      const updatedComplaints = checked
        ? [...prev.patient_condition.complaints, complaintId]
        : prev.patient_condition.complaints.filter(id => id !== complaintId);
      
      return {
        ...prev,
        patient_condition: {
          ...prev.patient_condition,
          complaints: updatedComplaints
        }
      };
    });
  };

  const handlePastHistoryCheckbox = (e, pastHistoryId) => {
    const { checked } = e.target;
    
    setFormData(prev => {
      const updatedPastHistory = checked
        ? [...prev.patient_condition.past_history, pastHistoryId]
        : prev.patient_condition.past_history.filter(id => id !== pastHistoryId);
      
      return {
        ...prev,
        patient_condition: {
          ...prev.patient_condition,
          past_history: updatedPastHistory
        }
      };
    });
  };

  const handlePersonalHOCheckbox = (e, personalHOId) => {
    const { checked } = e.target;
    
    setFormData(prev => {
      const updatedPersonalHO = checked
        ? [...prev.patient_condition.personal_H_O, personalHOId]
        : prev.patient_condition.personal_H_O.filter(id => id !== personalHOId);
      
      return {
        ...prev,
        patient_condition: {
          ...prev.patient_condition,
          personal_H_O: updatedPersonalHO
        }
      };
    });
  };

  const handleUpdate = (fcItem) => {
    setEditingId(extractId(fcItem));

    // Extract complaint IDs
    let complaintIds = [];
    if (fcItem.patient_condition?.complaints) {
      if (Array.isArray(fcItem.patient_condition.complaints)) {
        complaintIds = fcItem.patient_condition.complaints.length > 0 && typeof fcItem.patient_condition.complaints[0] === 'object'
          ? fcItem.patient_condition.complaints.map(c => c.id)
          : fcItem.patient_condition.complaints;
      }
    }

    let pastHistoryIds = [];
    if (fcItem.patient_condition?.past_history) {
      if (Array.isArray(fcItem.patient_condition.past_history)) {
        pastHistoryIds = fcItem.patient_condition.past_history.length > 0 && typeof fcItem.patient_condition.past_history[0] === 'object'
          ? fcItem.patient_condition.past_history.map(p => p.id)
          : fcItem.patient_condition.past_history;
      }
    }

    // Extract personal H/O IDs
    let personalHOIds = [];
    if (fcItem.patient_condition?.personal_H_O) {
      if (Array.isArray(fcItem.patient_condition.personal_H_O)) {
        personalHOIds = fcItem.patient_condition.personal_H_O.length > 0 && typeof fcItem.patient_condition.personal_H_O[0] === 'object'
          ? fcItem.patient_condition.personal_H_O.map(p => p.id)
          : fcItem.patient_condition.personal_H_O;
      }
    }

    setFormData({
      referrer: fcItem.referrer || "",
      patient_name: fcItem.patient_name || "",
      date: convertToDateTimeLocal(fcItem.date),
      age: fcItem.age || "",
      gender: fcItem.gender || "Male",
      address: fcItem.address || "",
      mobile_no: fcItem.mobile_no || "",
      patient_condition: {
        complaints: complaintIds,
        past_history: pastHistoryIds,
        personal_H_O: personalHOIds,
        PA: fcItem.patient_condition?.PA || "Soft, non-tender",
        RS: fcItem.patient_condition?.RS || "Bilateral air entry equal",
        CNS: fcItem.patient_condition?.CNS || "Conscious and oriented",
        CVS: fcItem.patient_condition?.CVS || "S1 S2 heard",
        datetime: fcItem.patient_condition?.datetime || null,
        blood_pressure: fcItem.patient_condition?.blood_pressure || "120/80",
        pulse: fcItem.patient_condition?.pulse || "72",
        blood_sugar: fcItem.patient_condition?.blood_sugar || "100",
        ECG: fcItem.patient_condition?.ECG || "Normal sinus rhythm",
        temperature: fcItem.patient_condition?.temperature || "98.6",
        poller: fcItem.patient_condition?.poller || false,
        icterus: fcItem.patient_condition?.icterus || false,
        LAP: fcItem.patient_condition?.LAP || false,
        edema_feet: fcItem.patient_condition?.edema_feet || false,
        clubbing: fcItem.patient_condition?.clubbing || false,
        cyanosis: fcItem.patient_condition?.cyanosis || false
      },
      Opinion: fcItem.Opinion || "",
      posted_for: fcItem.posted_for || null
    });
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        referrer: formData.referrer,
        patient_name: formData.patient_name,
        date: convertToAPIFormat(formData.date), // Convert to API format
        age: parseInt(formData.age),
        gender: formData.gender,
        address: formData.address,
        mobile_no: parseInt(formData.mobile_no),
        patient_condition: {
          ...formData.patient_condition,
          complaints: formData.patient_condition.complaints,
          personal_H_O: formData.patient_condition.personal_H_O,
          past_history: formData.patient_condition.past_history
        },
        Opinion: formData.Opinion,
        posted_for: formData.posted_for
      };

      if (editingId) {
        await updateFC(editingId, payload);
      } else {
        await createFC(payload);
      }
      resetForm(); // Reset form after successful submit
      setEditingId(null);
      setIsModalOpen(false);
      fetchFC();
      
    } catch (error) {
      console.error("Failed to save FC:", error);
      alert("Failed to save. Please check all fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Filter & Pagination ------------------ */
  const filteredFc = useMemo(() => {
    return fc.filter((fcItem) => {
      const searchText = search.toLowerCase();
      return (
        fcItem?.patient_name?.toLowerCase().includes(searchText) ||
        fcItem?.mobile_no?.toString().includes(searchText) ||
        fcItem?.referrer?.toLowerCase().includes(searchText)
      );
    });
  }, [fc, search]);

  const totalPages = Math.ceil(filteredFc.length / itemsPerPage);
  const paginatedFc = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFc.slice(start, start + itemsPerPage);
  }, [filteredFc, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const actionButtons = (fcItem) => [
    {
      label: "View",
      icon: Eye,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => navigate(`/fitness-view/${extractId(fcItem)}`)
    },
    {
      label: "Print",
      icon: Printer,
      color: "bg-[#008080] hover:bg-teal-700",
      onClick: () => handleFitnessPrint(fcItem)
    },
    {
      label: "Update",
      icon: Pencil,
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => handleUpdate(fcItem)
    },
  ];

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
          <h1 className="text-4xl font-bold text-gray-800">Fitness Certificate Management</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            + Add Fitness Certificate
          </button>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Edit Fitness Certificate" : "Add New Fitness Certificate"}
                </h2>
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Information */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Patient Name *</label>
                    <input
                      type="text"
                      name="patient_name"
                      value={formData.patient_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter patient name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Referrer</label>
                    <input
                      type="text"
                      name="referrer"
                      value={formData.referrer}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Dr. Ahuja"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Age *</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="150"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter age"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="1"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Mobile No *</label>
                    <input
                      type="tel"
                      name="mobile_no"
                      value={formData.mobile_no}
                      onChange={handleInputChange}
                      required
                      pattern="[0-9]{10}"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="10 digit mobile number"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Opinion</label>
                    <input
                      type="text"
                      name="Opinion"
                      value={formData.Opinion}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Admit under observation"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Posted For</label>
                    <input
                      type="text"
                      name="posted_for"
                      value={formData.posted_for || ""}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Posted for"
                    />
                  </div>

                  {/* All Complaints from FC Complaint API */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">All Complaints (FC)</label>
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                      {fcComplaints.map((item) => (
                        <label key={item.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.patient_condition.complaints.includes(item.id)}
                            onChange={(e) => handleFCComplaintCheckbox(e, item.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-700">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Past History Checkboxes */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Past History</label>
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg">
                      {fcPastHistory.map((item) => (
                        <label key={item.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.patient_condition.past_history.includes(item.id)}
                            onChange={(e) => handlePastHistoryCheckbox(e, item.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-700">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Personal H/O Checkboxes */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Personal History</label>
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg">
                      {personalHOList.map((item) => (
                        <label key={item.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.patient_condition.personal_H_O.includes(item.id)}
                            onChange={(e) => handlePersonalHOCheckbox(e, item.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-700">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Systemic Examination Section */}
                  <div className="md:col-span-2">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <span className="bg-blue-600 text-white p-1 rounded-md mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </span>
                        Systemic Examination
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">RS (Respiratory System)</label>
                          <input
                            type="text"
                            name="patient_condition.RS"
                            value={formData.patient_condition.RS}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Respiratory System"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">CVS (Cardiovascular System)</label>
                          <input
                            type="text"
                            name="patient_condition.CVS"
                            value={formData.patient_condition.CVS}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Cardiovascular System"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">CNS (Central Nervous System)</label>
                          <input
                            type="text"
                            name="patient_condition.CNS"
                            value={formData.patient_condition.CNS}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Central Nervous System"
                          />
                        </div>                        
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">PA (Per Abdomen)</label>
                          <input
                            type="text"
                            name="patient_condition.PA"
                            value={formData.patient_condition.PA}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Per Abdomen examination"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Examination & Investigation Section */}
                  <div className="md:col-span-2">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <span className="bg-green-600 text-white p-1 rounded-md mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        Examination & Investigation
                      </h3>
                      
                      {/* Vital Signs */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">BP *</label>
                          <input
                            type="text"
                            name="patient_condition.blood_pressure"
                            value={formData.patient_condition.blood_pressure}
                            required
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="120/80"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">Pulse *</label>
                          <input
                            type="text"
                            name="patient_condition.pulse"
                            value={formData.patient_condition.pulse}
                            required
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="/min"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">Sugar *</label>
                          <input
                            type="text"
                            name="patient_condition.blood_sugar"
                            value={formData.patient_condition.blood_sugar}
                            required
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="mg/dL"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">ECG *</label>
                          <input
                            type="text"
                            name="patient_condition.ECG"
                            value={formData.patient_condition.ECG}
                            required
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Normal/Abnormal"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">Temp *</label>
                          <input
                            type="text"
                            name="patient_condition.temperature"
                            value={formData.patient_condition.temperature}
                            required
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="°F/°C"
                          />
                        </div>
                      </div>

                      {/* Physical Signs Checkboxes */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Physical Signs</label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              name="patient_condition.poller"
                              checked={formData.patient_condition.poller}
                              onChange={handleCheckboxChange}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-gray-700">Poller</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              name="patient_condition.icterus"
                              checked={formData.patient_condition.icterus}
                              onChange={handleCheckboxChange}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-gray-700">Icterus</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              name="patient_condition.LAP"
                              checked={formData.patient_condition.LAP}
                              onChange={handleCheckboxChange}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-gray-700">LAP</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              name="patient_condition.edema_feet"
                              checked={formData.patient_condition.edema_feet}
                              onChange={handleCheckboxChange}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-gray-700">Edema Feet</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              name="patient_condition.clubbing"
                              checked={formData.patient_condition.clubbing}
                              onChange={handleCheckboxChange}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-gray-700">Clubbing</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              name="patient_condition.cyanosis"
                              checked={formData.patient_condition.cyanosis}
                              onChange={handleCheckboxChange}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-gray-700">Cyanosis</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="sticky bottom-0 bg-white pt-3 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsModalOpen(false);
                      setEditingId(null);
                    }}
                    className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : editingId ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <input
              type="text"
              placeholder="Search by name, mobile, referrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Age/Gender</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Referred</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Opinion</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date/Time</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-500">Loading...</td>
                  </tr>
                ) : paginatedFc.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-500">No FC found</td>
                  </tr>
                ) : (
                  paginatedFc.map((fcItem) => (
                    <tr key={extractId(fcItem)} className="hover:bg-purple-50 transition-colors">
                      <td className="px-3 py-3 text-xs text-gray-800 font-medium">{fcItem.patient_name || "-"}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{fcItem.age || "-"}/{fcItem.gender || "-"}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{fcItem.mobile_no || "-"}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{fcItem.referrer || "-"}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 max-w-[200px] truncate">{fcItem.Opinion || "-"}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{fcItem.date || "-"}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          {actionButtons(fcItem).map((btn, i) => {
                            const Icon = btn.icon;
                            return (
                              <button
                                key={i}
                                onClick={btn.onClick}
                                className={`${btn.color} text-white p-1.5 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md`}
                                title={btn.label}
                              >
                                <Icon size={16} />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 py-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg shadow-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}