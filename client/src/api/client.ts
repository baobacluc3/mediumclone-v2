import axios from 'axios';
import { useAuthStore } from '../store/authStore';
export const api = axios.create({ baseURL: 'http://localhost:3000/api' });
api.interceptors.request.use((config) => { const t = useAuthStore.getState().token; if (t) config.headers.Authorization = `Bearer ${t}`; return config; });
