import api from "./api.js";

const STAFF_TRANSACTIONS_BASE = "/staff_transactions";

export const getStaffTransactionsCount = async () => {
  const response = await api.get(`${STAFF_TRANSACTIONS_BASE}/`);
  return response.data.count;
}

export const getStaffTransactions = async () => {
  const response = await api.get(`${STAFF_TRANSACTIONS_BASE}/`);
  return response.data;
};

export const getStaffTransactionById = async (id) => {
  const response = await api.get(`${STAFF_TRANSACTIONS_BASE}/${id}/`);
  return response.data;
};

export const getStaffTransactionsByStaff = async (staffId) => {
  const response = await api.get(`${STAFF_TRANSACTIONS_BASE}/staff/${staffId}/`);
  return response.data;
};

export const createStaffTransaction = async (payload) => {
  const response = await api.post(`${STAFF_TRANSACTIONS_BASE}/`, payload);
  return response.data;
};

export const updateStaffTransaction = async (id, payload) => {
  const response = await api.patch(`${STAFF_TRANSACTIONS_BASE}/${id}/`, payload);
  return response.data;
};

export const deleteStaffTransaction = async (id) => {
  await api.delete(`${STAFF_TRANSACTIONS_BASE}/${id}/`);
  return true;
};
