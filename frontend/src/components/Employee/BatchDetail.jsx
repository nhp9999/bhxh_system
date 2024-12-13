import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, message, Spin, Typography, Tag, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;

// Danh sách đối tượng kê khai
const OBJECT_TYPES = {
    'HGD': 'Hộ gia đình',
    'DTTS': 'Dân tộc thiểu số',
    'NLNN': 'Nông lâm ngư nghiệp'
};

// Mapping trạng thái
const STATUS_MAP = {
    pending: { text: 'Chờ xử lý', color: 'processing' },
    submitted: { text: 'Đã nộp', color: 'warning' },
    approved: { text: 'Đã duyệt', color: 'success' },
    rejected: { text: 'Từ chối', color: 'error' }
};

const BatchDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState(null);

    useEffect(() => {
        const fetchBatchDetails = async () => {
            try {
                const response = await api.get(`/declarations/employee/batch/${id}`);
                setBatch(response.data);
            } catch (error) {
                console.error('Error fetching batch:', error);
                message.error('Không thể tải thông tin đợt kê khai');
                navigate('/employee/declarations/create/batch');
            } finally {
                setLoading(false);
            }
        };

        fetchBatchDetails();
    }, [id, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <Card 
            style={{ 
                maxWidth: 800, 
                margin: '24px auto',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
        >
            <Spin spinning={loading}>
                <div style={{ 
                    marginBottom: 24, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center' 
                }}>
                    <Title level={3} style={{ margin: 0 }}>Chi tiết đợt kê khai</Title>
                    <Space>
                        {batch?.status === 'pending' && (
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/employee/declarations/edit/batch/${id}`)}
                            >
                                Chỉnh sửa
                            </Button>
                        )}
                        <Button 
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/employee/declarations/create/batch')}
                        >
                            Quay lại
                        </Button>
                    </Space>
                </div>

                {batch && (
                    <Descriptions
                        bordered
                        column={1}
                        size="middle"
                        labelStyle={{ width: '200px', fontWeight: 500 }}
                    >
                        <Descriptions.Item label="Tên đợt">
                            {batch.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tháng/Năm">
                            {batch.month}/{batch.year}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số đợt">
                            {batch.batch_number}
                        </Descriptions.Item>
                        <Descriptions.Item label="Đối tượng">
                            {OBJECT_TYPES[batch.object_type] || batch.object_type}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={STATUS_MAP[batch.status]?.color || 'default'}>
                                {STATUS_MAP[batch.status]?.text || batch.status}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số lượng kê khai">
                            <Tag color="blue">{batch.total_declarations || 0}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">
                            {batch.notes || <span style={{ color: '#999', fontStyle: 'italic' }}>Không có ghi chú</span>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {formatDate(batch.created_at)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cập nhật lần cuối">
                            {formatDate(batch.updated_at)}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Spin>
        </Card>
    );
};

export default BatchDetail; 