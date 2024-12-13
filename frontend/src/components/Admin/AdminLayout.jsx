import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const { Content } = Layout;

const AdminLayout = () => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AdminSidebar />
            <Layout style={{ marginLeft: 250 }}>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout; 