import { useEffect, useState } from "react";
import {
  User,
  Calendar,
  Phone,
  MapPin,
  Bed,
  Stethoscope,
  Hash
} from "lucide-react";
import { getIpdById } from "../services/ipd.services";

const IpdPatientInfo = ({ ipdId }) => {
  const [ipd, setIpd] = useState(null);
   useEffect(() => {
    fetchIpd();
  }, [ipdId]);

  // 🔹 FETCH IPD DETAILS
  const fetchIpd = async () => {
    try {
      const res = await getIpdById(ipdId);
      setIpd(res.data)
      console.log(res.data)
    }catch(err){
        console.log(err)
    }
  }

  if (!ipd) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm sticky top-0 z-50">
      {/* Left Section: Patient Primary Info */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-bold text-gray-900 truncate leading-none uppercase">
            {ipd.patient_name}
          </h2>
          <span className="text-gray-500 font-medium text-sm">
            ({ipd.age}Y, {ipd.gender})
          </span>
        </div>
      </div>

      {/* Middle Section: Metadata */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[13px] font-medium text-gray-500 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0">
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold text-[10px] uppercase">ID</span>
          <span className="text-gray-800">{ipd.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold text-[10px] uppercase">SR</span>
          <span className="text-gray-800">{ipd.sr_no}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold text-[10px] uppercase">Bed</span>
          <span className="text-gray-800">{ipd.bed_data?.bed_number || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold text-[10px] uppercase">Doctor</span>
          <span className="text-gray-800">{ipd.doctor_data?.doctor_name}</span>
        </div>
      </div>
    </div>
  );
};

const Info = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-blue-600 mt-1">{icon}</div>
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  </div>
);

export default IpdPatientInfo;
