import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`, // Adjust if backend runs on different port
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

export default api;
