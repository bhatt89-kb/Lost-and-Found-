import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Automatically append JWT token to every request header if logged in
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);
export const loginWithGoogle = (credential) => API.post('/auth/google', { credential });
export const fetchPosts = (params = {}) => API.get('/posts', { params });
export const createPost = (formData) => API.post('/posts', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const submitClaim = (claimData) => API.post('/claims', claimData);
export const resolveHandover = (handoverData) => API.post('/claims/resolve', handoverData);
export const fetchClaimsByPost = (postId) => API.get(`/claims/post/${postId}`);
export const deletePost = (postId) => API.delete(`/posts/${postId}`);
export const fetchMyPosts = () => API.get('/posts/mine');
export const fetchMyClaims = () => API.get('/claims/mine');
export const withdrawClaim = (claimId) => API.delete(`/claims/${claimId}`);
export const fetchPendingCount = () => API.get('/claims/pending-count');
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => API.post('/auth/reset-password', { token, password });
export const fetchMe = () => API.get('/auth/me');
export const reportPost = (postId, data) => API.post(`/posts/${postId}/report`, data);
export const fetchReports = () => API.get('/admin/reports');
export const dismissReport = (reportId) => API.post(`/admin/reports/${reportId}/dismiss`);
export const adminDeletePost = (postId) => API.delete(`/admin/posts/${postId}`);