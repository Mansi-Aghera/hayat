import { useEffect, useState, useCallback, useRef } from "react";
import { Pencil, Trash2, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getOpds, getOpdById, updateOpd } from "../services/opd.services";

/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getWeekAgoDateString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Opd() {
  const navigate = useNavigate();

  /* ------------------ State ------------------ */
  const [opds, setOpds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // search & filter
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("patient_name"); // 'patient_name', 'mobile_number', or 'hid'
  const [fromDate, setFromDate] = useState(getWeekAgoDateString());
  const [toDate, setToDate] = useState(getTodayDateString());

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Debounce search to avoid too many API calls
  const searchTimeout = useRef(null);

  // Collection Summary
  const [summary, setSummary] = useState({
    grandTotal: 0,
    cash: 0,
    upi: 0,
    remaining: 0,
    loading: false
  });

  /* ------------------ Fetch opds with pagination ------------------ */
  const fetchOpds = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    // HID search: fetch single OPD by ID directly
    if (searchType === "hid" && search.trim()) {
      try {
        const res = await getOpdById(search.trim());
        const record = res?.data || res;
        if (record && !record.is_delete) {
          setOpds([record]);
          setTotalCount(1);
          setTotalPages(1);
        } else {
          setOpds([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("HID search failed:", err);
        setOpds([]);
        setTotalCount(0);
        setTotalPages(1);
      }
      setLoading(false);
      return;
    }

    const params = {
      page: currentPage,
      page_size: itemsPerPage,
    };

    // patient search
    if (search.trim()) {
      if (searchType === "patient_name") {
        params.patient_name = search.trim();
      } else {
        params.mobile_number = search.trim();
      }
    }

    // date filters
    if (fromDate) params.start_date = fromDate;
    if (toDate) params.end_date = toDate;

    const res = await getOpds(params);

    console.log("API Response:", res.data);

    const data = res?.data?.data || [];
    const total = res?.data?.count || data.length;

    // 🔹 Sort data by date (newest first)
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date || a.datetime || 0);
      const dateB = new Date(b.date || b.datetime || 0);
      return dateB - dateA;
    });

    setOpds(sortedData);
    setTotalCount(total);
    setTotalPages(Math.ceil(total / itemsPerPage));

    // 🔹 Use backend summary if available, otherwise default to 0
    // This avoids the expensive manual calculation loop
    const backendSummary = res?.data?.summary || {};
    setSummary({
      grandTotal: parseFloat(backendSummary.grand_total || 0),
      cash: parseFloat(backendSummary.cash_total || 0),
      upi: parseFloat(backendSummary.upi_total || 0),
      remaining: parseFloat(backendSummary.remaining_total || 0),
      loading: false
    });

  } catch (err) {
    console.error(err);
    setError("Failed to fetch OPD records");
  } finally {
    setLoading(false);
  }
}, [currentPage, search, searchType, fromDate, toDate]);



  // Debounced search
  useEffect(() => {
  if (searchTimeout.current) {
    clearTimeout(searchTimeout.current);
  }

  searchTimeout.current = setTimeout(() => {
    fetchOpds();
  }, 400);

  return () => clearTimeout(searchTimeout.current);

}, [currentPage, search, searchType, fromDate, toDate]);

  /* ------------------ Pagination Handlers ------------------ */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* ------------------ Print Function ------------------ */
  const handlePrintDetail = async (opdId) => {
    try {
      const res = await getOpdById(opdId);
      let opd = res.data;
      
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
                      <td>${index + 1}</td>
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

  /* ------------------ Delete ------------------ */
  const handleDelete = async (opd) => {
    if (!window.confirm("Are you sure you want to delete this Opd?")) return;
    const id = extractId(opd);
    
    try {
      await updateOpd(id, {
        is_delete: true,
      });

      // Refresh current page after delete
      fetchOpds();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete OPD");
    }
  };

  const actionButtons = (opd) => [
    {
      label: "Update",
      icon: Pencil,
      color: "bg-sky-400 hover:bg-sky-500",
      onClick: () => navigate(`/opd-update/${extractId(opd)}`)
    },
    {
      label: "Print Detail",
      icon: Printer,
      color: "bg-green-500 hover:bg-green-600",
      onClick: () => handlePrintDetail(extractId(opd))
    },
    {
      label: "Prescription",
      icon: Pencil,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => navigate(`/opd-prescription/${extractId(opd)}`)
    },
    {
      label: "Visit Pad",
      icon: Pencil,
      color: "bg-blue-700 hover:bg-blue-800",
      onClick: () => navigate(`/opd-visit/${extractId(opd)}`)
    },
    {
      label: "Delete",
      icon: Trash2,
      color: "bg-red-500 hover:bg-red-600",
      onClick: () => handleDelete(opd)
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">OPD Management</h1>
          <button
            onClick={() => navigate("/add-opd")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            + Add OPD
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[300px] flex gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="patient_name">Patient Name</option>
                <option value="mobile_number">Mobile Number</option>
                <option value="hid">UHID</option>
              </select>
              
              <input
                type="text"
                placeholder={`Search by ${searchType === 'patient_name' ? 'patient name' : searchType === 'mobile_number' ? 'mobile number' : 'OPD ID'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Collection Summary Dashboard - Compact Horizontal Row */}
        <div className="relative">
          {summary.loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="flex justify-between items-end mb-4">
             <div>
               <h2 className="text-xl font-bold text-gray-800">Today's Collection</h2>
               <p className="text-gray-500 text-xs font-medium mt-0.5">
                 From server • {totalCount} patients today
               </p>
             </div>
             <div className="flex gap-2">
               <button className="flex items-center gap-2 text-blue-600 font-semibold text-xs border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                 Payments
               </button>
               <a href="#" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-xs font-semibold px-3 py-1.5 transition-all">
                 Full History &rarr;
               </a>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Grand Total */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-blue-600 font-bold text-lg">₹</div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Grand Total</p>
                <h3 className="text-blue-700 text-xl font-bold leading-none mt-1">₹{summary.grandTotal.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            {/* Cash */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Cash</p>
                <h3 className="text-green-700 text-xl font-bold leading-none mt-1">₹{summary.cash.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            {/* UPI */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">UPI</p>
                <h3 className="text-purple-700 text-xl font-bold leading-none mt-1">₹{summary.upi.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            {/* Remaining */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Remaining</p>
                <h3 className="text-red-700 text-xl font-bold leading-none mt-1">₹{summary.remaining.toLocaleString('en-IN')}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Error & Table Card */}
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
                    <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">UHid</th>
                    <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SR</th>
                    <th className="w-48 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                    <th className="w-40 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Time</th>
                    <th className="w-48 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Services</th>
                    <th className="w-44 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-500 italic">
                        <div className="flex justify-center items-center">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                          Loading data...
                        </div>
                      </td>
                    </tr>
                  ) : opds.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                        {search || fromDate || toDate ? 'No matching records found.' : 'No OPD records found.'}
                      </td>
                    </tr>
                  ) : (
                    opds.map((opd, index) => (
                      <tr key={extractId(opd)} className="hover:bg-purple-50/50 transition-colors group">
                        <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                          {extractId(opd)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                          {opd.sr_no}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 truncate" title={opd.patient_name}>
                          {opd.patient_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {opd.date || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <div className="flex flex-wrap gap-1">
                            {opd.service_id?.map((s, i) => (
                              <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-100">
                                {s.service_name}
                              </span>
                            ))}
                          </div>
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
          </div>
        </div>

        {/* Pagination Controls */}
        {!error && totalCount > 0 && totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex justify-center items-center gap-4">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • {totalCount} total records
            </div>
          </div>
        )}
        
        {/* Simple pagination if only one page */}
        {!error && totalCount > 0 && totalPages <= 1 && (
          <div className="text-center text-sm text-gray-600 py-2">
            Showing all {totalCount} records
          </div>
        )}
        </div>
      </div>
    </div>
  );
}