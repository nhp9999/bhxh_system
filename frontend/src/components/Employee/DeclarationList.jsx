import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, message, Modal, Descriptions, Popconfirm } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PlusOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api';

const DeclarationList = () => {
    const [loading, setLoading] = useState(false);
    const [declarations, setDeclarations] = useState([]);
    const [deleteLoading, setDeleteLoading] = useState({});
    const navigate = useNavigate();
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const { batchId } = useParams();

    const fetchDeclarations = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/declarations/batch/${batchId}`);
            setDeclarations(response.data);
        } catch (error) {
            console.error('Không thể tải danh sách kê khai:', error);
            message.error('Không thể tải danh sách kê khai');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (batchId) {
            fetchDeclarations();
        }
    }, [batchId]);

    const handleSoftDelete = async (record) => {
        try {
            setDeleteLoading(prev => ({ ...prev, [record.id]: true }));
            // Gọi API để soft delete bản ghi
            await api.delete(`/declarations/employee/${record.id}/soft-delete`);
            message.success('Xóa bản ghi thành công');
            // Cập nhật lại danh sách sau khi soft delete
            fetchDeclarations();
        } catch (error) {
            console.error('Không thể xóa bản ghi:', error);
            message.error('Không thể xóa bản ghi');
        } finally {
            setDeleteLoading(prev => ({ ...prev, [record.id]: false }));
        }
    };

    const showDetailModal = async (record) => {
        try {
            const response = await api.get(`/declarations/employee/${record.id}`);
            setSelectedDeclaration(response.data);
            setDetailModalVisible(true);
        } catch (error) {
            console.error('Không thể tải chi tiết kê khai:', error);
            message.error('Không thể tải chi tiết kê khai');
        }
    };

    const columns = [
        {
            title: 'Mã kê khai',
            dataIndex: 'display_code',
            key: 'display_code',
            width: 150,
        },
        {
            title: 'Mã BHXH',
            dataIndex: 'bhxh_code',
            key: 'bhxh_code',
            width: 120,
        },
        {
            title: 'Họ tên',
            dataIndex: 'full_name',
            key: 'full_name',
            width: 200,
        },
        {
            title: 'CCCD',
            dataIndex: 'cccd',
            key: 'cccd',
            width: 150,
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone_number',
            key: 'phone_number',
            width: 120,
        },
        {
            title: 'Phương án',
            dataIndex: 'plan',
            key: 'plan',
            width: 100,
            render: (plan) => plan === 'TM' ? 'Thu mới' : 'Ốm nặng'
        },
        {
            title: 'Số tháng',
            dataIndex: 'months',
            key: 'months',
            width: 100,
            render: (months) => `${months} tháng`
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                let color = 'default';
                let text = 'Nháp';

                switch (status) {
                    case 'submitted':
                        color = 'processing';
                        text = 'Đã nộp';
                        break;
                    case 'approved':
                        color = 'success';
                        text = 'Đã duyệt';
                        break;
                    case 'rejected':
                        color = 'error';
                        text = 'Từ chối';
                        break;
                    default:
                        break;
                }

                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button 
                        type="link" 
                        onClick={() => showDetailModal(record)}
                    >
                        Xem chi tiết
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa bản ghi này?"
                        description="Bản ghi sẽ bị xóa khỏi đợt kê khai này"
                        onConfirm={() => handleSoftDelete(record)}
                        okText="Đồng ý"
                        cancelText="Hủy"
                    >
                        <Button 
                            type="link" 
                            danger
                            loading={deleteLoading[record.id]}
                            icon={<DeleteOutlined />}
                        >
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card 
                title="Danh sách kê khai" 
                extra={
                    <Space>
                        <Button
                            icon={<HistoryOutlined />}
                            onClick={() => navigate('/employee/declarations/history')}
                        >
                            Tra cứu lịch sử
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/employee/declarations/create/batch')}
                        >
                            Tạo kê khai mới
                        </Button>
                    </Space>
                }
            >
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
                        pageSizeOptions: ['10', '20', '50', '100']
                    }}
                />
            </Card>

            <Modal
                title="Chi tiết kê khai"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedDeclaration && (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Mã kê khai">
                            {selectedDeclaration.display_code}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={
                                selectedDeclaration.status === 'approved' ? 'success' :
                                selectedDeclaration.status === 'submitted' ? 'processing' :
                                selectedDeclaration.status === 'rejected' ? 'error' : 'default'
                            }>
                                {selectedDeclaration.status === 'approved' ? 'Đã duyệt' :
                                 selectedDeclaration.status === 'submitted' ? 'Đã nộp' :
                                 selectedDeclaration.status === 'rejected' ? 'Từ chối' : 'Nháp'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Họ và tên">
                            {selectedDeclaration.full_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã BHXH">
                            {selectedDeclaration.bhxh_code}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                            {dayjs(selectedDeclaration.birth_date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới tính">
                            {selectedDeclaration.gender}
                        </Descriptions.Item>
                        <Descriptions.Item label="CCCD">
                            {selectedDeclaration.cccd}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">
                            {selectedDeclaration.phone_number}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày nhận">
                            {dayjs(selectedDeclaration.receipt_date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày hết hạn thẻ cũ">
                            {selectedDeclaration.old_card_expiry_date ? 
                             dayjs(selectedDeclaration.old_card_expiry_date).format('DD/MM/YYYY') : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày hiệu lực thẻ mới">
                            {dayjs(selectedDeclaration.new_card_effective_date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tháng">
                            {selectedDeclaration.months} tháng
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương án">
                            {selectedDeclaration.plan === 'TM' ? 'Thu mới' : 'Ốm nặng'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phường/Xã">
                            {selectedDeclaration.commune}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thôn/Xóm">
                            {selectedDeclaration.hamlet}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số người tham gia">
                            {selectedDeclaration.participant_number} người
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã bệnh viện">
                            {selectedDeclaration.hospital_code}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(selectedDeclaration.created_at).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người tạo">
                            {selectedDeclaration.created_by}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </>
    );
};

export default DeclarationList; 