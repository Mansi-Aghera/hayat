import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMedical } from "../services/certificates.services";
import { Printer, ArrowLeft } from "lucide-react";

export default function MedicalCertificateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMedical();
        // Standardizing finding the record by ID
        const record = res.find((ii)=>ii.id==id);
        setData(record);
      } catch (err) {
        console.error("Error fetching medical record:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Loading Certificate...</div>;
  if (!data) return <div className="h-screen flex items-center justify-center font-bold">Record not found.</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 flex flex-col items-center">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything outside the prescription component */
          header, nav, aside, footer, .print-hidden { 
            display: none !important; 
          }
          
          /* Remove browser headers and footers (Localhost, Date, Title) */
          @page { 
            margin: 0; 
            size: A4;
          }
          
          body { 
            background: white; 
            margin: 0; 
          }

          /* Ensure the container takes full width and removes shadows */
          .certificate-card {
            border: none !important;
            box-shadow: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding-top: 6cm !important;
            padding-left: 2.5cm !important;
            padding-right: 1.5cm !important;
            padding-bottom: 1.5cm !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
          }
          .certificate-card h1 { font-size: 20px !important; }
          .certificate-card h2 { font-size: 16px !important; }
          .certificate-card p { font-size: 12px !important; }
          .certificate-card .mb-8, .certificate-card .mb-10, .certificate-card .mb-12 { margin-bottom: 15px !important; }
        }
      `}} />
      {/* Control Bar */}
      <div className="w-full max-w-[480px] mb-4 flex justify-between print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-700 font-bold hover:text-black">
          <ArrowLeft size={18}/> Back
        </button>
        <button onClick={() => window.print()} className="bg-[#008080] text-white px-5 py-2 rounded-full shadow-lg hover:opacity-90 flex items-center gap-2 font-bold transition-transform active:scale-95">
          <Printer size={18}/> Print
        </button>
      </div>

      {/* Certificate Card */}
      <div className="certificate-card w-full max-w-[480px] bg-white rounded-[32px] shadow-2xl p-10 font-sans print:shadow-none print:p-6 print:rounded-none relative overflow-hidden">
        
        {/* Date Display */}
        <div className="text-right text-sm font-bold text-slate-900 mb-8">
          Date: <span className="font-extrabold">{data.date}</span>
        </div>

        {/* Header Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-[#008080] border-b-4 border-[#008080] inline-block pb-1 tracking-tight uppercase">
            Medical Certificate
          </h1>
        </div>

        {/* Patient Details Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#008080] mb-3">Patient Details</h2>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</p>
              <p className="text-[16px] font-black text-black uppercase leading-tight">{data.name}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age / Gender</p>
              <p className="text-[16px] font-black text-black leading-tight">{data.age}/{data.gender}</p>
            </div>
          </div>
        </div>

        {/* Medical Details Section - Exact phrasing from image_be3b65.png */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-[#008080] mb-4">Medical Details</h2>
          
          <div className="space-y-4 text-[15px] text-slate-800 leading-relaxed font-medium">
            <p>This is to certify that the above-named patient was examined and treated at our hospital.</p>
            
            <p>
              Based on the medical assessment, the patient is diagnosed with 
              <span className="font-black text-black mx-1 uppercase">{data.diagnosis}</span>.
            </p>

            <p>
              He/She was treated on <span className="font-bold text-black">{data.treatment_basis}</span> at our 
              hospital from <span className="font-bold text-black">{data.treatment_from}</span> to <span className="font-bold text-black">{data.treatment_to}</span>.
            </p>

            <p>
              The patient has been advised to take medical rest for 
              <span className="font-black text-indigo-700 mx-1 uppercase">{data.rest_for}</span>, 
              from <span className="font-bold text-black">{data.rest_from}</span> to <span className="font-bold text-black">{data.rest_to}</span>, for proper recovery.
            </p>

            <p>This certificate is issued at the patient's request for the purpose of submitting to his/her department or employer.</p>

            <p className="font-black text-black pt-2">Hence certified.</p>

            {/* Fitness Note (NOW PATIENT IS FIT...) */}
            <p className="text-black font-extrabold leading-tight mt-4 uppercase">
              {data.note}
            </p>
          </div>
        </div>

        {/* Doctor Signature Footer - Professional bottom-right alignment */}
        <div className="text-right mt-12 border-t pt-6 border-slate-100">
          <p className="text-xl font-black uppercase text-black">
            {data.doctor_data?.doctor_name}
          </p>
          <p className="text-[13px] font-bold text-[#008080] uppercase tracking-wide">
            {data.doctor_data?.specialization_id?.specialization_name}
          </p>
          <p className="text-[12px] font-semibold text-slate-500">
            {data.doctor_data?.address}
          </p>
        </div>

      </div>
    </div>
  );
}