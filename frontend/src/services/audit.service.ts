import { api } from './api';

export const auditService = {
  getLogs: (page = 0, size = 500) =>
    api.get(`/api/audit-logs?page=${page}&size=${size}`),
};
