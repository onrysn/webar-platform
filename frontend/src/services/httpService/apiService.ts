import http from "./httpService";

export const apiService = {
  get: (url: string, params?: any) => http.get(url, { params }),
  post: (url: string, data?: any) => http.post(url, data),
  put: (url: string, data?: any) => http.put(url, data),
  delete: (url: string) => http.delete(url),
};
