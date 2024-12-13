import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Hàm kiểm tra trạng thái tài khoản
    const checkAccountStatus = (userData) => {
        if (userData.status === 'inactive') {
            throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
        }
        return true;
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Khôi phục trạng thái user từ localStorage khi component mount
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    
                    // Kiểm tra trạng thái tài khoản
                    if (checkAccountStatus(parsedUser)) {
                        setToken(storedToken);
                        setUser(parsedUser);
                        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                        
                        // Kiểm tra trạng thái hiện tại từ server
                        const response = await api.get('/auth/me');
                        const currentUser = response.data;
                        
                        // Cập nhật thông tin user nếu có thay đổi
                        if (currentUser.status === 'inactive') {
                            await logout();
                            throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
                        } else {
                            setUser(currentUser);
                            localStorage.setItem('user', JSON.stringify(currentUser));
                        }
                    }
                    console.log('Khôi phục phiên đăng nhập:', parsedUser);
                }
            } catch (error) {
                console.error('Lỗi khôi phục phiên đăng nhập:', error);
                // Nếu có lỗi, xóa dữ liệu không hợp lệ và đăng xuất
                await logout();
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = async (newToken, userData) => {
        console.log('Bắt đầu đăng nhập:', { token: newToken, user: userData });
        
        try {
            // Kiểm tra trạng thái tài khoản trước khi đăng nhập
            if (checkAccountStatus(userData)) {
                // Lưu vào localStorage
                localStorage.setItem('token', newToken);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Cập nhật state
                setToken(newToken);
                setUser(userData);
                
                // Cập nhật token cho axios instance
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                
                console.log('Đăng nhập thành công:', userData);
            }
        } catch (error) {
            console.error('Lỗi trong quá trình đăng nhập:', error);
            // Đảm bảo xóa dữ liệu nếu có lỗi
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            delete api.defaults.headers.common['Authorization'];
            throw error;
        }
    };

    const logout = async () => {
        console.log('Bắt đầu đăng xuất...');
        
        try {
            // Xóa khỏi localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Xóa khỏi state
            setToken(null);
            setUser(null);
            
            // Xóa token khỏi axios instance
            delete api.defaults.headers.common['Authorization'];
            
            // Xóa cache của trình duyệt
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                    console.log('Cache đã được xóa');
                } catch (error) {
                    console.error('Lỗi khi xóa cache:', error);
                }
            }
            
            // Chuyển hướng về trang đăng nhập
            window.location.href = '/login';
            
            console.log('Đăng xuất thành công');
        } catch (error) {
            console.error('Lỗi trong quá trình đăng xuất:', error);
        }
    };

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading
    };

    if (loading) {
        return null; // hoặc return <LoadingSpinner /> nếu bạn có component loading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext; 