import axios from 'axios';

// CRITICAL FIX: Rely *only* on the environment variable set during the build/deployment.
// The variable is read from Vercel's settings (or .env file locally).
const API_BASE_URL = process.env.REACT_APP_API_URL;

console.log('🌐 API Base URL:', API_BASE_URL);

// --- Everything else looks great! ---
const api = axios.create({
 baseURL: API_BASE_URL,
 headers: {
 'Content-Type': 'application/json',
 },
 timeout: 30000, // Increased timeout to 30 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
 (config) => {
 const token = localStorage.getItem('token');
 if (token) {
 config.headers.Authorization = `Bearer ${token}`;
 }
  return config;
 },
 (error) => {
 console.error('❌ Request interceptor error:', error);
 return Promise.reject(error);
 }
);

// Response interceptor to handle errors
api.interceptors.response.use(
 (response) => {
  return response;
 },
 (error) => {
  console.error('❌ API Error:', {
 url: error.config?.url,
 status: error.response?.status,
 message: error.message,
 data: error.response?.data
 });

 if (error.response?.status === 401) {
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 window.location.href = '/login';
 }
  
  if (error.code === 'ECONNABORTED') {
  return Promise.reject(new Error('Request timeout. Please try again.'));
  }
  
  if (!error.response) {
 return Promise.reject(new Error('Network error. Please check your connection and ensure the backend server is running.'));
 }
 
 const serverMessage = error.response.data?.message;
 if (serverMessage) {
 return Promise.reject(new Error(serverMessage));
}
 
 return Promise.reject(error);
 }
);

export default api;