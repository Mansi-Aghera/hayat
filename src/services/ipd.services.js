import api from "./api.js";

const IPD_BASE = "/ipd";

export const getIpdsCount = async () => {
  const response = await api.get(`${IPD_BASE}/`);
  return response.data.count;
};

export const getIpds = async () => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`${IPD_BASE}/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
};

export const getIpdss = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();

    const url = queryString
      ? `${IPD_BASE}/?${queryString}`
      : `${IPD_BASE}/`;

    const response = await api.get(url);

    return response;

  } catch (error) {
    console.error("Error fetching Ipds:", error);
    throw error;
  }
};


export const getIpdById = async (id) => {
  const response = await api.get(`${IPD_BASE}/${id}/`);
  return response.data;
};

export const createIpd = async (payload) => {
  const response = await api.post(`${IPD_BASE}/`, payload);
  return response.data;
};

export const updateIpd = async (id, payload) => {
  const response = await api.patch(`${IPD_BASE}/${id}/`, payload);
  return response.data;
};

export const deleteIpd = async (id) => {
  await api.delete(`${IPD_BASE}/${id}/`);
  return true;
};

export const pastHistory = async () =>{
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
  }
  return allResults;
}

export const createPastHistory = async (payload) => {
  const response = await api.post(`/past_history/`, payload);
  return response.data;
};

export const deleteIpdPastHistory = async (ipdId, index) => {
  const response = await api.delete(`/ipd_update/${ipdId}/past_historys/${index}/`);
  return response.data;
};

export const updateIpdPastHistory = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_update/${ipdId}/past_historys/${index}/`, payload);
  return response.data;
};

export const updateSystemeticExamination = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_update/${ipdId}/systemetic_examination/${index}/`, payload);
  return response.data;
}

export const deleteSystemeticExamination = async (ipdId, index) => {
  const response = await api.delete(`/ipd_update/${ipdId}/systemetic_examination/${index}/`);
  return response.data;
}

export const updateGeneralExamination = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_update/${ipdId}/general_examination/${index}/`, payload);
  return response.data;
}

export const deleteGeneralExamination = async (ipdId, index) => {
  const response = await api.delete(`/ipd_update/${ipdId}/general_examination/${index}/`);
  return response.data;
}

export const updateDailyExamination = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_update/${ipdId}/daily_examination/${index}/`, payload);
  return response.data;
}

export const deleteDailyExamination = async (ipdId, index) => {
  const response = await api.delete(`/ipd_update/${ipdId}/daily_examination/${index}/`);
  return response.data;
}

export const personalHo = async() =>{
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`/personal_ho/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
}

export const createPersonalHo = async (payload) => {
  const response = await api.post(`/personal_ho/`, payload);
  return response.data;
};

export const updatePersonalHo = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_update/${ipdId}/personal_H_O/${index}/`, payload);
  return response.data;
}

export const deletePersonalHo = async (ipdId, index) => {
  const response = await api.delete(`/ipd_update/${ipdId}/personal_H_O/${index}/`);
  return response.data;
}

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
  }
  return allResults;
};

export const createComplaint = async (payload) => {
  const response = await api.post(`/complaint/`, payload);
  return response.data;
};

export const deleteIpdComplaint = async (ipdId, index) => {
  const response = await api.delete(`/ipd_update/${ipdId}/daily_chief_complaints/${index}/`);
  return response.data;
};

export const updateIpdChiefComplaint = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_update/${ipdId}/daily_chief_complaints/${index}/`, payload);
  return response.data;
};

export const medicine = async() =>{
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
  }
  return allResults;
}

export const createMedicine = async (payload) => {
  const response = await api.post(`/medicine/`, payload);
  return response.data;
}

export const updateIpdMedicine = async (opdId, index, payload) => {
  const response = await api.patch(`/ipd_update/${opdId}/daily_given_treatment/${index}/`, payload);
  return response.data;
}

export const deleteIpddMedicine = async (opdId, index) => {
  const response = await api.delete(`/ipd_update/${opdId}/daily_given_treatment/${index}/`);
  return response.data;
}

export const diagnosis = async () =>{
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
  }
  return allResults;
}

export const createDiagnosis = async (payload) => {
  const response = await api.post(`/diagnosis/`, payload);
  return response.data;
}

export const updateIpdDiagnosis = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_update/${ipdId}/provisional_diagnosis/${index}/`, payload);
  return response.data;
};

export const deleteIpdDiagnosis = async (ipdid, index) => {
  const response = await api.delete(`/ipd_update/${ipdid}/provisional_diagnosis/${index}/`);
  return response.data;
};

export const updateInvestigation = async(ipdId,index,payload) =>{
  const response = await api.patch(`ipd_update/${ipdId}/investigation_chart/${index}/`,payload)
  return response.data;
}

export const deleteInvestigation = async (ipdid,index) => {
  const response = await api.delete(`ipd_update/${ipdid}/investigation_chart/${index}/`);
  return response.data
}

export const updateSugarChart = async(ipdId,index,payload) =>{
  const response = await api.patch(`ipd_update/${ipdId}/bp_sugar_chart/${index}/`,payload)
  return response.data;
}

export const deleteSugarChart = async (ipdid,index) => {
  const response = await api.delete(`ipd_update/${ipdid}/bp_sugar_chart/${index}/`);
  return response.data
}

export const updateTreatmentChart = async(ipdId,index,payload) => {
  const response = await api.patch(`ipd_update/${ipdId}/treatment_chart/${index}/`,payload)
  return response.data;
}

export const deleteTreatmentChart = async (ipdid,index) => {
  const response = await api.delete(`ipd_update/${ipdid}/treatment_chart/${index}/`);
  return response.data
}

export const updatePaymentDetail = async(ipdId,payload) => {
  const response = await api.post(`ipd_update/${ipdId}/payment/`,payload)
  return response.data
}

export const updatePayments = async (ipdId,index,payload) => {
  const response = await api.patch(`ipd_update/${ipdId}/update_payment/${index}/`,payload)
  return response.data;
}

export const deletePayment = async (ipdid, index) => {
  const response = await api.delete(`ipd_update/${ipdid}/update_payment/${index}/`);
  return response.data;
};

export const hospitalServices = async() => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`hospital_service/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
}

export const createHospitalServices = async (payload) => {
  const response = await api.post(`hospital_service/`, payload);
  return response.data;
}

export const ipdDailyRound = async() => {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await api.get(`ipd_daily_round/?page=${page}`);
    const data = response.data;

    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
    }

    hasNext = data.next !== null; // Django pagination
    page++;
  }
  return allResults;
}

export const getIpdDailyRoundById = async (id) => {
  const response = await api.get(`ipd_daily_round/ipd_id/${id}/`);
  return response.data;
};

export const createIpdDailyRound = async (payload) => {
  const response = await api.post(`ipd_daily_round/`, payload);
  return response.data;
};

export const updateIpdDailyRound = async (id, payload) => {
  const response = await api.patch(`ipd_daily_round/${id}/`, payload);
  return response.data;
};

export const deleteIpdDailyRoundChiefComplaint = async (ipdId, index) => {
  const response = await api.delete(`/ipd_daily_round_update/${ipdId}/daily_chief_complaints/${index}/`);
  return response.data;
};

export const updateIpdDailyRoundChiefComplaint = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_daily_round_update/${ipdId}/daily_chief_complaints/${index}/`, payload);
  return response.data;
};

export const updateIpdDailyRoundDailyExamination = async (ipdId, index, payload) => {
  const response = await api.patch(`/ipd_daily_round_update/${ipdId}/daily_examination/${index}/`, payload);
  return response.data;
}

export const deleteIpdDailyRoundDailyExamination = async (ipdId, index) => {
  const response = await api.delete(`/ipd_daily_round_update/${ipdId}/daily_examination/${index}/`);
  return response.data;
}

export const updateIpdDailyRoundMedicine = async (opdId, index, payload) => {
  const response = await api.patch(`/ipd_daily_round_update/${opdId}/daily_given_treatment/${index}/`, payload);
  return response.data;
}

export const deleteIpdDailyRounddMedicine = async (opdId, index) => {
  const response = await api.delete(`/ipd_daily_round_update/${opdId}/daily_given_treatment/${index}/`);
  return response.data;
}

export const createDischargeIpd = async (payload) => {
  const response = await api.post(`discharge_ipd/`, payload);
  return response.data;
};

export const updateDischargeIpd = async(id, payload) => {
  const response = await api.patch(`discharge_ipd/${id}/`, payload);
  return response.data;
}

export const getDischargeByIpdId = async (ipdId) => {
  const response = await api.get(`discharge_ipd/${ipdId}/`);
  return response.data;
};

export const checkDischargeExists = async (ipdId) => {
  try {
    const response = await api.get(`/discharge_ipd/`, {
      params: {
        ipd_data: ipdId
      }
    });
    
    // Assuming API returns array of results
    const dischargeRecords = response.data.data;
    // Check if any record matches the IPD ID
    return dischargeRecords.some(record => 
      parseInt(record.ipd_data) === parseInt(ipdId)
    );
  } catch (error) {
    console.error('Error checking discharge:', error);
    throw error;
  }
};