import React from 'react';
import { Menu, Avatar, Space, Divider, theme } from 'antd';
import {
    DashboardOutlined,
    FileAddOutlined,
    UnorderedListOutlined,
    HistoryOutlined,
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeSidebar = ({ collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userInfo, logout } = useAuth();
    const { token } = theme.useToken();

    const menuItems = [
        {
            key: '/employee/dashboard',
            icon: <DashboardOutlined />,
            label: 'Trang chủ',
        },
        {
            key: '/employee/declarations/create/batch',
            icon: <FileAddOutlined />,
            label: 'Tạo đợt kê khai',
        },
        {
            key: '/employee/declarations',
            icon: <UnorderedListOutlined />,
            label: 'Danh sách kê khai',
        },
        {
            key: '/employee/history',
            icon: <HistoryOutlined />,
            label: 'Lịch sử kê khai',
        },
        {
            type: 'divider',
            style: { margin: '8px 0' }
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
        }
    ];

    const handleMenuClick = ({ key }) => {
        if (key === 'logout') {
            logout();
            navigate('/login');
        } else {
            navigate(key);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="h-14 flex items-center justify-center border-b border-gray-100">
                {collapsed ? (
                    <Avatar size={32} src="/logo-small.png" />
                ) : (
                    <img src="/logo.png" alt="Logo" height={32} />
                )}
            </div>

            <div className={`px-4 py-3 border-b border-gray-100 transition-all duration-200 ${collapsed ? 'text-center' : ''}`}>
                <Space direction={collapsed ? 'vertical' : 'horizontal'} size={12} align="center">
                    <Avatar 
                        icon={<UserOutlined />}
                        style={{
                            backgroundColor: token.colorPrimary,
                            boxShadow: `0 2px 8px ${token.colorPrimary}40`
                        }}
                    />
                    {!collapsed && (
                        <div>
                            <div className="font-medium text-gray-800">{userInfo?.full_name}</div>
                            <div className="text-xs text-gray-500">{userInfo?.commune}</div>
                        </div>
                    )}
                </Space>
            </div>

            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                className="flex-1 border-0 py-2"
                style={{
                    backgroundColor: 'transparent'
                }}
            />
        </div>
    );
};

export default EmployeeSidebar; 