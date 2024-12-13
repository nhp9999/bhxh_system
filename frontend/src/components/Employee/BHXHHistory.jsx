import React, { useState } from 'react';
import { Card, Input, Button, Table, Tag, Timeline, Modal, Descriptions, message, Spin } from 'antd';
import { SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api';

const BHXHHistory = () => {
    const [loading, setLoading] = useState(false);
    const [bhxhCode, setBhxhCode] = useState('');
    const [history, setHistory] = useState([]);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const handleSearch = async () => {
        if (!bhxhCode) {
            message.warning('Vui lòng nhập mã BHXH cần tra cứu');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/declarations/history/${bhxhCode}`);
            setHistory(response.data.data);
            message.success(response.data.message);
        } catch (error) {
            console.error('Không thể tra cứu lịch sử:', error);
            message.error(error.response?.data?.message || 'Không thể tra cứu lịch sử');
        } finally {
            setLoading(false);
        }
    };

    const showDetail = (record) => {
        setSelectedRecord(record);
        setDetailModalVisible(true);
    };

    const columns = [
        {
            title: 'Mã kê khai',
            dataIndex: 'display_code',
            key: 'display_code',
            width: 150,
        },
        {
            title: 'Đợt kê khai',
            dataIndex: ['batch_info', 'name'],
            key: 'batch_name',
            width: 200,
        },
        {
            title: 'Thời gian',
            key: 'time',
            width: 120,
            render: (_, record) => (
                `${record.batch_info.month}/${record.batch_info.year}`
            ),
        },
        {
            title: 'Đối tượng',
            dataIndex: ['batch_info', 'object_type'],
            key: 'object_type',
            width: 120,
        },
        {
            title: 'Phương án',
            dataIndex: ['declaration_info', 'plan'],
            key: 'plan',
            width: 100,
            render: (plan) => plan === 'TM' ? 'Thu mới' : 'Ốm nặng'
        },
        {
            title: 'Số tháng',
            dataIndex: ['declaration_info', 'months'],
            key: 'months',
            width: 100,
            render: (months) => `${months} tháng`
        },
        {
            title: 'Trạng thái',
            dataIndex: ['batch_info', 'status'],
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
                    case 'processing':
                        color = 'warning';
                        text = 'Đang xử lý';
                        break;
                    case 'completed':
                        color = 'success';
                        text = 'Hoàn thành';
                        break;
                    default:
                        break;
                }

                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Thanh toán',
            dataIndex: ['batch_info', 'payment_status'],
            key: 'payment_status',
            width: 120,
            render: (status) => (
                <Tag color={status === 'paid' ? 'success' : 'default'}>
                    {status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Button type="link" onClick={() => showDetail(record)}>
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card title="Tra cứu lịch sử kê khai BHXH">
                <div style={{ marginBottom: 20, display: 'flex', gap: 16 }}>
                    <Input
                        placeholder="Nhập mã BHXH cần tra cứu"
                        value={bhxhCode}
                        onChange={(e) => setBhxhCode(e.target.value)}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined />}
                        onPressEnter={handleSearch}
                    />
                    <Button 
                        type="primary" 
                        onClick={handleSearch}
                        loading={loading}
                        icon={<HistoryOutlined />}
                    >
                        Tra cứu
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={history}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1500 }}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng số ${total} lần kê khai`,
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
                {selectedRecord && (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Mã kê khai" span={2}>
                            {selectedRecord.display_code}
                        </Descriptions.Item>
                        <Descriptions.Item label="Đợt kê khai" span={2}>
                            {selectedRecord.batch_info.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={
                                selectedRecord.batch_info.status === 'approved' ? 'success' :
                                selectedRecord.batch_info.status === 'submitted' ? 'processing' :
                                selectedRecord.batch_info.status === 'rejected' ? 'error' : 'default'
                            }>
                                {selectedRecord.batch_info.status === 'approved' ? 'Đã duyệt' :
                                 selectedRecord.batch_info.status === 'submitted' ? 'Đã nộp' :
                                 selectedRecord.batch_info.status === 'rejected' ? 'Từ chối' : 'Nháp'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thanh toán">
                            <Tag color={selectedRecord.batch_info.payment_status === 'paid' ? 'success' : 'default'}>
                                {selectedRecord.batch_info.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Họ và tên">
                            {selectedRecord.personal_info.full_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                            {dayjs(selectedRecord.personal_info.birth_date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới tính">
                            {selectedRecord.personal_info.gender}
                        </Descriptions.Item>
                        <Descriptions.Item label="CCCD">
                            {selectedRecord.personal_info.cccd}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">
                            {selectedRecord.personal_info.phone_number}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tháng">
                            {selectedRecord.declaration_info.months} tháng
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương án">
                            {selectedRecord.declaration_info.plan === 'TM' ? 'Thu mới' : 'Ốm nặng'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số người tham gia">
                            {selectedRecord.declaration_info.participant_number} người
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền">
                            {selectedRecord.declaration_info.actual_amount.toLocaleString()} đồng
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày biên lai">
                            {dayjs(selectedRecord.declaration_info.receipt_date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số biên lai">
                            {selectedRecord.declaration_info.receipt_number}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày hết hạn thẻ cũ">
                            {selectedRecord.declaration_info.old_card_expiry_date ? 
                             dayjs(selectedRecord.declaration_info.old_card_expiry_date).format('DD/MM/YYYY') : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày hiệu lực thẻ mới">
                            {dayjs(selectedRecord.declaration_info.new_card_effective_date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phường/Xã">
                            {selectedRecord.address.commune}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thôn/Xóm">
                            {selectedRecord.address.hamlet}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã bệnh viện">
                            {selectedRecord.hospital_code}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(selectedRecord.created_at).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default BHXHHistory; 