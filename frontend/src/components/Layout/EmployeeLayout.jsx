import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MenuFoldOutlined, MenuUnfoldOutlined, UnorderedListOutlined, HistoryOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const EmployeeLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const items = [
        {
            key: '/employee/declarations',
            icon: <UnorderedListOutlined />,
            label: 'Danh sách đợt kê khai'
        },
        {
            key: '/employee/declarations/history',
            icon: <HistoryOutlined />,
            label: 'Tra cứu lịch sử'
        }
    ];

    const handleMenuClick = (item) => {
        navigate(item.key);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={[location.pathname]}
                    items={items}
                    onClick={handleMenuClick}
                />
            </Sider>
            <Layout>
                <Header
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default EmployeeLayout; 