import React, { useState } from 'react';
import { formatCurrency, remarksOptions, paymentModeOptions } from './paymentUtils';

const AddPaymentModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading,
  staffList = [],
  unpaidAmount = 0,
  hasPaymentDetails = false
}) => {
  const [formData, setFormData] = useState({
    staff_data: '',
    amount: '',
    payment_mode: 'cash',
    remarks: 'Initial Payment',
    payment_date_time: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    if (!formData.staff_data) {
      alert('Please select a staff member');
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Payment</h3>
        
        {!hasPaymentDetails ? (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              ⚠️ Please set up payment details first before adding payments.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Staff <span className="text-red-500">*</span>
                </label>
                <select
                  name="staff_data"
                  value={formData.staff_data}
                  onChange={handleChange}
                  required
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Select Staff Member</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.staff_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter payment amount"
                />
                <p className="text-xs text-slate-500">
                  Remaining unpaid amount: {formatCurrency(unpaidAmount)}
                </p>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Payment Mode
                </label>
                <select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleChange}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  {paymentModeOptions.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Remarks
                </label>
                <select
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  {remarksOptions.map((remark) => (
                    <option key={remark} value={remark}>
                      {remark}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Payment Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="payment_date_time"
                  value={formData.payment_date_time}
                  onChange={handleChange}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-500">
                  Leave empty to use current date and time
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Add Payment'}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddPaymentModal;