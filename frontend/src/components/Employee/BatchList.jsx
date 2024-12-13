import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Popconfirm, Input, Row, Col, Card, Tooltip, Select, Statistic, message, Modal, Skeleton } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, SendOutlined, QrcodeOutlined, PlusOutlined, FilterOutlined, SearchOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import dayjs from 'dayjs';
import PaymentQR from './PaymentQR';

const { Option } = Select;

const BatchList = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        object_type: 'all',
        payment_status: 'all',
        month: dayjs().format('M'),
        year: dayjs().format('YYYY'),
        service_type: 'all'
    });
    const [searchText, setSearchText] = useState('');
    const [showPaymentQR, setShowPaymentQR] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();
    const [submitModalVisible, setSubmitModalVisible] = useState(false);
    const [selectedBatchForSubmit, setSelectedBatchForSubmit] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch user info
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await api.get('/auth/me');
                setUserInfo(response.data);
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };
        fetchUserInfo();
    }, []);

    // Fetch batches
    const fetchBatches = async () => {
        setLoading(true);
        try {
            const response = await api.get('/declarations/employee/batches');
            setBatches(response.data);
        } catch (error) {
            console.error('Error fetching batches:', error);
            message.error('Không thể tải danh sách đợt kê khai');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    // Handle QR code display
    const handleShowQR = (record) => {
        setSelectedBatch(record);
        setShowPaymentQR(true);
    };

    // Handle delete batch
    const handleDelete = async (id) => {
        try {
            const response = await api.delete(`/declarations/employee/batch/${id}`);
            if (response.data.success) {
                message.success('Xóa đợt kê khai thành công');
                fetchBatches();
            }
        } catch (error) {
            console.error('Delete error:', error);
            message.error('Không thể xóa đợt kê khai');
        }
    };

    // Thống kê số lượng theo trạng thái
    const stats = {
        total: batches.length,
        pending: batches.filter(b => b.status === 'pending').length,
        approved: batches.filter(b => b.status === 'approved').length,
        paid: batches.filter(b => b.payment_status === 'paid').length,
        unpaid: batches.filter(b => b.payment_status === 'unpaid').length
    };

    // Hàm lấy màu và icon cho trạng thái
    const getStatusConfig = (status, type = 'status') => {
        const config = {
            status: {
                pending: { color: 'blue', icon: <ClockCircleOutlined />, text: 'Chờ xử lý' },
                approved: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã duyệt' },
                rejected: { color: 'red', icon: <ExclamationCircleOutlined />, text: 'Đã từ chối' }
            },
            payment: {
                unpaid: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Chưa thanh toán' },
                paid: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã thanh toán' }
            }
        };
        return config[type][status] || { color: 'default', icon: null, text: status };
    };

    // Hàm render trạng thái với icon
    const renderStatus = (status, type = 'status') => {
        const { color, icon, text } = getStatusConfig(status, type);
        return (
            <Tag color={color} icon={icon}>
                {text}
            </Tag>
        );
    };

    // Handle submit batch
    const showSubmitModal = (record) => {
        setSelectedBatchForSubmit(record);
        setSubmitModalVisible(true);
    };

    const handleSubmitBatch = async () => {
        if (!selectedBatchForSubmit) return;

        setSubmitting(true);
        try {
            const response = await api.post(`/declarations/employee/batch/${selectedBatchForSubmit.id}/submit`);
            if (response.data.success) {
                message.success('Gửi đợt kê khai thành công');
                setSubmitModalVisible(false);
                setSelectedBatchForSubmit(null);
                fetchBatches();
            }
        } catch (error) {
            console.error('Submit error:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đợt kê khai');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRowClick = (record) => {
        navigate(`/employee/declarations/${record.id}/create`);
    };

    const renderActionButtons = (record) => {
        return (
            <Space onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Xem chi tiết">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/employee/declarations/batch/${record.id}`)}
                    />
                </Tooltip>
                {record.status === 'pending' && (
                    <>
                        {record.total_declarations > 0 && (
                            <Tooltip title="Gửi đợt kê khai">
                                <Button
                                    type="text"
                                    icon={<SendOutlined />}
                                    onClick={() => showSubmitModal(record)}
                                    className="text-blue-600 hover:text-blue-700"
                                />
                            </Tooltip>
                        )}
                        <Tooltip title="Chỉnh sửa">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/employee/declarations/batch/${record.id}/edit`)}
                            />
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <Popconfirm
                                title="Xóa đợt kê khai"
                                description="Bạn có chắc chắn muốn xóa đợt kê khai này?"
                                onConfirm={() => handleDelete(record.id)}
                                okText="Xóa"
                                cancelText="Hủy"
                                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        </Tooltip>
                    </>
                )}
                {record.status === 'approved' && record.payment_status === 'unpaid' && (
                    <Tooltip title="Mã QR">
                        <Button
                            type="text"
                            icon={<QrcodeOutlined />}
                            onClick={() => handleShowQR(record)}
                            className="text-green-600 hover:text-green-700"
                        />
                    </Tooltip>
                )}
            </Space>
        );
    };

    const columns = [
        {
            title: 'Thông tin đợt',
            children: [
                {
                    title: 'Tên đợt',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text, record) => {
                        // Kiểm tra nếu tên đợt đã chứa thông tin tháng/năm thì không hiển thị lại
                        const batchInfo = `Đợt ${record.batch_number} tháng ${record.month}/${record.year}`;
                        const displayName = text.includes(batchInfo) ? text : batchInfo;
                        
                        return (
                            <span className="font-medium">{displayName}</span>
                        );
                    }
                },
                {
                    title: 'Mã hồ sơ',
                    dataIndex: 'file_code',
                    key: 'file_code',
                    width: 150,
                    render: (code) => code ? (
                        <Tag color="blue">{code}</Tag>
                    ) : (
                        <span className="text-gray-400">Chưa có</span>
                    )
                },
                {
                    title: 'Đối tượng',
                    dataIndex: 'object_type',
                    key: 'object_type',
                    width: '15%',
                    render: (type) => {
                        const types = {
                            'HGD': { text: 'Hộ gia đình', color: 'blue' },
                            'DTTS': { text: 'Dân tộc thiểu số', color: 'purple' },
                            'NLNN': { text: 'Nông lâm ngư nghiệp', color: 'green' }
                        };
                        const { text, color } = types[type] || { text: type, color: 'default' };
                        return <Tag color={color}>{text}</Tag>;
                    }
                },
                {
                    title: 'Loại dịch vụ',
                    dataIndex: 'service_type',
                    key: 'service_type',
                    width: '15%',
                    render: (type) => {
                        const types = {
                            'BHYT': { text: 'Bảo hiểm y tế', color: 'cyan' },
                            'BHXH': { text: 'Bảo hiểm xã hội', color: 'magenta' },
                            'BHTN': { text: 'Bảo hiểm thất nghiệp', color: 'orange' }
                        };
                        const { text, color } = types[type] || { text: type, color: 'default' };
                        return <Tag color={color}>{text}</Tag>;
                    }
                }
            ]
        },
        {
            title: 'Trạng thái',
            children: [
                {
                    title: 'Kê khai',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => renderStatus(status, 'status')
                },
                {
                    title: 'Thanh toán',
                    dataIndex: 'payment_status',
                    key: 'payment_status',
                    render: (status) => renderStatus(status, 'payment')
                }
            ]
        },
        {
            title: 'Số liệu',
            children: [
                {
                    title: 'Số lượng',
                    dataIndex: 'total_declarations',
                    key: 'total_declarations',
                    align: 'center'
                },
                {
                    title: 'Số tiền cần đợng',
                    dataIndex: 'payment_amount',
                    key: 'payment_amount',
                    align: 'right',
                    render: (amount) => new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(amount)
                }
            ]
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '15%',
            align: 'center',
            fixed: 'right',
            render: renderActionButtons
        }
    ];

    // Hàm xử lý filter và search
    const handleFilterChange = (value, type) => {
        setFilters(prev => ({ ...prev, [type]: value }));
    };

    // Lấy danh sách tháng và năm unique từ batches
    const months = [...new Set(batches.map(batch => batch.month))].sort((a, b) => a - b);
    const years = [...new Set(batches.map(batch => batch.year))].sort((a, b) => b - a);

    const filteredBatches = batches.filter(batch => {
        const searchTextLower = searchText.toLowerCase().trim();
        
        // Tìm kiếm trong thông tin đợt
        const batchMatch = 
            batch.name?.toLowerCase().includes(searchTextLower) ||
            batch.batch_number?.toString().includes(searchTextLower);
            
        // Tìm kiếm trong declarations
        const declarationsMatch = batch.declarations?.some(declaration => 
            declaration.full_name?.toLowerCase().includes(searchTextLower) ||
            declaration.bhxh_code?.toLowerCase().includes(searchTextLower) ||
            declaration.cccd?.toLowerCase().includes(searchTextLower)
        );
        
        return (
            // Điều kiện filter
            (filters.status === 'all' || batch.status === filters.status) &&
            (filters.object_type === 'all' || batch.object_type === filters.object_type) &&
            (filters.payment_status === 'all' || batch.payment_status === filters.payment_status) &&
            (filters.month === 'all' || batch.month === parseInt(filters.month)) &&
            (filters.year === 'all' || batch.year === parseInt(filters.year)) &&
            (filters.service_type === 'all' || batch.service_type === filters.service_type) &&
            // Điều kiện search
            (searchTextLower === '' || batchMatch || declarationsMatch)
        );
    });

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <Row justify="space-between" align="middle">
                    <Col>
                        <h1 className="text-2xl font-semibold">Danh sách đợt kê khai</h1>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/employee/declarations/create/batch/new')}
                        >
                            Tạo đợt kê khai mới
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Thống kê */}
            <Row gutter={16} className="mb-6">
                <Col span={4}>
                    <Card>
                        <Statistic title="Tổng số đợt" value={stats.total} />
                    </Card>
                </Col>
                <Col span={5}>
                    <Card>
                        <Statistic 
                            title="Chờ xử lý" 
                            value={stats.pending}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={5}>
                    <Card>
                        <Statistic 
                            title="Đã duyệt" 
                            value={stats.approved}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={5}>
                    <Card>
                        <Statistic 
                            title="Chưa thanh toán" 
                            value={stats.unpaid}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={5}>
                    <Card>
                        <Statistic 
                            title="Đã thanh toán" 
                            value={stats.paid}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Bộ lọc */}
            <Card className="mb-6">
                <Row gutter={16} align="middle">
                    <Col span={6}>
                        <Input.Search
                            placeholder="Tìm kiếm theo tên đợt, số đợt..."
                            allowClear
                            enterButton
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col span={3}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Tháng"
                            value={filters.month}
                            onChange={value => handleFilterChange(value, 'month')}
                        >
                            <Option value="all">Tất cả tháng</Option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <Option key={month} value={month.toString()}>Tháng {month}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span={3}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Năm"
                            value={filters.year}
                            onChange={value => handleFilterChange(value, 'year')}
                        >
                            <Option value="all">Tất cả năm</Option>
                            {Array.from({ length: 5 }, (_, i) => dayjs().year() - i).map(year => (
                                <Option key={year} value={year.toString()}>{year}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span={4}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Trạng thái"
                            value={filters.status}
                            onChange={value => handleFilterChange(value, 'status')}
                        >
                            <Option value="all">Tất cả trạng thái</Option>
                            <Option value="pending">Chờ xử lý</Option>
                            <Option value="approved">Đã duyệt</Option>
                            <Option value="rejected">Đã từ chối</Option>
                        </Select>
                    </Col>
                    <Col span={4}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Đối tượng"
                            value={filters.object_type}
                            onChange={value => handleFilterChange(value, 'object_type')}
                        >
                            <Option value="all">Tất cả đối tượng</Option>
                            <Option value="HGD">Hộ gia đình</Option>
                            <Option value="DTTS">Dân tộc thiểu số</Option>
                            <Option value="NLNN">Nông lâm ngư nghiệp</Option>
                        </Select>
                    </Col>
                    <Col span={4}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Loại dịch vụ"
                            value={filters.service_type}
                            onChange={value => handleFilterChange(value, 'service_type')}
                        >
                            <Option value="all">Tất cả dịch vụ</Option>
                            <Option value="BHYT">Bảo hiểm y tế</Option>
                            <Option value="BHXH">Bảo hiểm xã hội</Option>
                            <Option value="BHTN">Bảo hiểm thất nghiệp</Option>
                        </Select>
                    </Col>
                    <Col span={4}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Thanh toán"
                            value={filters.payment_status}
                            onChange={value => handleFilterChange(value, 'payment_status')}
                        >
                            <Option value="all">Tất cả</Option>
                            <Option value="unpaid">Chưa thanh toán</Option>
                            <Option value="paid">Đã thanh toán</Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Bảng dữ liệu */}
            <Table
                columns={columns}
                dataSource={filteredBatches}
                loading={loading}
                rowKey="id"
                size="middle"
                bordered
                pagination={{
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đợt`,
                    pageSize: 10,
                    showQuickJumper: true
                }}
                scroll={{ x: 1300 }}
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: 'pointer' }
                })}
            />

            {/* Submit Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-blue-600">
                        <SendOutlined />
                        <span>Xác nhận gửi đợt kê khai</span>
                    </div>
                }
                open={submitModalVisible}
                onCancel={() => {
                    setSubmitModalVisible(false);
                    setSelectedBatchForSubmit(null);
                }}
                footer={[
                    <Button 
                        key="cancel"
                        onClick={() => {
                            setSubmitModalVisible(false);
                            setSelectedBatchForSubmit(null);
                        }}
                    >
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        icon={<SendOutlined />}
                        loading={submitting}
                        onClick={handleSubmitBatch}
                    >
                        Gửi đợt kê khai
                    </Button>
                ]}
                centered
            >
                <div className="py-4">
                    <div className="flex items-center gap-2 mb-4">
                        <ExclamationCircleOutlined className="text-yellow-500 text-xl" />
                        <span>Bạn có chắc chắn muốn gửi đợt kê khai này?</span>
                    </div>
                    {selectedBatchForSubmit && (
                        <div className="bg-gray-50 p-4 rounded">
                            <p><strong>Tên đợt:</strong> {selectedBatchForSubmit.name}</p>
                            <p><strong>Số lượng bản ghi:</strong> {selectedBatchForSubmit.total_declarations || 0}</p>
                            <p><strong>Tổng số tiền:</strong> {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(selectedBatchForSubmit.payment_amount || 0)}</p>
                        </div>
                    )}
                    <div className="mt-4 text-gray-500">
                        <p>Lưu ý: Sau khi gửi đợt kê khai, bạn sẽ không thể chỉnh sửa hoặc xóa cho đến khi được phê duyệt hoặc từ chối.</p>
                    </div>
                </div>
            </Modal>

            {/* Payment QR Modal */}
            <PaymentQR
                visible={showPaymentQR}
                onClose={() => {
                    setShowPaymentQR(false);
                    setSelectedBatch(null);
                }}
                batch={selectedBatch}
                userDepartmentCode={userInfo?.department_code}
            />
        </div>
    );
};

export default BatchList; 