import React from 'react';
import { DashboardOutlined, FileOutlined, TeamOutlined } from '@ant-design/icons';
import AdminDashboard from '../components/Admin/AdminDashboard';
import BatchList from '../components/Admin/BatchList';
import BatchDetail from '../components/Admin/BatchDetail';
import UserManagement from '../components/Admin/UserManagement';

// Định nghĩa tất cả các route admin
export const adminRoutes = [
    {
        path: 'dashboard',
        element: <AdminDashboard />,
    },
    {
        path: 'declarations',
        element: <BatchList />,
    },
    {
        path: 'declarations/batch/:id',
        element: <BatchDetail />,
    },
    {
        path: 'users',
        element: <UserManagement />,
    }
];

// Menu items cho sidebar
export const adminMenuItems = [
    {
        key: '/admin/dashboard',
        icon: <DashboardOutlined />,
        label: 'Tổng quan',
    },
    {
        key: '/admin/declarations',
        icon: <FileOutlined />,
        label: 'Quản lý kê khai',
    },
    {
        key: '/admin/users',
        icon: <TeamOutlined />,
        label: 'Quản lý người dùng',
    }
]; 