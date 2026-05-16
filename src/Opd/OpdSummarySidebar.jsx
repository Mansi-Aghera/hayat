import { Activity, ClipboardList, History, Pill } from "lucide-react";

export default function OpdSummarySidebar({ id, localOpd }) {
  const opd = localOpd;

  if (!opd) return null;

  return (
    <div className="space-y-4 sticky top-24">
      {/* 1. Chief Complaints Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50/50 px-3 py-2 border-b border-blue-100 flex items-center gap-2">
          <ClipboardList size={18} className="text-blue-600" />
          <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">Chief Complaints</h3>
        </div>
        <div className="p-3">
          {opd.chief_complaints?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {opd.chief_complaints.map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 transition-all hover:shadow-sm">
                  <div className="flex flex-col leading-tight">
                    <span className="text-base font-black text-gray-800 uppercase">{item.complaints_data?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-blue-600 font-bold">{item.duration} {item.optional && `| ${item.optional}`}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic text-center">No complaints recorded.</p>
          )}
        </div>
      </div>

      {/* 2. Vitals Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50/50 px-3 py-2 border-b border-blue-100 flex items-center gap-2">
          <Activity size={18} className="text-blue-600" />
          <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">Vitals</h3>
        </div>
        <div className="p-3">
          {opd.vitals ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(opd.vitals).map(([key, value]) => value && (
                <div key={key} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">{key}</div>
                  <div className="text-sm font-black text-blue-600">{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic text-center">No vitals recorded.</p>
          )}
        </div>
      </div>

      {/* 3. Past History Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50/50 px-3 py-2 border-b border-blue-100 flex items-center gap-2">
          <History size={18} className="text-blue-600" />
          <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">Past History</h3>
        </div>
        <div className="p-3">
          {opd.past_history?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {opd.past_history.map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 transition-all hover:shadow-sm">
                  <div className="flex flex-col leading-tight">
                    <span className="text-base font-black text-gray-800 uppercase">{item.past_history_data?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-blue-600 font-bold">{item.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic text-center">No history recorded.</p>
          )}
        </div>
      </div>

    </div>
  );
}
