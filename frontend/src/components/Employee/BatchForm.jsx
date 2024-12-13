import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const { Option } = Select;

const BatchForm = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [selectedObjectType, setSelectedObjectType] = useState('DTTS');

    // Danh sách đối tượng kê khai
    const OBJECT_TYPES = {
        'HGD': 'Hộ gia đình',
        'DTTS': 'Dân tộc thiểu số',
        'NLNN': 'Nông lâm ngư nghiệp'
    };

    // Danh sách dịch vụ kê khai
    const SERVICES = {
        'BHYT': 'Kê khai BHYT',
        'BHXH': 'Kê khai BHXH'
    };

    // Lấy thông tin tháng năm và số đợt khi component mount
    useEffect(() => {
        const initializeForm = async () => {
            try {
                // Kiểm tra thông tin user
                if (!user || !user.department_code) {
                    message.error('Không tìm thấy thông tin phòng ban của người dùng');
                    navigate('/employee/declarations');
                    return;
                }

                console.log('Initializing form with user:', {
                    id: user.id,
                    username: user.username,
                    department_code: user.department_code
                });

                const currentDate = new Date();
                const currentMonth = currentDate.getMonth() + 1;
                const currentYear = currentDate.getFullYear();

                // Lấy danh sách đợt kê khai trong tháng hiện tại
                const response = await api.get('/declarations/employee/batches');
                const batches = response.data;

                // Lọc các đợt trong tháng hiện tại theo loại đối tượng
                const batchesInCurrentMonth = batches.filter(
                    batch => batch.month === currentMonth && 
                            batch.year === currentYear &&
                            batch.created_by === user.id &&
                            batch.object_type === selectedObjectType
                );

                // Tính số đợt tiếp theo
                const nextBatchNumber = batchesInCurrentMonth.length > 0
                    ? Math.max(...batchesInCurrentMonth.map(b => b.batch_number)) + 1
                    : 1;

                // Set giá trị mặc định cho form
                form.setFieldsValue({
                    object_type: selectedObjectType,
                    service_type: 'BHYT', // Mặc định là BHYT
                    month: currentMonth,
                    year: currentYear,
                    batch_number: nextBatchNumber
                });
            } catch (error) {
                console.error('Error initializing form:', error);
                message.error('Không thể tải thông tin ban đầu');
            } finally {
                setInitializing(false);
            }
        };

        initializeForm();
    }, [form, user, navigate, selectedObjectType]);

    // Xử lý khi thay đổi loại đối tượng
    const handleObjectTypeChange = async (value) => {
        setSelectedObjectType(value);
        try {
            const response = await api.get('/declarations/employee/batches');
            const batches = response.data;
            const currentMonth = form.getFieldValue('month');
            const currentYear = form.getFieldValue('year');

            // Lọc các đợt trong tháng hiện tại theo loại đối tượng mới
            const batchesInCurrentMonth = batches.filter(
                batch => batch.month === currentMonth && 
                        batch.year === currentYear &&
                        batch.created_by === user.id &&
                        batch.object_type === value
            );

            // Tính số đợt tiếp theo cho loại đối tượng mới
            const nextBatchNumber = batchesInCurrentMonth.length > 0
                ? Math.max(...batchesInCurrentMonth.map(b => b.batch_number)) + 1
                : 1;

            form.setFieldsValue({ batch_number: nextBatchNumber });
        } catch (error) {
            console.error('Error updating batch number:', error);
            message.error('Không thể cập nhật số đợt');
        }
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);
            let currentBatchNumber = values.batch_number;
            let success = false;
            let maxRetries = 10; // Giới hạn số lần thử để tránh vòng lặp vô hạn
            let retryCount = 0;

            // Kiểm tra thông tin user
            if (!user || !user.department_code) {
                message.error('Không tìm thấy thông tin phòng ban của người dùng');
                return;
            }

            while (!success && retryCount < maxRetries) {
                try {
                    // Tạo tên đợt dựa trên số đợt hiện tại
                    const batchName = `Đợt ${currentBatchNumber} tháng ${values.month}/${values.year}`;
                    
                    const response = await api.post('/declarations/employee/batch', {
                        ...values,
                        batch_number: currentBatchNumber, // Cập nhật số đợt
                        name: batchName,
                        department_code: user.department_code
                    });

                    if (response.data.success) {
                        message.success('Tạo đợt kê khai thành công');
                        navigate(`/employee/declarations/${response.data.data.id}/create`);
                        success = true;
                    }
                } catch (error) {
                    if (error.response?.data?.error?.includes('declaration_batch_month_year_batch_number_department_code_o_key')) {
                        // Nếu trùng, tăng số đợt lên 1 và thử lại
                        currentBatchNumber++;
                        retryCount++;
                        console.log(`Thử lại với số đợt ${currentBatchNumber}`);
                    } else {
                        // Nếu lỗi khác thì throw để xử lý bên ngoài
                        throw error;
                    }
                }
            }

            if (!success) {
                message.error('Không thể tạo đợt kê khai sau nhiều lần thử. Vui lòng thử lại sau.');
            }
        } catch (error) {
            console.error('Create batch error:', error);
            if (error.response?.status === 401) {
                message.error('Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
            } else {
                const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo đợt kê khai';
                message.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card 
            title="Tạo đợt kê khai mới"
            extra={
                <Button 
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/employee/declarations/create/batch')}
                >
                    Quay lại
                </Button>
            }
            style={{ 
                maxWidth: 800,
                margin: '24px auto',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                disabled={initializing}
            >
                <Form.Item
                    name="object_type"
                    label="Đối tượng kê khai"
                    rules={[{ required: true, message: 'Vui lòng chọn đối tượng kê khai' }]}
                >
                    <Select onChange={handleObjectTypeChange}>
                        {Object.entries(OBJECT_TYPES).map(([value, label]) => (
                            <Option key={value} value={value}>{label}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="service_type"
                    label="Dịch vụ kê khai"
                    rules={[{ required: true, message: 'Vui lòng chọn dịch vụ kê khai' }]}
                >
                    <Select>
                        {Object.entries(SERVICES).map(([value, label]) => (
                            <Option key={value} value={value}>{label}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="month"
                    label="Tháng"
                >
                    <InputNumber 
                        style={{ width: '100%' }}
                        disabled
                    />
                </Form.Item>

                <Form.Item
                    name="year"
                    label="Năm"
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        disabled
                    />
                </Form.Item>

                <Form.Item
                    name="batch_number"
                    label="Số đợt"
                    tooltip="Số đợt được tự động tạo theo thứ tự tăng dần cho từng loại đối tượng"
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        disabled
                    />
                </Form.Item>

                <Form.Item
                    name="notes"
                    label="Ghi chú"
                >
                    <Input.TextArea
                        rows={4}
                        maxLength={500}
                        showCount
                        placeholder="Nhập ghi chú cho đợt kê khai (nếu có)"
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={loading}
                        block
                    >
                        Lưu đợt kê khai
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default BatchForm; 