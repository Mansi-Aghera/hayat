// StaffView.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Phone, Mail, MapPin, Building, Clock, 
  Calendar, DollarSign, ArrowLeft, Download,
  Printer, Edit
} from "lucide-react";
import { getStaffById } from "../services/staff.services";

export default function StaffView() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStaffDetails();
  }, [staffId]);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      const response = await getStaffById(staffId);
      setStaff(response.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch staff details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    navigate(`/edit-staff/${staffId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff details...</p>
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
            onClick={() => navigate("/staff")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Staff List
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Staff Details</h1>
              <p className="text-gray-600 mt-2">Complete information about {staff.staff_name}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-6xl font-bold mb-4">
                  {staff.image ? (
                    <img 
                        src={`https://adminapi.hayatplus.online${staff.image}`} 
                        alt={staff.staff_name}
                        className="w-48 h-48 rounded-full object-cover"
                    />
                    ) : (staff.staff_name?.charAt(0)?.toUpperCase())}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{staff.staff_name}</h2>
                
                <div className={`mt-3 px-4 py-1 rounded-full text-sm font-medium ${
                  staff.type === 'Medical' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {staff.type || "Staff"}
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <User size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Staff ID</p>
                    <p className="font-medium">#{staffId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joining Date</p>
                    <p className="font-medium">{formatDate(staff.date_of_joining)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Salary</p>
                    <p className="font-medium text-lg">
                      {staff.base_monthly_salary 
                        ? `₹${parseFloat(staff.base_monthly_salary).toFixed(2)}` 
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                <Phone size={22} className="text-indigo-600" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone size={18} />
                    <span className="text-sm">Mobile Number</span>
                  </div>
                  <p className="text-lg font-medium">{staff.mobile_no || "Not specified"}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail size={18} />
                    <span className="text-sm">Email Address</span>
                  </div>
                  <p className="text-lg font-medium break-all">{staff.email || "Not specified"}</p>
                </div>
                
                <div className="md:col-span-2 space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin size={18} />
                    <span className="text-sm">Address</span>
                  </div>
                  <p className="text-lg font-medium">{staff.address || "Not specified"}</p>
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                <Building size={22} className="text-green-600" />
                Work Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Building size={18} />
                    <span className="text-sm">Department</span>
                  </div>
                  <p className="text-lg font-medium">{staff.department || "Not specified"}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock size={18} />
                    <span className="text-sm">Work Timings</span>
                  </div>
                  <p className="text-lg font-medium">{staff.work_timings || "Not specified"}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={18} />
                    <span className="text-sm">Date of Birth</span>
                  </div>
                  <p className="text-lg font-medium">
                    {staff.dob ? `${formatDate(staff.dob)} (${calculateAge(staff.dob)} years)` : "Not specified"}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <User size={18} />
                    <span className="text-sm">Employment Type</span>
                  </div>
                  <p className="text-lg font-medium">{staff.type || "Not specified"}</p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                Additional Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Employment Duration</p>
                  <div className="flex items-center gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {calculateAge(staff.date_of_joining)}
                      </p>
                      <p className="text-xs text-gray-500">Years</p>
                    </div>
                    <div className="text-lg text-gray-700">
                      Working since {formatDate(staff.date_of_joining)}
                    </div>
                  </div>
                </div>
                
                {staff.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                    <div className="">
                      <p className="text-gray-700">{staff.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}