import axios from 'axios';
import { toast } from 'react-hot-toast';
import { isLoginForbidden } from '../modules/auth/constants/authErrors';

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
            if (error.response?.status === 403) {
                if (window.location.pathname !== '/403') {
                    window.location.href = '/403';
                }
                return Promise.reject(error);
            }

            if ((error.response?.status ?? 0) >= 500) {
                if (window.location.pathname !== '/500') {
                    window.location.href = '/500';
                }
                return Promise.reject(error);
            }

            const fallbackMessage = error.response
                ? `No se pudo completar la petición (${error.response.status}).`
                : 'No se pudo conectar con el servidor.';
            const backendMessage = error.response?.data?.message ?? error.response?.data?.error;
            const isAlreadyRentedRacket = error.config?.method?.toLowerCase() === 'patch'
                && /^\/api\/v1\/users\/\d+\/racket\/\d+$/.test(error.config.url ?? '')
                && backendMessage?.toLowerCase().includes('already have a rented racket') === true;
            const isCourtBookingHandledByPage = (error.config?.url ?? '').startsWith('/api/v1/bookings/courts/')
                || (error.config?.method?.toLowerCase() === 'post'
                    && (error.config?.url ?? '') === '/api/v1/bookings');
            const message = isLoginForbidden(error)
                ? 'El correo o la contraseña son incorrectos.'
                : backendMessage
                ?? fallbackMessage;
            if (!isAlreadyRentedRacket && !isCourtBookingHandledByPage) {
                toast.error(message);
            }
        } else {
            toast.error('Se ha producido un error inesperado.');
        }

        return Promise.reject(error);
    },
);

export default api;
