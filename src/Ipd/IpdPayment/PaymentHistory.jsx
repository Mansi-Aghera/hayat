import React, { useState } from 'react';
import { formatCurrency, formatDateTime, getPaymentActions } from './paymentUtils';

const PaymentHistory = ({ 
  payments = [], 
  staffList = [], 
  onUpdatePayment,
  onDeletePayment,
  loading = false,
  currentUpdatingIndex = null 
}) => {
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  
  const getStaffNameById = (staffData) => {
    if (!staffData) return 'Unknown Staff';
    
    // Check if staffData is an object with staff_name
    if (typeof staffData === 'object' && staffData.staff_name) {
      return staffData.staff_name;
    }
    
    // If staffData is just an ID, find in staffList
    if (typeof staffData === 'number' || !isNaN(staffData)) {
      const staffId = parseInt(staffData);
      const staff = staffList.find(s => s.id === staffId);
      return staff ? `${staff.first_name} ${staff.last_name}` : `Staff ID: ${staffId}`;
    }
    
    return 'Unknown Staff';
  };

  const handleUpdateReceived = (index, payment) => {
    const currentStatus = payment.is_received === 'Yes';
    const newStatus = currentStatus ? 'No' : 'Yes';
    
    if (window.confirm(`Are you sure you want to mark this payment as ${newStatus === 'Yes' ? 'RECEIVED' : 'NOT RECEIVED'}?`)) {
      onUpdatePayment(index, { is_received: newStatus });
    }
  };

  const handleDeletePayment = (index, paymentId) => {
    if (window.confirm(`Are you sure you want to delete Payment #${paymentId}? This action cannot be undone.`)) {
      onDeletePayment(index);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-300 m-6 rounded-lg">
        <div className="text-6xl mb-4 opacity-50">💰</div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Payment Records</h3>
        <p className="text-slate-600">Add your first payment using the "Add Payment" button</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-800">
          Payment History ({payments.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Staff
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Payment Mode
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Remarks
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                Received
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase tracking-wide text-xs w-48">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.map((payment, index) => {
              const actions = getPaymentActions(payment);
              const isUpdating = currentUpdatingIndex === index;
              
              return (
                <tr key={payment.payment_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-slate-700">
                    {formatDateTime(payment.payment_date_time)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {getStaffNameById(payment.staff_data)}
                  </td>
                  <td className="px-4 py-4 text-slate-800 font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {payment.payment_mode?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {payment.remarks}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      payment.is_received === 'Yes' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.is_received || 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleUpdateReceived(index, payment)}
                        disabled={loading || isUpdating}
                        title={actions.actionText}
                        className={`px-3 py-1 text-xs font-medium text-white rounded-md transition-colors ${actions.buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isUpdating ? 'Updating...' : actions.actionText}
                      </button>
                      
                      <button
                        onClick={() => handleDeletePayment(index, payment.payment_id)}
                        disabled={loading}
                        title="Delete Payment"
                        className="px-3 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory;