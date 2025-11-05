import axios from "axios";

const jsonHeader = {
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

const formHeader = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
  withCredentials: true,
};

// 🔍 GET business by bidNumber
export const getBusinessByBid = async (bidNumber) => {
  const res = await axios.get(`/api/business?bidNumber=${bidNumber}`, jsonHeader);
  if (Array.isArray(res.data)) return res.data[0];
  return res.data;
};

// ✏️ Update business request by bidNumber
export const updateBusinessRequest = (bidNumber, payload) => {
  return axios.put(`/api/business/${bidNumber}`, payload, jsonHeader);
};

// ➕ Add new business
export const addOwnerBusiness = (data) => {
  return axios.post(`/api/business`, data, jsonHeader);
};

// 📥 Fetch all businesses
export const getAddOwnerBusiness = () => {
  return axios.get(`/api/business`, jsonHeader);
};
