import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { EditOutlined, LockOutlined, UnlockOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../utils/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            setUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error(error.userMessage || 'Có lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            email: user.email,
            phone: user.phone,
            department_code: user.department_code
        });
        setEditModalVisible(true);
    };

    const handleEditSubmit = async () => {
        try {
            const values = await form.validateFields();
            await api.put(`/admin/users/${editingUser.id}`, values);
            message.success('Cập nhật thông tin thành công');
            setEditModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            message.error(error.userMessage || 'Có lỗi xảy ra khi cập nhật thông tin');
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            const response = await api.put(`/admin/users/${userId}/toggle-status`);
            message.success(response.data.message);
            fetchUsers();
        } catch (error) {
            console.error('Error toggling status:', error);
            message.error(error.userMessage || 'Có lỗi xảy ra khi thay đổi trạng thái tài khoản');
        }
    };

    const handleDelete = async (userId) => {
        try {
            setLoading(true);
            const response = await api.delete(`/admin/users/${userId}`);
            message.success(response.data.message || 'Xóa người dùng thành công');
            await fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            message.error(error.userMessage || 'Có lỗi xảy ra khi xóa người dùng');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Tên đăng nhập',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => role === 'admin' ? 'Quản trị viên' : 'Nhân viên'
        },
        {
            title: 'Mã phòng ban',
            dataIndex: 'department_code',
            key: 'department_code',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <span style={{ color: status === 'active' ? '#52c41a' : '#ff4d4f' }}>
                    {status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                </span>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Sửa
                    </Button>
                    <Button
                        type="link"
                        icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
                        onClick={() => handleToggleStatus(record.id)}
                        style={{ color: record.status === 'active' ? '#ff4d4f' : '#52c41a' }}
                    >
                        {record.status === 'active' ? 'Khóa' : 'Mở khóa'}
                    </Button>
                    {record.username !== 'admin' && (
                        <Popconfirm
                            title="Xác nhận xóa"
                            description="Bạn có chắc chắn muốn xóa người dùng này?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                            >
                                Xóa
                            </Button>
                        </Popconfirm>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2>Quản lý người dùng</h2>
                <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchUsers}
                    loading={loading}
                >
                    Làm mới
                </Button>
            </div>

            <Table
                loading={loading}
                columns={columns}
                dataSource={users}
                rowKey="id"
                pagination={{
                    total: users.length,
                    pageSize: 10,
                    showTotal: (total) => `Tổng số ${total} người dùng`,
                }}
            />

            <Modal
                title="Chỉnh sửa thông tin người dùng"
                open={editModalVisible}
                onOk={handleEditSubmit}
                onCancel={() => {
                    setEditModalVisible(false);
                    form.resetFields();
                }}
                okText="Cập nhật"
                cancelText="Hủy"
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        name="full_name"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                    >
                        <Select>
                            <Select.Option value="admin">Quản trị viên</Select.Option>
                            <Select.Option value="employee">Nhân viên</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="department_code"
                        label="Mã phòng ban"
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
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement; 