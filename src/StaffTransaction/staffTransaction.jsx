import { useEffect, useMemo, useState } from "react";
import { Eye, ChevronLeft, ChevronRight} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStaffTransactions } from "../services/staffTransactions.services";

// Helper to format currency
const formatCurrency = (amount) => {
  return `₹${parseFloat(amount || 0).toFixed(2)}`;
};

export default function StaffTransaction() {
  const navigate = useNavigate();

  /* ------------------ State ------------------ */
  const [staffTransactions, setStaffTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // search & filter
  const [search, setSearch] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ------------------ Fetch staff transactions ------------------ */
  useEffect(() => {
    fetchStaffTransactions();
  }, []);

  const fetchStaffTransactions = async () => {
    try {
      setLoading(true);
      const data = await getStaffTransactions();
      setStaffTransactions(Array.isArray(data.data) ? data.data : []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch staff transactions");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Process data to group by staff ------------------ */
  const staffSummary = useMemo(() => {
    const staffMap = {};

    staffTransactions.forEach(transaction => {
      const staffId = transaction.staff_data?.id;
      if (!staffId) return;

      if (!staffMap[staffId]) {
        staffMap[staffId] = {
          id: staffId,
          staff_name: transaction.staff_data?.staff_name || "Unknown",
          department: transaction.staff_data?.department || "-",
          mobile_no: transaction.staff_data?.mobile_no || "-",
          email: transaction.staff_data?.email || "-",
          transactions: 0,
          last_txn_datetime: "",
          last_running_balance: "0.00"
        };
      }

      // Increment transaction count
      staffMap[staffId].transactions += 1;

      // Compare dates to find the latest transaction
      const currentDate = new Date(transaction.txn_datetime);
      const existingDate = staffMap[staffId].last_txn_datetime 
        ? new Date(staffMap[staffId].last_txn_datetime)
        : null;

      if (!existingDate || currentDate > existingDate) {
        staffMap[staffId].last_txn_datetime = transaction.txn_datetime;
        staffMap[staffId].last_running_balance = transaction.running_balance;
      }
    });

    // Convert map to array and sort by last transaction date (newest first)
    return Object.values(staffMap).sort((a, b) => 
      new Date(b.last_txn_datetime) - new Date(a.last_txn_datetime)
    );
  }, [staffTransactions]);

  /* ------------------ Filter Logic ------------------ */
  const filteredStaff = useMemo(() => {
    if (!search) return staffSummary;
    
    const searchText = search.toLowerCase();
    return staffSummary.filter((staff) => {
      return (
        staff.staff_name?.toLowerCase().includes(searchText) ||
        staff.department?.toLowerCase().includes(searchText) ||
        staff.mobile_no?.toString().includes(searchText) ||
        staff.email?.toLowerCase().includes(searchText)
      );
    });
  }, [staffSummary, search]);

  /* ------------------ Pagination ------------------ */
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(start, start + itemsPerPage);
  }, [filteredStaff, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* ------------------ Action buttons ------------------ */
  const actionButtons = (staff) => [
    {
      label: "View",
      icon: Eye,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => navigate(`/staff-transactions-detail/${staff.id}`)
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Staff Transactions Summary</h1>
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <input
              type="text"
              placeholder="Search Staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-96 rounded-lg border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    NO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      Loading staff transactions...
                    </td>
                  </tr>
                ) : paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      {search ? "No staff found matching your search" : "No staff transactions found"}
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((staff, index) => (
                    <tr
                      key={staff.id}
                      className="hover:bg-purple-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {staff.staff_name || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {staff.mobile_no || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {staff.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-semibold text-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          {staff.transactions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {staff.last_txn_datetime || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={`
                          ${parseFloat(staff.last_running_balance) < 0 
                            ? 'text-red-600 bg-red-50 px-3 py-1 rounded-full' 
                            : parseFloat(staff.last_running_balance) > 0 
                              ? 'text-green-600 bg-green-50 px-3 py-1 rounded-full'
                              : 'text-gray-600 bg-gray-50 px-3 py-1 rounded-full'
                          }`}
                        >
                          {formatCurrency(staff.last_running_balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {actionButtons(staff).map((btn, i) => {
                            return (
                              <button
                                key={i}
                                onClick={btn.onClick}
                                className={`${btn.color} text-white text-xs font-medium px-3 py-2 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap hover:shadow-md`}
                                title={btn.label}
                              >
                                {btn.label}
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
          <div className="flex justify-center items-center gap-4 py-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}