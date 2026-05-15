// src/utils/birthPrint.js

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
  .mb-2 { margin-bottom: 8px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .mb-8 { margin-bottom: 32px; }
  .mb-10 { margin-bottom: 40px; }
  .mb-12 { margin-bottom: 48px; }
  .mt-16 { margin-top: 64px; }
  .pt-2 { padding-top: 8px; }
  .italic { font-style: italic; }
  .inline-block { display: inline-block; }
  .pb-1 { padding-bottom: 4px; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .items-center { align-items: center; }
  .space-y-0\\.5 > * + * { margin-top: 2px; }
  .space-y-4 > * + * { margin-top: 16px; }
  .font-bold { font-weight: 700; }
  .font-black { font-weight: 900; }
  .font-extrabold { font-weight: 800; }
  .text-xs { font-size: 12px; }
  .text-sm { font-size: 14px; }
  .text-base { font-size: 16px; }
  .text-[15px] { font-size: 15px; }
  .text-2xl { font-size: 24px; }
  .leading-relaxed { line-height: 1.625; }
  .text-gray-500 { color: #6b7280; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-700 { color: #374151; }

  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

const generatePrintContent = (data) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Birth Certificate – ${data.name}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        <div class="page-container first-page">
          <div class="certificate-card">
            
            <!-- Date at Top Right -->
            <div class="text-right text-sm font-bold text-black mb-6">
              Date: ${data.date || data.bod}
            </div>

            <!-- Main Title -->
            <div class="text-center mb-10">
              <h1 class="text-2xl font-bold text-teal tracking-wide inline-block border-b-teal pb-1 uppercase">
                Birth Certificate
              </h1>
            </div>

            <!-- Mother Details Section -->
            <div class="mb-8">
              <h2 class="text-base font-bold text-teal mb-2 uppercase">Mother Details</h2>
              <div class="space-y-0.5">
                <p class="text-xs font-bold text-gray-600 uppercase">Name</p>
                <p class="text-base font-bold text-black uppercase">${data.name}</p>
              </div>
            </div>

            <!-- Birth Details Section -->
            <div class="mb-12">
              <h2 class="text-base font-bold text-teal mb-4 uppercase">Birth Details</h2>
              <div class="text-[15px] leading-relaxed space-y-4 text-gray-700">
                <p>
                  This is to certify that the above-named mother delivered a 
                  <span class="font-bold text-black"> ${data.gender} </span> 
                  child at our hospital.
                </p>
                <p>
                  The delivery took place on <span class="font-bold text-black">${data.bod}</span> at 
                  <span class="font-bold text-black"> ${data.bot}</span>.
                </p>
                <p>
                  The baby weight at birth was <span class="font-bold text-black">${data.weight}</span>.
                </p>
                <p>
                  The mode of delivery was <span class="font-bold text-black">${data.mode}</span>.
                </p>
                <p class="pt-2 italic text-gray-500 text-sm">
                  This certificate is issued at the request of the patient/relatives for official records.
                </p>
              </div>
            </div>

            <!-- Doctor Signature Section -->
            <div class="text-right mt-16">
              <p class="text-base font-bold uppercase text-black">
                ${data.doctor_data?.doctor_name || ""}
              </p>
              <p class="text-xs font-bold text-gray-600 uppercase">
                ${data.doctor_data?.specialization_id?.specialization_name || ""}
              </p>
              <p class="text-xs text-gray-500 uppercase">
                ${data.doctor_data?.address || ""}
              </p>
            </div>

          </div>
        </div>
      </body>
    </html>
  `;
};

export const handleBirthPrint = (data) => {
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
