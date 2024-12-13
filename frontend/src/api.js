import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
    },
    responseType: 'json',
    responseEncoding: 'utf8'
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Chỉ stringify data nếu không phải FormData
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
            config.data = JSON.stringify(config.data);
        }
        // Nếu là FormData, đảm bảo Content-Type được set đúng
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Ensure proper decoding of response data
        if (response.data && typeof response.data === 'string') {
            try {
                response.data = JSON.parse(response.data);
            } catch (e) {
                console.error('Error parsing response data:', e);
            }
        }
        return response;
    },
    (error) => {
        if (!error.response) {
            return Promise.reject({
                response: {
                    data: {
                        message: 'Không thể kết nối đến server'
                    }
                }
            });
        }

        // Đảm bảo error.response.data luôn có message
        if (error.response && error.response.data) {
            if (!error.response.data.message && error.response.data.error) {
                error.response.data.message = error.response.data.error;
            }
        }

        return Promise.reject(error);
    }
);

export default api; 