import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, FileText, Activity, Bed, Stethoscope, Receipt, CreditCard, TrendingUp, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getIpds, getIpdss, getIpdById, checkDischargeExists, updateIpd } from "../services/ipd.services";
import { getDischarge, updateDischarge } from "../services/certificates.services";


/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

export default function Ipd() {
  const navigate = useNavigate();

  /* ------------------ State ------------------ */
  const [ipds, setIpds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // search & filter
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("patient_name"); // 'patient_name', 'mobile_number', or 'hid'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState("active"); // 'active' or 'discharged'


  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const searchTimeout = useRef(null);

  /* ------------------ Fetch IPDs with filters ------------------ */
  const fetchIpds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // HID search: fetch single IPD by ID directly
      if (searchType === "hid" && search.trim()) {
        try {
          const res = await getIpdById(search.trim());
          const record = res?.data || res;
          
          const expectedDischarge = activeTab === "active" ? 0 : 1;
          const val = record?.is_discharge ? 1 : 0;
          const matchesTab = val === expectedDischarge;

          if (record && !record.is_delete && matchesTab) {
            setIpds([record]);
            setTotalCount(1);
            setTotalPages(1);
          } else {
            setIpds([]);
            setTotalCount(0);
            setTotalPages(1);
          }
        } catch (err) {
          console.error("HID search failed:", err);
          setIpds([]);
          setTotalCount(0);
          setTotalPages(1);
        }
        setLoading(false);
        return;
      }

      // Fetch ALL IPDs since backend might not filter is_discharge properly
      const res = await getIpds();
      let allData = Array.isArray(res) ? res : [];

      // If getIpds somehow returns an object with results/data
      if (res?.data?.data) allData = res.data.data;
      else if (res?.data?.results) allData = res.data.results;
      else if (res?.data && Array.isArray(res.data)) allData = res.data;

      // Filter out deleted
      let filteredData = allData.filter(ipd => !ipd.is_delete);

      // Filter for active/discharged
      const expectedDischarge = activeTab === "active" ? 0 : 1;
      filteredData = filteredData.filter(ipd => {
        const val = ipd.is_discharge ? 1 : 0;
        return val === expectedDischarge;
      });

      // Filter for search
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        if (searchType === "patient_name") {
          filteredData = filteredData.filter(ipd => ipd.patient_name?.toLowerCase().includes(query));
        } else if (searchType === "mobile_number") {
          filteredData = filteredData.filter(ipd => ipd.mobile?.toLowerCase().includes(query) || ipd.mobile_no?.toLowerCase().includes(query));
        }
      }

      // Filter for dates
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        filteredData = filteredData.filter(ipd => {
           if (!ipd.created_at && !ipd.date) return true;
           const ipdDate = new Date(ipd.created_at || ipd.date);
           return ipdDate >= start;
        });
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filteredData = filteredData.filter(ipd => {
           if (!ipd.created_at && !ipd.date) return true;
           const ipdDate = new Date(ipd.created_at || ipd.date);
           return ipdDate <= end;
        });
      }

      setTotalCount(filteredData.length);
      setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
      
      // Paginate locally
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
      
      setIpds(paginatedData);

    } catch (err) {
      console.error("Error fetching IPDs:", err);
      setError(err.response?.data?.message || "Failed to fetch IPD records");
      setIpds([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, searchType, fromDate, toDate, activeTab]);


  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page on new search
      } else {
        fetchIpds();
      }
    }, 500);

    return () => clearTimeout(searchTimeout.current);
  }, [search, searchType, fromDate, toDate, activeTab]);


  // Fetch when page changes or when search triggers with page=1
  useEffect(() => {
    fetchIpds();
  }, [currentPage, search, searchType, fromDate, toDate, activeTab]);


  /* ------------------ Pagination Handlers ------------------ */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* ------------------ Delete ------------------ */
  const handleDelete = async (ipd) => {
    if (!window.confirm("Are you sure you want to delete this IPD record?")) return;

    const id = extractId(ipd);

    try {
      await updateIpd(id, { is_delete: true });
      
      // Refresh data after delete
      fetchIpds();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete record");
    }
  };


  const handleDischargeCheck = async (ipd) => {
    const ipdId = extractId(ipd);
    if (!ipdId) return;

    try {
      const alreadyDischarged = await checkDischargeExists(ipdId);

      if (alreadyDischarged) {
        // Find is used if we have the discharge record in the list, but usually we just navigate
        navigate(`/discharge-ipd/view/${ipdId}`);
        return;
      }

      navigate(`/discharge/ipd/${ipdId}`);

    } catch (error) {
      console.error("Discharge check failed:", error);
      alert("Unable to verify discharge status. Please try again.");
    }
  };

  const actionButtons = (ipd) => {
    // Determine the target ID for IPD-related actions
    const targetIpdId = extractId(ipd);

    const commonButtons = [
      {
        label: "Update",
        icon: Pencil,
        color: "bg-blue-600 hover:bg-blue-700",
        onClick: () => navigate(`/ipd-update/${targetIpdId}`)
      },
      {
        label: "Investigation",
        icon: Activity,
        color: "bg-indigo-700 hover:bg-indigo-800",
        onClick: () => navigate(`/investigation/${targetIpdId}`)
      },
      {
        label: "Switch Bed",
        icon: Bed,
        color: "bg-blue-500 hover:bg-blue-600",
        onClick: () => {
          if (activeTab === "discharged") {
            alert("This patient has already been discharged. Bed management is not available.");
          } else {
            navigate(`/ipd-bed-switch/${targetIpdId}`);
          }
        }
      },
      {
        label: "View Details",
        icon: Eye,
        color: "bg-blue-700 hover:bg-blue-800",
        onClick: () => navigate(`/view-ipd/${targetIpdId}`)
      },
      {
        label: "Treatment",
        icon: Stethoscope,
        color: "bg-green-700 hover:bg-green-800",
        onClick: () => navigate(`/ipd-treatment-chart/${targetIpdId}`)
      },
      {
        label: "Delete",
        icon: Trash2,
        color: "bg-red-600 hover:bg-red-700",
        onClick: () => handleDelete(ipd) // Delete specific record (Discharge or IPD)
      },
      {
        label: "Round",
        icon: Activity,
        color: "bg-cyan-600 hover:bg-cyan-700",
        onClick: () => navigate(`/ipd-daily-round/${targetIpdId}`)
      },
      {
        label: "D Certificate",
        icon: FileCheck,
        color: "bg-rose-600 hover:bg-rose-700",
        onClick: () => activeTab === "active" ? handleDischargeCheck(ipd) : navigate(`/discharge-ipd/view/${extractId(ipd)}`)
      },
      {
        label: "Discharge Now",
        icon: FileText,
        color: "bg-orange-600 hover:bg-orange-700",
        onClick: () => {
          if (activeTab === "discharged") {
            alert("This patient is already discharged.");
          } else {
            navigate(`/ipd-discharge/${targetIpdId}`);
          }
        }
      },
      {
        label: "BP / Sugar Chart",
        icon: TrendingUp,
        color: "bg-lime-600 hover:bg-lime-700",
        onClick: () => navigate(`/ipd-bp-chart/${targetIpdId}`)
      },
      {
        label: "Bill",
        icon: Receipt,
        color: "bg-yellow-600 hover:bg-yellow-700",
        onClick: () => navigate(`/ipd-bill/${targetIpdId}`)
      },
      {
        label: "Payment",
        icon: CreditCard,
        color: "bg-orange-700 hover:bg-orange-800",
        onClick: () => navigate(`/ipd-payment/${targetIpdId}`)
      },
    ];

    return commonButtons;
  };



 
  /* ------------------ UI ------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-bold text-gray-800">IPD Management</h1>
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-4 py-1 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "active"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Active IPD
              </button>
              <button
                onClick={() => setActiveTab("discharged")}
                className={`px-4 py-1 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "discharged"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Discharged IPD
              </button>
            </div>

            <button
              onClick={() => navigate("/add-ipd")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              + Add IPD
            </button>
          </div>
        </div>


        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[300px] flex gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="patient_name">Patient Name</option>
                <option value="mobile_number">Mobile Number</option>
                <option value="hid">HID</option>
              </select>
              
              <input
                type="text"
                placeholder={`Search by ${searchType === 'patient_name' ? 'patient name' : searchType === 'mobile_number' ? 'mobile number' : 'IPD ID'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

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
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    SR NO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>


              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                        Loading IPD records...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : ipds.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500">
                      {search || fromDate || toDate ? 'No matching IPD records found.' : 'No IPD records found.'}
                    </td>
                  </tr>
                ) : (
                  ipds.map((ipd, index) => (
                    <tr
                      key={extractId(ipd) || index}
                      className="hover:bg-purple-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {ipd.sr_no || ((currentPage - 1) * itemsPerPage) + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                        {ipd.patient_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {ipd.mobile || ipd.mobile_no || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {ipd.doctor_data?.doctor_name || ipd.doctor_name || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 min-w-max">
                          {actionButtons(ipd).map((btn, i) => {
                            const Icon = btn.icon;
                            return (
                              <button
                                key={i}
                                onClick={btn.onClick}
                                className={`${btn.color} text-white text-xs font-medium px-3 py-1 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap hover:shadow-md`}
                                title={btn.label}
                              >
                                <Icon size={14} />
                                <span>{btn.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>


                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
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
        {totalPages <= 1 && totalCount > 0 && (
          <div className="text-center text-sm text-gray-600 py-2">
            Showing all {totalCount} records
          </div>
        )}
      </div>
    </div>
  );
}