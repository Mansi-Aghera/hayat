import { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, ChevronLeft, ChevronRight, X, Edit, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getExpenditure, updateExpenditure, createExpenditure } from "../services/certificates.services";
import { getDoctors } from "../services/doctor.services";

/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

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

export default function ExpenditureManagement() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    sr_no: "",
    doctor_data: "",
    date: "", 
    name: "",
    age: "",
    gender: "Female",
    suffering: "",
    needs: "",
  });

  useEffect(() => {
    fetchRecords();
    fetchDoctors();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await getExpenditure();
      let recordsData = Array.isArray(res.data) ? res.data : res;
      let filteredData = recordsData.filter(item => !item.is_delete);
      setRecords(filteredData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(Array.isArray(data.data) ? data.data : data);
    } catch (e) { console.error(e); }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    const now = new Date().toISOString().slice(0, 16);
    setFormData({
      sr_no: "", doctor_data: "", date: now, name: "",
      age: "", gender: "Female", suffering: "", needs: ""
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
    });
    setIsModalOpen(true);
  };

  async function handleDelete(item) {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
        try {  
          const id = extractId(item);
            await updateExpenditure(id, {
              is_delete: true,
            });
            fetchRecords();
        } catch (error) {
          alert("Failed to delete Expenditure");
        }
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        doctor_data: parseInt(formData.doctor_data),
        date: formatToApiDate(formData.date),
        is_delete: false
      };
      isEditMode ? await updateExpenditure(selectedId, payload) : await createExpenditure(payload);
      setIsModalOpen(false);
      fetchRecords();
    } catch (err) { alert("Error saving"); } finally { setLoading(false); }
  };

  const filtered = records.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">Expenditure Management</h1>
          <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition-all">+ New Expenditure</button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <input type="text" placeholder="Search patient..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-md px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sr No.</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Patient Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Suffering</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Need/Expenditure</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((item) => (
                <tr key={extractId(item)} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.sr_no}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.suffering}</td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">{item.needs}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => navigate(`/expenditure-view/${extractId(item)}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={20}/></button>
                    <button onClick={() => handleEditClick(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Edit size={20}/></button>
                    <button onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={20}/></button>                 
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">{isEditMode ? "Edit Record" : "Add New Record"}</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">SR No</label><input type="text" name="sr_no" value={formData.sr_no} onChange={(e) => setFormData({...formData, sr_no: e.target.value})} className="w-full rounded-lg border p-2" required /></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Date & Time</label><input type="datetime-local" name="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full rounded-lg border p-2" required /></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Patient Name</label><input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border p-2" required /></div>
                <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Age</label><input type="number" name="age" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full rounded-lg border p-2" required /></div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Gender</label>
                  <select name="gender" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full rounded-lg border p-2">
                    <option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Doctor</label>
                  <select name="doctor_data" value={formData.doctor_data} onChange={(e) => setFormData({...formData, doctor_data: e.target.value})} className="w-full rounded-lg border p-2" required>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={extractId(d)} value={extractId(d)}>{d.doctor_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2"><label className="text-sm font-semibold text-slate-700">Chief Complaint (Suffering)</label><input type="text" name="suffering" value={formData.suffering} onChange={(e) => setFormData({...formData, suffering: e.target.value})} className="w-full rounded-lg border p-2" placeholder="e.g. Chest Pain" required /></div>
                <div className="space-y-1 md:col-span-2"><label className="text-sm font-semibold text-slate-700">Expenditure Need (Examination/Needs)</label><input type="text" name="needs" value={formData.needs} onChange={(e) => setFormData({...formData, needs: e.target.value})} className="w-full rounded-lg border p-2" placeholder="e.g. ECG / MRI" required /></div>
                
                <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border rounded-lg font-medium text-slate-600">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700">Save Record</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}