import React from 'react';
import { formatCurrency, getStatusBadgeClass } from './paymentUtils';

const PaymentSummary = ({ 
  paymentDetails, 
  onUpdateAmount, 
  onAddPayment 
}) => {
  const getDisplayValue = (key, defaultValue = 0) => {
    if (!paymentDetails) return defaultValue;
    return paymentDetails[key] !== undefined ? paymentDetails[key] : defaultValue;
  };

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Payment Summary</h3>
        <div className="flex gap-3">
          <button
            onClick={onUpdateAmount}
            className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Update Total Amount
          </button>
          <button
            onClick={onAddPayment}
            className="px-4 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Add Payment
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Bill Amount</div>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(getDisplayValue('total_amount'))}
          </div>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-amber-600 font-medium mb-1">Discount Applied</div>
          <div className="text-2xl font-bold text-amber-700">
            {formatCurrency(getDisplayValue('discount_applied'))}
          </div>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="text-sm text-emerald-600 font-medium mb-1">Total After Discount</div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(getDisplayValue('total_after_discount'))}
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(getDisplayValue('total_paid'))}
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-600 font-medium mb-1">Total Unpaid</div>
          <div className="text-2xl font-bold text-red-700">
            {formatCurrency(getDisplayValue('total_unpaid'))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Payment Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(getDisplayValue('status', 'pending'))}`}>
            {getDisplayValue('status', 'pending')?.toUpperCase()}
          </span>
        </div>
        
        <div className="text-sm text-slate-600">
          Last Updated: {new Date().toLocaleDateString('en-IN')}
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;