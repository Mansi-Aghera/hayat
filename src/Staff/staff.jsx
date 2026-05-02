import { useEffect, useMemo, useState} from "react";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Printer, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStaff, deleteStaff } from "../services/staff.services";

/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

export default function Staff() {
  const navigate = useNavigate();

  /* ------------------ State ------------------ */
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // search & filter
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ------------------ Fetch staff ------------------ */
  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const data = await getStaff();
      setStaff(Array.isArray(data.data) ? data.data : data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Delete ------------------ */
  const handleDelete = async (staffItem) => {
    if (!window.confirm(`Are you sure you want to delete ${staffItem.staff_name}?`)) return;
    try {
      await deleteStaff(extractId(staffItem));
      fetchStaffs();
    } catch (error) {
      alert("Failed to delete staff member");
    }
  };

  /* ------------------ Filter Logic ------------------ */
  const filteredstaff = useMemo(() => {
    return staff.filter((staffItem) => {
      const searchText = search.toLowerCase();
      
      const matchesSearch = 
        staffItem?.staff_name?.toLowerCase().includes(searchText) ||
        staffItem?.mobile_no?.toString().includes(searchText) ||
        staffItem?.email?.toLowerCase().includes(searchText);

      const matchesType = 
        typeFilter === "all" || 
        staffItem?.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [staff, search, typeFilter]);

  /* ------------------ Pagination ------------------ */
  const totalPages = Math.ceil(filteredstaff.length / itemsPerPage);

  const paginatedstaff = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredstaff.slice(start, start + itemsPerPage);
  }, [filteredstaff, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const actionButtons = (staffItem) => [
    {
      label: "View",
      icon: Eye,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => navigate(`/view-staff/${extractId(staffItem)}`)
    },
    {
      label: "Update",
      icon: Pencil,
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => navigate(`/edit-staff/${extractId(staffItem)}`)
    },
    {
      label: "Salary",
      icon: Printer,
      color: "bg-purple-600 hover:bg-purple-700",
      onClick: () => navigate(`/staff-salary-detail/${extractId(staffItem)}`)
    },
    {
      label: "Delete",
      icon: Trash2,
      color: "bg-red-600 hover:bg-red-700",
      onClick: () => handleDelete(staffItem)
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Staff Management</h1>
          <button
            onClick={() => navigate("/add-staff")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            + Add Staff
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <input
              type="text"
              placeholder="Search Staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="Medical">Medical</option>
              <option value="Non Medical">Non Medical</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    NO
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Work Timing
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedstaff.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      No Staff found
                    </td>
                  </tr>
                ) : (
                  paginatedstaff.map((staffItem, index) => (
                    <tr
                      key={extractId(staffItem)}
                      className="hover:bg-purple-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700 font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-800 font-medium">
                            {staffItem.staff_name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {staffItem.mobile_no || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {staffItem.department || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          staffItem.type === 'Medical' 
                            ? 'bg-green-100 text-green-800' 
                            : staffItem.type === 'Non Medical'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {staffItem.type || "Not Specified"}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {staffItem.work_timings || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {actionButtons(staffItem).map((btn, i) => {
                            const Icon = btn.icon;
                            return (
                              <button
                                key={i}
                                onClick={btn.onClick}
                                className={`${btn.color} text-white p-2 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center hover:shadow-md`}
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

        {/* Pagination - Original Design */}
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