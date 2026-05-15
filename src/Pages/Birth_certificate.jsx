import { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, ChevronLeft, ChevronRight, X, Edit, Baby, ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBirth, updateBirth, createBirth } from "../services/certificates.services";
import { getDoctors } from "../services/doctor.services";
import { handleBirthPrint } from "../utils/birthPrint";

/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

// Helper: Converts "2026-01-13T12:40" to "13-01-2026 12:40 PM"
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

// Helper: Converts "13-01-2026 12:40 PM" back to "2026-01-13T12:40" for input fields
const formatToInputDate = (apiDate) => {
  if (!apiDate) return "";
  try {
    const [datePart, timePart, ampm] = apiDate.split(' ');
    const [day, month, year] = datePart.split('-');
    let [hours, minutes] = timePart.split(':');
    if (ampm === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (ampm === 'AM' && hours === '12') hours = '00';
    return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${minutes}`;
  } catch (e) {
    return "";
  }
};

export default function BirthManagement() {
  const navigate = useNavigate();

  /* ------------------ State ------------------ */
  const [births, setBirths] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState({
    sr_no: "",
    doctor_data: "",
    date: "", // Will hold YYYY-MM-DDTHH:mm
    name: "",
    gender: "Female",
    bod: "",  // Will hold YYYY-MM-DDTHH:mm
    bot: "",
    weight: "",
    mode: "",
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ------------------ Fetching ------------------ */
  useEffect(() => {
    fetchBirths();
    fetchDoctors();
  }, []);

  const fetchBirths = async () => {
    try {
      setLoading(true);
      const res = await getBirth();
      let birthsData = Array.isArray(res.data) ? res.data : res;
      let filteredBirths = birthsData.filter(item => !item.is_delete);
      setBirths(filteredBirths);
    } catch (err) {
      setError("Failed to fetch birth records");
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
      gender: "Female",
      bod: localNow,
      bot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      weight: "",
      mode: "",
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
      bod: formatToInputDate(item.bod),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await updateBirth(extractId(item), { is_delete: true });
      fetchBirths();
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
        bod: formatToApiDate(formData.bod),
        is_delete: false
      };

      if (isEditMode) {
        await updateBirth(selectedId, payload);
      } else {
        await createBirth(payload);
      }
      setIsModalOpen(false);
      fetchBirths();
    } catch (error) { alert("Error saving record"); } 
    finally { setLoading(false); }
  };

  /* ------------------ Filter & Pagination ------------------ */
  const filteredBirth = useMemo(() => {
    return births.filter((item) => {
      const searchText = search.toLowerCase();
      return item?.name?.toLowerCase().includes(searchText) || item?.sr_no?.toLowerCase().includes(searchText);
    });
  }, [births, search]);

  const totalPages = Math.ceil(filteredBirth.length / itemsPerPage);
  const paginatedBirth = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBirth.slice(start, start + itemsPerPage);
  }, [filteredBirth, currentPage]);

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
          <h1 className="text-4xl font-bold text-gray-800">Birth Management</h1>
          <button onClick={handleOpenAddModal} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 transition-all shadow-lg">+ Add Birth</button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <input type="text" placeholder="Search child name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-96 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sr No.</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Child Name</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">BOD / Time</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Gender</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Weight</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Doctor</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="7" className="py-12 text-center">Loading...</td></tr>
                ) : paginatedBirth.map((item) => (
                  <tr key={extractId(item)} className="hover:bg-purple-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium">{item.sr_no}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-800">{item.name}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium">{item.bod}</div>
                      <div className="text-[10px] text-indigo-500 font-bold uppercase">{item.bot}</div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {item.gender}
                        </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">{item.weight} kg</td>
                    <td className="px-4 py-4 text-sm">{item.doctor_data?.doctor_name}</td>
                    <td className="px-4 py-4 flex gap-2">
                      <button onClick={() => navigate(`/birth-view/${extractId(item)}`)} className="bg-blue-600 text-white p-2 rounded-lg" title="View"><Eye size={18}/></button>
                      <button onClick={() => handleBirthPrint(item)} className="bg-[#008080] text-white p-2 rounded-lg" title="Print"><Printer size={18}/></button>
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
                <h2 className="text-2xl font-bold">{isEditMode ? "Edit Record" : "Add Birth"}</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">SR Number</label>
                  <input type="text" name="sr_no" value={formData.sr_no} onChange={(e) => setFormData({...formData, sr_no: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Mother/Patient Name</label>
                  <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date & Time</label>
                  <input type="datetime-local" name="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Birth Date & Time</label>
                  <input type="datetime-local" name="bod" value={formData.bod} onChange={(e) => setFormData({...formData, bod: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Birth Time</label>
                  <input type="time" name="bot" value={formData.bot} onChange={(e) => setFormData({...formData, bot: e.target.value})} className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Delivery Mode</label>
                  <input type="text" name="mode" value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Doctor</label>
                  <select name="doctor_data" value={formData.doctor_data} onChange={(e) => setFormData({...formData, doctor_data: e.target.value})} required className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Doctor</option>
                    {doctors.map(doc => <option key={extractId(doc)} value={extractId(doc)}>{doc.doctor_name || doc.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Gender</label>
                    <select name="gender" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <input type="text" name="weight" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3">
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