import api from "./api.js";

const DOCTOR_BASE = "/doctor";

export const getDoctorsCount = async () => {
  const response = await api.get(`${DOCTOR_BASE}/`);
  return response.data.count;
};

export const getDoctors = async () => {
  try {
    let allResults = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const response = await api.get(`${DOCTOR_BASE}/?page=${page}`);
      const data = response.data;

      // Handle both { data: [...] } and directly [...]
      const list = data?.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(list)) {
        allResults = [...allResults, ...list];
      }

      hasNext = data.next !== null && data.next !== undefined;
      page++;
      
      if (page > 1000) break;
    }
    return allResults;
  } catch (error) {
    console.error("Error fetching doctors:", error);
    throw error;
  }
};

export const createDoctor = async (doctorData) => {
  const response = await api.post(`${DOCTOR_BASE}/`, doctorData);
  return response.data;
};

export const updateDoctor = async (id, doctorData) => {
  const response = await api.patch(`${DOCTOR_BASE}/${id}/`, doctorData);
  return response.data;
};

export const deleteDoctor = async (id) => {
  await api.delete(`${DOCTOR_BASE}/${id}/`);
  return true;
};

export const getOpdByDoctor = async (id, page = 1) => {
  try {
    const response = await api.get(`/opd/doctor_id/${id}/?page=${page}`);
    
    // Your API already returns paginated data with summary
    // Response structure: { data: [...], summary: {...}, count: total_records, next: next_page_url, previous: previous_page_url }
   // For debugging, check the structure of the response
    return response.data; // This should contain { data, summary, count, next, previous }
  } catch (error) {
    console.error("Error fetching OPD by doctor:", error);
    throw error;
  }
};