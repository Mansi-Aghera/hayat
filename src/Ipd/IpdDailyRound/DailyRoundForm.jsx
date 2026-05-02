import React, { useState, useEffect } from 'react';
import { createIpdDailyRound } from '../../services/ipd.services';
import { getStaff } from '../../services/staff.services';
import DailyChiefComplaints from './DailyRoundChiefComplaint';
import DailyExamination from './DailyExamination';
import DailyGivenTreatment from './DailyGivenTreatment';

const DailyRoundForm = ({ ipdId, onCancel, onSubmitSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    ipd_data: ipdId ? parseInt(ipdId) : '',
    staff_data: '',
    datetime: new Date().toISOString().slice(0, 16),
    special_notes: '',
  });

  // Child component states
  const [dailyChiefComplaints, setDailyChiefComplaints] = useState([]);
  const [dailyExamination, setDailyExamination] = useState([{
    BP: '',
    PR: '',
    SPO2: '',
    date_time: new Date().toISOString().slice(0, 16)
  }]);
  const [dailyGivenTreatment, setDailyGivenTreatment] = useState([]);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const response = await getStaff();
      const staffData =  response;
      setStaffList(staffData);
    } catch (error) {
      console.error('Error fetching staff list:', error);
      alert('Failed to fetch staff list');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.staff_data) {
      alert('Please select a staff member');
      return;
    }

    // Prepare the payload
    const payload = {
      ipd_data: formData.ipd_data,
      staff_data: parseInt(formData.staff_data),
      datetime: formData.datetime,
      special_notes: formData.special_notes,
      daily_chief_complaints: dailyChiefComplaints,
      daily_examination: dailyExamination,
      daily_given_treatment: dailyGivenTreatment
    };

    console.log('Submitting payload:', payload);

    setLoading(true);
    try {
      const response = await createIpdDailyRound(payload);
      console.log('Create daily round response:', response);
      
      alert('Daily round created successfully!');
      onSubmitSuccess();
      
    } catch (error) {
      console.error('Error creating daily round:', error);
      alert('Failed to create daily round');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-4">New Daily Round</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-800 whitespace-nowrap min-w-[140px]">
              Staff Member <span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <select
                name="staff_data"
                value={formData.staff_data}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="">Select Staff Member</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.staff_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-800 whitespace-nowrap min-w-[140px]">
              Date & Time
            </label>
            <div className="flex-1">
              <input
                type="datetime-local"
                name="datetime"
                value={formData.datetime}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-800 whitespace-nowrap min-w-[140px]">
              Special Notes
            </label>
            <div className="flex-1">
              <input
                type="text"
                name="special_notes"
                value={formData.special_notes}
                onChange={handleInputChange}
                placeholder="Enter any special notes"
                className="w-full border border-gray-300 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Chief Complaints Component */}
      <DailyChiefComplaints
        dailyChiefComplaints={dailyChiefComplaints}
        setDailyChiefComplaints={setDailyChiefComplaints}
      />

      {/* Daily Examination Component */}
      <DailyExamination
        dailyExamination={dailyExamination}
        setDailyExamination={setDailyExamination}
      />

      {/* Daily Given Treatment Component */}
      <DailyGivenTreatment
        dailyGivenTreatment={dailyGivenTreatment}
        setDailyGivenTreatment={setDailyGivenTreatment}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-1 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-1 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            'Create Daily Round'
          )}
        </button>
      </div>
    </div>
  );
};

export default DailyRoundForm;