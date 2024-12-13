import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import api from '../../api';

const { Option } = Select;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Handle edit user
    const handleEdit = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            full_name: user.full_name,
            role: user.role,
            department_code: user.department_code,
            email: user.email,
            phone_number: user.phone_number,
            province: user.province,
            district: user.district,
            commune: user.commune
        });
        setModalVisible(true);
    };

    // Handle form submit
    const handleSubmit = async (values) => {
        try {
            if (editingUser) {
                const response = await api.put(`/admin/users/${editingUser.id}`, values);
                if (response.data.success) {
                    message.success('Cập nhật thông tin thành công');
                    fetchUsers();
                }
            } else {
                const response = await api.post('/admin/users', values);
                if (response.data.success) {
                    message.success('Tạo người dùng thành công');
                    fetchUsers();
                }
            }
            setModalVisible(false);
            form.resetFields();
            setEditingUser(null);
        } catch (error) {
            console.error('Error submitting form:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    // Handle toggle user status
    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.status === 'active' ? 'inactive' : 'active';
            const response = await api.post(`/admin/users/${user.id}/toggle-status`, {
                status: newStatus
            });
            if (response.data.success) {
                message.success(response.data.message);
                fetchUsers();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    // Handle delete user
    const handleDelete = async (user) => {
        try {
            const confirmed = await new Promise((resolve) => {
                Modal.confirm({
                    title: 'Xác nhận xóa',
                    content: `Bạn có chắc chắn muốn xóa người dùng "${user.full_name}" không?`,
                    okText: 'Xóa',
                    okType: 'danger',
                    cancelText: 'Hủy',
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false),
                });
            });

            if (!confirmed) return;

            const response = await api.delete(`/admin/users/${user.id}`);
            if (response.data.success) {
                message.success('Xóa người dùng thành công');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const columns = [
        {
            title: 'Tên đăng nhập',
            dataIndex: 'username',
            key: 'username'
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name'
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={role === 'admin' ? 'blue' : 'green'}>
                    {role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                </Tag>
            )
        },
        {
            title: 'Mã phòng ban',
            dataIndex: 'department_code',
            key: 'department_code'
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email'
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone_number',
            key: 'phone_number'
        },
        {
            title: 'Tỉnh/Thành phố',
            dataIndex: 'province',
            key: 'province'
        },
        {
            title: 'Quận/Huyện',
            dataIndex: 'district',
            key: 'district'
        },
        {
            title: 'Xã/Phường',
            dataIndex: 'commune',
            key: 'commune'
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'error'}>
                    {status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                </Tag>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="text"
                        icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
                        onClick={() => handleToggleStatus(record)}
                        disabled={record.role === 'admin'}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                        disabled={record.role === 'admin'}
                    />
                </Space>
            )
        }
    ];

    return (
        <div>
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Quản lý người dùng</h2>
                <Button
                    type="primary"
                    onClick={() => {
                        setEditingUser(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                >
                    Thêm người dùng
                </Button>
            </div>

            <Table
                loading={loading}
                dataSource={users}
                columns={columns}
                rowKey="id"
            />

            <Modal
                title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingUser(null);
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    {!editingUser && (
                        <Form.Item
                            name="username"
                            label="Tên đăng nhập"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên đăng nhập' }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    )}

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="full_name"
                        label="Họ và tên"
                        rules={[
                            { required: true, message: 'Vui lòng nhập họ và tên' }
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[
                            { required: true, message: 'Vui lòng chọn vai trò' }
                        ]}
                    >
                        <Select>
                            <Option value="employee">Nhân viên</Option>
                            <Option value="admin">Quản trị viên</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="department_code"
                        label="Mã phòng ban"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã phòng ban' }
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="phone_number"
                        label="Số đi���n thoại"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="province"
                        label="Tỉnh/Thành phố"
                        rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
                    >
                        <Input placeholder="Nhập tỉnh/thành phố" />
                    </Form.Item>

                    <Form.Item
                        name="district"
                        label="Quận/Huyện"
                        rules={[{ required: true, message: 'Vui lòng nhập quận/huyện' }]}
                    >
                        <Input placeholder="Nhập quận/huyện" />
                    </Form.Item>

                    <Form.Item
                        name="commune"
                        label="Xã/Phường"
                        rules={[{ required: true, message: 'Vui lòng nhập xã/phường' }]}
                    >
                        <Input placeholder="Nhập xã/phường" />
                    </Form.Item>

                    <div className="flex justify-end space-x-4">
                        <Button onClick={() => {
                            setModalVisible(false);
                            form.resetFields();
                            setEditingUser(null);
                        }}>
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingUser ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement; 