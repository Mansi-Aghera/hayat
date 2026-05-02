import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { createStaff, updateStaff, getStaffById } from "../services/staff.services";

export default function StaffForm() {
  const navigate = useNavigate();
  const { staffId } = useParams();
  const isEditMode = !!staffId;

  // Form state
  const [formData, setFormData] = useState({
    staff_name: "",
    dob: "",
    type: "",
    mobile_no: "",
    address: "",
    base_monthly_salary: "",
    image: null,
    date_of_joining: "",
    department: "",
    email: "",
    work_timings: ""
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch staff data for edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchStaffData();
    }
  }, [staffId]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const response = await getStaffById(staffId);
      const staffData = response.data;
      
      console.log("Fetched staff data:", staffData); // Debug log
      
      // Format dates for input fields (YYYY-MM-DD)
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        staff_name: staffData.staff_name || "",
        dob: formatDateForInput(staffData.dob),
        type: staffData.type || "",
        mobile_no: staffData.mobile_no || "",
        address: staffData.address || "",
        base_monthly_salary: staffData.base_monthly_salary || "",
        image: staffData.image || null,
        date_of_joining: formatDateForInput(staffData.date_of_joining),
        department: staffData.department || "",
        email: staffData.email || "",
        work_timings: staffData.work_timings || ""
      });

      if (staffData.image) {
        setImagePreview(`https://adminapi.hayatplus.online${staffData.image}`);
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
      alert("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file); // Debug log
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          image: "Please upload a valid image (JPEG, PNG, GIF)"
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: "Image size should be less than 5MB"
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ""
        }));
      }
    }
  };

  // Remove image
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.staff_name.trim()) newErrors.staff_name = "Staff name is required";
    if (!formData.mobile_no.trim()) newErrors.mobile_no = "Mobile number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.date_of_joining) newErrors.date_of_joining = "Joining date is required"; // FIXED: changed from joining_date to date_of_joining

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Mobile validation
    const mobileRegex = /^\d{10}$/;
    if (formData.mobile_no && !mobileRegex.test(formData.mobile_no)) {
      newErrors.mobile_no = "Please enter a valid 10-digit mobile number";
    }

    console.log("Validation errors:", newErrors); // Debug log
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log("Form validation failed"); // Debug log
      return;
    }

    setIsSubmitting(true);
    try {
      // Format data for API
      const submitData = new FormData();
      
      // Append all fields
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== "") {
          submitData.append(key, value);
        }
      });

      console.log("Submitting data:"); // Debug log
      for (let pair of submitData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      if (isEditMode) {
        // Update existing staff
        const response = await updateStaff(staffId, submitData);
        console.log("Update response:", response); // Debug log
        alert("Staff updated successfully!");

      } else {
        // Create new staff
        console.log(submitData)
        const response = await createStaff(submitData);
        console.log("Create response:", response); // Debug log
        alert("Staff added successfully!");
      }
      
      navigate("/staff"); // Redirect to staff list
    } catch (error) {
      console.error("Error saving staff:", error);
      console.error("Error details:", error.response?.data); // Debug log
      alert(error.response?.data?.detail || error.response?.data?.message || "Failed to save staff. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
      navigate("/staff");
    }
  };

  // Staff types for dropdown
  const staffTypes = [
    { value: "", label: "Select Type" },
    { value: "Medical", label: "Medical" },
    { value: "Non Medical", label: "Non Medical" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-xl text-gray-600">Loading staff data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditMode ? "Update Staff" : "Add New Staff"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode 
              ? "Update staff information and save changes" 
              : "Fill in the details below to add a new staff member"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit}>
            {/* Two Column Layout for Form Fields */}
            <div className="space-y-8">
              {/* Staff Name - Full Width */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Staff Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="staff_name"
                  value={formData.staff_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.staff_name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  placeholder="Staff Name"
                />
                {errors.staff_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.staff_name}</p>
                )}
              </div>

              {/* Row: DOB | Joining Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    DOB
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Joining Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_of_joining"
                    value={formData.date_of_joining}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.date_of_joining ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  />
                  {errors.date_of_joining && (
                    <p className="text-sm text-red-500 mt-1">{errors.date_of_joining}</p>
                  )}
                </div>
              </div>

              {/* Row: Type | Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                  >
                    {staffTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Department"
                  />
                </div>
              </div>

              {/* Row: Mobile | Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile_no"
                    value={formData.mobile_no}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.mobile_no ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                    placeholder="Mobile Number"
                  />
                  {errors.mobile_no && (
                    <p className="text-sm text-red-500 mt-1">{errors.mobile_no}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                    placeholder="Email"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Address - Full Width */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Address"
                />
              </div>

              {/* Row: Salary | Timings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Base Monthly Salary
                  </label>
                  <input
                    type="number"
                    name="base_monthly_salary"
                    value={formData.base_monthly_salary}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Base Monthly Salary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Work Timings
                  </label>
                  <input
                    type="text"
                    name="work_timings"
                    value={formData.work_timings}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Work Timings (e.g. 9AM - 5PM)"
                  />
                </div>
              </div>

              {/* Profile Image Section */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Profile Image
                </label>
                
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  {/* File Upload Section */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                        id="file-upload"
                      />
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      {formData.image?.name || "No file chosen"}
                    </p>
                    {errors.image && (
                      <p className="text-sm text-red-500">{errors.image}</p>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  <div className="md:w-auto w-full flex justify-center">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 hover:border-indigo-300 transition-colors">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm text-center p-4">
                          No Image<br/>Selected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-medium border border-black hover:bg-gray-50 transition-colors"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {isSubmitting 
                  ? (isEditMode ? "Updating..." : "Adding...") 
                  : (isEditMode ? "Update Staff" : "Add Staff")
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}