// src/utils/dischargePrint.js

const PRINT_STYLES = `
  @page { 
    size: auto; 
    margin: 0; 
  }
  body { 
    font-family: 'Helvetica', 'Arial', sans-serif; 
    font-size: 10.5pt; 
    color: #000; 
    background: #fff; 
    margin: 0; 
    padding: 0; 
    line-height: 1.4;
  }
  .page-container {
    padding: 1.5cm 1.5cm 1.5cm 2.5cm;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .first-page {
    padding-top: 6cm !important;
  }
  .page-break {
    page-break-after: always;
    clear: both;
  }
  
  .main-table {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid black;
  }
  .main-table td {
    border: 1.5px solid black;
    padding: 6px 12px;
    vertical-align: top;
  }
  .no-top-border { border-top: 0 !important; }
  .no-bottom-border { border-bottom: 0 !important; }
  .no-left-border { border-left: 0 !important; }
  .no-right-border { border-right: 0 !important; }
  
  .text-center { text-align: center; }
  .text-bold { font-weight: 800; }
  .text-uppercase { text-transform: uppercase; }
  .font-large { font-size: 14pt; }
  
  .particulars-box {
    border: 1.5px solid black;
    border-radius: 12px;
    padding: 12px 20px;
    margin-bottom: 25px;
    display: flex;
    justify-content: space-between;
    font-weight: 800;
  }
  
  .section-title {
    font-weight: 800;
    margin-top: 20px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bg-highlight {
    background-color: #E0E0E0 !important;
  }
`;

const onlyDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const onlyTime = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
};

const formatDosage = (dosage) => {
  if (!dosage) return "";
  const parts = dosage.split("-");
  if (parts.length === 3) {
    return `Morning: ${parts[0]} | Afternoon: ${parts[1]} | Evening: ${parts[2]}`;
  }
  return dosage;
};

const generatePrintContent = (d) => {
  const diagnosisStr = (d.diagnosis || []).map(x => x.diagnosis_name || x.name).join(", ").toUpperCase();
  const clinicalNotesStr = (d.clinical_notes || []).map(x => x.opinion_name || x.name).join(", ").toUpperCase();
  const treatmentGivenStr = (d.treatment_chart || []).map(t => t.medicine_data?.medicine_name || t.medicine_name).filter(Boolean).join(", ").toUpperCase();
  
  const conditionStr = d.discharge_condition 
    ? Object.entries(d.discharge_condition)
        .filter(([k, v]) => k !== "date_time" && v)
        .map(([k, v]) => `${k.toUpperCase()} ${v.toUpperCase()}`)
        .join(" ")
    : "N/A";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Discharge Certificate – ${d.patient_name}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        <div class="page-container page-break first-page">
          <table class="main-table">
            <tbody>
              <tr class="bg-highlight">
                <td colspan="3" class="text-center text-bold font-large">DISCHARGE CERTIFICATE</td>
              </tr>
              <tr>
                <td style="width: 180px;" class="text-bold">PATIENT'S NAME:</td>
                <td colspan="2" class="text-bold">${d.patient_name?.toUpperCase() || "N/A"}</td>
              </tr>
              <tr>
                <td style="width: 50%; border-right: 0px;" class="text-bold">
                  AGE/SEX: ${d.age || "N/A"} / ${d.gender || "N/A"}
                </td>
                <td colspan="2" style="border-left: 0px;" class="text-bold bg-highlight">
                  ADDRESS: ${d.address?.toUpperCase() || "N/A"}
                </td>
              </tr>
              <tr>
                <td style="width: 33.33%;">
                  <span class="text-bold">DOA:</span> ${onlyDate(d.datetime_admission)}<br/>
                  <span class="text-bold">TOA:</span> ${onlyTime(d.datetime_admission)}
                </td>
                <td style="width: 33.33%;">
                  <span class="text-bold">DOD:</span> ${onlyDate(d.datetime_discharge)}<br/>
                  <span class="text-bold">TOD:</span> ${onlyTime(d.datetime_discharge)}
                </td>
                <td style="width: 33.33%;" class="text-bold">
                  BED NO: ${d.bed_data?.name?.toUpperCase() || ""} ${d.bed_data?.bed_number || ""}
                </td>
              </tr>
              <tr class="bg-highlight">
                <td style="width: 180px;" class="text-bold">TYPE OF DISCHARGE:</td>
                <td colspan="2" class="text-bold">${d.type_of_discharge?.toUpperCase() || "N/A"}</td>
              </tr>
              <tr>
                <td style="width: 180px;" class="text-bold">DIAGNOSIS:</td>
                <td colspan="2" style="font-weight: 500">${diagnosisStr || "N/A"}</td>
              </tr>
              <tr class="bg-highlight">
                <td style="width: 180px;" class="text-bold">CLINICAL NOTES:</td>
                <td colspan="2" style="font-weight: 500">${clinicalNotesStr || "N/A"}</td>
              </tr>
              <tr>
                <td style="width: 180px;" class="text-bold">INVESTIGATION:</td>
                <td colspan="2" style="font-weight: 500">${d.investigation?.toUpperCase().replace(/\n/g, '<br/>') || "N/A"}</td>
              </tr>
              <tr class="bg-highlight">
                <td style="width: 180px;" class="text-bold">TREATMENT GIVEN:</td>
                <td colspan="2" style="font-weight: 500; line-height: 1.6;">${treatmentGivenStr || "N/A"}</td>
              </tr>
              <tr>
                <td style="width: 180px;" class="text-bold">CONDITION ON DISCHARGE:</td>
                <td colspan="2" style="font-weight: 500">${conditionStr}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="page-container">
          <div class="particulars-box">
            <div>
              ${d.sr_no || ""} : ${d.patient_name?.toUpperCase()} (${d.age} / ${d.gender})<br/>
              ${d.address?.toUpperCase()} / ${d.mobile}
            </div>
            <div style="text-align: right">
              ${onlyDate(d.datetime_discharge)} ${onlyTime(d.datetime_discharge)}<br/>
              UHID : ${d.uhid?.toUpperCase() || "P" + (d.id || "")}
            </div>
          </div>

          <div class="text-bold text-uppercase" style="margin-bottom: 10px">RX ON DISCHARGE</div>
          <table class="main-table">
            <thead>
              <tr style="background-color: #eee">
                <th style="border: 1.5px solid black; padding: 6px; width: 50px">SR</th>
                <th style="border: 1.5px solid black; padding: 6px">MEDICINE</th>
                <th style="border: 1.5px solid black; padding: 6px">MEAL TIME</th>
                <th style="border: 1.5px solid black; padding: 6px">DOSAGE</th>
                <th style="border: 1.5px solid black; padding: 6px; width: 60px">QTY</th>
              </tr>
            </thead>
            <tbody>
              ${(d.Rx || []).length > 0 ? (d.Rx || []).map((r, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td class="text-bold">${(r.medicine_data?.medicine_name || r.medicine_name || "").toUpperCase()}<br/><small style="font-weight: 400">${formatDosage(r.doses || r.dosage)}</small></td>
                  <td>${(r.medicine_data?.meal_time || r.meal_time || "AFTER MEAL").toUpperCase()}</td>
                  <td>${(r.doses || r.dosage || "STAT").toUpperCase()}</td>
                  <td class="text-center">${r.quantity || "1"}</td>
                </tr>
              `).join("") : "<tr><td colspan='5' class='text-center'>No prescriptions listed</td></tr>"}
            </tbody>
          </table>

          <div class="section-title">ADVICE:</div>
          <div class="text-uppercase" style="padding-left: 5px">${(d.adviced || []).map(a => (a.opinion_details_data?.opinion_name || a.opinion_name || "").toUpperCase()).filter(Boolean).join(", ") || "N/A"}</div>
          
          <div class="section-title">NEXT VISIT: <span style="font-weight: 500">${(d.next_visit || "").toUpperCase() || "NOT MENTIONED"}</span></div>
          
          <div class="section-title">NOTE:</div>
          <div class="text-uppercase" style="padding-left: 5px">${(d.Note || []).map(n => (n.opinion_details_data?.opinion_name || n.opinion_name || "").toUpperCase()).filter(Boolean).join(", ") || "N/A"}</div>
        </div>
      </body>
    </html>
  `;
};

export const handleDischargePrint = (data, setIsPrinting) => {
  if (!data) return;
  if (setIsPrinting) setIsPrinting(true);
  
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
        if (setIsPrinting) setIsPrinting(false);
        window.removeEventListener('focus', printHandler);
      };
      
      iframe.contentWindow.onafterprint = printHandler;
      window.addEventListener('focus', printHandler);
    }, 250);
  };
};
