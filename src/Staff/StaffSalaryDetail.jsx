import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, X, Plus, Trash2, Edit, Calendar, DollarSign, CheckCircle, Clock, User, ArrowLeft } from "lucide-react";
import { getStaffById, updateStaff,updateStaffSalaryDetail,deleteStaffSalaryDetail } from "../services/staff.services";

export default function StaffSalaryDetail() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
const [isCalculationsOpen, setIsCalculationsOpen] = useState(false);
  
  // Form state for adding new payment
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: "",
    attendance: {
      present_days: 0,
      absent_days: 0,
      half_days: 0,
      late_days: 0,
      overtime_days: 0,
      paid_leaves: 0
    },
    daily_rate: 0,
    calculated_earnings: 0,
    net_payable: 0,
    payment_status: "PENDING"
  });
  
  // For editing existing record
  const [editingIndex, setEditingIndex] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Months list
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Years list (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  
  // Fetch staff data
  useEffect(() => {
    fetchStaffData();
  }, [staffId]);
  
  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const response = await getStaffById(staffId);
      setStaff(response.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch staff data");
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate values when attendance changes
  useEffect(() => {
    calculateValues();
  }, [formData.attendance, staff]);
  
  const calculateValues = () => {
    if (!staff || !staff.base_monthly_salary) return;
    
    const baseSalary = parseFloat(staff.base_monthly_salary) || 0;
    
    // Calculate daily rate
    const dailyRate = baseSalary / 30;
    
    // Get attendance values
    const { 
      present_days, 
      absent_days,
      half_days, 
      late_days, 
      overtime_days, 
      paid_leaves 
    } = formData.attendance;
    
    // Calculate converted days
    const halfDaysConverted = half_days * 0.5;      // Half days count as 0.5
    const lateDaysConverted = late_days * 0.5;      // Late days have 50% deduction
    const overtimeDaysConverted = overtime_days;    // Overtime counts as full extra days
    
    // Calculate total effective days using your formula:
    // Present days + (Half days × 0.5) + Overtime days + Paid leaves - Absent days - (Late days × 0.5)
    const totalEffectiveDays = 
      present_days + 
      halfDaysConverted + 
      overtimeDaysConverted + 
      paid_leaves - 
      absent_days - 
      lateDaysConverted;
    
    // Calculate net payable
    const netPayable = totalEffectiveDays * dailyRate;
    
    // Ensure net payable is not negative (minimum 0)
    const finalNetPayable = Math.max(0, netPayable);
    
    setFormData(prev => ({
      ...prev,
      daily_rate: parseFloat(dailyRate.toFixed(2)),
      calculated_earnings: parseFloat(finalNetPayable.toFixed(2)),
      net_payable: parseFloat(finalNetPayable.toFixed(2))
    }));
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('attendance.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        attendance: {
          ...prev.attendance,
          [field]: parseInt(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle editing existing record
  const handleEdit = (index) => {
    if (!staff?.salary_detail?.[index]) return;
    
    const record = staff.salary_detail[index];
    setFormData({
      year: record.year,
      month: record.month,
      attendance: { ...record.attendance },
      daily_rate: record.daily_rate,
      calculated_earnings: record.calculated_earnings,
      net_payable: record.net_payable,
      payment_status: record.payment_status
    });
    setEditingIndex(index);
    setIsEditMode(true);
  };
  
  // Handle delete record
  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) return;
    
    try {
      await deleteStaffSalaryDetail(staffId, index);
      fetchStaffData();
    } catch (error) {
      alert("Failed to delete salary record");
    }
  };
  
  // Handle form submission (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.year || !formData.month) {
      alert("Please select year and month");
      return;
    }
    
    // Check if this month already exists (only for new entries)
    if (!isEditMode && staff?.salary_detail) {
      const exists = staff.salary_detail.some(
        record => record.year === parseInt(formData.year) && 
                  record.month === formData.month
      );
      if (exists) {
        alert("Salary record for this month already exists. Please edit the existing record.");
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        // Update existing record
        await updateStaffSalaryDetail(staffId, editingIndex, formData);
      } else {
        // Add new record
        const updatedSalaryDetail = [formData]
        
        await updateStaff(staffId, { salary_detail: updatedSalaryDetail });
      }
      
      // Reset form and refresh data
      resetForm();
      fetchStaffData();
      alert(isEditMode ? "Salary record updated successfully!" : "Salary record added successfully!");
    } catch (error) {
      console.error("Error saving salary detail:", error);
      alert(error.response?.data?.detail || "Failed to save salary record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      month: "",
      attendance: {
        present_days: 0,
        absent_days: 0,
        half_days: 0,
        late_days: 0,
        overtime_days: 0,
        paid_leaves: 0
      },
      daily_rate: 0,
      calculated_earnings: 0,
      net_payable: 0,
      payment_status: "PENDING"
    });
    setEditingIndex(null);
    setIsEditMode(false);
  };
  
  // Handle cancel
  const handleCancel = () => {
    resetForm();
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/staff`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Staff Profile
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Salary Management</h1>
              <p className="text-gray-600 mt-2">
                Manage salary details for {staff.staff_name}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow">
                <p className="text-sm text-gray-500">Base Salary</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(staff.base_monthly_salary)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add/Edit Salary Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
            <DollarSign size={22} className="text-green-600" />
            {isEditMode ? "Edit Salary Record" : "Add New Salary Payment"}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {/* Year and Month Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Month <span className="text-red-500">*</span>
                </label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Attendance Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Attendance Details
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Present Days */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Present Days (P)
                  </label>
                  <input
                    type="number"
                    name="attendance.present_days"
                    value={formData.attendance.present_days}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    min="0"
                    max="31"
                  />
                </div>
                
                {/* Half Days */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Half Days (H)
                  </label>
                  <input
                    type="number"
                    name="attendance.half_days"
                    value={formData.attendance.half_days}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    min="0"
                    max="31"
                  />
                </div>
                
                {/* Late Days */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Late Days (L)
                  </label>
                  <input
                    type="number"
                    name="attendance.late_days"
                    value={formData.attendance.late_days}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    min="0"
                    max="31"
                  />
                </div>
                
                {/* Absent Days */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Absent Days (A)
                  </label>
                  <input
                    type="number"
                    name="attendance.absent_days"
                    value={formData.attendance.absent_days}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    min="0"
                    max="31"
                  />
                </div>
                
                {/* Overtime Days */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Overtime Days (OT)
                  </label>
                  <input
                    type="number"
                    name="attendance.overtime_days"
                    value={formData.attendance.overtime_days}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    min="0"
                    max="31"
                  />
                </div>
                
                {/* Paid Leaves */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Paid Leaves (PL)
                  </label>
                  <input
                    type="number"
                    name="attendance.paid_leaves"
                    value={formData.attendance.paid_leaves}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    min="0"
                    max="31"
                  />
                </div>
              </div>
            </div>
            
            {/* Calculations */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Calculations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Daily Rate (DR)
                  </label>
                  <div className="px-4 py-3 rounded-lg border border-gray-300 bg-gray-50">
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(formData.daily_rate)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Base Salary / 30 days
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Calculated Earnings (CE)
                  </label>
                  <div className="px-4 py-3 rounded-lg border border-gray-300 bg-gray-50">
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(formData.calculated_earnings)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on attendance
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Net Payable (To Pay)
                  </label>
                  <div className="px-4 py-3 rounded-lg border border-gray-300 bg-gray-50">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(formData.net_payable)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleInputChange}
                className="w-full md:w-64 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </button>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={20} />
                {isSubmitting 
                  ? (isEditMode ? "Updating..." : "Adding...") 
                  : (isEditMode ? "Update Payment" : "Add Payment")
                }
              </button>
            </div>
          </form>
        </div>
        
        {/* Existing Salary Records */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
            <Clock size={22} className="text-indigo-600" />
            Salary History
          </h2>
          
          {!staff.salary_detail || staff.salary_detail.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-300 mb-4">
                <DollarSign size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500">No salary records found</p>
              <p className="text-sm text-gray-400 mt-1">Add your first salary record above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Daily Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Earnings
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Net Payable
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.salary_detail.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {record.year}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {record.month}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            P: {record.attendance.present_days}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            H: {record.attendance.half_days}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            L: {record.attendance.late_days}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            A: {record.attendance.absent_days}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            OT: {record.attendance.overtime_days}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            PL: {record.attendance.paid_leaves}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(record.daily_rate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(record.calculated_earnings)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg font-bold text-purple-600">
                          {formatCurrency(record.net_payable)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          record.payment_status === 'PAID' 
                            ? 'bg-green-100 text-green-800'
                            : record.payment_status === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}