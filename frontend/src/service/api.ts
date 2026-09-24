import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_BASE_URL as string) || 'https://localhost:8443',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;