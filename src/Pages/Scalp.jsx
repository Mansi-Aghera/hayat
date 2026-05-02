import { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, ChevronLeft, ChevronRight, X, ArrowLeft, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getScalps, updateScalp, createScalp } from "../services/certificates.services";
import { getDoctors } from "../services/doctor.services";
/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

export default function Staff() {
  const navigate = useNavigate();

  /* ------------------ State ------------------ */
  const [scalp, setScalp] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add Scalp Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    bed_data: "",
    doctor_data: "",
    sr_no: "",
    date: "",
    datetime_admission: "",
    patient_name: "",
    age: "",
    gender: "male",
    address: "",
    mobile: "",
  });

  // Discharge Modal state
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [dischargeData, setDischargeData] = useState({
    id: "",
    patient_name: "",
    sr_no: "",
    fees: "",
    datetime_discharge: "",
  });

  // search & filter
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Admitted");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ------------------ Fetch data ------------------ */
  useEffect(() => {
    fetchScalps();
    fetchDoctors();
  }, []);

  const fetchScalps = async () => {
    try {
      setLoading(true);
      const data = await getScalps();
      let scalpsData = Array.isArray(data.data) ? data.data : data
      let filteredData = scalpsData.filter(item => !item.is_delete);
      setScalp(filteredData);
      console.log("Fetched scalps:", data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  // Add this useEffect to set default datetime values
    useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setFormData(prev => ({
        ...prev,
        date: defaultDateTime,
        datetime_admission: defaultDateTime
    }));
    }, []);

  /* ------------------ Delete ------------------ */
  const handleDelete = async (scalpItem) => {
    if (!window.confirm(`Are you sure you want to delete ${scalpItem.patient_name}?`)) return;
    try {
      const id = extractId(scalpItem);
      
          await updateScalp(id, {
            is_delete: true,
          });
      fetchScalps();
    } catch (error) {
      alert("Failed to delete scalp");
    }
  };

  /* ------------------ Add Scalp ------------------ */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Format date if not provided
       const formatDate = (datetime) => {
        if (!datetime) {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${day}-${month}-${year} ${hours}:${minutes}`;
        }
        
        const [datePart, timePart] = datetime.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}-${month}-${year} ${timePart}`;
       };

      const payload = {
        bed_data: formData.bed_data,
        doctor_data: parseInt(formData.doctor_data), // Pass doctor ID
        sr_no: formData.sr_no,
        date: formatDate(formData.date),
        datetime_admission: formatDate(formData.datetime_admission),
        patient_name: formData.patient_name,
        age: parseInt(formData.age),
        gender: formData.gender,
        address: formData.address,
        mobile: parseInt(formData.mobile),
        discharge_status: "Admitted"
      };

      await createScalp(payload);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      // Reset form and close modal
      setFormData({
        bed_data: "",
        doctor_data: "",
        sr_no: "",
        date: "",
        datetime_admission: defaultDateTime,
        patient_name: "",
        age: "",
        gender: "male",
        address: "",
        mobile: "",
        discharge_status: "Admitted"
      });
      
      setIsModalOpen(false);
      fetchScalps(); // Refresh the list
      
    } catch (error) {
      console.error("Failed to add scalp:", error);
      alert("Failed to add scalp. Please check all fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Filter Logic ------------------ */
  const filteredScalp = useMemo(() => {
    return scalp.filter((scalpItem) => {
      const searchText = search.toLowerCase();
      
      const matchesSearch = 
        scalpItem?.patient_name?.toLowerCase().includes(searchText) ||
        scalpItem?.mobile?.toString().includes(searchText) ||
        scalpItem?.bed_data?.toString().includes(searchText);

      const matchesType = 
        typeFilter === "all" || 
        scalpItem?.discharge_status === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [scalp, search, typeFilter]);

  /* ------------------ Pagination ------------------ */
  const totalPages = Math.ceil(filteredScalp.length / itemsPerPage);

  const paginatedScalp = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredScalp.slice(start, start + itemsPerPage);
  }, [filteredScalp, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const actionButtons = (scalpItem) => [
    {
      label: scalpItem.discharge_status === "Admitted"
        ? "Discharge"
        : "Readmit",
      icon: scalpItem.discharge_status === "Admitted" ? DollarSign : Eye,
      color:
        scalpItem.discharge_status === "Admitted"
        ? "bg-green-600 hover:bg-green-700"
        : "bg-blue-600 hover:bg-blue-700",
      onClick: () => handleDischargeClick(scalpItem),
    },
    {
      label: "Delete",
      icon: Trash2,
      color: "bg-red-600 hover:bg-red-700",
      onClick: () => handleDelete(scalpItem)
    },
  ];

  const handleDischargeClick = async(scalpItem) => {
    // ✅ READMIT (NO MODAL)
    if (scalpItem.discharge_status !== "Admitted") {
      await updateScalp(extractId(scalpItem), {
        id_discharge: 0,
        discharge_status: "Admitted",
      });
      fetchScalps();
      return;
    }
    // Format current datetime for discharge
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    setDischargeData({
      id: extractId(scalpItem),
      patient_name: scalpItem.patient_name || "",
      sr_no: scalpItem.sr_no || "",
      fees: scalpItem.fees||"",
      datetime_discharge: defaultDateTime,
    });
    setIsDischargeModalOpen(true);
  };

  const handleDischargeInputChange = (e) => {
    const { name, value } = e.target;
    setDischargeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Format datetime for API
      const formatDateTime = (datetime) => {
        if (!datetime) {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = now.getFullYear();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          return `${day}-${month}-${year} ${hours}:${minutes}`;
        }
        
        const [datePart, timePart] = datetime.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}-${month}-${year} ${timePart}`;
      };

      const payload = {
        id_discharge: 1,
        discharge_status: "Discharge",
        fees: dischargeData.fees,
        datetime_discharge: formatDateTime(dischargeData.datetime_discharge),
      };

      await updateScalp(dischargeData.id, payload);
      
      setIsDischargeModalOpen(false);
      fetchScalps(); // Refresh the list
      
    } catch (error) {
      console.error("Failed to discharge patient:", error);
      alert("Failed to discharge patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReceivedUpdate = async (item, value) => {
    let res = await updateScalp(extractId(item), { is_received: value });
    console.log("Received update response:", res);
    fetchScalps();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Scalp Management</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            + Add Scalp
          </button>
        </div>

        {/* Add Scalp Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Add New Scalp</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Information */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      name="patient_name"
                      value={formData.patient_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter patient name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      SR Number *
                    </label>
                    <input
                      type="text"
                      name="sr_no"
                      value={formData.sr_no}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter SR number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Age *
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="150"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter age"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="2"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mobile *
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      required
                      pattern="[0-9]{10}"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="10 digit mobile number"
                    />
                  </div>

                  {/* Hospital Information */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bed Number *
                    </label>
                    <input
                      type="text"
                      name="bed_data"
                      value={formData.bed_data}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., ICU 2, Ward 3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Doctor *
                    </label>
                    <select
                      name="doctor_data"
                      value={formData.doctor_data}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id || doctor._id} value={doctor.id || doctor._id}>
                          {doctor.doctor_name || doctor.name} - {doctor.specialization || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Date
                    </label>
                    <input
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Admission Date/Time
                    </label>
                    <input
                        type="datetime-local"
                        name="datetime_admission"
                        value={formData.datetime_admission}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "Add Scalp"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Discharge Modal */}
        {isDischargeModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Discharge Patient</h2>
                <button
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleDischargeSubmit} className="p-6 space-y-4">
                {/* Read-only fields - ID and Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    value={dischargeData.id}
                    readOnly
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={dischargeData.patient_name}
                    readOnly
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    SR Number
                  </label>
                  <input
                    type="text"
                    value={dischargeData.sr_no}
                    readOnly
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Editable fields */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Discharge Date/Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="datetime_discharge"
                    value={dischargeData.datetime_discharge}
                    onChange={handleDischargeInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fees *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="fees"
                      value={dischargeData.fees}
                      onChange={handleDischargeInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter fees amount"
                    />
                  </div>
                </div>

                {/* Hidden fields that will be sent to API */}
                <input type="hidden" name="id_discharge" value="1" />
                <input type="hidden" name="discharge_status" value="Discharge" />

                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDischargeModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? "Processing..." : "Confirm Discharge"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <input
              type="text"
              placeholder="Search by name, mobile, bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-96 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Admitted">Admitted</option>
              <option value="Discharge">Discharge</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Sr No.
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Age/Gender
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bed No
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  {
                    typeFilter=="Discharge" && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Fees
                      </th>
                    ) 
                  }
                  {
                    typeFilter=="Discharge" && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Recieved
                      </th>
                    )
                  }
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedScalp.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500">
                      No Scalp found
                    </td>
                  </tr>
                ) : (
                  paginatedScalp.map((scalpItem, index) => (
                    <tr
                      key={extractId(scalpItem)}
                      className="hover:bg-purple-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-xs text-gray-700 font-medium">
                        {scalpItem.sr_no || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-800 font-medium">
                            {scalpItem.patient_name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        {scalpItem.age || "-"}/{scalpItem.gender || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        {scalpItem.mobile || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        {scalpItem.doctor_data?.doctor_name || 
                         (typeof scalpItem.doctor_data === 'object' ? scalpItem.doctor_data?.name : "-")}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        {scalpItem.bed_data || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          scalpItem.discharge_status === 'Admitted' 
                            ? 'bg-green-100 text-green-800' 
                            : scalpItem.discharge_status === 'Discharge'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {scalpItem.discharge_status || "Not Specified"}
                        </span>
                      </td>
                      {
                        typeFilter === "Discharge" && (
                          <td className="px-4 py-4 text-xs font-bold text-green-600">
                            {scalpItem.fees || "0"}/-
                          </td>
                        )
                      }
                      {
                        typeFilter === "Discharge" && (
                          <td className="px-4 py-4">
                            <button
                              onClick={() =>
                                handleReceivedUpdate(
                                  scalpItem,
                                  scalpItem.is_received === 1 ? 0 : 1
                                )
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                                scalpItem.is_received === 1
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                              title={scalpItem.is_received === 1 ? "Received: Yes" : "Received: No"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                                  scalpItem.is_received === 1 ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </td>
                        )
                      }
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {actionButtons(scalpItem).map((btn, i) => {
                            const Icon = btn.icon;
                            return (
                              <button
                                key={i}
                                onClick={btn.onClick}
                                className={`${btn.color} text-white p-2 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center hover:shadow-md`}
                                title={btn.label}
                              >
                                {btn.label}
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
          <div className="flex justify-center items-center gap-4 py-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}