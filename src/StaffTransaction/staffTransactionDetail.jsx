import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getStaffTransactionsByStaff } from "../services/staffTransactions.services";

// Helper to format currency
const formatCurrency = (amount) => {
  return `₹${parseFloat(amount || 0).toFixed(2)}`;
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return dateString;
};

// Helper to get type color
const getTypeColor = (type) => {
  switch(type?.toUpperCase()) {
    case 'CASH_IN':
    case 'CREDIT':
      return 'text-green-600 bg-green-50';
    case 'CASH_OUT':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

// Helper to get type label
const getTypeLabel = (type) => {
  switch(type?.toUpperCase()) {
    case 'CASH_IN': return 'Cash In';
    case 'CASH_OUT': return 'Cash Out';
    case 'CREDIT': return 'Credit';
    default: return type || 'Unknown';
  }
};

export default function StaffTransactionDetail() {
  const navigate = useNavigate();
  const { staffId } = useParams();

  /* ------------------ State ------------------ */
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staffInfo, setStaffInfo] = useState(null);

  /* ------------------ Fetch staff transactions ------------------ */
  useEffect(() => {
    if (staffId) {
      fetchStaffTransactions();
    }
  }, [staffId]);

  const fetchStaffTransactions = async () => {
    try {
      setLoading(true);
      const data = await getStaffTransactionsByStaff(staffId);
      const transactionList = Array.isArray(data.data) ? data.data : [];
      setTransactions(transactionList);
      
      // Extract staff info from first transaction (if available)
      if (transactionList.length > 0) {
        setStaffInfo(transactionList[0].staff_data);
      }
      
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch staff transactions");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Calculate summary ------------------ */
  const summary = useMemo(() => {
    let totalCashIn = 0;
    let totalCashOut = 0;
    let totalCredit = 0;
    
    transactions.forEach(txn => {
      const amount = parseFloat(txn.amount || 0);
      const type = txn.type?.toUpperCase();
      
      if (type === 'CASH_IN') {
        totalCashIn += amount;
      } else if (type === 'CASH_OUT') {
        totalCashOut += amount;
      } else if (type === 'CREDIT') {
        totalCredit += amount;
      }
    });
    
    const latestTxn = transactions.length > 0 
      ? transactions.reduce((latest, current) => 
          new Date(current.txn_datetime) > new Date(latest.txn_datetime) ? current : latest
        )
      : null;
    
    return {
      totalTransactions: transactions.length,
      totalCashIn,
      totalCashOut,
      totalCredit,
      latestBalance: latestTxn?.running_balance || "0.00",
      latestDate: latestTxn?.txn_datetime || "-"
    };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/staff-transactions")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Staff List</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Staff Information Card */}
        {staffInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Staff Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Staff Name</p>
                <p className="text-lg font-semibold text-gray-800">{staffInfo.staff_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Department</p>
                <p className="text-lg font-semibold text-gray-800">{staffInfo.department}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Mobile Number</p>
                <p className="text-lg font-semibold text-gray-800">{staffInfo.mobile_no}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-semibold text-gray-800">{staffInfo.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500">Total Cash In</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCashIn)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500">Total Cash Out</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCashOut)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className={`text-2xl font-bold ${parseFloat(summary.latestBalance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(summary.latestBalance)}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Running Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-purple-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                        #{txn.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(txn.txn_datetime)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(txn.type)}`}>
                          {getTypeLabel(txn.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {txn.category || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={txn.type?.toUpperCase() === 'CASH_OUT' ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={parseFloat(txn.running_balance) < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(txn.running_balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {txn.note || "No note"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}