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
export const getBusinessByBid = async (bidNumber) => {
  const res = await axios.get(`/api/business?bidNumber=${bidNumber}`, jsonHeader);

  // 🧠 unwrap the data before returning
  if (Array.isArray(res.data)) {
    return res.data[0]; // if backend sends an array
  }
  return res.data; // fallback if backend returns an object
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

export async function getUserBusinesses() {
  const res = await fetch('/api/business'); // adjust API endpoint as needed
  if (!res.ok) throw new Error('Failed to fetch user businesses');
  return res.json();
}
