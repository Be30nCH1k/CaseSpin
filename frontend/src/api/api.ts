import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing   = false;
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: any) => void }> = [];

const flushQueue = (error: any, token: string | null = null) => {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else       resolve(token!);
    });
    pendingQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject });
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`;
                return api(original);
            });
        }

        original._retry = true;
        isRefreshing = true;

        const refresh = localStorage.getItem('refresh');

        if (!refresh) {
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        try {
            const { data } = await axios.post(`${BASE_URL}/token/refresh/`, { refresh });

            const newAccess = data.access;
            localStorage.setItem('access', newAccess);

            api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
            flushQueue(null, newAccess);

            original.headers.Authorization = `Bearer ${newAccess}`;
            return api(original);
        } catch (refreshError) {
            flushQueue(refreshError);
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;