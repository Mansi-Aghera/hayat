// src/services/certificates.services.js
import api from "./api.js";

// All certificate types with endpoint and label
export const CERTIFICATE_TYPES = {
  fitness_certificate:{
    key: "fitness_certificate",
    label: "Fitness Certificate",
    endpoint: "/fitness_certificate/",
  },
  discharge_certificate:{
    key: "discharge_certificate",
    label: "Discharge Certificate",
    endpoint: "/discharge_certificate/",
  },
    ipd_list:{
    key: "ipd_list",
    label: "Ipd List",
    endpoint: "/ipd_list/",
  },
  scalp_list:{
    key: "scalp_list",
    label: "Scalp List",
    endpoint: "/scalp_list/",
  },
   medical_certificate: {
    key: "medical_certificate",
    label: "Medical Certificate",
    endpoint: "/medical_certificate/",
  },
  death: {
    key: "death",
    label: "Death Certificate",
    endpoint: "/death/",
  },
  birth: {
    key: "birth",
    label: "Birth Certificate",
    endpoint: "/birth/",
  },
  expenditure: {
    key: "expenditure",
    label: "Expenditure Certificate",
    endpoint: "/expenditure/",
  },
  refer: {
    key: "refer",
    label: "Refer Certificate",
    endpoint: "/refer/",
  },
};

// Helper: get endpoint config by type
const getEndpoint = (type) => {
  const config = CERTIFICATE_TYPES[type];
  if (!config) {
    throw new Error(`Unknown certificate type: ${type}`);
  }
  return config.endpoint;
};

const assertValid = (data) => {
  if (data && typeof data === "object" && data.status === "invalid data") {
    const err = new Error("Invalid data");
    err.response = { data, status: 400 };
    throw err;
  }
  return data;
};

// LIST (GET /<endpoint>/)
export const getCertificates = async (type, params = {}) => {
  const endpoint = getEndpoint(type);
  const res = await api.get(endpoint, { params });
  // Return data only; component will handle array / paginated shape
  return assertValid(res.data);
};

// CREATE (POST /<endpoint>/)
export const createCertificate = async (type, payload) => {
  const endpoint = getEndpoint(type);
  const res = await api.post(endpoint, payload);
  return assertValid(res.data); // created object
};

// UPDATE (PATCH /<endpoint>/<id>/)
export const updateCertificate = async (type, id, payload) => {
  const endpoint = getEndpoint(type);
  const res = await api.patch(`${endpoint}${id}/`, payload);
  return assertValid(res.data); // updated object
};

// DELETE (DELETE /<endpoint>/<id>/)
export const deleteCertificate = async (type, id) => {
  const endpoint = getEndpoint(type);
  await api.delete(`${endpoint}${id}/`);
};

export const getScalps = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`scalp/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const getScalpById = async (id) => {
  const response = await api.get(`scalp/${id}/`);
  return response.data;
};

export const createScalp = async (payload) => {
  const response = await api.post(`scalp/`, payload);
  return response.data;
};

export const updateScalp = async (id, payload) => {
  const response = await api.patch(`scalp/${id}/`, payload);
  return response.data;
};

export const deleteScalp = async (id) => {
  await api.delete(`scalp/${id}/`);
  return true;
};

export const getFC = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`fc/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const getFCById = async (id) => {
  const response = await api.get(`fc/${id}/`);
  return response.data;
}

export const createFC = async (payload) => {
  const response = await api.post(`fc/`, payload);
  return response.data;
};

export const updateFC = async (id, payload) => {
  const response = await api.patch(`fc/${id}/`, payload);
  return response.data;
};

export const getFCComplaints = async() =>{
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`fc_complaint/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
}

export const getFCPastHistory = async() =>{
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`fc_past_history/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
}

export const getFCPersonalHO = async() =>{
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`fc_personal_ho/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
}

export const getBirth = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`birth/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createBirth = async (payload) => {
  const response = await api.post(`birth/`, payload);
  return response.data;
};

export const updateBirth = async (id, payload) => {
  const response = await api.patch(`birth/${id}/`, payload);
  return response.data;
};

export const getDeath = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`death/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createDeath = async (payload) => {
  const response = await api.post(`death/`, payload);
  return response.data;
};

export const updateDeath = async (id, payload) => {
  const response = await api.patch(`death/${id}/`, payload);
  return response.data;
};

export const getExpenditure = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`expenditure/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createExpenditure = async (payload) => {
  const response = await api.post(`expenditure/`, payload);
  return response.data;
};

export const updateExpenditure = async (id, payload) => {
  const response = await api.patch(`expenditure/${id}/`, payload);
  return response.data;
};

export const getRefer = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`refer/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createRefer = async (payload) => {
  const response = await api.post(`refer/`, payload);
  return response.data;
};

export const updateRefer = async (id, payload) => {
  const response = await api.patch(`refer/${id}/`, payload);
  return response.data;
};

export const getMedical = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`medical_certificate/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const createMedical = async (payload) => {
  const response = await api.post(`medical_certificate/`, payload);
  return response.data;
};

export const updateMedical = async (id, payload) => {
  const response = await api.patch(`medical_certificate/${id}/`, payload);
  return response.data;
};

export const getDischarge = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`discharge_ipd/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const updateDischarge = async (id, payload) => {
  const response = await api.patch(`discharge_ipd/${id}/`, payload);
  return response.data;
};

export const createDischarge = async (payload) => {
  const response = await api.post(`discharge_ipd/`, payload);
  return response.data;
};

export const getExpenses = async () => {
  let allResults = [];
  let summaryData = null;
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`expense/?page=${page}`);
    const data = response.data;

    // Collect paginated data
    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    // Store summary only once (usually same on every page)
    if (!summaryData && data.summary) {
      summaryData = data.summary;
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }

  return {
    data: allResults,
    summary: summaryData,
  };
};



export const updateExpenses = async (id, payload) => {
  const response = await api.patch(`expense/${id}/`, payload);
  return response.data;
};

export const createExpenses = async (payload) => {
  const response = await api.post(`expense/`, payload);
  return response.data;
};

export const deleteExpenses = async (id) => {
  const response = await api.delete(`expense/${id}/`);
  return response.data;
}
