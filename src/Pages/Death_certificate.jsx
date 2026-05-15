import { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, ChevronLeft, ChevronRight, X, Edit, ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDeath, updateDeath, createDeath } from "../services/certificates.services";
import { getDoctors } from "../services/doctor.services";
import { handleDeathPrint } from "../utils/deathPrint";

/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

// Converts "2026-01-13T12:40" to "13-01-2026 12:40 PM"
const formatToApiDate = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  const dateObj = new Date(dateTimeStr);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; 
  return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

// Converts "13-01-2026 12:40 PM" back to "2026-01-13T12:40"
const formatToInputDate = (apiDate) => {
  if (!apiDate) return "";
  try {
    const [datePart, timePart, ampm] = apiDate.split(' ');
    const [day, month, year] = datePart.split('-');
    let [hours, minutes] = timePart.split(':');
    if (ampm === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (ampm === 'AM' && hours === '12') hours = '00';
    return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${minutes}`;
  } catch (e) { return ""; }
};

export default function DeathManagement() {
  const navigate = useNavigate();

  /* ------------------ State ------------------ */
  const [deaths, setDeaths] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState({
    sr_no: "",
    doctor_data: "",
    date: "", 
    name: "",
    age: "",
    gender: "Female",
    address: "",
    admitted_datetime: "",
    expired_datetime: "",
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ------------------ Fetching ------------------ */
  useEffect(() => {
    fetchDeaths();
    fetchDoctors();
  }, []);

  const fetchDeaths = async () => {
    try {
      setLoading(true);
      const res = await getDeath();
      let recordsData = Array.isArray(res.data) ? res.data : res;
      let filteredData = recordsData.filter(item => !item.is_delete);
      setDeaths(filteredData);
    } catch (err) {
      setError("Failed to fetch death records");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(Array.isArray(data.data) ? data.data : data);
    } catch (error) { console.error(error); }
  };

  /* ------------------ Actions ------------------ */
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const localNow = now.toISOString().slice(0, 16);
    
    setFormData({
      sr_no: "",
      doctor_data: "",
      date: localNow,
      name: "",
      age: "",
      gender: "Female",
      address: "",
      admitted_datetime: localNow,
      expired_datetime: localNow,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setIsEditMode(true);
    setSelectedId(extractId(item));
    setFormData({
      ...item,
      doctor_data: item.doctor_data?.id || item.doctor_data,
      date: formatToInputDate(item.date),
      admitted_datetime: formatToInputDate(item.admitted_datetime),
      expired_datetime: formatToInputDate(item.expired_datetime),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await updateDeath(extractId(item), { is_delete: true });
      fetchDeaths();
    } catch (error) { alert("Failed to delete"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        doctor_data: parseInt(formData.doctor_data),
        date: formatToApiDate(formData.date),
        admitted_datetime: formatToApiDate(formData.admitted_datetime),
        expired_datetime: formatToApiDate(formData.expired_datetime),
        is_delete: false
      };

      if (isEditMode) {
        await updateDeath(selectedId, payload);
      } else {
        await createDeath(payload);
      }
      setIsModalOpen(false);
      fetchDeaths();
    } catch (error) { alert("Error saving record"); } 
    finally { setLoading(false); }
  };

  /* ------------------ Filter & Pagination ------------------ */
  const filteredDeath = useMemo(() => {
    return deaths.filter((item) => {
      const searchText = search.toLowerCase();
      return item?.name?.toLowerCase().includes(searchText) || item?.sr_no?.toLowerCase().includes(searchText);
    });
  }, [deaths, search]);

  const totalPages = Math.ceil(filteredDeath.length / itemsPerPage);
  const paginatedDeath = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDeath.slice(start, start + itemsPerPage);
  }, [filteredDeath, currentPage]);

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
          <h1 className="text-4xl font-bold text-gray-800">Death Management</h1>
          <button onClick={handleOpenAddModal} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 transition-all shadow-lg">+ Add Death</button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <input type="text" placeholder="Search patient name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-96 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sr No.</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Patient Name</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Age/Gender</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Expired Date</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Doctor</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="6" className="py-12 text-center">Loading...</td></tr>
                ) : paginatedDeath.map((item) => (
                  <tr key={extractId(item)} className="hover:bg-purple-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium">{item.sr_no}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-800">{item.name}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium">{item.age} Years</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">{item.gender}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-red-600 font-bold">{item.expired_datetime}</td>
                    <td className="px-4 py-4 text-sm">{item.doctor_data?.doctor_name}</td>
                    <td className="px-4 py-4 flex gap-2">
                      <button onClick={() => navigate(`/death-view/${extractId(item)}`)} className="bg-blue-600 text-white p-2 rounded-lg" title="View"><Eye size={18}/></button>
                      <button onClick={() => handleDeathPrint(item)} className="bg-[#008080] text-white p-2 rounded-lg" title="Print"><Printer size={18}/></button>
                      <button onClick={() => handleEditClick(item)} className="bg-green-600 text-white p-2 rounded-lg" title="Edit"><Edit size={18}/></button>
                      <button onClick={() => handleDelete(item)} className="bg-red-600 text-white p-2 rounded-lg" title="Delete"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 py-4">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={20} /></button>
            <span className="text-sm font-medium bg-white px-4 py-2 rounded-lg shadow-sm">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={20} /></button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{isEditMode ? "Edit Death Record" : "Add Death Record"}</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">SR Number</label>
                  <input type="text" name="sr_no" value={formData.sr_no} onChange={(e) => setFormData({...formData, sr_no: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Patient Name</label>
                  <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date & Time</label>
                  <input type="datetime-local" name="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Age</label>
                  <input type="number" name="age" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Gender</label>
                  <select name="gender" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Admitted Date & Time</label>
                  <input type="datetime-local" name="admitted_datetime" value={formData.admitted_datetime} onChange={(e) => setFormData({...formData, admitted_datetime: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Expired Date & Time</label>
                  <input type="datetime-local" name="expired_datetime" value={formData.expired_datetime} onChange={(e) => setFormData({...formData, expired_datetime: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Doctor</label>
                  <select name="doctor_data" value={formData.doctor_data} onChange={(e) => setFormData({...formData, doctor_data: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Doctor</option>
                    {doctors.map(doc => <option key={extractId(doc)} value={extractId(doc)}>{doc.doctor_name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{isEditMode ? "Update" : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}