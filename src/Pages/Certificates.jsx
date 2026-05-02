import { CERTIFICATE_TYPES } from "../services/certificates.services";
import { useNavigate } from "react-router-dom";
import { FileText, Activity, User, Clipboard, Stethoscope, Scissors, Syringe, Baby, Brain, Heart, Eye, Shield, Phone, Mail } from "lucide-react";

export default function Certificates() {
  const navigate = useNavigate();

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

      {/* Certificates Section */}
      <div>
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
    </div>
  );
}