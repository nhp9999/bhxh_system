import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, message } from 'antd';
import { FileOutlined, CheckCircleOutlined, ClockCircleOutlined, StopOutlined, TeamOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import api from '../../api';

const EmployeeDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/employee/dashboard/stats');
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                message.error('Không thể tải thống kê');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Tổng quan</h2>
            
            {/* Thống kê đợt kê khai */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Thống kê đợt kê khai</h3>
                <Row gutter={16}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng số đợt"
                                value={stats?.batches?.total || 0}
                                prefix={<FileOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đã gửi"
                                value={stats?.batches?.byStatus?.submitted || 0}
                                valueStyle={{ color: '#faad14' }}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Chờ gửi"
                                value={stats?.batches?.byStatus?.pending || 0}
                                valueStyle={{ color: '#1890ff' }}
                                prefix={<FileOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đã hoàn thành"
                                value={stats?.batches?.byStatus?.approved || 0}
                                valueStyle={{ color: '#3f8600' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Thống kê kê khai */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Thống kê hồ sơ kê khai</h3>
                <Row gutter={16}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Tổng số hồ sơ"
                                value={stats?.declarations?.total || 0}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Số người tham gia"
                                value={stats?.declarations?.total || 0}
                                prefix={<UserOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Số tiền bình quân/người"
                                value={(stats?.declarations?.totalAmount || 0) / (stats?.declarations?.total || 1)}
                                formatter={(value) => formatCurrency(value)}
                                prefix={<DollarOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Thống kê tài chính */}
            <div>
                <h3 className="text-lg font-medium mb-4">Thống kê tài chính</h3>
                <Row gutter={16}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Tổng số tiền"
                                value={stats?.declarations?.totalAmount || 0}
                                formatter={(value) => formatCurrency(value)}
                                prefix={<DollarOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Số tiền đã duyệt"
                                value={stats?.declarations?.byStatus?.approved?.amount || 0}
                                valueStyle={{ color: '#3f8600' }}
                                formatter={(value) => formatCurrency(value)}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Số tiền chờ duyệt"
                                value={stats?.declarations?.byStatus?.submitted?.amount || 0}
                                valueStyle={{ color: '#faad14' }}
                                formatter={(value) => formatCurrency(value)}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default EmployeeDashboard; 