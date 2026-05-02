import api from "./api.js";

const SCALP_BASE = "/scalp";

export const getScalps = async () => {
  try {
    let allResults = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const response = await api.get(`${SCALP_BASE}/?page=${page}`);
      const data = response.data;

      if (Array.isArray(data.data)) {
        allResults = [...allResults, ...data.data];
      }

      hasNext = data.next !== null;
      page++;
      
      if (page > 1000) break;
    }
    return allResults;
  } catch (error) {
    console.error("Error fetching scalps:", error);
    throw error;
  }
};