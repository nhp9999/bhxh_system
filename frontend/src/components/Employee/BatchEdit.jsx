import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Row, Col, Typography, Spin, Select } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Danh sách đối tượng kê khai
const OBJECT_TYPES = [
    { value: 'HGD', label: 'Hộ gia đình' },
    { value: 'DTTS', label: 'Dân tộc thiểu số' },
    { value: 'NLNN', label: 'Nông lâm ngư nghiệp' }
];

const BatchEdit = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchBatchDetails = async () => {
            try {
                const response = await api.get(`/declarations/employee/batch/${id}`);
                const batch = response.data;

                // Kiểm tra nếu đợt không ở trạng thái pending
                if (batch.status !== 'pending') {
                    message.error('Chỉ có thể chỉnh sửa đợt kê khai ở trạng thái chờ xử lý');
                    navigate('/employee/declarations/create/batch');
                    return;
                }

                form.setFieldsValue({
                    name: batch.name,
                    object_type: batch.object_type,
                    notes: batch.notes,
                    month: batch.month,
                    year: batch.year
                });
            } catch (error) {
                console.error('Error fetching batch:', error);
                message.error('Không thể tải thông tin đợt kê khai');
                navigate('/employee/declarations/create/batch');
            } finally {
                setLoading(false);
            }
        };

        fetchBatchDetails();
    }, [id, form, navigate]);

    const onFinish = async (values) => {
        try {
            setSaving(true);

            const response = await api.put(`/declarations/employee/batch/${id}`, {
                ...values,
                name: values.name.trim(),
                notes: values.notes?.trim() || null
            });

            if (response.data.success) {
                message.success('Cập nhật đợt kê khai thành công');
                navigate('/employee/declarations/create/batch');
            }
        } catch (error) {
            if (error.response?.status === 401) {
                message.error('Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
            } else {
                const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật đợt kê khai';
                message.error(errorMessage);
            }
        } finally {
            setSaving(false);
        }
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
                    <Title level={3} style={{ margin: 0 }}>Chỉnh sửa đợt kê khai</Title>
                    <Button 
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/employee/declarations/create/batch')}
                    >
                        Quay lại
                    </Button>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark="optional"
                >
                    <Form.Item
                        name="name"
                        label="Tên đợt kê khai"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên đợt kê khai' },
                            { whitespace: true, message: 'Tên không được chỉ chứa khoảng trắng' }
                        ]}
                    >
                        <Input 
                            placeholder="Nhập tên đợt kê khai"
                            style={{ borderRadius: '6px' }}
                            maxLength={100}
                        />
                    </Form.Item>

                    <Form.Item
                        name="month"
                        label="Tháng"
                        rules={[{ required: true, message: 'Vui lòng chọn tháng' }]}
                        style={{ display: 'none' }}
                    >
                        <Input type="hidden" />
                    </Form.Item>

                    <Form.Item
                        name="year"
                        label="Năm"
                        rules={[{ required: true, message: 'Vui lòng chọn năm' }]}
                        style={{ display: 'none' }}
                    >
                        <Input type="hidden" />
                    </Form.Item>

                    <Form.Item
                        name="object_type"
                        label="Đối tượng kê khai"
                        rules={[{ required: true, message: 'Vui lòng chọn đối tượng kê khai' }]}
                    >
                        <Select
                            placeholder="Chọn đối tượng"
                            style={{ width: '100%', borderRadius: '6px' }}
                        >
                            {OBJECT_TYPES.map(type => (
                                <Option key={type.value} value={type.value}>
                                    {type.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Ghi chú"
                    >
                        <TextArea 
                            placeholder="Nhập ghi chú cho đợt kê khai (nếu có)"
                            style={{ borderRadius: '6px' }}
                            rows={4}
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={saving}
                            style={{ 
                                borderRadius: '6px',
                                paddingLeft: 20,
                                paddingRight: 20
                            }}
                        >
                            Lưu thay đổi
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </Card>
    );
};

export default BatchEdit; 