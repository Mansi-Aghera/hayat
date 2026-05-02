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
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center font-serif text-black">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header, nav, aside, footer, .print-hidden { 
            display: none !important; 
          }
          @page { 
            margin: 0; 
            size: A4;
          }
          body { 
            background: white !important; 
            margin: 0; 
            padding: 0;
            color: black !important;
          }
          .min-h-screen {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .certificate-container {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding-top: 6cm !important;
            padding-left: 2.5cm !important;
            padding-right: 1.5cm !important;
            padding-bottom: 1.5cm !important;
            box-shadow: none !important;
            border: none !important;
            box-sizing: border-box !important;
          }
          .table-certificate th, .table-certificate td {
            padding: 4px 8px !important;
            font-size: 12px !important;
          }
          .text-header {
            font-size: 16px !important;
          }
          .signature-cell {
            height: 80px !important;
            padding-bottom: 5px !important;
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
          border: 1.5px solid black;
        }
        .table-certificate th, .table-certificate td {
          border: 1.5px solid black;
          padding: 6px 10px;
          text-align: left;
          font-size: 14px;
        }
        .text-header {
          text-align: center !important;
          font-weight: 1000 !important;
          font-size: 20px !important;
          letter-spacing: 1px;
        }
        .label-bold {
          font-weight: 800;
        }
        .section-header {
           width: 25%;
           vertical-align: middle;
        }
        .col-width-fixed {
           width: 25%;
        }
        .bg-highlight {
          background-color: #E0E0E0 !important;
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

      <div className="certificate-container w-full max-w-[850px] bg-white shadow-lg overflow-hidden p-4 md:p-8">
        <table className="table-certificate">
          <colgroup>
            <col className="col-width-fixed" />
            <col className="col-width-fixed" />
            <col className="col-width-fixed" />
            <col className="col-width-fixed" />
          </colgroup>
          <tbody>
            {/* Title */}
            <tr className="bg-highlight">
              <td colSpan="4" className="text-header uppercase italic">Fitness Certificate</td>
            </tr>

            {/* Referrer & Date */}
            <tr>
              <td colSpan="3"><span className="label-bold uppercase">Referring Doctor/Hospital:</span> {data.referrer?.toUpperCase() || "N/A"}</td>
              <td><span className="label-bold">Date:</span> {data.date || "N/A"}</td>
            </tr>

            {/* Patient Name & Age/Sex */}
            <tr>
              <td colSpan="3"><span className="label-bold uppercase">Patient's Name:</span> {data.patient_name?.toUpperCase() || "N/A"}</td>
              <td><span className="label-bold">Age/ Sex:</span> {data.age || "N/A"} / {data.gender || "N/A"}</td>
            </tr>

            {/* Address & Mobile */}
            <tr>
              <td colSpan="3"><span className="label-bold">Address:</span> {data.address?.toUpperCase() || "N/A"}</td>
              <td><span className="label-bold uppercase">Mobile:</span> {data.mobile_no || "N/A"}</td>
            </tr>

            {/* Posted For */}
            <tr className="bg-highlight">
              <td colSpan="4"><span className="label-bold uppercase">Posted For:</span> {data.posted_for?.toUpperCase() || "N/A"}</td>
            </tr>

            {/* Complaints Section */}
            <tr>
              <td rowSpan="3" className="section-header label-bold">COMPLAINTS:</td>
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
              <td rowSpan="2" className="section-header label-bold">PAST HISTORY OF:</td>
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
              <td rowSpan="2" className="section-header label-bold uppercase tracking-tight">Personal H/O:</td>
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
              <td rowSpan="5" className="section-header label-bold uppercase">General Examination:</td>
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
              <td rowSpan="2" className="section-header label-bold uppercase">Systemic Examination:</td>
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
            <tr className="bg-highlight">
              <td colSpan="4" className="py-2">
                <span className="label-bold uppercase">Opinion: </span>
                <span className="uppercase">{data.Opinion || "---"}</span>
              </td>
            </tr>

            {/* Signature Section */}
            <tr>
              <td colSpan="4" className="signature-cell relative mt-10 mt-10-print-none" style={{ verticalAlign: 'bottom', paddingBottom: '10px' }}>
                <div className="text-right label-bold uppercase">Doctor's Signature</div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FitnessView;