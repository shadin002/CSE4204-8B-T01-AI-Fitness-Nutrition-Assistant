import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fitguide_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message;

    if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')) {
      message = 'The request took too long. Please try again.';
    } else if (error?.code === 'ERR_NETWORK' || !error?.response) {
      message = 'Cannot connect to the server. Check your network and try again.';
    } else {
      message =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.';
    }

    error.appMessage = message;
    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
