import { useEffect, useState } from "react";
import { getOpdById, deleteOpdComplaint, deleteOpdPastHistory } from "../services/opd.services";
import { Trash2, Activity, AlertCircle, History } from "lucide-react";

export default function OpdSummarySidebar({ id }) {
  const [opd, setOpd] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOpd();
    
    // Listen for updates from other components
    const handleUpdate = () => fetchOpd();
    window.addEventListener('opd_info_updated', handleUpdate);
    window.addEventListener('opd_visit_updated', handleUpdate);
    
    return () => {
      window.removeEventListener('opd_info_updated', handleUpdate);
      window.removeEventListener('opd_visit_updated', handleUpdate);
    };
  }, [id]);

  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      setOpd(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleDeleteComplaint = async (index) => {
    try {
      setLoading(true);
      await deleteOpdComplaint(id, index);
      fetchOpd();
      window.dispatchEvent(new Event('opd_info_updated'));
    } catch (error) {
      alert("Failed to delete complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (index) => {
    try {
      setLoading(true);
      await deleteOpdPastHistory(id, index);
      fetchOpd();
      window.dispatchEvent(new Event('opd_info_updated'));
    } catch (error) {
      alert("Failed to delete history");
    } finally {
      setLoading(false);
    }
  };

  if (!opd) return null;

  return (
    <div className="sticky top-[120px] self-start space-y-6">
      {/* 1. Complaints Summary Card - Changed to Blue Theme */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
          <AlertCircle size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Chief Complaints</h3>
        </div>
        <div className="p-4">
          {opd.chief_complaints?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {opd.chief_complaints.map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 transition-all hover:shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-800">{item.complaints_data?.name}</span>
                    <span className="text-[10px] text-blue-600 font-medium">{item.duration}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteComplaint(index)}
                    className="text-red-400 hover:text-red-600 transition-colors ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No complaints added.</p>
          )}
        </div>
      </div>

      {/* 2. Vitals Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
          <Activity size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Current Vitals</h3>
        </div>
        <div className="p-4">
          {opd.vitals ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(opd.vitals).map(([key, value]) => (
                <div key={key} className="flex flex-col border-b border-gray-50 pb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{key}</span>
                  <span className="text-sm font-black text-blue-700">{value || '--'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No vitals recorded yet.</p>
          )}
        </div>
      </div>

      {/* 3. Past History Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-purple-50/50 px-4 py-3 border-b border-purple-100 flex items-center gap-2">
          <History size={18} className="text-purple-600" />
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Past History</h3>
        </div>
        <div className="p-4">
          {opd.past_history?.length > 0 ? (
            <div className="space-y-2">
              {opd.past_history.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-purple-50/30 border border-purple-50 rounded-lg px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">{item.past_history_data?.name}</span>
                    <span className="text-[10px] text-purple-500 font-medium">{item.duration}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteHistory(index)}
                    className="text-purple-200 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No past history recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
