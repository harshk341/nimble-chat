import axios from "axios";

const apiCaller = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_API}`,
  timeout: 10000,
});

apiCaller.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    return Promise.reject(error);
  },
);

export default apiCaller;
