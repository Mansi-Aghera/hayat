// src/services/medicine.services.js
import api from "./api.js";

const MEDICINE_BASE = "/medicine";

export const getMedicinesCount = async () => {
  const response = await api.get(`${MEDICINE_BASE}/`);
  return response.data.count;
};

export const getMedicines = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`${MEDICINE_BASE}/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createMedicine = async (medicineData) => {
  const response = await api.post(`${MEDICINE_BASE}/`, medicineData);
  return response.data;
};

export const updateMedicine = async (id, medicineData) => {
  const response = await api.patch(`${MEDICINE_BASE}/${id}/`, medicineData);
  return response.data;
};

export const deleteMedicine = async (id) => {
  await api.delete(`${MEDICINE_BASE}/${id}/`);
  return true;
};
