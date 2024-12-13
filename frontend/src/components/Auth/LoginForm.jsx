import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('Đang gửi request đăng nhập:', {
            username: formData.username,
            passwordLength: formData.password.length
        });

        try {
            const response = await axios.post('http://localhost:4000/api/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Đăng nhập thành công:', {
                status: response.status,
                data: {
                    ...response.data,
                    token: response.data.token ? `${response.data.token.substring(0, 20)}...` : null
                }
            });

            // Sử dụng login từ AuthContext
            await login(response.data.token, response.data.user);

            // Sửa lại phần chuyển hướng
            if (response.data.user.role === 'admin') {
                console.log('Chuyển hướng admin đến: /admin/dashboard');
                navigate('/admin/dashboard', { replace: true });
            } else {
                console.log('Chuyển hướng nhân viên đến: /employee/dashboard');
                navigate('/employee/dashboard', { replace: true });
            }

        } catch (err) {
            console.error('Lỗi đăng nhập:', {
                message: err.message,
                response: {
                    status: err.response?.status,
                    data: err.response?.data,
                    headers: err.response?.headers
                },
                request: err.request ? 'Request sent but no response' : null
            });

            if (!err.response) {
                setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
            } else if (err.response.status === 401) {
                if (err.response.data?.message === 'Tài khoản đã bị khóa') {
                    setError('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
                } else {
                    setError('Tên đăng nhập hoặc mật khẩu không đúng');
                }
            } else if (err.response.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Có lỗi xảy ra. Vui lòng thử lại.');
            }

            setFormData(prev => ({
                ...prev,
                password: ''
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Đăng nhập
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                            <div className="text-red-700">{error}</div>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">Tên đăng nhập</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Tên đăng nhập"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Mật khẩu</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Mật khẩu"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                loading 
                                    ? 'bg-indigo-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`}
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginForm; 