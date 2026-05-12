// FitnessView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getFCById } from '../services/certificates.services';
import { Printer, ArrowLeft } from 'lucide-react';

const FitnessView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchFitnessDetails(id);
    }
  }, [id]);

  const fetchFitnessDetails = async (fitnessId) => {
    try {
      setLoading(true);
      const response = await getFCById(id);
      setData(response.data || response);
    } catch (error) {
      console.error('Error fetching fitness details:', error);
      toast.error('Failed to fetch fitness details');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = (list, label) => {
    if (!list || !Array.isArray(list)) return 'NO';
    const found = list.some(item => {
      const itemName = typeof item === 'string' ? item : item.name;
      return itemName?.toLowerCase().includes(label.toLowerCase());
    });
    return found ? 'YES' : 'NO';
  };

  const formatBool = (val) => {
    if (val === true || val === 'true' || val === 1) return 'YES';
    if (val === false || val === 'false' || val === 0) return 'NO';
    return val || 'NO';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-600">
        Record not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center font-sans text-black">
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          /* Hide scrollbars ONLY for this certificate view page on screen */
          html, body, main, div, section, .scrollbar-hide {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          /* Hide the mobile Admin Panel bar ONLY on this page */
          .md\\:hidden {
            display: none !important;
          }
        }

        @media print {
          /* HIDE EVERYTHING EXCEPT THE CERTIFICATE */
          header, nav, aside, footer, .print-hidden, .md\\:hidden, 
          [class*="sidebar"], [class*="Sidebar"], 
          .fixed, .sticky { 
            display: none !important; 
          }
          
          /* Force hide the sidebar specifically if it's a div */
          div[class*="bg-indigo-800"] {
            display: none !important;
          }

          @page { 
            margin: 0; 
            size: A4;
          }
          
          body, html, main, div, section { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            color: black !important;
            overflow: visible !important; /* Prevents scrollbars in print */
            height: auto !important;
          }

          ::-webkit-scrollbar {
            display: none !important;
          }

          .min-h-screen {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
          }

          .certificate-container {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding-top: 5cm !important;
            padding-left: 1.5cm !important;
            padding-right: 1.5cm !important;
            padding-bottom: 1.5cm !important;
            box-shadow: none !important;
            border: none !important;
            box-sizing: border-box !important;
            display: block !important;
          }

          .table-certificate th, .table-certificate td {
            padding: 5px 10px !important;
            font-size: 13px !important;
          }
          .text-header {
            font-size: 18px !important;
          }
          .signature-cell {
            height: 100px !important;
          }
          .mt-10-print-none {
            margin-top: 0 !important;
          }
        }
        
        .table-certificate {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          background: white;
          border: 2px solid black;
        }
        .table-certificate th, .table-certificate td {
          border: 1.5px solid black;
          padding: 8px 12px;
          text-align: left;
          font-size: 14px;
        }
        .text-header {
          text-align: center !important;
          font-weight: 900 !important;
          font-size: 22px !important;
          letter-spacing: 0.5px;
        }
        .label-bold {
          font-weight: 800;
        }
        .section-header {
           width: 20%;
           vertical-align: middle;
        }
        .col-label {
           width: 20%;
        }
        .col-data {
           width: 26.66%;
        }
        .bg-highlight {
          background-color: #d1d5db !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}} />

      {/* Control Bar */}
      <div className="w-full max-w-[850px] mb-4 flex justify-between print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold hover:underline">
          <ArrowLeft size={18}/> Back
        </button>
        <button onClick={() => window.print()} className="bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors">
           Print Fitness Certificate
        </button>
      </div>

      <div className="certificate-container w-full max-w-[850px] bg-white shadow-lg overflow-hidden p-4 md:p-8 scrollbar-hide">
        <table className="table-certificate">
          <colgroup>
            <col className="col-label" />
            <col className="col-data" />
            <col className="col-data" />
            <col className="col-data" />
          </colgroup>
          <tbody>
            {/* Title */}
            <tr className="bg-highlight">
              <td colSpan="4" className="text-header uppercase italic font-bold">Fitness Certificate</td>
            </tr>

            {/* Referrer & Date */}
            <tr>
              <td colSpan="3" className="font-bold uppercase">Referring Doctor/Hospital: {data.referrer?.toUpperCase() || "N/A"}</td>
              <td className="font-bold">Date: {data.date || "N/A"}</td>
            </tr>

            {/* Patient Name & Age/Sex */}
            <tr>
              <td colSpan="3" className="font-bold uppercase">Patient's Name: {data.patient_name?.toUpperCase() || "N/A"}</td>
              <td className="font-bold">Age/ Sex: {data.age || "N/A"} / {data.gender || "N/A"}</td>
            </tr>

            {/* Address & Mobile */}
            <tr>
              <td colSpan="3" className="font-bold">Address: {data.address?.toUpperCase() || "N/A"}</td>
              <td className="font-bold uppercase">Mobile: {data.mobile_no || "N/A"}</td>
            </tr>

            {/* Posted For */}
            <tr className="bg-highlight">
              <td colSpan="4" className="font-bold uppercase">Posted For: {data.posted_for?.toUpperCase() || "N/A"}</td>
            </tr>

            {/* Complaints Section */}
            <tr>
              <td rowSpan="3" className="section-header font-bold">COMPLAINTS:</td>
              <td>Chest Pain = {checkStatus(data.patient_condition?.complaints, "Chest Pain")}</td>
              <td>Palpitation = {checkStatus(data.patient_condition?.complaints, "Palpitation")}</td>
              <td>Breathlessness = {checkStatus(data.patient_condition?.complaints, "Breathlessness")}</td>
            </tr>
            <tr>
              <td>Cough = {checkStatus(data.patient_condition?.complaints, "Cough")}</td>
              <td>Dyspnea on Exertion = {checkStatus(data.patient_condition?.complaints, "Exertion")}</td>
              <td>Angina on Exertion = {checkStatus(data.patient_condition?.complaints, "Angina")}</td>
            </tr>
            <tr>
              <td>Prolonged Fever = {checkStatus(data.patient_condition?.complaints, "Fever")}</td>
              <td></td>
              <td></td>
            </tr>

            {/* Past History Section */}
            <tr>
              <td rowSpan="2" className="section-header font-bold">PAST HISTORY OF:</td>
              <td>HTN = {checkStatus(data.patient_condition?.past_history, "HTN")}</td>
              <td>DM = {checkStatus(data.patient_condition?.past_history, "DM")}</td>
              <td>CAD/CVA = {checkStatus(data.patient_condition?.past_history, "CAD")}</td>
            </tr>
            <tr>
              <td>KOCH = {checkStatus(data.patient_condition?.past_history, "KOCH")}</td>
              <td>CKD = {checkStatus(data.patient_condition?.past_history, "CKD")}</td>
              <td>Asthma/COPD = {checkStatus(data.patient_condition?.past_history, "Asthma")}</td>
            </tr>

            {/* Personal H/O Section */}
            <tr>
              <td rowSpan="2" className="section-header font-bold uppercase tracking-tight">Personal H/O:</td>
              <td>Tobacco = {checkStatus(data.patient_condition?.personal_H_O, "Tobacco")}</td>
              <td>Bidi/Cigarette = {checkStatus(data.patient_condition?.personal_H_O, "Bidi")}</td>
              <td>Alcohol = {checkStatus(data.patient_condition?.personal_H_O, "Alcohol")}</td>
            </tr>
            <tr>
              <td>H/O Hospitalization = {checkStatus(data.patient_condition?.personal_H_O, "Hospitalization")}</td>
              <td colSpan="2">Any Drug Reaction = {checkStatus(data.patient_condition?.personal_H_O, "Reaction")}</td>
            </tr>

            {/* General Examination Section */}
            <tr>
              <td rowSpan="5" className="section-header font-bold uppercase">General Examination:</td>
              <td>BP = {data.patient_condition?.blood_pressure || "---/---"}</td>
              <td>Blood Sugar = {data.patient_condition?.blood_sugar || "--"}</td>
              <td>Pulse = {data.patient_condition?.pulse || "--"}</td>
            </tr>
            <tr>
              <td colSpan="3">ECG = {data.patient_condition?.ECG?.toUpperCase() || "---"}</td>
            </tr>
            <tr>
              <td>Temp = {data.patient_condition?.temperature ? (parseFloat(data.patient_condition.temperature) <= 99 ? 'AFEBRILE' : data.patient_condition.temperature + ' F') : "---"}</td>
              <td>Pallor = {formatBool(data.patient_condition?.poller)}</td>
              <td>Icterus = {formatBool(data.patient_condition?.icterus)}</td>
            </tr>
            <tr>
              <td>EdemaFeet = {formatBool(data.patient_condition?.edema_feet)}</td>
              <td>LAP = {formatBool(data.patient_condition?.LAP)}</td>
              <td>Clubbing = {formatBool(data.patient_condition?.clubbing)}</td>
            </tr>
            <tr>
              <td>Cyanosis = {formatBool(data.patient_condition?.cyanosis)}</td>
              <td></td>
              <td></td>
            </tr>

            {/* Systemic Examination Section */}
            <tr>
              <td rowSpan="2" className="section-header font-bold uppercase">Systemic Examination:</td>
              <td>RS = {data.patient_condition?.RS?.toUpperCase() || "---"}</td>
              <td>CVS = {data.patient_condition?.CVS?.toUpperCase() || "---"}</td>
              <td>P/A = {data.patient_condition?.PA?.toUpperCase() || "---"}</td>
            </tr>
            <tr>
              <td>CNS = {data.patient_condition?.CNS?.toUpperCase() || "---"}</td>
              <td></td>
              <td></td>
            </tr>

            {/* Opinion Section */}
            <tr>
              <td colSpan="4" className="py-3 px-3 font-bold border-2">
                <span className="uppercase">Opinion : </span>
                <span className="uppercase">{data.Opinion || "---"}</span>
              </td>
            </tr>

            {/* Signature Section */}
            <tr>
              <td colSpan="4" className="bg-highlight" style={{ height: '120px', verticalAlign: 'bottom', paddingBottom: '15px' }}>
                <div className="text-right font-bold uppercase pr-6">Doctor's Signature</div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FitnessView;