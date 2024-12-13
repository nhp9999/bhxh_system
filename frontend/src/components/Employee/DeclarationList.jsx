import React, { useState, useEffect } from 'react';
import { 
    Table, 
    Button, 
    Space, 
    Tag, 
    Modal, 
    message, 
    Card, 
    Typography, 
    Input, 
    Row, 
    Col,
    Tooltip,
    Badge,
    Statistic,
    theme
} from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    SearchOutlined,
    FileExcelOutlined,
    PlusOutlined,
    FilterOutlined,
    SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api';

const { Title, Text } = Typography;
const { Search } = Input;
const { useToken } = theme;

const DeclarationList = () => {
    const navigate = useNavigate();
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [statistics, setStatistics] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0,
        approvedAmount: 0
    });
    const { token } = useToken();

    useEffect(() => {
        fetchDeclarations();
        fetchStatistics();
    }, []);

    const fetchDeclarations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/declarations/employee/declarations');
            if (response.data.success) {
                setDeclarations(response.data.data);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách kê khai');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/declarations/employee/statistics');
            if (response.data.success) {
                setStatistics(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải thống kê:', error);
        }
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa kê khai này?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { 
                danger: true,
                icon: <DeleteOutlined />
            },
            onOk: async () => {
                try {
                    const response = await api.delete(\`/declarations/employee/declaration/\${record.id}\`);
                    if (response.data.success) {
                        message.success('Xóa kê khai thành công');
                        fetchDeclarations();
                        fetchStatistics();
                    }
                } catch (error) {
                    message.error('Lỗi khi xóa kê khai');
                }
            }
        });
    };

    const handleEdit = (record) => {
        navigate(\`/employee/declarations/edit/\${record.id}\`);
    };

    const showDetailModal = (record) => {
        setSelectedDeclaration(record);
        setIsDetailModalVisible(true);
    };

    const getStatusTag = (status) => {
        const statusConfig = {
            pending: { color: 'gold', text: 'Chờ duyệt' },
            approved: { color: 'success', text: 'Đã duyệt' },
            rejected: { color: 'error', text: 'Từ chối' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const columns = [
        {
            title: 'Mã BHXH',
            dataIndex: 'bhxh_code',
            key: 'bhxh_code',
            width: 120,
            fixed: 'left',
            render: (text) => <Text copyable>{text}</Text>
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            width: 180,
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'CCCD',
            dataIndex: 'cccd',
            key: 'cccd',
            width: 140,
            render: (text) => <Text copyable>{text}</Text>
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'birth_date',
            key: 'birth_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Số người tham gia',
            dataIndex: 'participant_number',
            key: 'participant_number',
            width: 150,
            render: (number) => (
                <Badge 
                    count={number} 
                    style={{ 
                        backgroundColor: token.colorPrimary,
                        fontWeight: 'bold'
                    }} 
                />
            )
        },
        {
            title: 'Số tiền',
            dataIndex: 'actual_amount',
            key: 'actual_amount',
            width: 150,
            render: (amount) => (
                <Text strong style={{ color: token.colorSuccess }}>
                    {amount?.toLocaleString()}đ
                </Text>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: getStatusTag
        },
        {
            title: 'Thao tác',
            key: 'action',
            fixed: 'right',
            width: 180,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => showDetailModal(record)}
                        />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="Chỉnh sửa">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(record)}
                                />
                            </Tooltip>
                            <Tooltip title="Xóa">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(record)}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Thống kê */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Tổng số kê khai"
                            value={statistics.total}
                            prefix={<FileExcelOutlined />}
                            valueStyle={{ color: token.colorPrimary }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Chờ duyệt"
                            value={statistics.pending}
                            prefix={<SyncOutlined spin />}
                            valueStyle={{ color: token.colorWarning }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Đã duyệt"
                            value={statistics.approved}
                            valueStyle={{ color: token.colorSuccess }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Tổng số tiền"
                            value={statistics.totalAmount}
                            suffix="đ"
                            precision={0}
                            valueStyle={{ color: token.colorSuccess }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Thanh công cụ */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col flex="auto">
                    <Space size="middle">
                        <Search
                            placeholder="Tìm kiếm theo mã BHXH, CCCD, họ tên..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            style={{ width: 300 }}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        <Tooltip title="Lọc nâng cao">
                            <Button icon={<FilterOutlined />}>Lọc</Button>
                        </Tooltip>
                    </Space>
                </Col>
                <Col>
                    <Space>
                        <Button 
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/employee/declarations/create/batch')}
                        >
                            Tạo đợt kê khai
                        </Button>
                        <Tooltip title="Làm mới dữ liệu">
                            <Button 
                                icon={<SyncOutlined />} 
                                onClick={() => {
                                    fetchDeclarations();
                                    fetchStatistics();
                                }}
                            />
                        </Tooltip>
                    </Space>
                </Col>
            </Row>

            {/* Bảng dữ liệu */}
            <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={declarations.filter(item =>
                        Object.values(item).some(val =>
                            String(val).toLowerCase().includes(searchText.toLowerCase())
                        )
                    )}
                    loading={loading}
                    scroll={{ x: 1500 }}
                    rowKey="id"
                    pagination={{
                        total: declarations.length,
                        pageSize: 10,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} kê khai`,
                        showSizeChanger: true,
                        showQuickJumper: true
                    }}
                />
            </Card>

            {/* Modal chi tiết */}
            <Modal
                title={<Title level={4}>Chi tiết kê khai</Title>}
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedDeclaration && (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Mã BHXH" span={2}>
                            <Text copyable>{selectedDeclaration.bhxh_code}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Họ và tên">
                            {selectedDeclaration.full_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="CCCD">
                            <Text copyable>{selectedDeclaration.cccd}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                            {dayjs(selectedDeclaration.birth_date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới tính">
                            {selectedDeclaration.gender}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">
                            {selectedDeclaration.phone_number}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số người tham gia">
                            {selectedDeclaration.participant_number} người
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền">
                            <Text strong style={{ color: token.colorSuccess }}>
                                {selectedDeclaration.actual_amount?.toLocaleString()}đ
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {getStatusTag(selectedDeclaration.status)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(selectedDeclaration.created_at).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default DeclarationList; 