import api from "./api.js";

const COMPLAINT_BASE = "/complaint";

export const getComplaints = async () => {
  const response = await api.get(`${COMPLAINT_BASE}/`);
  return response.data;
};

export const createComplaint = async (payload) => {
  const response = await api.post(`${COMPLAINT_BASE}/`, payload);
  return response.data;
};

export const updateComplaint = async (id, payload) => {
  const response = await api.patch(`${COMPLAINT_BASE}/${id}/`, payload);
  return response.data;
};

export const deleteComplaint = async (id) => {
  await api.delete(`${COMPLAINT_BASE}/${id}/`);
  return true;
};
