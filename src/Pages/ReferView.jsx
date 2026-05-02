import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRefer } from "../services/certificates.services";
import { Printer, ArrowLeft } from "lucide-react";

export default function ReferCertificateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getRefer();
        const record = res.find((ii)=>ii.id==id);
        setData(record);
      } catch (err) {
        console.error("Error fetching refer record:", err);
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
          .certificate-card .mb-8, .certificate-card .mb-10, .certificate-card .mb-14 { margin-bottom: 15px !important; }
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
            Refer Certificate
          </h1>
        </div>

        {/* Patient Details Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#008080] mb-3">Patient Details</h2>
          <div className="space-y-1">
            <p className="text-[16px] text-black">
              <span className="font-bold">Name:</span> <span className="font-extrabold uppercase">{data.name}</span>
            </p>
            <p className="text-[16px] text-black">
              <span className="font-bold">Age:</span> <span className="font-extrabold">{data.age}</span>
            </p>
            <p className="text-[16px] text-black">
              <span className="font-bold">Gender:</span> <span className="font-extrabold">{data.gender}</span>
            </p>
          </div>
        </div>

        {/* Medical Details Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-[#008080] mb-4">Medical Details</h2>
          
          <div className="space-y-6 text-[16px] text-slate-800 leading-relaxed font-medium">
            <div>
              <p className="font-bold text-black mb-1">Diagnosis:</p>
              <p className="font-semibold text-slate-700">{data.diagnosis}</p>
            </div>

            <div className="pt-2">
              <p className="mb-4">The above-named patient is being referred to:</p>
              <p className="font-extrabold text-black text-lg leading-tight italic">
                {data.refer_to}
              </p>
              <p className="mt-4">for further evaluation and management.</p>
            </div>
          </div>
        </div>

        {/* Doctor Signature Footer */}
        <div className="text-right mt-10">
          <p className="text-xl font-black uppercase text-black">
            {data.doctor_data?.doctor_name}
          </p>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            {data.doctor_data?.specialization_id?.specialization_name}
          </p>
          <p className="text-sm font-semibold text-slate-500">
            {data.doctor_data?.address}
          </p>
        </div>

      </div>
    </div>
  );
}