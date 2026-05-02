import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoctors } from "../services/doctor.services";
import { getOpdByDoctor } from "../services/doctor.services";
import { Calendar, DollarSign, CreditCard, Smartphone, Users, ArrowLeft, Eye, ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { getOpdById } from "../services/opd.services";
export default function DoctorOpdSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [paginatedopds, setPaginatedOpds] = useState([]);
  const [summary, setSummary] = useState({
    grand_total: 0,
    cash_total: 0,
    upi_total: 0,
    remaining: 0
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch paginated OPD records
  useEffect(() => {
    const fetchOpdRecords = async () => {
      try {
        setLoading(true);
        console.log("Fetching page:", currentPage);
        const response = await getOpdByDoctor(id, currentPage);
        console.log("API Response:", response);
        
        // Adjust based on your actual API response structure
        // If response has data property
        if (response.data && Array.isArray(response.data)) {
          setPaginatedOpds(response.data);
          setSummary(response.summary || { 
            grand_total: 0, 
            cash_total: 0, 
            upi_total: 0,
            remaining: 0 
          });
          
          // Handle pagination - check where count is
          const total = response.count || response.total || 0;
          setTotalRecords(total);
          setTotalPages(Math.ceil(total / 10)); // Adjust page size
        }
        // If response is directly an array
        else if (Array.isArray(response)) {
          setPaginatedOpds(response);
          // You might need to fetch summary separately
        }
        // If response has results property (common in DRF)
        else if (response.results) {
          setPaginatedOpds(response.results);
          setTotalRecords(response.count);
          setTotalPages(Math.ceil(response.count / 10));
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load OPD records");
      } finally {
        setLoading(false);
      }
    };

    // Fetch doctor details
    const fetchDoctor = async () => {
      try {
        const doctorsData = await getDoctors();
        const currentDoctor = doctorsData.data.find(d => d.id === parseInt(id));
        setDoctor(currentDoctor);
      } catch (err) {
        console.error("Error fetching doctor:", err);
      }
    };

    if (id) {
      fetchDoctor();
      fetchOpdRecords();
    }
  }, [id, currentPage]);

  // Helper function to extract ID
  const extractId = (opd) => {
    return opd?.id || opd?.opd_id || Math.random();
  };

  const handlePrintDetail = async (opdId) => {
    try {
      const res = await getOpdById(opdId);
      let opd = res.data;
      
      // Your existing print logic here (keeping it as is)
      const amountInWords = (num) => {
        const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
        const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
        if ((num = num.toString()).length > 9) return 'overflow';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return ''; 
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
        return str;
      };

      const printWindow = window.open("", "_blank", "width=900,height=650");

      printWindow.document.write(`
        <html>
          <head>
            <title>OPD Receipt - ${opd.patient_name}</title>
            <style>
              @page { margin: 10mm; size: auto; }
              body { 
                font-size: 12px; 
                color: #333; 
                margin: 0;
                padding: 20px;
              }
              .patient-card {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              }
              .patient-title {
                font-size: 16px;
                font-weight: 700;
                color: #1e293b;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              .header-flex {
                display: flex;
                justify-content: space-between;
                line-height: 1.6;
              }
              .col-left { flex: 1; }
              .col-right { flex: 1; text-align: right; }
              .label { color: #64748b; font-weight: 500; }
              .value { color: #1e293b; font-weight: 600; }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th {
                background-color: #bae6fd;
                color: #0369a1;
                padding: 10px;
                border: 1px solid #7dd3fc;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 11px;
              }
              td {
                padding: 10px;
                border: 1px solid #e2e8f0;
                text-align: center;
                font-size: 13px;
              }
              .text-left { text-align: left; }
              .summary-box {
                text-align: right;
                margin-top: 10px;
              }
              .in-words {
                text-align: left;
                font-style: italic;
                color: #64748b;
                margin-bottom: 15px;
                font-size: 11px;
              }
              .amount-line { margin-bottom: 5px; font-size: 14px; }
              .total-line { 
                font-size: 16px; 
                font-weight: 800; 
                color: #000;
                margin-top: 5px;
              }
              .footer {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .signature-area {
                text-align: center;
                min-width: 200px;
              }
              .dr-name {
                font-weight: 700;
                color: #1e3a8a;
                font-size: 14px;
                border-top: 1px dashed #cbd5e1;
                padding-top: 5px;
              }
              .sign-label {
                font-size: 9px;
                color: #94a3b8;
                letter-spacing: 1px;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            
            <div class="patient-card">
              <div class="patient-title">${opd.patient_name} (${opd.age} / ${opd.gender})</div>
              <div class="header-flex">
                <div class="col-left">
                  <div><span class="label">Mobile:</span> <span class="value">${opd.mobile_no}</span></div>
                  <div><span class="label">Address:</span> <span class="value">${opd.address || '-'}</span></div>
                  <div><span class="label">UHID:</span> <span class="value">P${opd.opd_data || opd.id}</span></div>
                </div>
                <div class="col-right">
                  <div><span class="label">Date:</span> <span class="value">${opd.date || opd.datetime?.split(' ')[0]}</span></div>
                  <div><span class="label">Bill No:</span> <span class="value">${opd.opd_data || opd.id}</span></div>
                  <div><span class="label">Dr:</span> <span class="value">Dr. ${opd.doctor_data?.doctor_name}</span></div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th width="10%">S.No</th>
                  <th width="65%" class="text-left">Service Description</th>
                  <th width="25%">Amount</th>
                </tr>
              </thead>
              <tbody>
                 ${
                  opd.service_id?.map((service, index) => `
                    <tr>
                      <td>${index+1}</td>
                      <td class="text-left">${service.service_name}</td>
                      <td>₹${service.service_price?.toFixed(2)}</td>
                    </tr>
                  `).join("") || ""
                }
              </tbody>
            </table>

            <div class="summary-box">
              <div class="in-words">In Words: ${amountInWords(opd.total_amount || 0)}</div>
              <div class="amount-line"><span class="label">Billed Amount:</span> <span class="value">₹${opd.total_amount?.toFixed(2)}</span></div>
              <div class="total-line"><span class="label">Received Amount:</span> ₹${opd.total_amount?.toFixed(2)}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Payment Method: Cash / Pay: cash</div>
            </div>

            <div class="footer">
              <div style="color: #94a3b8; font-size: 11px;">
                Thank you. Get well soon!
              </div>
              <div class="signature-area">
                <div class="dr-name">Dr. ${opd.doctor_data?.doctor_name}</div>
                <div class="sign-label">Authorized Medical Officer</div>
              </div>
            </div>

          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (err) {
      console.error("Print failed", err);
      alert("Unable to print OPD details");
    }
  };

  // Action buttons for each row
  const actionButtons = (opd) => [
      {
        label: "Update",
        color: "bg-sky-400 hover:bg-sky-500",
        onClick: () => navigate(`/opd-update/${extractId(opd)}`)
      },
      {
        label: "Print Detail",
        color: "bg-green-500 hover:bg-green-600",
        onClick: () => handlePrintDetail(extractId(opd))
      },
      {
        label: "Prescription",
        color: "bg-blue-600 hover:bg-blue-700",
        onClick: () => navigate(`/opd-prescription/${extractId(opd)}`)
      },
      {
        label: "Visit Pad",
        color: "bg-blue-700 hover:bg-blue-800",
        onClick: () => navigate(`/opd-visit/${extractId(opd)}`)
      },
      {
        label: "Delete",
        color: "bg-red-500 hover:bg-red-600",
        onClick: () => handleDelete(opd)
      },
    ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₹', '');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 min-h-screen">
        <div className="bg-white border border-red-200 rounded-lg p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // Calculate remaining (Grand Total - Collected)
  const collected = summary.cash_total + summary.upi_total;
  const remaining = summary.grand_total - collected;

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      {/* Doctor Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
            <Users size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {doctor?.doctor_name || doctor?.name || `Dr. ${doctor?.first_name} ${doctor?.last_name}`}
            </h1>
            <p className="text-gray-600 mt-1">
              {doctor?.specialization_id?.specialization_name || doctor?.specialization || 'General Physician'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">📋 Total OPD: <span className="font-semibold">{totalRecords}</span></span>
              {doctor?.mobile_no && <span className="flex items-center gap-1">📞 {doctor.mobile_no}</span>}
              {doctor?.email && <span className="flex items-center gap-1">✉️ {doctor.email}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards - Your requested layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Grand Total Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Grand Total</span>
            <Calendar size={18} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            ₹{formatCurrency(summary.grand_total)}
          </div>
          <div className="text-xs text-gray-500">
            Cash + UPI
          </div>
        </div>

        {/* Collected Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Cash</span>
            <CreditCard size={18} className="text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            ₹{formatCurrency(summary.cash_total)}
          </div>
          <div className="text-xs text-gray-500">
            Cash Payments
          </div>
        </div>

        {/* UPI Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">UPI</span>
            <Smartphone size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            ₹{formatCurrency(summary.upi_total)}
          </div>
          <div className="text-xs text-gray-500">
            Digital Payments
          </div>
        </div>

        {/* Remaining Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Remaining</span>
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-1">
            ₹{formatCurrency(remaining)}
          </div>
        </div>
      </div>

      {/* OPD Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
          <h2 className="text-lg font-semibold text-gray-800">OPD Records</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm bg-white px-3 py-1 rounded-full shadow-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SR</th>
                <th className="w-48 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile</th>
                <th className="w-40 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Doctor</th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="w-44 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-sm text-gray-500 italic">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      Loading data...
                    </div>
                  </td>
                </tr>
              ) : paginatedopds.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-sm text-gray-500">No OPD records found.</td>
                </tr>
              ) : (
                paginatedopds.map((opd) => (
                  <tr key={extractId(opd)} className="hover:bg-purple-50/50 transition-colors group">
                    <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                      {opd.sr_no || opd.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 truncate" title={opd.patient_name}>
                      <span className="block truncate">{opd.patient_name || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">
                      {opd.mobile_no || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 truncate" title={opd.doctor_data?.doctor_name}>
                      {opd.doctor_data?.doctor_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-700 tabular-nums">
                      ₹{opd.total_amount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {actionButtons(opd).map((btn, i) => (
                          <button
                            key={i}
                            onClick={btn.onClick}
                            className={`${btn.color} text-white text-[10px] uppercase font-medium px-2.5 py-1.5 rounded-md shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1`}
                            title={btn.label}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <div className="flex gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                        : 'border border-gray-300 hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}