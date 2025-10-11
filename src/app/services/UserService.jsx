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


  export const signUpWithCompleteInfo = (data) => {
    return axios.post(
      `/api/users`,
      data,
      jsonHeader
    );
  };

  export const userLogin = (data) => {
    return axios.post(
      `/api/login`,
      data,
      jsonHeader
    );
  };



