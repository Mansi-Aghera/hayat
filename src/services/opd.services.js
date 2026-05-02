import api from "./api.js";

const OPD_BASE = "/opd";

export const getOpdsCount = async () => {
  const response = await api.get(`${OPD_BASE}/`);
  return response.data.count;
};

export const getOpds = async (params = {}) => {
  try {
    // If specific search/pagination params are provided, return raw response for Opd.jsx
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${OPD_BASE}/?${queryString}` : `${OPD_BASE}/`;
      return await api.get(url);
    }

    // Otherwise, fetch ALL pages for Reports.jsx
    let allResults = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const response = await api.get(`${OPD_BASE}/?page=${page}`);
      const data = response.data;

      if (Array.isArray(data.data)) {
        allResults = [...allResults, ...data.data];
      }

      hasNext = data.next !== null;
      page++;
      
      // Safety break to prevent infinite loops if API is misbehaving
      if (page > 1000) break;
    }
    return allResults;

  } catch (error) {
    console.error("Error fetching OPDs:", error);
    throw error;
  }
};

export const getOpd = async (id, page = 1) => {
  try {
    const response = await api.get(`${OPD_BASE}/?page=${page}`);

    // Your API already returns paginated data with summary
    // Response structure: { data: [...], summary: {...}, count: total_records, next: next_page_url, previous: previous_page_url }
    // For debugging, check the structure of the response
    return response.data; // This should contain { data, summary, count, next, previous }
  } catch (error) {
    console.error("Error fetching OPD by doctor:", error);
    throw error;
  }
};


export const getOpdById = async (id) => {
  const response = await api.get(`${OPD_BASE}/${id}/`);
  return response.data;
};

export const createOpd = async (payload) => {
  const response = await api.post(`${OPD_BASE}/`, payload);
  return response.data;
};

export const pastHistory = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`/past_history/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
    if (page > 500) break; // Safety break
  }
  return allResults;
}

export const createPastHistory = async (payload) => {
  const response = await api.post(`/past_history/`, payload);
  return response.data;
};

export const deleteOpdPastHistory = async (opdId, index) => {
  const response = await api.delete(`/opd_update/${opdId}/past_history/${index}/`);
  return response.data;
};

export const updateOpdPastHistory = async (opdId, index, payload) => {
  const response = await api.patch(`/opd_update/${opdId}/past_history/${index}/`, payload);
  return response.data;
};

// services/opd.services.js
export const complaint = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`/complaint/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
    if (page > 500) break; // Safety break
  }
  return allResults;
};

export const createComplaint = async (payload) => {
  const response = await api.post(`/complaint/`, payload);
  return response.data;
};

export const deleteOpdComplaint = async (opdId, index) => {
  const response = await api.delete(`/opd_update/${opdId}/chief_complaints_opd/${index}/`);
  return response.data;
};

export const updateOpdChiefComplaint = async (opdId, index, payload) => {
  const response = await api.patch(`/opd_update/${opdId}/chief_complaints_opd/${index}/`, payload);
  return response.data;
};

export const diagnosis = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`/diagnosis/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
    if (page > 500) break; // Safety break
  }
  return allResults;
}

export const createDiagnosis = async (payload) => {
  const response = await api.post(`/diagnosis/`, payload);
  return response.data;
}

export const updateOpdDiagnosis = async (opdId, index, payload) => {
  const response = await api.patch(`/opd_update/${opdId}/diagnosis_detail/${index}/`, payload);
  return response.data;
};

export const deleteOpdDiagnosis = async (opdId, index) => {
  const response = await api.delete(`/opd_update/${opdId}/diagnosis_detail/${index}/`);
  return response.data;
};

export const opinion = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`/opinion/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
    if (page > 500) break; // Safety break
  }
  return allResults;
}

export const createOpinion = async (payload) => {
  const response = await api.post(`/opinion/`, payload);
  return response.data;
};

export const updateOpdOpinion = async (opdId, index, payload) => {
  const response = await api.patch(`/opd_update/${opdId}/adviced/${index}/`, payload);
  return response.data;
};

export const deleteOpdOpinion = async (opdId, index) => {
  const response = await api.delete(`/opd_update/${opdId}/adviced/${index}/`);
  return response.data;
};

export const updateOpdNote = async (opdId, index, payload) => {
  const response = await api.patch(`opd_update/${opdId}/Note/${index}/`, payload);
  return response.data;
};

export const deleteOpdNote = async (opdId, index) => {
  const response = await api.delete(`opd_update/${opdId}/Note/${index}/`);
  return response.data;
}

export const diet = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`/diet/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
    if (page > 500) break; // Safety break
  }
  return allResults;
}

export const createDiet = async (payload) => {
  const response = await api.post(`/diet/`, payload);
  return response.data;
};

export const medicine = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`/medicine/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
    if (page > 500) break; // Safety break
  }
  return allResults;
}

export const createMedicine = async (payload) => {
  const response = await api.post(`/medicine/`, payload);
  return response.data;
}

export const updateOpdMedicine = async (opdId, index, payload) => {
  const response = await api.patch(`/opd_update/${opdId}/given_medicine/${index}/`, payload);
  return response.data;
}

export const deleteOpdMedicine = async (opdId, index) => {
  const response = await api.delete(`/opd_update/${opdId}/given_medicine/${index}/`);
  return response.data;
}

export const updateOpdNextVisit = async (opdId, index, payload) => {
  const response = await api.patch(`/opd_update/${opdId}/nextVisit/${index}/`, payload);
  return response.data;
}

export const deleteOpdNextVisit = async (opdId, index) => {
  const response = await api.delete(`/opd_update/${opdId}/nextVisit/${index}/`);
  return response.data;
}

export const updateOpd = async (id, payload) => {
  const response = await api.patch(`${OPD_BASE}/${id}/`, payload);
  return response.data;
};

export const updateOpdPut = async (id, payload) => {
  const response = await api.put(`${OPD_BASE}/${id}/`, payload);
  return response.data;
};

export const updateOpdChiefComplaintAtIndex = async (id, index, payload) => {
  const url = `/opd_update/${id}/chief_complaints_opd/${index}/`;
  try {
    const response = await api.patch(url, payload);
    return response.data;
  } catch (err) {
    // Some deployments block PATCH on this endpoint (preflight/method issues). Fallback to PUT/POST.
    try {
      const response = await api.put(url, payload);
      return response.data;
    } catch {
      const response = await api.post(url, payload);
      return response.data;
    }
  }
};

export const appendOpdChiefComplaint = async (opdId, payload) => {
  const url = `/opd_update/${opdId}/chief_complaints_opd/`;
  try {
    const response = await api.post(url, payload);
    return response.data;
  } catch (err) {
    // Fallback order for deployments that restrict POST.
    try {
      const response = await api.patch(url, payload);
      return response.data;
    } catch {
      const response = await api.put(url, payload);
      return response.data;
    }
  }
};

export const updateOpdChiefComplaintByComplaintId = async (opdId, complaintId, payload) => {
  const url = `/opd_update/${opdId}/chief_complaints_opd/${complaintId}/`;
  try {
    const response = await api.patch(url, payload);
    return response.data;
  } catch (err) {
    try {
      const response = await api.put(url, payload);
      return response.data;
    } catch {
      const response = await api.post(url, payload);
      return response.data;
    }
  }
};

export const deleteOpd = async (id) => {
  await api.delete(`${OPD_BASE}/${id}/`);
  return true;
};

// api/opdApi.js
export const opdVisitById = async (id) => {
  try {
    const response = await api.get(`/opd_visit/opd_id/${id}/`);
    const data = response.data;
    console.log('Fetched OPD visit data:', data);

    // Add any additional formatting or data transformation here
    return {
      ...data,
      // Ensure all arrays exist even if empty
      chief_complaints: data.chief_complaints || [],
      given_medicine: data.given_medicine || [],
      diagnosis_detail: data.diagnosis_detail || [],
      adviced: data.adviced || [],
      Note: data.Note || [],
      nextVisit: data.nextVisit || [],
      suggested_diet: data.suggested_diet || [],
      past_history: data.past_history || [],
      vitals: data.vitals || {},
      examination: data.examination || {},
      datetime: data.datetime || new Date().toISOString(),
      visit_type: data.visit_type || 'Consultation'
    };
  } catch (error) {
    console.error('Error fetching OPD visit:', error);
    throw error;
  }
};

export const opdVisitByVisitId = async (id) => {
  const response = await api.get(`/opd_visit/${id}/`);
  return response.data;
}

export const deleteOpdVisit = async (id) => {
  const response = await api.delete(`/opd_visit/${id}/`);
  return response.data;
}

export const createOpdVisit = async (payload) => {
  const response = await api.post(`/opd_visit/`, payload);
  return response.data;
}

export const updateOpdVisit = async (id, payload) => {
  const response = await api.patch(`/opd_visit/${id}/`, payload);
  return response.data;
}