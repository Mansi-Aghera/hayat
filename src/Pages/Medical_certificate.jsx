import { useEffect, useState } from "react";
import { Eye, X, Edit, Search, Plus, Trash2, ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMedical, updateMedical, createMedical } from "../services/certificates.services";
import { getDoctors } from "../services/doctor.services";
import { handleMedicalPrint } from "../utils/medicalPrint";

/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

// Converts YYYY-MM-DD from input to DD-MM-YYYY for API
const formatToApiDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

// Converts DD-MM-YYYY from API to YYYY-MM-DD for input
const formatToInputDate = (dateStr) => {
  if (!dateStr) return "";
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
};

export default function MedicalManagement() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    sr_no: "", doctor_data: "", date: "", name: "", age: "", gender: "Male",
    diagnosis: "", treatment_basis: "OPD BASIS",
    treatment_from: "", treatment_to: "",
    rest_for: "", rest_from: "", rest_to: "",
    note: ""
  });

  // Auto-calculate rest days whenever rest_from or rest_to changes
  useEffect(() => {
    if (formData.rest_from && formData.rest_to) {
      const start = new Date(formData.rest_from);
      const end = new Date(formData.rest_to);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        setFormData(prev => ({ ...prev, rest_for: `${diffDays} DAYS` }));
      }
    }
  }, [formData.rest_from, formData.rest_to]);

  useEffect(() => {
    fetchRecords();
    fetchDoctors();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await getMedical();
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
    setSelectedId(null);
    setFormData({
      sr_no: "", doctor_data: "", date: new Date().toISOString().split('T')[0], 
      name: "", age: "", gender: "Male", diagnosis: "", treatment_basis: "OPD BASIS",
      treatment_from: "", treatment_to: "", rest_for: "", rest_from: "", rest_to: "", note: ""
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setIsEditMode(true);
    setSelectedId(extractId(item));
    setFormData({
      ...item,
      doctor_data: item.doctor_data?.id || item.doctor_data,
      // Convert all API dates (DD-MM-YYYY) to Input dates (YYYY-MM-DD)
      date: formatToInputDate(item.date),
      treatment_from: formatToInputDate(item.treatment_from),
      treatment_to: formatToInputDate(item.treatment_to),
      rest_from: formatToInputDate(item.rest_from),
      rest_to: formatToInputDate(item.rest_to),
    });
    setIsModalOpen(true);
  };

  async function handleDelete(item) {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
        try {  
          const id = extractId(item);
            await updateMedical(id, {
              is_delete: true,
            });
            fetchRecords();
        } catch (error) {
          alert("Failed to delete Medical Certificate ");
        }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { 
        ...formData, 
        date: formatToApiDate(formData.date),
        treatment_from: formatToApiDate(formData.treatment_from),
        treatment_to: formatToApiDate(formData.treatment_to),
        rest_from: formatToApiDate(formData.rest_from),
        rest_to: formatToApiDate(formData.rest_to),
        doctor_data: parseInt(formData.doctor_data),
        is_delete: false
      };
      
      if (isEditMode) {
        await updateMedical(selectedId, payload);
      } else {
        let res = await createMedical(payload);
        console.log("Created Record:", res);
      }
      
      setIsModalOpen(false);
      fetchRecords();
    } catch (err) { alert("Error saving record"); } finally { setLoading(false); }
  };

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
          <h1 className="text-3xl font-bold text-slate-800">Medical Certificate</h1>
          <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition-all">+ New Certificate</button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <input 
            type="text" 
            placeholder="Search patient..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full max-w-md px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sr No.</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Patient Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Diagnosis</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rest Period</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records
                .filter((i) => (i.name || "").toLowerCase().includes(search.toLowerCase()))
                .map((item) => (
                <tr key={extractId(item)} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{item.sr_no}</td>
                  <td className="px-6 py-4 text-sm font-bold">{item.name}</td>
                  <td className="px-6 py-4 text-sm">{item.diagnosis}</td>
                  <td className="px-6 py-4 text-sm text-indigo-600 font-bold">{item.rest_for}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => navigate(`/medical-view/${extractId(item)}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={20}/></button>
                    <button onClick={() => handleMedicalPrint(item)} className="p-2 text-[#008080] hover:bg-teal-50 rounded-lg" title="Print"><Printer size={20}/></button>
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
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">{isEditMode ? "Edit Certificate" : "New Sick Certificate"}</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-slate-500">SR NO</label><input type="text" value={formData.sr_no} onChange={(e) => setFormData({...formData, sr_no: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-500">CERTIFICATE DATE</label><input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full border p-2 rounded-lg" required /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-500">PATIENT NAME</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg" required /></div>
                
                <div className="md:col-span-3 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Age</label><input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full border p-2 rounded-lg" required /></div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Gender</label>
                        <select name="gender" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>
                <div className="md:col-span-3 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-500">TREATMENT FROM</label><input type="date" value={formData.treatment_from} onChange={(e) => setFormData({...formData, treatment_from: e.target.value})} className="w-full border p-2 rounded-lg" required /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-500">TREATMENT TO</label><input type="date" value={formData.treatment_to} onChange={(e) => setFormData({...formData, treatment_to: e.target.value})} className="w-full border p-2 rounded-lg" required /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-500">BASIS</label><input type="text" value={formData.treatment_basis} onChange={(e) => setFormData({...formData, treatment_basis: e.target.value})} className="w-full border p-2 rounded-lg" /></div>
                </div>

                <div className="md:col-span-3 grid grid-cols-3 gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="space-y-1"><label className="text-xs font-bold text-indigo-600">REST FROM</label><input type="date" value={formData.rest_from} onChange={(e) => setFormData({...formData, rest_from: e.target.value})} className="w-full border p-2 rounded-lg" required /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-indigo-600">REST TO</label><input type="date" value={formData.rest_to} onChange={(e) => setFormData({...formData, rest_to: e.target.value})} className="w-full border p-2 rounded-lg" required /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-indigo-600">REST FOR (AUTO)</label><input type="text" value={formData.rest_for} className="w-full border p-2 rounded-lg bg-white font-bold text-indigo-700" readOnly /></div>
                </div>

                <div className="md:col-span-3 space-y-1"><label className="text-xs font-bold text-slate-500">DIAGNOSIS</label><input type="text" value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} className="w-full border p-2 rounded-lg" required /></div>
                <div className="md:col-span-3 space-y-1"><label className="text-xs font-bold text-slate-500">FITNESS NOTE</label><input type="text" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="NOW PATIENT IS FIT TO JOIN THE DUTIES WEF DATE..." /></div>
                
                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-slate-500">DOCTOR</label>
                  <select value={formData.doctor_data} onChange={(e) => setFormData({...formData, doctor_data: e.target.value})} className="w-full border p-2 rounded-lg" required>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={extractId(d)} value={extractId(d)}>{d.doctor_name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-3 pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all">
                    {isEditMode ? "Update Certificate" : "Save Certificate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}