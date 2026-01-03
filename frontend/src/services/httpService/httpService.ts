import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

const http: AxiosInstance = axios.create({
  baseURL: '/api', 
  timeout: 200000,
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Yetkisiz erişim - oturum sonlandırılıyor.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default http;
