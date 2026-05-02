import React, { useState, useEffect } from 'react';
import { formatCurrency } from './serviceUtils';

const BillingSummary = ({
  billingData = {},
  onUpdate,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    discount_total: 0,
    advanced_paid: 0,
    bill_type: 'Provisional Bill'
  });

  useEffect(() => {
    if (billingData) {
      setFormData({
        discount_total: billingData.discount_total || 0,
        advanced_paid: billingData.advanced_paid || 0,
        bill_type: billingData.bill_type || 'Provisional Bill'
      });
    }
  }, [billingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_total') || name.includes('_paid') 
        ? (value === '' ? '' : parseFloat(value))
        : value
    }));
  };

  const handleSubmit = () => {
    onUpdate(formData);
  };

  const {
    gross_total = 0,
    discount_total = 0,
    net_total = 0,
    advanced_paid = 0,
    balance = 0,
    total_paid = 0,
    total_due = 0,
    bill_type = 'Provisional Bill',
    is_settled = false
  } = billingData;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-4">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">Billing Summary</h3>
      
      {/* Top Row - Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Discount Amount (₹)
          </label>
          <input
            type="number"
            name="discount_total"
            value={formData.discount_total}
            onChange={handleChange}
            min="0"
            step="1"
            className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter discount"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Advanced Payment (₹)
          </label>
          <input
            type="number"
            name="advanced_paid"
            value={formData.advanced_paid}
            onChange={handleChange}
            min="0"
            step="1"
            className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter advance"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Bill Type
          </label>
          <select
            name="bill_type"
            value={formData.bill_type}
            onChange={handleChange}
            className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="Provisional Bill">Provisional Bill</option>
            <option value="Final Bill">Final Bill</option>
            <option value="Discharge Bill">Discharge Bill</option>
            <option value="Advance Bill">Advance Bill</option>
            <option value="Partial Bill">Partial Bill</option>
            <option value="Consolidated Bill">Consolidated Bill</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="mb-8">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Update Billing'}
        </button>
      </div>

      {/* Billing Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Gross Total</div>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(gross_total)}
          </div>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-amber-600 font-medium mb-1">Discount</div>
          <div className="text-2xl font-bold text-amber-700">
            {formatCurrency(discount_total)}
          </div>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="text-sm text-emerald-600 font-medium mb-1">Net Total</div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(net_total)}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Advanced Paid</div>
          <div className="text-2xl font-bold text-purple-700">
            {formatCurrency(advanced_paid)}
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-600 font-medium mb-1">Balance Due</div>
          <div className="text-2xl font-bold text-red-700">
            {formatCurrency(total_due)}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600 font-medium mb-1">Bill Type</div>
          <div className="text-xl font-bold text-slate-700">
            {bill_type}
          </div>
        </div>
      </div>

      {/* Footer - Status and Balance */}
      <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-slate-200 gap-4">
        <div className="flex items-center gap-2">
          {/* <span className="text-sm font-medium text-slate-700">Settlement Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
            is_settled 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
          }`}>
            {is_settled ? 'SETTLED' : 'PENDING'}
          </span> */}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-700">
            <span className="font-medium">Total Paid:</span> {formatCurrency(total_paid)}
          </div>
          <div className="text-sm font-semibold text-slate-800">
            Balance: {formatCurrency(balance)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSummary;