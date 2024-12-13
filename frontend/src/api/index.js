import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('Request config:', {
            method: config.method,
            url: config.url,
            headers: config.headers,
            data: config.data
        });
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers
        });
        return response;
    },
    (error) => {
        console.error('Response error:', {
            config: error.config,
            response: error.response,
            message: error.message
        });

        if (error.response) {
            // Xử lý các lỗi response
            switch (error.response.status) {
                case 401:
                    // Token hết hạn hoặc không hợp lệ
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    // Không có quyền truy cập
                    console.error('Không có quyền truy cập');
                    break;
                case 404:
                    // Không tìm thấy tài nguyên
                    console.error('Không tìm thấy tài nguyên');
                    break;
                case 500:
                    // Lỗi server
                    console.error('Lỗi server:', error.response.data);
                    break;
                default:
                    console.error('Có lỗi xảy ra:', error.response.data);
            }
        } else if (error.request) {
            // Không nhận được response
            console.error('Không thể kết nối đến server:', error.request);
        } else {
            // Lỗi khi setup request
            console.error('Lỗi khi gửi request:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api; 