import React from 'react';

const PDFGenerator = ({ 
  billingData = {}, 
  patientInfo = {}, 
  ipdId = '',
  services = [] 
}) => {
  
  const printBill = () => {
    if (!billingData) {
      alert('No billing data available to print');
      return;
    }

    // Create a printable HTML page
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hospital Bill - ${patientInfo.patient_name || 'Patient'}</title>
        <style>
          @media print {
            @page { margin: 20mm; }
            body { margin: 0; padding: 0; }
            .print-header { 
              background: #2980b9; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              margin-bottom: 20px;
            }
            .patient-info { 
              background: #f8f9fa; 
              padding: 15px; 
              margin-bottom: 20px; 
              border-radius: 5px;
            }
            .patient-info h3 { margin-top: 0; color: #2c3e50; }
            .patient-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .detail-item { margin-bottom: 8px; }
            .detail-label { font-weight: bold; color: #34495e; }
            .detail-value { color: #2c3e50; }
            .services-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            .services-table th { 
              background: #27ae60; 
              color: white; 
              padding: 10px; 
              text-align: left;
            }
            .services-table td { 
              padding: 8px; 
              border-bottom: 1px solid #ddd;
            }
            .billing-summary { 
              margin: 20px 0; 
              padding: 15px; 
              background: #f8f9fa; 
              border-radius: 5px;
            }
            .summary-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px;
            }
            .total-due { 
              font-size: 1.2em; 
              font-weight: bold; 
              color: #e74c3c; 
              border-top: 2px solid #ddd; 
              padding-top: 10px;
            }
            .signatures { 
              display: flex; 
              justify-content: space-between; 
              margin-top: 50px; 
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .signature-box { text-align: center; }
            .signature-line { 
              width: 200px; 
              border-top: 1px solid #000; 
              margin: 40px auto 10px;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              font-style: italic; 
              color: #666; 
              font-size: 0.9em;
            }
            .print-button { display: none; }
          }
          
          @media screen {
            body { padding: 20px; background: #f5f5f5; }
            .print-content { 
              background: white; 
              padding: 20px; 
              max-width: 800px; 
              margin: 0 auto; 
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .print-button { 
              text-align: center; 
              margin: 20px 0;
            }
            button { 
              padding: 10px 20px; 
              background: #2980b9; 
              color: white; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
            }
            button:hover { background: #1c6ea4; }
          }
        </style>
      </head>
      <body>
        <div class="print-content">
          
          <div class="patient-info">
            <h3>PATIENT INFORMATION</h3>
            <div class="patient-details">
              <div class="detail-item">
                <span class="detail-label">Patient Name:</span>
                <span class="detail-value">${patientInfo.patient_name || 'Not Available'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Mobile:</span>
                <span class="detail-value">${patientInfo.mobile || 'Not Available'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${patientInfo.address || 'Not Available'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Admission Date:</span>
                <span class="detail-value">${patientInfo.admission_date || 'Not Available'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Bed Number:</span>
                <span class="detail-value">${patientInfo.bed_number || 'Not Available'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Discharge Date:</span>
                <span class="detail-value">${patientInfo.discharge_date || 'Pending'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Bill Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Bill No:</span>
                <span class="detail-value">HMS-${ipdId}-${new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
          
          <h3>SERVICES & CHARGES</h3>
          <table class="services-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Service Description</th>
                <th>Unit Price (₹)</th>
                <th>Quantity</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${services && services.length > 0 ? 
                services.map((service, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${service.hospital_service_data?.name || 'Unknown Service'}</td>
                    <td>₹${service.fees?.toLocaleString('en-IN') || '0'}</td>
                    <td>${service.quantity || '1'}</td>
                    <td>₹${service.total?.toLocaleString('en-IN') || '0'}</td>
                  </tr>
                `).join('') : 
                '<tr><td colspan="5" style="text-align: center;">No services added</td></tr>'
              }
            </tbody>
          </table>
          
          <div class="billing-summary">
            <h3>BILLING SUMMARY</h3>
            <div class="summary-row">
              <span>Gross Total:</span>
              <span>₹${billingData.gross_total?.toLocaleString('en-IN') || '0'}</span>
            </div>
            <div class="summary-row">
              <span>Discount:</span>
              <span>₹${billingData.discount_total?.toLocaleString('en-IN') || '0'}</span>
            </div>
            <div class="summary-row">
              <span>Advanced Payment:</span>
              <span>₹${billingData.advanced_paid?.toLocaleString('en-IN') || '0'}</span>
            </div>
            <div class="summary-row">
              <span>Total Paid:</span>
              <span>₹${billingData.total_paid?.toLocaleString('en-IN') || '0'}</span>
            </div>
            <div class="summary-row total-due">
              <span>BALANCE DUE:</span>
              <span>₹${billingData.total_due?.toLocaleString('en-IN') || '0'}</span>
            </div>
            <div style="margin-top: 15px;">
              <strong>Bill Type:</strong> ${billingData.bill_type || 'Provisional Bill'} | 
              <strong>Status:</strong> ${billingData.is_settled ? 'SETTLED' : 'PENDING'}
            </div>
          </div>
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p><strong>Doctor's Signature</strong></p>
              <p>(Authorized Medical Officer)</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p><strong>Cashier's Signature</strong></p>
              <p>(Authorized Finance Officer)</p>
            </div>
          </div>
          
          <div class="print-button">
            <button onclick="window.print()">Print Bill</button>
            <button onclick="window.close()">Close</button>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button
      onClick={printBill}
      className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print Bill
    </button>
  );
};

export default PDFGenerator;