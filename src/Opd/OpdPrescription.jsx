import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { getOpdById } from "../services/opd.services";

const OpdPrescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opd, setOpd] = useState(null);

  const { search } = useLocation();
  const printParam = new URLSearchParams(search).get("print");

  useEffect(() => {
    getOpdById(id).then((res) => {
      setOpd(res.data);
    });
  }, [id]);

  // Auto-print if print parameter is true
  useEffect(() => {
    if (opd && printParam === "true") {
      const timer = setTimeout(() => {
        window.print();
      }, 1000); // Wait for content/styles to load
      return () => clearTimeout(timer);
    }
  }, [opd, printParam]);

  if (!opd) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen font-sans text-gray-800 print:bg-white print:p-0 print:m-0">
      {/* INTERNAL PRINT STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything outside the prescription component */
          header, nav, aside, footer, .print-hidden { 
            display: none !important; 
          }
          
          /* Remove browser headers and footers (Localhost, Date, Title) */
          @page { 
            margin: 5mm; 
            size: auto;
          }
          
          body { 
            background: white; 
            margin: 0; 
          }

          /* Ensure the container takes full width and removes shadows */
          .prescription-card {
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* ===== ACTION BAR (Hidden on Print) ===== */}
      <div className="flex gap-2 mb-4 print-hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all"
        >
          <Printer size={18} /> Print Prescription
        </button>
      </div>

      {/* ===== PRESCRIPTION CONTAINER ===== */}
      <div className="prescription-card bg-white shadow-sm border rounded-xl overflow-hidden print:rounded-none">
        
        {/* 1. PATIENT HEADER */}
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold uppercase text-gray-900 tracking-tight">
                {opd.patient_name} <span className="text-gray-500 font-normal">({opd.age} / {opd.gender})</span>
              </h2>
              <p className="text-sm font-medium text-gray-600">{opd.mobile_no}</p>
              <p className="text-xs text-gray-500 leading-tight uppercase">{opd.address}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">UHID: P{opd.id}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-600">
                Date: <span className="text-gray-900">{opd.date}</span>
              </div>
              <div className="text-xs font-bold text-gray-500 uppercase">Bill: {opd.id}</div>
              <div className="text-sm font-bold text-indigo-700 mt-1 uppercase">Dr: {opd.doctor_data?.doctor_name}</div>
            </div>
          </div>
        </div>

        {/* 2. THREE-COLUMN CARDS (Complaints, Vitals, Exam) */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50/50 border-b">
          
          <div className="bg-white border rounded-xl p-3 shadow-sm">
            <h4 className="text-[13px] font-bold text-indigo-900 mb-1 border-b pb-1">Chief Complaints:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              {opd.chief_complaints?.length > 0 ? opd.chief_complaints.map((c, i) => (
                <p key={i}>• {c.complaints_data.name}</p>
              )) : "No Fresh Complaints"}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-3 shadow-sm">
            <h4 className="text-[13px] font-bold text-indigo-900 mb-1 border-b pb-1">Vitals:</h4>
            <div className="grid grid-cols-1 gap-1 text-[11px] text-gray-600">
              <p><span className="font-bold text-gray-400">BP:</span> {opd.vitals?.BP}</p>
              <p><span className="font-bold text-gray-400">PR:</span> {opd.vitals?.PR || "--"}</p>
              <p><span className="font-bold text-gray-400">SPO2:</span> {opd.vitals?.SPO}%</p>
              <p><span className="font-bold text-gray-400">Sugar:</span> {opd.vitals?.Sugar}</p>
              <p><span className="font-bold text-gray-400">Weight:</span> {opd.vitals?.Weight} kg</p>
              <p><span className="font-bold text-gray-400">Temp:</span> {opd.vitals?.Temp}°F</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-3 shadow-sm">
            <h4 className="text-[13px] font-bold text-indigo-900 mb-1 border-b pb-1">Examination:</h4>
            <div className="text-[11px] text-gray-600 space-y-1">
               <p><span className="font-bold text-gray-400">RS:</span> {opd.examination?.RS}</p>
               <p><span className="font-bold text-gray-400">CVS:</span> {opd.examination?.CVS}</p>
               <p><span className="font-bold text-gray-400">CNS:</span> {opd.examination?.CNS}</p>
               <p><span className="font-bold text-gray-400">PA:</span> {opd.examination?.PA}</p>
            </div>
          </div>
        </div>

        {/* 3. HISTORY & DIAGNOSIS */}
        <div className="p-4 space-y-3">
          <div className="border rounded-lg px-3 py-2 text-sm bg-white">
            <span className="font-bold text-gray-700">Past History:</span>
            <span className="ml-2 text-gray-600 italic">
              {opd.past_history?.map(p => p.past_history_data.name).join(", ") || "None"}
            </span>
          </div>

          <div className="border rounded-lg px-3 py-2 text-sm bg-white">
            <span className="font-bold text-gray-700">Diagnosis:</span>
            <span className="ml-2 text-gray-600 font-medium">
              {opd.diagnosis_detail?.map(d => d.diagnosis_data.diagnosis_name).join(", ") || "None"}
            </span>
          </div>

          {/* 4. MEDICINE TABLE (Rx) */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-2 border-r w-12 text-center">SR</th>
                  <th className="px-4 py-2 border-r">Medicine Name</th>
                  <th className="px-4 py-2 border-r text-center">Dose</th>
                  <th className="px-4 py-2 border-r">Timing</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {opd.given_medicine?.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-r text-center text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 border-r font-bold text-indigo-900">{m.medicine_data.medicine_name}</td>
                    <td className="px-4 py-2 border-r text-center font-mono bg-yellow-50/50">{m.doses}</td>
                    <td className="px-4 py-2 border-r text-gray-600 text-xs">{m.intake_type}</td>
                    <td className="px-4 py-2 text-center font-bold text-gray-700">{m.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. FOOTER DETAILS */}
          <div className="space-y-1 text-sm pt-2">
            <p><span className="font-bold">Advice:</span> <span className="text-gray-600">{opd.adviced?.map(a => a.opinion_details_data.opinion_name).join(", ") || "-"}</span></p>
            <p><span className="font-bold">Next Visit:</span> <span className="text-gray-600">{opd.nextVisit?.map(d => d.visit).join(", ") || "-"}</span></p>
            <p><span className="font-bold">Noted:</span> <span className="text-gray-600">{opd.Note?.map(n => n.opinion_details_data.opinion_name).join(", ") || "-"}</span></p>
          </div>
        </div>

        {/* 6. SIGNATURE */}
        <div className="p-8 mt-10 flex justify-end">
          <div className="text-center border-t-2 border-dotted border-gray-300 pt-3 min-w-[220px]">
            <p className="font-bold text-indigo-900 text-lg">Dr. {opd.doctor_data?.doctor_name}</p>
            <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Authorized Medical Officer</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OpdPrescription;