// src/services/staff.services.js
import api from "./api.js";

const STAFF_BASE = "/staff";

export const getStaffCount = async () => {
  const response = await api.get(`${STAFF_BASE}/`);
  return response.data.count;
};

// Helper – prepares data with FormData when there is an image
const prepareStaffData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    if (key === "salary_detail" || key === "image") {
      // skip – handled separately
      return;
    }
    if (data[key] !== null && data[key] !== undefined && data[key] !== "") {
      formData.append(key, data[key]);
    }
  });

  // salary_detail – you can adjust the format according to your backend
  if (data.salary_detail && data.salary_detail.length > 0) {
    // Example: backend expects JSON string
    formData.append("salary_detail", JSON.stringify(data.salary_detail));
  }

  // image file
  if (data.image && data.image instanceof File) {
    formData.append("image", data.image);
  }

  return formData;
};

export const getStaff = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`${STAFF_BASE}/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createStaff = async (staffData) => {
  const response = await api.post(`${STAFF_BASE}/`, staffData);
  return response.data;
};

export const updateStaff = async (id, staffData) => {
  const response = await api.patch(`${STAFF_BASE}/${id}/`, staffData);
  return response.data;
};

export const deleteStaff = async (id) => {
  await api.delete(`${STAFF_BASE}/${id}/`);
  return true;
};

export const getStaffById = async (id) => {
  const response = await api.get(`${STAFF_BASE}/${id}/`);
  return response.data;
};

export const updateStaffSalaryDetail = async (staffId, index, payload) => {
  const response = await api.patch(`/staff_update/${staffId}/salary_detail/${index}/`, payload);
  return response.data;
}

export const deleteStaffSalaryDetail = async (staffId,index) => {
  const response = await api.delete(`/staff_update/${staffId}/salary_detail/${index}/`);
  return response.data;
}