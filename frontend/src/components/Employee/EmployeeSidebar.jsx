import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { employeeMenuItems } from '../../routes/employee';
import { useAuth } from '../../contexts/AuthContext';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';

const { Sider } = Layout;

const EmployeeSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();

    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
        }
    };

    return (
        <Sider width={250} theme="light" style={{ height: '100vh', position: 'fixed', left: 0 }}>
            {/* Header với thông tin user */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <UserOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{user?.full_name || 'Nhân viên'}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{user?.username}</div>
                    </div>
                </div>
            </div>

            {/* Menu chính */}
            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                style={{ 
                    height: 'calc(100% - 120px)', 
                    borderRight: 0,
                    overflowY: 'auto'
                }}
                items={employeeMenuItems}
                onClick={handleMenuClick}
            />

            {/* Nút đăng xuất */}
            <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                width: '100%', 
                padding: '16px',
                borderTop: '1px solid #f0f0f0'
            }}>
                <Button 
                    type="primary" 
                    danger 
                    icon={<LogoutOutlined />} 
                    onClick={handleLogout}
                    style={{ width: '100%' }}
                >
                    Đăng xuất
                </Button>
            </div>
        </Sider>
    );
};

export default EmployeeSidebar; 