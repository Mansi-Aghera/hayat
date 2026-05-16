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

  const currentDateTime = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen font-sans text-gray-800 print:bg-white print:p-0 print:m-0">
      {/* SURGICAL PRINT STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* HIDE SIDEBAR, ADMIN HEADER, AND ACTION BUTTONS */
          aside, 
          nav, 
          .print-hidden,
          div[class*="md:hidden flex items-center p-4 bg-white border-b"],
          .flex.h-screen.overflow-hidden > div:first-child,
          .bg-indigo-800,
          button {
            display: none !important;
          }

          /* HIDE SCROLLBARS */
          * {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
          }
          
          @page { 
            margin: 0; 
            size: auto;
          }
          
          body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .prescription-content {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
          }
        }

        /* Typography matching Image 1 */
        .rx-title { font-weight: 800; color: #000; font-size: 18px; }
        .section-label { font-weight: 900; font-size: 13px; color: #000; text-transform: uppercase; }
        .data-text { font-size: 13px; color: #000; line-height: 1.5; }
        .rx-mark { font-size: 24px; font-weight: 900; margin-bottom: 8px; color: #000; }
        
        /* Medicine table matching Image 2 */
        .medicine-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
          border: 1.5px solid #000;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .medicine-table th { 
          background-color: #d1d5db !important; 
          color: #000; 
          font-weight: 900; 
          font-size: 12px;
          text-align: center;
          padding: 10px;
          border: 1.5px solid #000;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .medicine-table td { 
          border: 1.5px solid #000;
          padding: 12px 10px;
          font-size: 12px;
          vertical-align: middle;
          color: #000;
        }
        .med-name { font-weight: 800; font-size: 13px; text-transform: uppercase; color: #000; }
        .med-sub { font-size: 11px; color: #333; margin-top: 4px; font-weight: 500; }
      `}} />

      {/* ===== ACTION BAR (Hidden on Print) ===== */}
      <div className="flex gap-2 mb-4 print-hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-all text-sm"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all text-sm"
        >
          <Printer size={18} /> Print Prescription
        </button>
      </div>

      {/* ===== PRESCRIPTION CONTENT ===== */}
      <div className="prescription-content bg-white shadow-sm border rounded-xl p-8 print:shadow-none print:border-none print:rounded-none">
        
        {/* 1. PATIENT HEADER BOX */}
        <div className="border border-black rounded-xl p-4 mb-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="rx-title">
                {opd.id} : {opd.patient_name} ({opd.age}/{opd.gender})
              </h1>
              <p className="data-text font-bold">
                {opd.address} / {opd.mobile_no}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="data-text font-bold">{opd.date} {opd.time || ""}</p>
              <p className="data-text font-bold uppercase">UHID : HP{opd.id}</p>
            </div>
          </div>
        </div>

        {/* 2. THREE-COLUMN DATA */}
        {/* 2. THREE-COLUMN DATA - Only show if at least one has data */}
        {(opd.chief_complaints?.length > 0 || 
          (opd.vitals && Object.values(opd.vitals).some(v => v && v !== "-")) || 
          (opd.examination && Object.values(opd.examination).some(v => v && v !== "-"))) && (
          <div className="grid grid-cols-3 gap-6 mb-10">
            {opd.chief_complaints?.length > 0 && (
              <div>
                <h4 className="section-label mb-2">CHIEF COMPLAINTS:</h4>
                <div className="data-text">
                  {opd.chief_complaints.map((c, i) => (
                    <p key={i}>{c.complaints_data?.name}</p>
                  ))}
                </div>
              </div>
            )}

            {opd.vitals && Object.values(opd.vitals).some(v => v && v !== "-") && (
              <div>
                <h4 className="section-label mb-2">VITALS:</h4>
                <div className="data-text">
                  {opd.vitals.BP && opd.vitals.BP !== "-" && <p>BP: {opd.vitals.BP}</p>}
                  {opd.vitals.PR && opd.vitals.PR !== "-" && <p>PR: {opd.vitals.PR}</p>}
                  {opd.vitals.SPO && opd.vitals.SPO !== "-" && <p>SPO2: {opd.vitals.SPO}</p>}
                  {opd.vitals.Sugar && opd.vitals.Sugar !== "-" && <p>Sugar: {opd.vitals.Sugar}</p>}
                  {opd.vitals.Weight && opd.vitals.Weight !== "-" && <p>Weight: {opd.vitals.Weight}</p>}
                </div>
              </div>
            )}

            {opd.examination && Object.values(opd.examination).some(v => v && v !== "-") && (
              <div>
                <h4 className="section-label mb-2">EXAMINATION:</h4>
                <div className="data-text">
                  {opd.examination.RS && opd.examination.RS !== "-" && <p>RS: {opd.examination.RS}</p>}
                  {opd.examination.CVS && opd.examination.CVS !== "-" && <p>CVS: {opd.examination.CVS}</p>}
                  {opd.examination.CNS && opd.examination.CNS !== "-" && <p>CNS: {opd.examination.CNS}</p>}
                  {opd.examination.PA && opd.examination.PA !== "-" && <p>PA: {opd.examination.PA}</p>}
                  {opd.examination.Other && opd.examination.Other !== "-" && <p>Other: {opd.examination.Other}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. PAST HISTORY & DIAGNOSIS */}
        {(opd.past_history?.length > 0 || opd.diagnosis_detail?.length > 0) && (
          <div className="mb-10 space-y-4">
            {opd.past_history?.length > 0 && (
              <p className="data-text font-bold flex gap-2">
                <span>PAST HISTORY:</span>
                <span className="font-normal">
                  {opd.past_history.map(p => p.past_history_data?.name).join(", ")}
                </span>
              </p>
            )}
            
            {opd.diagnosis_detail?.length > 0 && (
              <p className="data-text font-bold flex gap-2">
                <span>DIAGNOSIS:</span>
                <span className="font-normal">
                  {opd.diagnosis_detail.map(d => d.diagnosis_data?.diagnosis_name).join(", ")}
                </span>
              </p>
            )}
          </div>
        )}

        {/* 4. MEDICINE SECTION (Matching Image 2) */}
        {opd.given_medicine?.length > 0 && (
          <div className="mb-10">
            <div className="rx-mark">Rx:</div>
            <table className="medicine-table">
              <thead>
                <tr>
                  <th className="w-12">Sr</th>
                  <th>Medicine</th>
                  <th className="w-32">Meal Time</th>
                  <th className="w-24">Dosage</th>
                  <th className="w-16">Qty</th>
                </tr>
              </thead>
              <tbody>
                {opd.given_medicine.map((m, i) => {
                  const doseParts = m.doses?.split('-') || [];
                  return (
                    <tr key={i}>
                      <td className="text-center">{i + 1}</td>
                      <td>
                        <p className="med-name">{m.medicine_data?.medicine_name}</p>
                        {doseParts.length === 3 && (
                          <p className="med-sub">
                            Morning: {doseParts[0]} | Afternoon: {doseParts[1]} | Evening: {doseParts[2]}
                          </p>
                        )}
                      </td>
                      <td className="text-center font-medium">{m.intake_type}</td>
                      <td className="text-center font-bold">{m.doses}</td>
                      <td className="text-center font-bold">{m.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. ADVICE / OPINION */}
        {opd.adviced?.length > 0 && (
          <div className="mb-10">
            <h4 className="section-label mb-2">ADVICE / OPINION:</h4>
            <div className="data-text">
              {opd.adviced.map((a, i) => (
                <p key={i}>• {a.opinion_details_data?.opinion_name}</p>
              ))}
            </div>
          </div>
        )}

        {/* 5. FOOTER / SIGNATURE */}
        <div className="mt-auto pt-20 flex flex-col items-end">
          <div className="w-64 text-center border-t border-black pt-2">
            <p className="section-label">DOCTOR SIGNATURE</p>
            <p className="text-[10px] text-gray-500 mt-4">
              Generated: {currentDateTime}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default OpdPrescription;