import api from "./api.js";

const SPECIALIZATION_BASE = "/specialization";

export const getSpecializations = async (search) => {
  const response = await api.get(`${SPECIALIZATION_BASE}/`, {
    params: search ? { search } : undefined,
  });
  return response.data;
};

export const createSpecialization = async (specializationName) => {
  const payload = {
    specialization_name: String(specializationName ?? "").trim(),
  };
  const response = await api.post(`${SPECIALIZATION_BASE}/`, payload);
  return response.data;
};

export const updateSpecialization = async (id, specializationName) => {
  const payload = {
    specialization_name: String(specializationName ?? "").trim(),
  };
  const response = await api.patch(`${SPECIALIZATION_BASE}/${id}/`, payload);
  return response.data;
};

export const deleteSpecialization = async (id) => {
  const response = await api.delete(`${SPECIALIZATION_BASE}/${id}/`);
  return response.data;
};
