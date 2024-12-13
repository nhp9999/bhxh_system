import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import EmployeeSidebar from './EmployeeSidebar';

const { Content } = Layout;

const EmployeeLayout = () => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <EmployeeSidebar />
            <Layout style={{ marginLeft: 250 }}>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default EmployeeLayout; 