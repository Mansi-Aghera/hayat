import api from "./api.js";

const LABFORM_BASE = "/labform";

export const getLabFormsCount = async () => {
  const response = await api.get(`${LABFORM_BASE}/`);
  return response.data.count;
};

export const getLabForms = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`${LABFORM_BASE}/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};


export const createLabForm = async (labData) => {
  const response = await api.post(`${LABFORM_BASE}/`, labData);
  return response.data;
};

export const updateLabForm = async (id, labData) => {
  const response = await api.patch(`${LABFORM_BASE}/${id}/`, labData);
  return response.data;
};

export const deleteLabForm = async (id) => {
  await api.delete(`${LABFORM_BASE}/${id}/`);
  return true;
};
