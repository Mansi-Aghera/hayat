import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBirth } from "../services/certificates.services";
import { Printer, ArrowLeft } from "lucide-react";

export default function BirthView() {
  const { id } = useParams();
  console.log("Fetching birth certificate with ID:", id);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await getBirth();

        const record = res.find((ii)=>ii.id==id);
        setData(record);
      } catch (err) {
        console.error("Error fetching detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!data) return <div className="h-screen flex items-center justify-center">No record found.</div>;

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-10 flex flex-col items-center">
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
          .certificate-card div { margin-bottom: 10px !important; }
        }
      `}} />
      {/* Navigation & Print Buttons (Hidden during Print) */}
      <div className="w-full max-w-[450px] mb-4 flex justify-between print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-700 hover:text-black">
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={handlePrint} className="bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-emerald-700 flex items-center gap-2">
          <Printer size={18} /> Print
        </button>
      </div>

      {/* Certificate Card - Designed to match image_b25b34.png */}
      <div className="certificate-card w-full max-w-[450px] bg-white rounded-[30px] shadow-xl p-8 md:p-10 text-gray-800 font-sans print:shadow-none print:rounded-none">
        
        {/* Date at Top Right */}
        <div className="text-right text-sm font-semibold mb-6">
          Date: {data.date || data.bod}
        </div>

        {/* Main Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-[#008080] tracking-wide inline-block border-b-4 border-[#008080] pb-1">
            BIRTH CERTIFICATE
          </h1>
        </div>

        {/* Mother Details Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#008080] mb-2">Mother Details</h2>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-gray-600 uppercase">Name</p>
            <p className="text-base font-bold">{data.name}</p>
          </div>
        </div>

        {/* Birth Details Section */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-[#008080] mb-4">Birth Details</h2>
          <div className="text-[15px] leading-relaxed space-y-4 text-gray-700">
            <p>
              This is to certify that the above-named mother delivered a 
              <span className="font-bold text-black"> {data.gender} </span> 
              child at our hospital.
            </p>
            <p>
              The delivery took place on <span className="font-bold text-black">{data.bod}</span> at 
              <span className="font-bold text-black"> {data.bot}</span>.
            </p>
            <p>
              The baby weight at birth was <span className="font-bold text-black">{data.weight}</span>.
            </p>
            <p>
              The mode of delivery was <span className="font-bold text-black">{data.mode}</span>.
            </p>
            <p className="pt-2 italic text-gray-500 text-sm">
              This certificate is issued at the request of the patient/relatives for official records.
            </p>
          </div>
        </div>

        {/* Doctor Signature Section */}
        <div className="text-right mt-16">
          <p className="text-base font-bold uppercase text-black">
            {data.doctor_data?.doctor_name || "DR SHAHNAWAZ ALI"}
          </p>
          <p className="text-xs font-bold text-gray-600 uppercase">
            {data.doctor_data?.specialization_id.specialization_name || "-"}
          </p>
          <p className="text-xs text-gray-500 uppercase">
            {data.doctor_data?.address || "-"}
          </p>
        </div>

      </div>

      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; padding: 0 !important; }
          .min-h-screen { background: white !important; min-height: auto !important; }
          .print\\:hidden { display: none !important; }
          .shadow-xl { box-shadow: none !important; }
          .rounded-\\[30px\\] { border-radius: 0 !important; }
          @page { margin: 0; }
        }
      `}} />
    </div>
  );
}