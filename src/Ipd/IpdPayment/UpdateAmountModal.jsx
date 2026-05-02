import React, { useState, useEffect } from 'react';
import { formatCurrency } from './paymentUtils';

const UpdateAmountModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading,
  initialData = { total_amount: 0, discount_applied: 0 },
  isFirstTime = false
}) => {
  const [formData, setFormData] = useState({
    total_amount: 0,
    discount_applied: 0,
    total_after_discount: 0
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        total_amount: initialData.total_amount || 0,
        discount_applied: initialData.discount_applied || 0,
        total_after_discount: initialData.total_after_discount || 0
      });
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const totalAfterDiscount = formData.total_amount - formData.discount_applied;
    setFormData(prev => ({
      ...prev,
      total_after_discount: totalAfterDiscount
    }));
  }, [formData.total_amount, formData.discount_applied]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? '' : parseFloat(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  const handleSubmit = () => {
    if (!formData.total_amount || formData.total_amount <= 0) {
      alert('Total amount must be greater than 0');
      return;
    }

    if (formData.discount_applied < 0) {
      alert('Discount cannot be negative');
      return;
    }

    if (formData.discount_applied > formData.total_amount) {
      alert('Discount cannot be greater than total amount');
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {isFirstTime ? 'Set Up Payment Details' : 'Update Total Amount'}
        </h3>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Total Bill Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleChange}
              min="0"
              step="1"
              required
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Discount Applied (₹)
            </label>
            <input
              type="number"
              name="discount_applied"
              value={formData.discount_applied}
              onChange={handleChange}
              min="0"
              step="1"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-sm text-slate-600 mb-1">Total After Discount:</div>
            <div className="text-lg font-bold text-emerald-600">
              {formatCurrency(formData.total_after_discount)}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : isFirstTime ? 'Set Up Payment' : 'Update Amount'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateAmountModal;