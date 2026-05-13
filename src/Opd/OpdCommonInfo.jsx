import { useEffect, useState } from "react";
import {
  User,
  Calendar,
  Phone,
  MapPin,
  Bed,
  Stethoscope,
  Hash,
  Pencil,
} from "lucide-react";
import { getOpdById } from "../services/opd.services";

const OpdPatientInfo = ({ opdId, data = null }) => {
  const [opd, setOpd] = useState(data);

  useEffect(() => {
    if (data) {
      setOpd(data);
    } else if (opdId) {
      fetchOpd();
    }
  }, [opdId, data]);

  // 🔹 FETCH OPD DETAILS
  const fetchOpd = async () => {
    try {
      const res = await getOpdById(opdId);
      setOpd(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  if (!opd) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm sticky top-0 z-50">
      {/* Left Section: Patient Primary Info */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-bold text-gray-900 truncate leading-none uppercase">
            {opd.patient_name}
          </h2>
          <span className="text-gray-500 font-medium text-sm">
            ({opd.age}Y, {opd.gender})
          </span>
        </div>
      </div>

      {/* Middle Section: Metadata */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[13px] font-medium text-gray-500 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0">
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold text-[10px] uppercase">ID</span>
          <span className="text-gray-800">{opd.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold text-[10px] uppercase">SR</span>
          <span className="text-gray-800">{opd.sr_no}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold text-[10px] uppercase">Phone</span>
          <span className="text-gray-800 font-semibold">{opd.mobile_no}</span>
        </div>
        <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
          <span className="text-gray-400 font-bold text-[10px] uppercase">Doctor</span>
          <span className="text-blue-600 font-bold">{opd.doctor_data?.doctor_name}</span>
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

export default OpdPatientInfo;
