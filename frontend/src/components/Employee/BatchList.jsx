import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, message, Modal, Space, Typography, Tooltip, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SendOutlined, WalletOutlined, FileExcelOutlined } from '@ant-design/icons';
import api from '../../api';
import PaymentQR from './PaymentQR';

const { Title } = Typography;

// Danh sách đối tượng kê khai
const OBJECT_TYPES = {
    'HGD': 'Hộ gia đình',
    'DTTS': 'Dân tộc thiểu số',
    'NLNN': 'Nông lâm ngư nghiệp'
};

const BatchList = () => {
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState([]);
    const [deleteLoading, setDeleteLoading] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [showPaymentQR, setShowPaymentQR] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

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

    const handleDelete = async (record) => {
        try {
            const confirmed = await new Promise((resolve) => {
                Modal.confirm({
                    title: 'Xác nhận xóa',
                    content: `Bạn có chắc chắn muốn xóa ${record.name} khng?`,
                    okText: 'Xóa',
                    okType: 'danger',
                    cancelText: 'Hủy',
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false),
                });
            });

            if (!confirmed) return;

            setDeleteLoading(prev => ({ ...prev, [record.id]: true }));

            const response = await api.delete(`/declarations/employee/batch/${record.id}`);

            if (response.data.success) {
                message.success('Xóa đợt kê khai thành công');
                fetchBatches();
            }
        } catch (error) {
            console.error('Delete error:', error);
            message.error('Không thể xóa đợt kê khai');
        } finally {
            setDeleteLoading(prev => ({ ...prev, [record.id]: false }));
        }
    };

    const handleSubmit = async (record) => {
        try {
            const confirmed = await new Promise((resolve) => {
                Modal.confirm({
                    title: 'Xác nhận gửi',
                    content: `Bạn có chắc chắn muốn gửi đợt kê khai "${record.name}" không?`,
                    okText: 'Gửi',
                    okType: 'primary',
                    cancelText: 'Hủy',
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false),
                });
            });

            if (!confirmed) return;

            setSubmitting(prev => ({ ...prev, [record.id]: true }));

            const response = await api.post(`/declarations/employee/batch/${record.id}/submit`);

            if (response.data.success) {
                message.success('Gửi đợt kê khai thành công');
                fetchBatches();
            }
        } catch (error) {
            console.error('Submit error:', error);
            if (error.response?.data?.error?.includes('declaration_batch_month_year_batch_number_department_code_o_key')) {
                message.error('Đã tồn tại đợt kê khai với cùng tháng, năm, số đợt, loại đối tượng và loại dịch vụ');
            } else {
                message.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đợt kê khai');
            }
        } finally {
            setSubmitting(prev => ({ ...prev, [record.id]: false }));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'processing';
            case 'submitted':
                return 'warning';
            case 'approved':
                return 'success';
            case 'processing':
                return 'blue';
            case 'completed':
                return 'success';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Chờ xử lý';
            case 'submitted':
                return 'Đã nộp';
            case 'approved':
                return 'Đã duyệt';
            case 'processing':
                return 'Đang xử lý';
            case 'completed':
                return 'Đã hoàn thành';
            case 'rejected':
                return 'Từ chối';
            default:
                return 'Không xác định';
        }
    };

    const handlePayment = (record) => {
        setSelectedBatch(record);
        setShowPaymentQR(true);
    };

    const getPaymentStatusText = (paymentStatus) => {
        switch (paymentStatus) {
            case 'paid':
                return 'Đã thanh toán';
            case 'unpaid':
                return 'Chưa thanh toán';
            default:
                return 'Chưa thanh toán';
        }
    };

    const getPaymentStatusColor = (paymentStatus) => {
        switch (paymentStatus) {
            case 'paid':
                return 'success';
            case 'unpaid':
                return 'warning';
            default:
                return 'warning';
        }
    };

    const handleExportExcel = async (record) => {
        try {
            const response = await api.get(`/declarations/employee/batch/${record.id}/export-excel`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Danh_sach_ke_khai_dot_${record.batch_number}_${record.month}_${record.year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            message.success('Xuất Excel thành công');
        } catch (error) {
            console.error('Export Excel error:', error);
            message.error('Có lỗi xảy ra khi xuất Excel');
        }
    };

    const columns = [
        {
            title: 'Tên đợt',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: 'Tháng/Năm',
            key: 'month_year',
            render: (_, record) => `${record.month}/${record.year}`,
            align: 'center'
        },
        {
            title: 'Số đợt',
            dataIndex: 'batch_number',
            key: 'batch_number',
            align: 'center'
        },
        {
            title: 'Đối tượng',
            key: 'object_type',
            render: (_, record) => OBJECT_TYPES[record.object_type] || record.object_type,
            align: 'center'
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => (
                <Tag color={getStatusColor(record.status)}>
                    {getStatusText(record.status)}
                </Tag>
            ),
            align: 'center'
        },
        {
            title: 'Trạng thái thanh toán',
            key: 'payment_status',
            render: (_, record) => (
                <Tag color={getPaymentStatusColor(record.payment_status)}>
                    {getPaymentStatusText(record.payment_status)}
                </Tag>
            ),
            align: 'center'
        },
        {
            title: 'Số lượng',
            dataIndex: 'total_declarations',
            key: 'total_declarations',
            align: 'center',
            render: (text) => <Badge count={text} style={{ backgroundColor: '#108ee9' }} />
        },
        {
            title: 'Tổng số tiền',
            dataIndex: 'total_amount',
            key: 'total_amount',
            align: 'right',
            render: (amount) => formatCurrency(amount)
        },
        {
            title: 'Ghi chú',
            dataIndex: 'notes',
            key: 'notes',
            render: (text) => text || 'Không có ghi chú'
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/employee/declarations/batch/${record.id}`);
                            }}
                        />
                    </Tooltip>

                    {record.total_declarations > 0 && (
                        <Tooltip title="Xuất Excel">
                            <Button
                                type="text"
                                icon={<FileExcelOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportExcel(record);
                                }}
                                className="text-green-600 hover:text-green-700"
                            />
                        </Tooltip>
                    )}

                    {record.status === 'approved' && !record.payment_status !== 'paid' && (
                        <Tooltip title="Thanh toán">
                            <Button
                                type="text"
                                icon={<WalletOutlined />}
                                onClick={() => handlePayment(record)}
                                className="text-green-600 hover:text-green-700"
                            />
                        </Tooltip>
                    )}

                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="Chỉnh sửa">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/employee/declarations/edit/batch/${record.id}`)}
                                />
                            </Tooltip>

                            {record.total_declarations > 0 && (
                                <Tooltip title="Gửi đợt kê khai">
                                    <Button
                                        type="text"
                                        icon={<SendOutlined />}
                                        loading={submitting[record.id]}
                                        onClick={() => handleSubmit(record)}
                                    />
                                </Tooltip>
                            )}

                            <Tooltip title="Xóa">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    loading={deleteLoading[record.id]}
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
        <>
            <Card>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={3} style={{ margin: 0 }}>Danh sách đợt kê khai</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/employee/declarations/create/batch/new')}
                    >
                        Tạo đợt kê khai mới
                    </Button>
                </div>

                <Table
                    loading={loading}
                    dataSource={batches}
                    columns={columns}
                    rowKey="id"
                    onRow={(record) => ({
                        onClick: () => {
                            if (record.status === 'pending') {
                                navigate(`/employee/declarations/${record.id}/create`);
                            }
                        },
                        style: {
                            cursor: record.status === 'pending' ? 'pointer' : 'default'
                        }
                    })}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng số ${total} đợt kê khai`
                    }}
                />
            </Card>

            <PaymentQR
                visible={showPaymentQR}
                onClose={() => {
                    setShowPaymentQR(false);
                    setSelectedBatch(null);
                }}
                batch={selectedBatch}
                userDepartmentCode={userInfo?.department_code}
            />
        </>
    );
};

export default BatchList; 