import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, message, Spin, Typography, Tag, Space, Table, Modal } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../../api';
import DeclarationForm from '../Employee/DeclarationForm';

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
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState(null);
    const [declarations, setDeclarations] = useState([]);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [batchResponse, declarationsResponse] = await Promise.all([
                    api.get(`/declarations/admin/batch/${id}`),
                    api.get(`/declarations/admin/batch/${id}/declarations`)
                ]);

                setBatch(batchResponse.data);
                setDeclarations(declarationsResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                message.error('Không thể tải thông tin đợt kê khai');
                navigate('/admin/declarations');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const handleEdit = (record) => {
        setSelectedDeclaration(record);
        setIsEditModalVisible(true);
    };

    const handleEditModalClose = () => {
        setIsEditModalVisible(false);
        setSelectedDeclaration(null);
    };

    const handleApprove = async (batch) => {
        try {
            await api.put(`/declarations/admin/batch/${batch.id}/approve`);
            message.success('Đã duyệt đợt kê khai thành công');
            window.location.reload();
        } catch (error) {
            message.error('Không thể duyệt đợt kê khai');
        }
    };

    const handleReject = async (batch) => {
        try {
            await api.put(`/declarations/admin/batch/${batch.id}/reject`);
            message.success('Đã từ chối đợt kê khai');
            window.location.reload();
        } catch (error) {
            message.error('Không thể từ chối đợt kê khai');
        }
    };

    const handleExportExcel = async () => {
        try {
            console.log('Exporting batch:', id);
            
            const response = await api.get(`/declarations/admin/batch/${id}/export`, {
                responseType: 'blob'
            });
            
            console.log('Export response:', response);
            
            if (!response.data) {
                throw new Error('Không nhận được dữ liệu từ server');
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `IMPORT_VNPT_BHXH_${batch.department_code}_${batch.month}_${batch.year}_${batch.batch_number}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            message.success('Xuất file Excel thành công');
        } catch (error) {
            console.error('Export error:', error);
            message.error('Có lỗi xảy ra khi xuất file Excel: ' + error.message);
        }
    };

    const declarationColumns = [
        {
            title: 'Mã số BHXH',
            dataIndex: 'bhxh_code',
            key: 'bhxh_code'
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name'
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'birth_date',
            key: 'birth_date',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'CCCD/CMND',
            dataIndex: 'cccd',
            key: 'cccd'
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone_number',
            key: 'phone_number'
        },
        {
            title: 'Số tháng',
            dataIndex: 'months',
            key: 'months',
            align: 'center'
        },
        {
            title: 'Số tiền',
            dataIndex: 'actual_amount',
            key: 'actual_amount',
            align: 'right',
            render: (amount) => amount?.toLocaleString('vi-VN') + ' đ'
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={STATUS_MAP[status]?.color || 'default'}>
                    {STATUS_MAP[status]?.text || status}
                </Tag>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Button 
                    type="link" 
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                >
                    Chỉnh sửa
                </Button>
            )
        }
    ];

    return (
        <Card>
            <Spin spinning={loading}>
                <div className="mb-6 flex justify-between items-center">
                    <Title level={3} className="mb-0">Chi tiết đợt kê khai</Title>
                    <Space>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExportExcel}
                            type="primary"
                        >
                            Xuất Excel
                        </Button>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/admin/declarations')}
                        >
                            Quay lại
                        </Button>
                    </Space>
                </div>

                {batch && (
                    <div className="space-y-6">
                        <Descriptions
                            bordered
                            column={2}
                            labelStyle={{ width: '200px', fontWeight: 500 }}
                        >
                            <Descriptions.Item label="Tên đợt kê khai">
                                {batch.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={STATUS_MAP[batch.status]?.color}>
                                    {STATUS_MAP[batch.status]?.text}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tháng/Năm">
                                {batch.month}/{batch.year}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số đợt">
                                {batch.batch_number}
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại đối tượng">
                                {OBJECT_TYPES[batch.object_type] || batch.object_type}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hình thức">
                                {batch.service_type}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phòng ban">
                                {batch.department_code}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {new Date(batch.created_at).toLocaleString('vi-VN')}
                            </Descriptions.Item>
                            {batch.admin_notes && (
                                <Descriptions.Item label="Ghi chú của admin" span={2}>
                                    {batch.admin_notes}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        <div>
                            <Title level={4}>Danh sách kê khai</Title>
                            <Table
                                dataSource={declarations}
                                columns={declarationColumns}
                                rowKey="id"
                                pagination={false}
                                scroll={{ x: true }}
                            />
                        </div>

                        {batch.status === 'submitted' && (
                            <div className="flex justify-end space-x-4">
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={() => handleApprove(batch)}
                                >
                                    Duyệt đợt kê khai
                                </Button>
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => handleReject(batch)}
                                >
                                    Từ chối
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <Modal
                    title="Chỉnh sửa kê khai"
                    visible={isEditModalVisible}
                    onCancel={handleEditModalClose}
                    width={1200}
                    footer={null}
                >
                    {selectedDeclaration && batch && (
                        <DeclarationForm
                            batchId={batch.id}
                            initialValues={selectedDeclaration}
                            onSuccess={() => {
                                handleEditModalClose();
                                window.location.reload();
                            }}
                        />
                    )}
                </Modal>
            </Spin>
        </Card>
    );
};

export default BatchDetail; 