import { useEffect, useState } from "react";
import { getIpdById } from "../services/ipd.services";

export default function IpdFooterSummary({ id }) {
  const [ipd, setIpd] = useState(null);

  useEffect(() => {
    fetchIpd();
    
    // Listen for updates from IpdInfo component
    window.addEventListener('ipd_info_updated', fetchIpd);
    return () => window.removeEventListener('ipd_info_updated', fetchIpd);
  }, [id]);

  const fetchIpd = async () => {
    try {
      const res = await getIpdById(id);
      const ipdData = Array.isArray(res.data) ? res.data[0] : res.data;
      setIpd(ipdData);
    } catch (error) {
      console.error("Error fetching IPD for summary:", error);
    }
  };

  // FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      dateString = dateString.replace(/\s+/g, " ").trim();
      const match = dateString.match(
        /(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}) (AM|PM)/i
      );

      if (match) {
        let [, day, month, year, hour, minute, period] = match;
        hour = parseInt(hour, 10);
        if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
        const date = new Date(year, month - 1, day, hour, minute);
        return date.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      const date = new Date(dateString);
      return isNaN(date) ? dateString : date.toLocaleString("en-IN");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'occupied': return 'text-red-600 bg-red-50';
      case 'available':
      case 'vacant': return 'text-green-600 bg-green-50';
      case 'reserved': return 'text-yellow-600 bg-yellow-50';
      case 'maintenance': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (!ipd) return null;

  return (
    <div className="space-y-5 mt-6 mb-8 max-w-7xl">
      {/* Services Card - Only keep this if services exist */}
      {ipd.service_id && ipd.service_id.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h4 className="font-black text-sm text-gray-800 uppercase tracking-[0.2em]">
              Selected Services ({ipd.service_id.length})
            </h4>
          </div>
          <div className={`grid ${ipd.service_id.length > 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-3`}>
            {ipd.service_id.map((service, index) => (
              <div
                key={service.id || index}
                className="flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-100 group hover:border-blue-200 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Service</span>
                  <span className="text-gray-900 font-black text-sm uppercase">
                    {service.service_name || "Service"}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Price</span>
                  <span className="font-black text-blue-600 text-lg">
                    ₹{service.service_price || "0"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

}
