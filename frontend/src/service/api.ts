import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const accessToken = window.sessionStorage.getItem('accessToken');
    if (accessToken) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
            const message = error.response?.data?.message
                ?? error.response?.data?.error
                ?? (error.response
                    ? `No se pudo completar la petición (${error.response.status}).`
                    : 'No se pudo conectar con el servidor.');
            toast.error(message);
        } else {
            toast.error('Se ha producido un error inesperado.');
        }

        return Promise.reject(error);
    },
);

export default api;