import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_URL_AND_PORT;

// ✅ Create a shared Axios instance
const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Registration service
export const signUpWithCompleteInfo = (data) => {
  return axiosInstance.post("/api/users", data);
};

// ✅ Login service
export const userLogin = (data) => {
  return axiosInstance.post("/api/login", data);
};
