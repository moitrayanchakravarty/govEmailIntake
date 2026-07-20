import axiosInstance from '../../api/axiosInstance';

const unwrap = (res) => res.data;

/**
 * One-to-one mapping onto backend/src/routes/requestRoutes.js.
 */
export const requestsApi = {
  downloadBulkTemplate: async () => {
    const res = await axiosInstance.get('/requests/bulk/template', { responseType: 'blob' });
    return res.data;
  },
  validateBulkCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post('/requests/bulk/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return unwrap(res);
  },
  createSingle: (payload) => axiosInstance.post('/requests/single', payload).then(unwrap),
  createBulk: (payload) => axiosInstance.post('/requests/bulk', payload).then(unwrap),
  createModification: (payload) => axiosInstance.post('/requests/modification', payload).then(unwrap),
  createDeletion: (payload) => axiosInstance.post('/requests/deletion', payload).then(unwrap),
  list: (params) => axiosInstance.get('/requests', { params }).then(unwrap),
  getById: (id) => axiosInstance.get(`/requests/${id}`).then(unwrap),
  updateDraft: (id, payload) => axiosInstance.patch(`/requests/${id}`, payload).then(unwrap),
  deleteDraft: (id) => axiosInstance.delete(`/requests/${id}`).then(unwrap),
  submitDraft: (id) => axiosInstance.post(`/requests/${id}/submit`).then(unwrap),
  resubmit: (id, payload) => axiosInstance.post(`/requests/${id}/resubmit`, payload || {}).then(unwrap),
  review: (id, payload) => axiosInstance.post(`/requests/${id}/review`, payload).then(unwrap)
};
