import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, ChevronRight, X, Pencil, ArrowLeft } from "lucide-react";
import { getBeds,createBed,updateBed,deleteBed } from "../services/bed.services";
/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

export default function Bed() {
  /* ------------------ State ------------------ */
  const [bed, setBed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  let navigate = useNavigate();


  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name:"",
    bed_number:"",
    status:"vacant",
  });

  // search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | vacant | occupied

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add this inside your component, before the return statement
  const resetForm = () => {
    setFormData({
      name: "",
      bed_number: "",
      status: "vacant",
    });
    setEditingId(null);
  };

  /* ------------------ Fetch data ------------------ */
  useEffect(() => {
    fetchBed();
  }, []);


  const fetchBed = async () => {
    try {
      setLoading(true);
      const data = await getBeds();
      let bedData = Array.isArray(data.data) ? data.data : data
      setBed(bedData);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch fc");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Form Handlers ------------------ */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
  };


  const handleUpdate = (fcItem) => {
    setEditingId(extractId(fcItem));

    setFormData({
      name: fcItem.name || "",
      bed_number: fcItem.bed_number || "",
      status: fcItem.status || "vacant",
    });
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        bed_number: formData.bed_number,
        status: formData.status,
      };

      if (editingId) {
        await updateBed(editingId, payload);
      } else {
        await createBed(payload);
      }
      resetForm(); // Reset form after successful submit
      setEditingId(null);
      setIsModalOpen(false);
      fetchBed();
      
    } catch (error) {
      console.error("Failed to save Bed:", error);
      alert("Failed to save. Please check all fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Filter & Pagination ------------------ */
  const filteredBed = useMemo(() => {
    return bed.filter((bedItem) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        bedItem?.name?.toLowerCase().includes(searchText) ||
        bedItem?.bed_number?.toString().includes(searchText) ||
        bedItem?.status?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" || bedItem?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bed, search, statusFilter]);

  const totalPages = Math.ceil(filteredBed.length / itemsPerPage);
  const paginatedBed = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBed.slice(start, start + itemsPerPage);
  }, [filteredBed, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  async function handleDelete(id) {
    try{
      if(window.confirm("Are you sure you want to delete this bed?")){
        await deleteBed(id);
        fetchBed();
      }
    }catch(err){
      console.error("Failed to delete bed:", err);
      alert("Failed to delete. Please try again.");
    }
  }

  const actionButtons = (fcItem) => [
    {
      label: "Update",
      icon: Pencil,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => handleUpdate(fcItem)
    },
    {
      label: "Delete",
      icon: Trash2,
      color: "bg-green-600 hover:bg-green-700",
      onClick: () => handleDelete(extractId(fcItem)) // Delete Bed item
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Bed Management</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            + Add Bed
          </button>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Edit Bed " : "Add New Bed"}
                </h2>
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Information */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Bed Number</label>
                    <input
                      type="text"
                      name="bed_number"
                      value={formData.bed_number}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 101"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="vacant">Vacant</option>
                      <option value="occupied">occupied</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="sticky bottom-0 bg-white pt-3 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsModalOpen(false);
                      setEditingId(null);
                    }}
                    className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : editingId ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name, bed number, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Beds</option>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Bed Number</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-500">Loading...</td>
                  </tr>
                ) : paginatedBed.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-500">No Bed found</td>
                  </tr>
                ) : (
                  paginatedBed.map((fcItem) => (
                    <tr key={extractId(fcItem)} className="hover:bg-purple-50 transition-colors">
                      <td className="px-3 py-3 text-sm text-gray-800 font-medium">{fcItem.name || "-"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{fcItem.bed_number || "-"}</td>
                      <td className={`px-3 py-3 text-sm font-bold text-gray-600 ${fcItem.status === "occupied" ? "text-red-500" : "text-green-500"}`}>{fcItem.status || "-"}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          {actionButtons(fcItem).map((btn, i) => {
                            const Icon = btn.icon;
                            return (
                              <button
                                key={i}
                                onClick={btn.onClick}
                                className={`${btn.color} text-white p-1.5 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md`}
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
          <div className="flex justify-center items-center gap-3 py-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg shadow-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}