import axios from "axios";

const URL = process.env.NEXT_PUBLIC_URL_AND_PORT;

// 🔐 Shared headers
const jsonHeader = {
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ Ensures cookies are sent for session-based auth
};

const formHeader = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
  withCredentials: true,
};

// 🔍 GET business by bidNumber (query param version)
export const getBusinessByBid = (bidNumber) => {
  return axios.get(`/api/business?bidNumber=${bidNumber}`, jsonHeader);
};

// ✏️ PUT update business by bidNumber
export const updateBusinessRequest = (bidNumber, payload) => {
  return axios.put(`/api/business/${bidNumber}`, payload, jsonHeader);
};

// ➕ POST new business (owner only)
export const addOwnerBusiness = (data) => {
  return axios.post(`/api/business`, data, jsonHeader);
};

// 📥 GET all businesses (owner or officer)
export const getAddOwnerBusiness = () => {
  return axios.get(`/api/business`, jsonHeader);
};
