import React, { useState, useEffect } from 'react';
import { Layout, Button, theme, ConfigProvider } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Outlet, useLocation } from 'react-router-dom';
import EmployeeSidebar from './EmployeeSidebar';

const { Header, Sider, Content } = Layout;

const EmployeeLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();
    const { token } = theme.useToken();

    const isDeclarationFormPage = /\/declarations\/\d+\/create/.test(location.pathname);

    useEffect(() => {
        if (isDeclarationFormPage) {
            setCollapsed(true);
        }
    }, [location.pathname, isDeclarationFormPage]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setCollapsed(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleToggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1677ff',
                    borderRadius: 6,
                },
                components: {
                    Layout: {
                        siderBg: token.colorBgContainer,
                        headerBg: token.colorBgContainer,
                    },
                    Menu: {
                        itemBg: 'transparent',
                        itemSelectedBg: token.colorPrimaryBg,
                        itemHoverBg: token.colorPrimaryBgHover,
                    }
                }
            }}
        >
            <Layout style={{ minHeight: '100vh' }}>
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    breakpoint="lg"
                    collapsedWidth={isMobile ? 0 : 80}
                    width={260}
                    style={{
                        background: token.colorBgContainer,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 1001,
                        transition: 'all 0.2s cubic-bezier(0.34, 0.69, 0.1, 1)',
                    }}
                >
                    <EmployeeSidebar 
                        collapsed={collapsed} 
                        onMenuClick={() => {
                            if (collapsed) {
                                return;
                            }
                        }} 
                    />
                </Sider>

                <Layout style={{ 
                    marginLeft: collapsed ? (isMobile ? 0 : '80px') : '260px',
                    transition: 'all 0.2s cubic-bezier(0.34, 0.69, 0.1, 1)',
                    background: '#f5f5f5'
                }}>
                    <Header style={{
                        padding: 0,
                        background: token.colorBgContainer,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1000,
                        height: 56,
                        display: 'flex',
                        alignItems: 'center',
                    }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={handleToggleSidebar}
                            style={{
                                fontSize: '16px',
                                width: 56,
                                height: 56,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                borderRadius: 0,
                            }}
                            className="hover:bg-gray-50"
                        />
                    </Header>

                    <Content style={{
                        margin: '24px',
                        minHeight: 280,
                        borderRadius: token.borderRadiusLG,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            background: token.colorBgContainer,
                            padding: 24,
                            borderRadius: token.borderRadiusLG,
                            minHeight: '100%',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                        }}>
                            <Outlet />
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

export default EmployeeLayout; 