export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_BACKEND_URL ||
  'http://localhost:8443';
