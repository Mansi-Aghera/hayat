// Utility functions for hospital service billing

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const calculateServiceTotal = (fees, quantity) => {
  const feesNum = parseFloat(fees) || 0;
  const quantityNum = parseFloat(quantity) || 0;
  return feesNum * quantityNum;
};

export const calculateTotals = (services, discount = 0, advancedPaid = 0) => {
  const grossTotal = services.reduce((sum, service) => {
    return sum + (parseFloat(service.total) || 0);
  }, 0);
  
  const discountTotal = parseFloat(discount) || 0;
  const netTotal = grossTotal - discountTotal;
  const totalDue = netTotal - advancedPaid;
  
  return {
    grossTotal,
    discountTotal,
    netTotal,
    totalDue,
    advancedPaid: parseFloat(advancedPaid) || 0
  };
};

// Bill type options
export const billTypeOptions = [
  'Provisional Bill',
  'Final Bill',
  'Discharge Bill',
  'Advance Bill',
  'Partial Bill',
  'Consolidated Bill'
];