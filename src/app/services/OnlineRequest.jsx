import axios from "axios";

const URL = process.env.NEXT_PUBLIC_URL_AND_PORT

const headers = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
}

const jsonHeader = {
  headers: {
    "Content-Type": "application/json",
  },
};


export const getSanitationOnlineRequest = () => {
  // console.log(data)
  // return {}
  return axios.get(
    `${URL}/api/officer`,
  );
};

export const updateSanitationOnlineRequest = (id, payload) => {
  return axios.put(
    `${URL}/api/officer/${id}`, 
    payload, 
    jsonHeader);
};

