// src/utils/deathPrint.js

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
    padding-top: 1.5cm !important;
  }
  .certificate-card {
    width: 100%;
    background: white;
    font-family: sans-serif;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .text-bold { font-weight: 800; }
  .text-black { color: #000; }
  .text-uppercase { text-transform: uppercase; }
  .text-teal { color: #008080; }
  .border-b-teal { border-bottom: 4px solid #008080; }
  .mb-3 { margin-bottom: 12px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-8 { margin-bottom: 32px; }
  .mb-10 { margin-bottom: 40px; }
  .mb-12 { margin-bottom: 48px; }
  .mb-14 { margin-bottom: 56px; }
  .mt-12 { margin-top: 48px; }
  .border-t { border-top: 1px solid #eee; }
  .pt-6 { padding-top: 24px; }
  .pt-8 { padding-top: 32px; }
  .tracking-tight { letter-spacing: -0.025em; }
  .tracking-wide { letter-spacing: 0.025em; }
  .tracking-wider { letter-spacing: 0.05em; }
  .inline-block { display: inline-block; }
  .pb-1 { padding-bottom: 4px; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .items-start { align-items: flex-start; }
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .col-span-2 { grid-column: span 2 / span 2; }
  .gap-y-5 { row-gap: 20px; }
  .space-y-1 > * + * { margin-top: 4px; }
  .space-y-4 > * + * { margin-top: 16px; }
  .space-y-6 > * + * { margin-top: 24px; }
  .font-black { font-weight: 900; }
  .font-extrabold { font-weight: 800; }
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .text-xs { font-size: 12px; }
  .text-sm { font-size: 14px; }
  .text-lg { font-size: 18px; }
  .text-xl { font-size: 20px; }
  .text-3xl { font-size: 30px; }
  .leading-tight { line-height: 1.25; }
  .leading-relaxed { line-height: 1.625; }
  .mx-1 { margin-left: 4px; margin-right: 4px; }
  .pt-2 { padding-top: 8px; }
  .text-slate-400 { color: #94a3b8; }
  .text-slate-800 { color: #1e293b; }
  .text-slate-900 { color: #0f172a; }
  .text-slate-500 { color: #64748b; }
  .text-slate-600 { color: #475569; }

  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

const generatePrintContent = (data) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Death Certificate – ${data.name}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        <div class="page-container first-page">
          <div class="certificate-card">
            
            <div class="text-right text-sm font-bold text-slate-900 mb-8">
              Date: ${data.date}
            </div>

            <div class="text-center mb-12">
              <h1 class="text-3xl font-extrabold text-teal border-b-teal inline-block pb-1 tracking-wider uppercase">
                Death Certificate
              </h1>
            </div>

            <!-- Patient Details Section -->
            <div class="mb-10">
              <h2 class="text-xl font-bold text-teal mb-4">Patient Details</h2>
              <div class="grid grid-cols-2 gap-y-5">
                <div>
                  <p class="text-sm font-bold text-slate-800">Name</p>
                  <p class="text-lg font-extrabold text-black uppercase">${data.name}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-800">Age / Gender</p>
                  <p class="text-lg font-extrabold text-black">${data.age}/${data.gender}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-sm font-bold text-slate-800">Address</p>
                  <p class="text-lg font-extrabold text-black uppercase">${data.address}</p>
                </div>
              </div>
            </div>

            <!-- Hospital Details Section -->
            <div class="mb-14">
              <h2 class="text-xl font-bold text-teal mb-4">Hospital Details</h2>
              <div class="space-y-6 text-sm text-slate-900 leading-relaxed font-medium">
                <p>
                  The above-named patient was admitted to the hospital on 
                  <span class="font-extrabold text-black"> ${data.admitted_datetime}</span>.
                </p>
                <p>
                  The patient expired on 
                  <span class="font-extrabold text-black"> ${data.expired_datetime}</span>.
                </p>
                <p>
                  The dead body was handed over to the relatives.
                </p>
              </div>
            </div>

            <!-- Doctor Signature Area -->
            <div class="text-right pt-8">
              <p class="text-xl font-black uppercase text-black">
                ${data.doctor_data?.doctor_name || ""}
              </p>
              <p class="text-sm font-bold text-slate-600 uppercase tracking-wide">
                ${data.doctor_data?.specialization_id?.specialization_name || ""}
              </p>
              <p class="text-sm font-semibold text-slate-500">
                ${data.doctor_data?.address || ""}
              </p>
            </div>

          </div>
        </div>
      </body>
    </html>
  `;
};

export const handleDeathPrint = (data) => {
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
