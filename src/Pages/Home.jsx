import { useState, useEffect } from "react";
import { CERTIFICATE_TYPES } from "../services/certificates.services";
import { useNavigate } from "react-router-dom";
import { FileText, Activity, User, Clipboard, Stethoscope, Scissors, Syringe, Baby, Brain, Heart, Eye, Shield, Phone, Mail } from "lucide-react";
import { getDoctors } from "../services/doctor.services"; // Adjust the import path as needed

export default function Home() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch doctors using your getDoctors function
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await getDoctors();
        setDoctors(data.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Navigation mapping for each certificate type
  const getNavigationPath = (key) => {
    const pathMap = {
      'medical_certificate': '/medical-certificate',
      'fitness_certificate': '/fitness-certificate',
      'scalp_list': '/scalp',
      'ipd_list': '/ipd',
      'birth': '/birth-certificate',
      'death': '/death-certificate',
      'discharge_certificate': '/discharge-ipd',
      'expenditure': '/expenditure',
      'refer': '/refer'
    };
    return pathMap[key] || `/${key}`;
  };

  // Icon mapping for certificates
  const getIcon = (type) => {
    const iconMap = {
      'medical_certificate': FileText,
      'fitness_certificate': Activity,
      'scalp': User,
      'opd': Clipboard,
      'ipd': Stethoscope,
      'surgery': Scissors,
      'vaccination': Syringe,
      'birth': Baby,
      'death': Brain,
      'discharge': Heart,
      'consultation': Eye,
      'insurance': Shield
    };
    return iconMap[type] || FileText;
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">

      {/* Doctors Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Doctors</h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No doctors found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => navigate(`/doctor-view/${doctor.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Doctor Avatar/Icon */}
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  
                  {/* Doctor Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {doctor.name || doctor.doctor_name || `Dr. ${doctor.first_name} ${doctor.last_name}`}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {doctor.specialization || doctor.speciality || 'General Physician'}
                    </p>

                    {/* Contact Info */}
                    <div className="mt-3 space-y-1">
                      {doctor.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone size={12} />
                          <span>{doctor.phone}</span>
                        </div>
                      )}
                      {doctor.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={12} />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Certificates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(CERTIFICATE_TYPES).map(([key, value]) => {
            const IconComponent = getIcon(key);
            
            return (
              <div
                key={key}
                onClick={() => navigate(getNavigationPath(key))}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <IconComponent size={20} className="text-blue-600" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 mb-1">
                      {value.label}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {value.description || `Manage ${value.label.toLowerCase()}`}
                    </p>
                    
                    {/* Continue link */}
                    <div className="flex items-center text-sm text-blue-600">
                      <span>Click to continue</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Expenses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div
                onClick={() => navigate("/expenses")}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Clipboard size={20} className="text-blue-600" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 mb-1">
                      Expenses
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Manage expenses for your organization
                    </p>
                    
                    {/* Continue link */}
                    <div className="flex items-center text-sm text-blue-600">
                      <span>Click to continue</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}