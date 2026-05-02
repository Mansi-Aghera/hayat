import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, ChevronRight, X, Pencil, ArrowLeft } from "lucide-react";
import { getMedicines,createMedicine,deleteMedicine,updateMedicine } from "../services/medicine.services";
/* ------------------ Helpers ------------------ */
const extractId = (item) => item?.id || item?._id;

export default function Medicine() {
  /* ------------------ State ------------------ */
  const [medicine, setMedicine] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  let navigate = useNavigate();


  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: "",
    composition: "",
    dosage: "",
    meal_time: "",
    quantity: ""
  });

  // search & filter
  const [search, setSearch] = useState("");
  const dosageOptions = [
    "1-1-0","1-1-1","1-0-1","0-1-1","0-0-1","0-1-0","1-0-0","SOS","STAT","PRN","HS","AC","PC","BID","TID","QID","QD","BBF","BD"
  ];
  const MealOptions = [
    "Before Meal",
    "After Meal",
    "With Meal",
    "Empty Stomach",
    "Any Time"
  ];

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add this inside your component, before the return statement
  const resetForm = () => {
    setFormData({
      medicine_name: "",
      composition: "",
      dosage: "",
      meal_time: "",
      quantity: ""
    });
    setEditingId(null);
  };

  /* ------------------ Fetch data ------------------ */
  useEffect(() => {
    fetchMedicine();
  }, []);


  const fetchMedicine = async () => {
    try {
      setLoading(true);
      const data = await getMedicines();
      let medicineData = Array.isArray(data.data) ? data.data : data
      setMedicine(medicineData);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch medicine");
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
      medicine_name: fcItem.medicine_name || "",
      composition: fcItem.composition || "",
      dosage: fcItem.dosage || "",
      meal_time: fcItem.meal_time || "",
      quantity: fcItem.quantity || ""
    });
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        medicine_name: formData.medicine_name,
        composition: formData.composition,
        dosage: formData.dosage,
        meal_time: formData.meal_time,
        quantity: formData.quantity
      };

      if (editingId) {
        await updateMedicine(editingId, payload);
      } else {
        await createMedicine(payload);
      }
      resetForm(); // Reset form after successful submit
      setEditingId(null);
      setIsModalOpen(false);
      fetchMedicine();
      
    } catch (error) {
      console.error("Failed to save Medicine:", error);
      alert("Failed to save. Please check all fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Filter & Pagination ------------------ */
  const filteredMedicine = useMemo(() => {
    return medicine.filter((medicineItem) => {
      const searchText = search.toLowerCase();
      return (
        medicineItem?.medicine_name?.toLowerCase().includes(searchText) ||
        medicineItem?.composition?.toLowerCase().includes(searchText) ||
        medicineItem?.dosage?.toString().includes(searchText) ||
        medicineItem?.meal_time?.toLowerCase().includes(searchText) ||
        medicineItem?.quantity?.toString().includes(searchText)
      );
    });
  }, [medicine, search]);

  const totalPages = Math.ceil(filteredMedicine.length / itemsPerPage);
  const paginatedMedicine = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMedicine.slice(start, start + itemsPerPage);
  }, [filteredMedicine, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  async function handleDelete(id) {
    try{
      if(window.confirm("Are you sure you want to delete this medicine?")){
        await deleteMedicine(id);
        fetchMedicine();
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
          <h1 className="text-4xl font-bold text-gray-800">Medicine Management</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            + Add Medicine
          </button>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Edit Medicine" : "Add New Medicine"}
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
                    <label className="block text-xs font-medium text-gray-700">Medicine Name *</label>
                    <input
                      type="text"
                      name="medicine_name"
                      value={formData.medicine_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Composition</label>
                    <input
                      type="text"
                      name="composition"
                      value={formData.composition}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Paracetamol, 500mg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Dosage *</label>
                    <select
                      name="dosage"
                      value={formData.dosage}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Dosage</option>
                      {dosageOptions.map((dosage) => (
                        <option key={dosage} value={dosage}>
                          {dosage}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Meal Time *</label>
                    <select
                      name="meal_time"
                      value={formData.meal_time}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Meal Time</option>
                      {MealOptions.map((meal) => (
                        <option key={meal} value={meal}>
                          {meal}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Quantity</label>
                    <input
                      type="text"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 1"
                    />
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
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Medicine Name</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Composition</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Dosage</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Meal Time</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-500">Loading...</td>
                  </tr>
                ) : paginatedMedicine.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-500">No Bed found</td>
                  </tr>
                ) : (
                  paginatedMedicine.map((fcItem) => (
                    <tr key={extractId(fcItem)} className="hover:bg-purple-50 transition-colors">
                      <td className="px-3 py-3 text-sm text-gray-800 font-medium">{fcItem.medicine_name || "-"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{fcItem.composition || "-"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{fcItem.dosage || "-"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{fcItem.meal_time || "-"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{fcItem.quantity || "-"}</td>
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