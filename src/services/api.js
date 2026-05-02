import axios from 'axios';

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && String(envUrl).trim()) return String(envUrl).trim();

  // Avoid mixed-content/protocol mismatch: if app is on https, prefer https API.
  // Otherwise prefer http API.
  const proto = typeof window !== "undefined" ? window.location.protocol : "http:";
  const host = "adminapi.hayatplus.online";
  return proto === "https:" ? `https://${host}` : `http://${host}`;
};

const API = axios.create({
  baseURL: resolveBaseUrl(),
});

export default API;