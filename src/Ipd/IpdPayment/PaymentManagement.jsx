import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  updateIpd,
  getIpdById,
  updatePaymentDetail,
  updatePayments,  
  deletePayment
} from '../../services/ipd.services';
import {getStaff} from "../../services/staff.services"
import IpdPatientInfo from '../IpdCommonInfo';
import PaymentSummary from './PaymentSummary';
import PaymentHistory from './PaymentHistory';
import UpdateAmountModal from './UpdateAmountModal';
import AddPaymentModal from './AddPaymentModal.jsx';

const PaymentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [showUpdateAmountModal, setShowUpdateAmountModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [updatingPaymentIndex, setUpdatingPaymentIndex] = useState(null);
  const [deletingPaymentIndex, setDeletingPaymentIndex] = useState(null);
  
  
  const [amountUpdateForm, setAmountUpdateForm] = useState({
    total_amount: 0,
    discount_applied: 0,
    total_after_discount: 0
  });

  useEffect(() => {
    if (id) {
      fetchPaymentData();
      fetchStaffList();
    }
  }, [id]);

  const fetchPaymentData = async () => {
    setFetchLoading(true);
    try {
      const response = await getIpdById(id);
      
      if (response.data && response.data.payment_details) {
        setPaymentDetails(response.data.payment_details);
        setAmountUpdateForm({
          total_amount: response.data.payment_details.total_amount || 0,
          discount_applied: response.data.payment_details.discount_applied || 0,
          total_after_discount: response.data.payment_details.total_after_discount || 0
        });
      } else {
        setPaymentDetails(null);
        setAmountUpdateForm({
          total_amount: 0,
          discount_applied: 0,
          total_after_discount: 0
        });
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      alert('Failed to fetch payment data');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const response = await getStaff();
      const staffData =  response.data;
      setStaffList(response);
    } catch (error) {
      console.error('Error fetching staff list:', error);
      alert('Failed to fetch staff list');
    }
  };

  const hasPaymentDetails = () => {
    // console.log(paymentDetails!==null)
    return paymentDetails !== null;
  };

  const handleUpdateAmount = async (formData) => {
    setLoading(true);
    try {
      const totalAfterDiscount = formData.total_amount - formData.discount_applied;
      
      if (!hasPaymentDetails()) {
        // First time - create payment_details using updateIpd
        const payload = {
          payment_details: {
            total_amount: parseFloat(formData.total_amount),
            discount_applied: parseFloat(formData.discount_applied) || 0,
            total_after_discount: totalAfterDiscount,
            total_paid: 0,
            total_unpaid: totalAfterDiscount,
            status: totalAfterDiscount > 0 ? 'pending' : 'paid',
            payments: []
          }
        };
        
        console.log('Creating payment_details for first time with:', payload);
        
        const response = await updateIpd(id, payload);
        console.log('Create payment response:', response);
        
        setPaymentDetails(payload.payment_details);
        
      } else {
        // Update existing payment_details using updatePaymentDetail
        const payload = {
          total_amount: parseFloat(formData.total_amount),
          discount_applied: parseFloat(formData.discount_applied) || 0
        };
        
        console.log('Updating payment amount with:', payload);
        
        const response = await updatePaymentDetail(id, payload);
        console.log('Update response:', response);
        
        const currentTotalPaid = paymentDetails.total_paid || 0;
        const newTotalUnpaid = totalAfterDiscount - currentTotalPaid;
        
        setPaymentDetails(prev => ({
          ...prev,
          total_amount: payload.total_amount,
          discount_applied: payload.discount_applied,
          total_after_discount: totalAfterDiscount,
          total_unpaid: newTotalUnpaid > 0 ? newTotalUnpaid : 0,
          status: newTotalUnpaid <= 0 ? 'paid' : newTotalUnpaid === totalAfterDiscount ? 'pending' : 'partial'
        }));
      }
      
      setShowUpdateAmountModal(false);
      alert('Payment amount updated successfully!');
      
    } catch (error) {
      console.error('Error updating payment amount:', error);
      alert('Failed to update payment amount');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (formData) => {
    setLoading(true);
    try {
      const paymentAmount = parseFloat(formData.amount);
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      const paymentPayload = {
        staff_data: parseInt(formData.staff_data),
        amount: paymentAmount,
        payment_mode: formData.payment_mode,
        payment_date_time: formData.payment_date_time || currentTime,
        remarks: formData.remarks,
        is_received: "No"
      };
      
      console.log('Adding new payment with:', paymentPayload);
      
      // Add payment using updatePaymentDetail function
      const response = await updatePaymentDetail(id, paymentPayload);
      console.log('Add payment response:', response);
      
      // Update local state with new payment
      const currentTotalAfterDiscount = paymentDetails.total_after_discount || 0;
      const currentTotalPaid = paymentDetails.total_paid || 0;
      const newTotalPaid = currentTotalPaid + paymentAmount;
      const newTotalUnpaid = currentTotalAfterDiscount - newTotalPaid;
      const newStatus = newTotalUnpaid <= 0 ? 'paid' : newTotalUnpaid === currentTotalAfterDiscount ? 'pending' : 'partial';
      
      const existingPayments = paymentDetails.payments || [];
      const newPaymentId = existingPayments.length > 0 
        ? Math.max(...existingPayments.map(p => p.payment_id)) + 1 
        : 1;
      
      const newPaymentEntry = {
        payment_id: newPaymentId,
        ...paymentPayload
      };
      
      const updatedPaymentDetails = {
        ...paymentDetails,
        total_paid: newTotalPaid,
        total_unpaid: newTotalUnpaid > 0 ? newTotalUnpaid : 0,
        status: newStatus,
        payments: [...existingPayments, newPaymentEntry]
      };
      
      // Update the main payment_details using updateIpd
      await updateIpd(id, {
        payment_details: updatedPaymentDetails
      });
      
      setPaymentDetails(updatedPaymentDetails);
      
      setShowAddPaymentModal(false);
      alert('Payment added successfully!');
      
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (paymentIndex, updateData) => {
  setUpdatingPaymentIndex(paymentIndex);
  setLoading(true);
  
  try {
    // Update the payment via API
    const payload = {
      is_received: updateData.is_received
    };
    
    console.log(`Updating payment ${paymentIndex} with:`, payload);
    
    const response = await updatePayments(id, paymentIndex, payload);
    console.log('Update payment response:', response);
    
    // Update local state
    setPaymentDetails(prev => {
      const updatedPayments = [...prev.payments];
      updatedPayments[paymentIndex] = {
        ...updatedPayments[paymentIndex],
        is_received: updateData.is_received
      };
      
      return {
        ...prev,
        payments: updatedPayments
      };
    });
    
    alert(`Payment marked as ${updateData.is_received === 'Yes' ? 'RECEIVED' : 'NOT RECEIVED'} successfully!`);
    
  } catch (error) {
    console.error('Error updating payment:', error);
    alert('Failed to update payment');
  } finally {
    setUpdatingPaymentIndex(null);
    setLoading(false);
  }
};

const handleDeletePayment = async (paymentIndex) => {
  setDeletingPaymentIndex(paymentIndex);
  setLoading(true);
  
  try {
    const paymentToDelete = paymentDetails.payments[paymentIndex];
    const paymentId = paymentToDelete.payment_id;
    const paymentAmount = paymentToDelete.amount;
    
    console.log(`Deleting payment ${paymentIndex} (ID: ${paymentId})`);
    
    // Delete payment via API
    const response = await deletePayment(id, paymentIndex);
    console.log('Delete payment response:', response);
    
    // Update local state
    const newTotalPaid = paymentDetails.total_paid - paymentAmount;
    const newTotalUnpaid = paymentDetails.total_after_discount - newTotalPaid;
    const newStatus = newTotalUnpaid <= 0 ? 'paid' : newTotalUnpaid === paymentDetails.total_after_discount ? 'pending' : 'partial';
    
    setPaymentDetails(prev => ({
      ...prev,
      total_paid: newTotalPaid,
      total_unpaid: newTotalUnpaid > 0 ? newTotalUnpaid : 0,
      status: newStatus,
      payments: prev.payments.filter((_, index) => index !== paymentIndex)
    }));
    
    // Also update the main payment_details using updateIpd
    const updatedPaymentDetails = {
      ...paymentDetails,
      total_paid: newTotalPaid,
      total_unpaid: newTotalUnpaid > 0 ? newTotalUnpaid : 0,
      status: newStatus,
      payments: paymentDetails.payments.filter((_, index) => index !== paymentIndex)
    };
    
    await updateIpd(id, {
      payment_details: updatedPaymentDetails
    });
    
    alert(`Payment #${paymentId} deleted successfully!`);
    
  } catch (error) {
    console.error('Error deleting payment:', error);
    alert('Failed to delete payment');
  } finally {
    setDeletingPaymentIndex(null);
    setLoading(false);
  }
};

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading payment data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-5 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Payment Management</h2>
        <button 
          className="border rounded-3xl px-4 py-1 hover:bg-slate-100 transition"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
      
      <IpdPatientInfo ipdId={id} />

      {/* Initial Setup Message if no payment_details */}
      {!hasPaymentDetails() && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-2xl">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payment Setup Required</h3>
              <p className="text-yellow-700 mb-3">
                No payment details have been set up yet. Please set the total bill amount first.
              </p>
              <button
                onClick={() => setShowUpdateAmountModal(true)}
                className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Set Up Payment Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary Card */}
      {hasPaymentDetails() && (
        <PaymentSummary
          paymentDetails={paymentDetails}
          onUpdateAmount={() => setShowUpdateAmountModal(true)}
          onAddPayment={() => setShowAddPaymentModal(true)}
        />
      )}

      {/* Payment History */}
      {hasPaymentDetails() && (
        <PaymentHistory
            payments={paymentDetails?.payments || []}
            staffList={staffList}
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
            loading={loading}
            currentUpdatingIndex={updatingPaymentIndex}
        />
      )}

      {/* Modals */}
      <UpdateAmountModal
        isOpen={showUpdateAmountModal}
        onClose={() => setShowUpdateAmountModal(false)}
        onSubmit={handleUpdateAmount}
        loading={loading}
        initialData={amountUpdateForm}
        isFirstTime={!hasPaymentDetails()}
      />

      <AddPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onSubmit={handleAddPayment}
        loading={loading}
        staffList={staffList}
        unpaidAmount={paymentDetails?.total_unpaid || 0}
        hasPaymentDetails={hasPaymentDetails()}
      />
    </div>
  );
};

export default PaymentManagement;