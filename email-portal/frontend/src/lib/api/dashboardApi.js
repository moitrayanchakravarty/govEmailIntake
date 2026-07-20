import axiosInstance from '../../api/axiosInstance';

export const dashboardApi = {
  getMetrics: () => axiosInstance.get('/dashboard/metrics').then((r) => r.data)
};
