import axiosInstance from '../../api/axiosInstance';

export const registryApi = {
  // Backs the real-time Preferred Email ID check (single + bulk forms).
  checkEmail: (email) => axiosInstance.get('/registry/check-email', { params: { email } }).then((r) => r.data),
  // Backend already scopes this to the caller's own office for office_admin.
  search: (params) => axiosInstance.get('/registry/search', { params }).then((r) => r.data)
};
