// Utility functions for payment management

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '-';
  
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateTimeString;
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'pending':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Constants
export const remarksOptions = [
  'Initial Payment',
  'Advanced Payment 1',
  'Advanced Payment 2',
  'Advanced Payment 3',
  'Advanced Payment 4',
  'Final Payment',
  'Refund Adjustment',
  'Other'
];

export const paymentModeOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
];

// Add these functions to paymentUtils.js
export const updatePaymentReceived = async (ipdId, paymentIndex, isReceived) => {
  // This function should be called from the main component
  return { ipdId, paymentIndex, isReceived };
};

export const getPaymentActions = (payment) => {
  const isReceived = payment.is_received === 'Yes';
  return {
    canUpdate: true, // Always allow toggling is_received
    currentStatus: isReceived,
    nextStatus: isReceived ? 'No' : 'Yes',
    actionText: isReceived ? 'Mark as Not Received' : 'Mark as Received',
    buttonClass: isReceived 
      ? 'bg-amber-500 hover:bg-amber-600' 
      : 'bg-green-500 hover:bg-blue-600'
  };
};