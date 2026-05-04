import { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, ChevronLeft, ChevronRight, X, Edit, Baby, ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDischarge,updateDischarge } from "../../services/certificates.services";
import { handleDischargePrint } from "../../utils/dischargePrint";

/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;



export default function DischargeIpd() {
  const navigate = useNavigate();

  /* ------------------ State ------------------ */
  const [dischargeIpd,setDischargeIpd] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ------------------ Fetching ------------------ */
  useEffect(() => {
    fetchDischargeIpd();
  }, []);

  const fetchDischargeIpd = async () => {
    try {
      setLoading(true);
      const res = await getDischarge();
      let dischargeIpdData = Array.isArray(res.data) ? res.data : res;
      let filteredDischargeIpd = dischargeIpdData.filter(item => !item.is_delete);
      setDischargeIpd(filteredDischargeIpd);
    } catch (err) {
      setError("Failed to fetch discharge records");
    } finally {
      setLoading(false);
    }
  };
  /* ------------------ Actions ------------------ */

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await updateDischarge(extractId(item), { is_delete: true });
      fetchDischargeIpd();
    } catch (error) { alert("Failed to delete"); }
  };


  /* ------------------ Filter & Pagination ------------------ */
  const filteredDischargeIpd = useMemo(() => {
    return dischargeIpd.filter((item) => {
      const searchText = search.toLowerCase();
      return item?.patient_name?.toLowerCase().includes(searchText) || item?.sr_no?.toLowerCase().includes(searchText);
    });
  }, [dischargeIpd, search]);

  const totalPages = Math.ceil(filteredDischargeIpd.length / itemsPerPage);
  const paginatedDischargeIpd = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDischargeIpd.slice(start, start + itemsPerPage);
  }, [filteredDischargeIpd, currentPage]);

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
          <h1 className="text-4xl font-bold text-gray-800">Discharge Certificate Management</h1>
          <button onClick={()=>navigate("/discharge/new")} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 transition-all shadow-lg">+ Add Discharge Certificate</button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <input type="text" placeholder="Search name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-96 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sr No.</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Patient Name</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Age/Gender</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Mobile</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Daignosis</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Admission Date</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="7" className="py-12 text-center">Loading...</td></tr>
                ) : paginatedDischargeIpd.map((item) => (
                  <tr key={extractId(item)} className="hover:bg-purple-50 transition-colors">
                    <td className="px-4 py-4 text-xs font-medium">{item.sr_no}</td>
                    <td className="px-4 py-4 text-xs font-medium text-gray-800">{item.patient_name}</td>
                    <td className="px-4 py-4 text-xs">{item.age}/{item.gender}</td>
                    <td className="px-4 py-4 text-xs font-medium text-gray-800">{item.mobile}</td>
                    <td className="px-4 py-4 text-xs">
                       {
                        item.diagnosis && item.diagnosis.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {item.diagnosis.map((diag, index) => (
                                <li key={index} className="text-gray-700">{diag.diagnosis_name}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-500 italic">No diagnosis</span>
                        )
                       }
                    </td>
                    <td className="px-4 py-4 text-xs font-medium">{item.datetime_admission}</td>
                    <td className="px-4 py-4 flex gap-2">
                      <button onClick={() => navigate(`/discharge-ipd/view/${extractId(item)}`)} className="bg-blue-600 text-white p-2 rounded-lg flex items-center gap-1">
                        <Eye size={14} />
                        View
                      </button>
                      <button onClick={() => handleDischargePrint(item)} className="bg-emerald-600 text-white p-2 rounded-lg flex items-center gap-1">
                        <Printer size={14} />
                        Print
                      </button>
                      <button onClick={() => navigate(`/discharge/edit/${extractId(item)}`)} className="bg-green-600 text-white p-2 rounded-lg flex items-center gap-1">
                        <Edit size={14} />
                        Update
                      </button>
                      <button onClick={() => handleDelete(item)} className="bg-red-600 text-white p-2 rounded-lg flex items-center gap-1">
                        <Trash2 size={14} />
                        Delete
                      </button>
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

      </div>
    </div>
  );
}