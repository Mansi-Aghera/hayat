// src/services/service.services.js
import api from "./api.js";

const SERVICE_BASE = "/service";

export const getServicesCount = async () => {
  const response = await api.get(`${SERVICE_BASE}/`);
  return response.data.count;
}

export const getServices = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`${SERVICE_BASE}/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createService = async (serviceData) => {
  const response = await api.post(`${SERVICE_BASE}/`, serviceData);
  return response.data;
};

export const updateService = async (id, serviceData) => {
  const response = await api.patch(`${SERVICE_BASE}/${id}/`, serviceData);
  return response.data;
};

export const deleteService = async (id) => {
  await api.delete(`${SERVICE_BASE}/${id}/`);
  return true;
};
