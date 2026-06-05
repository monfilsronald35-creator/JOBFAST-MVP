import axios from 'axios';

// 1. Kreye instans API a
const API = axios.create({
  baseURL: 'https://api.jobfast.com/v1', // Ranplase ak URL backend ou a
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor: Ajoute token an otomatikman nan tout demann (Request)
// Sa fè ou pa bezwen mete header a nan chak paj ou fè yon API call
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Interceptor: Jere erè yo (egzanp: si session an ekspire 401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Isit la ou ka fè yon "logout" otomatik si token an pa valab
      console.error("Sesyon ekspire, tanpri konekte ankò.");
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
