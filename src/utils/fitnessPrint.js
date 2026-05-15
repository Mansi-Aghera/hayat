// src/utils/fitnessPrint.js

const PRINT_STYLES = `
  @page { 
    size: auto; 
    margin: 0; 
  }
  body { 
    font-family: 'Helvetica', 'Arial', sans-serif; 
    font-size: 10pt; 
    color: #000; 
    background: #fff; 
    margin: 0; 
    padding: 0; 
    line-height: 1.3;
  }
  .page-container {
    padding: 1.5cm 1.5cm 1.5cm 1.5cm;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .first-page {
    padding-top: 1.5cm !important;
  }
  .table-certificate {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    background: white;
    border: 1.5px solid black;
  }
  .table-certificate th, .table-certificate td {
    border: 1.2px solid black;
    padding: 4px 8px;
    text-align: left;
    font-size: 11px;
    word-wrap: break-word;
  }
  .text-header {
    text-align: center !important;
    font-weight: 900 !important;
    font-size: 18px !important;
    letter-spacing: 0.5px;
    padding: 8px !important;
  }
  .bg-highlight {
    background-color: #e5e7eb !important;
  }
  .uppercase { text-transform: uppercase; }
  .italic { font-style: italic; }
  .font-bold { font-weight: 700; }
  .text-right { text-align: right; }
  .pr-6 { padding-right: 24px; }
  .mt-4 { margin-top: 16px; }

  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

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

const generatePrintContent = (data) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fitness Certificate – ${data.patient_name}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        <div class="page-container first-page">
          <table class="table-certificate">
            <colgroup>
              <col style="width: 20%;" />
              <col style="width: 26.6%;" />
              <col style="width: 26.6%;" />
              <col style="width: 26.6%;" />
            </colgroup>
            <tbody>
              <tr class="bg-highlight">
                <td colspan="4" class="text-header uppercase italic font-bold">Fitness Certificate</td>
              </tr>
              <tr>
                <td colspan="3" class="font-bold uppercase">Referring Doctor/Hospital: ${data.referrer?.toUpperCase() || "N/A"}</td>
                <td class="font-bold">Date: ${data.date || "N/A"}</td>
              </tr>
              <tr>
                <td colspan="3" class="font-bold uppercase">Patient's Name: ${data.patient_name?.toUpperCase() || "N/A"}</td>
                <td class="font-bold">Age/ Sex: ${data.age || "N/A"} / ${data.gender || "N/A"}</td>
              </tr>
              <tr>
                <td colspan="3" class="font-bold">Address: ${data.address?.toUpperCase() || "N/A"}</td>
                <td class="font-bold uppercase">Mobile: ${data.mobile_no || "N/A"}</td>
              </tr>
              <tr class="bg-highlight">
                <td colspan="4" class="font-bold uppercase">Posted For: ${data.posted_for?.toUpperCase() || "N/A"}</td>
              </tr>
              <tr>
                <td rowspan="3" class="font-bold">COMPLAINTS:</td>
                <td>Chest Pain = ${checkStatus(data.patient_condition?.complaints, "Chest Pain")}</td>
                <td>Palpitation = ${checkStatus(data.patient_condition?.complaints, "Palpitation")}</td>
                <td>Breathlessness = ${checkStatus(data.patient_condition?.complaints, "Breathlessness")}</td>
              </tr>
              <tr>
                <td>Cough = ${checkStatus(data.patient_condition?.complaints, "Cough")}</td>
                <td>Dyspnea on Exertion = ${checkStatus(data.patient_condition?.complaints, "Exertion")}</td>
                <td>Angina on Exertion = ${checkStatus(data.patient_condition?.complaints, "Angina")}</td>
              </tr>
              <tr>
                <td>Prolonged Fever = ${checkStatus(data.patient_condition?.complaints, "Fever")}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td rowspan="2" class="font-bold">PAST HISTORY OF:</td>
                <td>HTN = ${checkStatus(data.patient_condition?.past_history, "HTN")}</td>
                <td>DM = ${checkStatus(data.patient_condition?.past_history, "DM")}</td>
                <td>CAD/CVA = ${checkStatus(data.patient_condition?.past_history, "CAD")}</td>
              </tr>
              <tr>
                <td>KOCH = ${checkStatus(data.patient_condition?.past_history, "KOCH")}</td>
                <td>CKD = ${checkStatus(data.patient_condition?.past_history, "CKD")}</td>
                <td>Asthma/COPD = ${checkStatus(data.patient_condition?.past_history, "Asthma")}</td>
              </tr>
              <tr>
                <td rowspan="2" class="font-bold uppercase">Personal H/O:</td>
                <td>Tobacco = ${checkStatus(data.patient_condition?.personal_H_O, "Tobacco")}</td>
                <td>Bidi/Cigarette = ${checkStatus(data.patient_condition?.personal_H_O, "Bidi")}</td>
                <td>Alcohol = ${checkStatus(data.patient_condition?.personal_H_O, "Alcohol")}</td>
              </tr>
              <tr>
                <td>H/O Hospitalization = ${checkStatus(data.patient_condition?.personal_H_O, "Hospitalization")}</td>
                <td>Any Drug Reaction = ${checkStatus(data.patient_condition?.personal_H_O, "Reaction")}</td>
                <td></td>
              </tr>
              <tr>
                <td rowspan="5" class="font-bold uppercase">General Examination:</td>
                <td>BP = ${data.patient_condition?.blood_pressure || "---/---"}</td>
                <td>Blood Sugar = ${data.patient_condition?.blood_sugar || "--"}</td>
                <td>Pulse = ${data.patient_condition?.pulse || "--"}</td>
              </tr>
              <tr>
                <td>ECG = ${data.patient_condition?.ECG?.toUpperCase() || "---"}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Temp = ${data.patient_condition?.temperature || "---"}</td>
                <td>Pallor = ${formatBool(data.patient_condition?.poller)}</td>
                <td>Icterus = ${formatBool(data.patient_condition?.icterus)}</td>
              </tr>
              <tr>
                <td>EdemaFeet = ${formatBool(data.patient_condition?.edema_feet)}</td>
                <td>LAP = ${formatBool(data.patient_condition?.LAP)}</td>
                <td>Clubbing = ${formatBool(data.patient_condition?.clubbing)}</td>
              </tr>
              <tr>
                <td>Cyanosis = ${formatBool(data.patient_condition?.cyanosis)}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td rowspan="2" class="font-bold uppercase">Systemic Examination:</td>
                <td>RS = ${data.patient_condition?.RS?.toUpperCase() || "---"}</td>
                <td>CVS = ${data.patient_condition?.CVS?.toUpperCase() || "---"}</td>
                <td>P/A = ${data.patient_condition?.PA?.toUpperCase() || "---"}</td>
              </tr>
              <tr>
                <td>CNS = ${data.patient_condition?.CNS?.toUpperCase() || "---"}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td colspan="4" class="font-bold border-2">
                  <span class="uppercase">Opinion : </span>
                  <span class="uppercase">${data.Opinion || "---"}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <table class="table-certificate mt-4 bg-highlight">
            <tbody>
              <tr>
                <td colspan="4" style="height: 100px; vertical-align: bottom; padding-bottom: 10px;" class="text-right font-bold uppercase pr-6">
                  Doctor's Signature
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
};

export const handleFitnessPrint = (data) => {
  if (!data) return;
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(generatePrintContent(data));
  iframeDoc.close();
  
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      const printHandler = () => {
        document.body.removeChild(iframe);
        window.removeEventListener('focus', printHandler);
      };
      
      iframe.contentWindow.onafterprint = printHandler;
      window.addEventListener('focus', printHandler);
    }, 250);
  };
};
