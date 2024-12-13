import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, message, Space, Typography, Button, Modal, Input, Tooltip } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, FormOutlined, CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title } = Typography;

const BatchList = () => {
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState([]);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectNotes, setRejectNotes] = useState('');
    const [selectedBatch, setSelectedBatch] = useState(null);
    const navigate = useNavigate();

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const response = await api.get('/declarations/admin/batches');
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'default';
            case 'submitted':
                return 'warning';
            case 'approved':
                return 'processing';
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

    const handleViewDetails = (id) => {
        navigate(`/admin/declarations/batch/${id}`);
    };

    const handleApprove = async (record) => {
        try {
            const response = await api.post(`/declarations/admin/batch/${record.id}/approve`);
            if (response.data.success) {
                message.success('Duyệt đợt kê khai thành công');
                fetchBatches();
            }
        } catch (error) {
            console.error('Approve error:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt đợt kê khai');
        }
    };

    const showRejectModal = (record) => {
        setSelectedBatch(record);
        setRejectModalVisible(true);
    };

    const handleReject = async () => {
        if (!rejectNotes.trim()) {
            message.error('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            const response = await api.post(`/declarations/admin/batch/${selectedBatch.id}/reject`, {
                notes: rejectNotes
            });

            if (response.data.success) {
                message.success('Từ chối đợt kê khai thành công');
                setRejectModalVisible(false);
                setRejectNotes('');
                setSelectedBatch(null);
                fetchBatches();
            }
        } catch (error) {
            console.error('Reject error:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối đợt kê khai');
        }
    };

    const handleProcess = async (record) => {
        try {
            const response = await api.post(`/declarations/admin/batch/${record.id}/process`);
            if (response.data.success) {
                message.success('Đã chuyển hồ sơ sang trạng thái xử lý');
                fetchBatches();
            }
        } catch (error) {
            console.error('Process error:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý hồ sơ');
        }
    };

    const handleComplete = async (record) => {
        try {
            const response = await api.post(`/declarations/admin/batch/${record.id}/complete`);
            if (response.data.success) {
                message.success('��ã hoàn thành xử lý hồ sơ');
                fetchBatches();
            }
        } catch (error) {
            console.error('Complete error:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi hoàn thành xử lý hồ sơ');
        }
    };

    const handleExportExcel = async (record) => {
        try {
            const response = await api.get(`/declarations/admin/batch/${record.id}/export`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Đợt_kê_khai_${record.id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            message.success('Xuất file Excel thành công');
        } catch (error) {
            console.error('Export error:', error);
            message.error('Có lỗi xảy ra khi xuất file Excel');
        }
    };

    const columns = [
        {
            title: 'Mã kê khai',
            key: 'id',
            render: (_, record) => `#${record.id}`,
            width: 100
        },
        {
            title: 'Nhân viên',
            dataIndex: 'employee_name',
            key: 'employee_name'
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department_code',
            key: 'department_code'
        },
        {
            title: 'Loại đối tượng',
            key: 'object_type',
            render: (_, record) => {
                switch (record.object_type) {
                    case 'HGD':
                        return 'Hộ gia đình';
                    case 'DTTS':
                        return 'Dân tộc thiểu số';
                    case 'NLNN':
                        return 'Nông lâm ngư nghiệp';
                    default:
                        return record.object_type;
                }
            }
        },
        {
            title: 'Hình thức',
            dataIndex: 'service_type',
            key: 'service_type'
        },
        {
            title: 'Tổng số tiền',
            dataIndex: 'total_amount',
            key: 'total_amount',
            align: 'right',
            render: (amount) => formatCurrency(amount)
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
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
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
                            onClick={() => handleViewDetails(record.id)}
                        />
                    </Tooltip>

                    {record.status === 'approved' && record.payment_status === 'paid' && (
                        <Tooltip title="Xử lý hồ sơ">
                            <Button
                                type="text"
                                icon={<FormOutlined />}
                                onClick={() => handleProcess(record)}
                                className="text-blue-600 hover:text-blue-700"
                            />
                        </Tooltip>
                    )}

                    {record.status === 'processing' && (
                        <Tooltip title="Hoàn thành xử lý">
                            <Button
                                type="text"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleComplete(record)}
                                className="text-green-600 hover:text-green-700"
                            />
                        </Tooltip>
                    )}

                    {record.status === 'submitted' && (
                        <>
                            <Tooltip title="Duyệt">
                                <Button
                                    type="text"
                                    icon={<CheckOutlined />}
                                    onClick={() => handleApprove(record)}
                                    className="text-green-600 hover:text-green-700"
                                />
                            </Tooltip>
                            <Tooltip title="Từ chối">
                                <Button
                                    type="text"
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => showRejectModal(record)}
                                />
                            </Tooltip>
                        </>
                    )}

                    <Tooltip title="Xuất Excel">
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => handleExportExcel(record)}
                            className="text-green-600 hover:text-green-700"
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <Card>
            <div style={{ marginBottom: 16 }}>
                <Title level={3}>Danh sách kê khai chờ duyệt</Title>
            </div>

            <Table
                loading={loading}
                dataSource={batches}
                columns={columns}
                rowKey="id"
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng số ${total} đợt kê khai`
                }}
            />

            <Modal
                title="Từ chối đợt kê khai"
                open={rejectModalVisible}
                onOk={handleReject}
                onCancel={() => {
                    setRejectModalVisible(false);
                    setRejectNotes('');
                    setSelectedBatch(null);
                }}
                okText="Từ chối"
                cancelText="Hủy"
            >
                <Input.TextArea
                    rows={4}
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                />
            </Modal>
        </Card>
    );
};

export default BatchList; 