// src/services/bed.services.js
import api from "./api.js";

const BED_BASE = "/bed";

export const getBedsCount = async () => {
  const response = await api.get(`${BED_BASE}/`);
  return response.data.count;
};

export const getBeds = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`/bed/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createBed = async (bedData) => {
  const response = await api.post(`${BED_BASE}/`, bedData);
  return response.data;
};

export const updateBed = async (id, bedData) => {
  const response = await api.patch(`${BED_BASE}/${id}/`, bedData);
  return response.data;
};

export const deleteBed = async (id) => {
  await api.delete(`${BED_BASE}/${id}/`);
  return true;
};
