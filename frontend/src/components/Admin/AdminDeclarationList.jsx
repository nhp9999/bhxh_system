import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../api';

const AdminDeclarationList = () => {
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch danh sách kê khai
    const fetchDeclarations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/declarations/pending');
            console.log('Danh sách kê khai:', response.data);
            setDeclarations(response.data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách:', error);
            message.error('Không thể tải danh sách kê khai');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeclarations();
    }, []);

    // Xử lý duyệt kê khai
    const handleApprove = async (id) => {
        try {
            await api.post(`/declarations/${id}/approve`);
            message.success('Duyệt kê khai thành công');
            fetchDeclarations();
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt kê khai');
        }
    };

    // Xử lý từ chối kê khai
    const handleReject = async (id) => {
        Modal.confirm({
            title: 'Từ chối kê khai',
            content: 'Bạn có chắc chắn muốn từ chối kê khai này?',
            okText: 'Từ chối',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await api.post(`/declarations/${id}/reject`);
                    message.success('Từ chối kê khai thành công');
                    fetchDeclarations();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối kê khai');
                }
            }
        });
    };

    const columns = [
        {
            title: 'Mã kê khai',
            dataIndex: 'display_code',
            key: 'display_code',
            width: 150,
        },
        {
            title: 'Nhân viên',
            dataIndex: 'user',
            key: 'user',
            width: 200,
            render: (_, record) => (
                <div>
                    <div>{record.full_name}</div>
                    <small style={{ color: '#666' }}>{record.username}</small>
                </div>
            ),
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department_code',
            key: 'department_code',
            width: 120,
            render: (code) => code || '-',
        },
        {
            title: 'Mã BHXH',
            dataIndex: 'bhxh_code',
            key: 'bhxh_code',
            width: 120,
        },
        {
            title: 'Loại đối tượng',
            dataIndex: 'object_type',
            key: 'object_type',
            width: 120,
            render: (type) => {
                const types = {
                    'HGD': 'Hộ gia đình',
                    'DTTS': 'Dân tộc thiểu số',
                    'NLNN': 'Nông lâm ngư nghiệp'
                };
                return types[type] || type;
            },
        },
        {
            title: 'Số tháng',
            dataIndex: 'months',
            key: 'months',
            width: 100,
            render: (months) => `${months} tháng`,
        },
        {
            title: 'Hình thức',
            dataIndex: 'plan',
            key: 'plan',
            width: 100,
            render: (plan) => plan === 'TM' ? 'Trả một lần' : 'Online',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const statusConfig = {
                    'pending': { color: 'gold', text: 'Chờ duyệt' },
                    'approved': { color: 'green', text: 'Đã duyệt' },
                    'rejected': { color: 'red', text: 'Từ chối' }
                };
                const config = statusConfig[status] || { color: 'default', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date) => new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            fixed: 'right',
            width: 200,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleApprove(record.id)}
                        disabled={record.status !== 'pending'}
                    >
                        Duyệt
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleReject(record.id)}
                        disabled={record.status !== 'pending'}
                    >
                        Từ chối
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Danh sách kê khai chờ duyệt</h2>
            <Table
                columns={columns}
                dataSource={declarations}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1500 }}
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng số ${total} kê khai`,
                }}
            />
        </div>
    );
};

export default AdminDeclarationList; 