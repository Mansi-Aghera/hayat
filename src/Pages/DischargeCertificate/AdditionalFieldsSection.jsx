import React,{useEffect,useState} from 'react';
import { getStaff } from '../../services/staff.services';

const AdditionalFieldsSection = ({ formData, setFormData }) => {
    const [staff,setStaff] = useState([])
     useEffect(() => {
        fetchStaffList();
      }, []);
    
      const fetchStaffList = async () => {
        try {
          const response = await getStaff();
          const staffData =  response;
          setStaff(staffData);
        } catch (error) {
          console.error('Error fetching staff list:', error);
          alert('Failed to fetch staff list');
        }
      };
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Next Visit Date
          </label>
          <input
            type="date"
            value={formData.next_visit}
            onChange={(e) => setFormData(prev => ({ ...prev, next_visit: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investigation
          </label>
          <input
            type="text"
            value={formData.investigation || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, investigation: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter investigation details"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          DD Note
        </label>
        <textarea
          value={formData.dd_note || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, dd_note: e.target.value }))}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter DD note here..."
        />
      </div>

      <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              name="staff_data"
              value={formData.staff_data}
               onChange={(e) => setFormData(prev => ({ ...prev, staff_data: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Staff Member</option>
              {staff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.staff_name}
                </option>
              ))}
            </select>
          </div>
    </>
  );
};

export default AdditionalFieldsSection;