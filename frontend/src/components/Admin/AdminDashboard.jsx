import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography } from 'antd';
import { FileOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await api.get('/admin/dashboard/stats');
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Title level={3}>Tổng quan</Title>

            <Row gutter={[16, 16]}>
                {/* Thống kê đợt kê khai */}
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng số đợt kê khai"
                            value={stats?.batches?.total || 0}
                            prefix={<FileOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Đã duyệt"
                            value={stats?.batches?.byStatus?.approved || 0}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Chờ duyệt"
                            value={stats?.batches?.byStatus?.submitted || 0}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Từ chối"
                            value={stats?.batches?.byStatus?.rejected || 0}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<CloseCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {/* Thống kê bản ghi kê khai */}
                <Col xs={24} sm={12} lg={8}>
                    <Card title="Thống kê bản ghi">
                        <Statistic
                            title="Tổng số bản ghi"
                            value={stats?.declarations?.total || 0}
                        />
                        <Statistic
                            title="Tổng số tiền"
                            value={(stats?.declarations?.totalAmount || 0).toLocaleString('vi-VN')}
                            suffix="đ"
                            className="mt-4"
                        />
                    </Card>
                </Col>

                {/* Thống kê theo loại đối tượng */}
                <Col xs={24} sm={12} lg={8}>
                    <Card title="Theo loại đối tượng">
                        <div className="space-y-4">
                            <Statistic
                                title="Hộ gia đình"
                                value={stats?.objectTypes?.HGD || 0}
                            />
                            <Statistic
                                title="Dân tộc thiểu số"
                                value={stats?.objectTypes?.DTTS || 0}
                            />
                            <Statistic
                                title="Nông lâm ngư nghiệp"
                                value={stats?.objectTypes?.NLNN || 0}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Thống kê theo phòng ban */}
                <Col xs={24} lg={8}>
                    <Card title="Theo phòng ban" className="h-full">
                        <div className="space-y-4">
                            {Object.entries(stats?.departments || {}).map(([dept, count]) => (
                                <Statistic
                                    key={dept}
                                    title={dept}
                                    value={count}
                                />
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard; 