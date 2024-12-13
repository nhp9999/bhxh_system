import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const UnauthorizedPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleBackClick = () => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard');
        } else if (user?.role === 'employee') {
            navigate('/employee/declarations');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Result
                status="403"
                title="Không có quyền truy cập"
                subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
                extra={
                    <Button type="primary" onClick={handleBackClick}>
                        Quay lại trang chủ
                    </Button>
                }
            />
        </div>
    );
};

export default UnauthorizedPage; 