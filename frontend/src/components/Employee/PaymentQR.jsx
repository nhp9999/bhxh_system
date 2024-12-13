import React, { useState } from 'react';
import { Modal, Button, Space, message, Upload, App } from 'antd';
import { CopyOutlined, DownloadOutlined, CheckCircleOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../api';

const PaymentQRContent = ({ visible, onClose, batch, userDepartmentCode }) => {
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        message.success(`Đã sao chép ${label}`);
    };

    const handleDownloadQR = () => {
        const qrImage = document.querySelector('#payment-qr img');
        if (qrImage) {
            const link = document.createElement('a');
            link.href = qrImage.src;
            link.download = `QR_${batch?.id || 'payment'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleConfirmPayment = () => {
        // Hiện modal upload ảnh bill
        setShowUploadModal(true);
    };

    const handleUpload = async () => {
        if (!fileList || fileList.length === 0) {
            message.error('Vui lòng chọn ảnh bill thanh toán');
            return;
        }

        const file = fileList[0];
        if (!file) {
            message.error('Không tìm thấy file ảnh');
            return;
        }

        const formData = new FormData();
        formData.append('bill_image', file.originFileObj || file);

        setUploading(true);
        try {
            console.log('Uploading file:', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });

            // Upload ảnh bill
            const response = await api.post(`/declarations/employee/batch/${batch.id}/upload-bill`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Upload response:', response);

            // Xác nhận thanh toán
            await api.post(`/declarations/employee/batch/${batch.id}/confirm-payment`);

            message.success('Xác nhận thanh toán thành công');
            setShowUploadModal(false);
            setFileList([]);
            onClose();
        } catch (error) {
            console.error('Error uploading bill:', error);
            message.error(error.response?.data?.message || 'Không thể upload ảnh bill');
        } finally {
            setUploading(false);
        }
    };

    const uploadProps = {
        onRemove: () => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            // Kiểm tra định dạng file
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Chỉ chấp nhận file ảnh!');
                return false;
            }

            // Kiểm tra kích thước file (tối đa 5MB)
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Kích thước ảnh phải nhỏ hơn 5MB!');
                return false;
            }

            // Thêm file vào fileList
            setFileList([file]);
            return false;
        },
        fileList,
        maxCount: 1,
        // Thêm accept để chỉ cho phép chọn file ảnh
        accept: 'image/*'
    };

    return (
        <>
            <Modal
                title={<div className="text-lg">Mã QR Thanh toán</div>}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={800}
                centered
            >
                <div className="flex gap-8">
                    {/* QR Code */}
                    <div className="w-1/2 flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg" id="payment-qr">
                        <img
                            src={`https://api.vietqr.io/image/${batch?.bank_id || '970416'}-${batch?.account_number || '6706202903085'}-compact2.jpg?amount=${batch?.payment_amount || 0}&addInfo=${batch?.payment_content || ''}&accountName=BAO%20HIEM%20XA%20HOI%20THI%20XA%20TINH%20BIEN`}
                            alt="Payment QR"
                            className="w-full max-w-[300px]"
                        />
                        <img src="/vietqr.png" alt="VietQR" className="mt-4 h-8" />
                    </div>

                    {/* Thông tin thanh toán */}
                    <div className="w-1/2 space-y-4">
                        <div>
                            <div className="text-gray-500 mb-1">Tên đợt</div>
                            <div className="font-medium">{batch?.name}</div>
                        </div>

                        <div>
                            <div className="text-gray-500 mb-1">Ngân hàng</div>
                            <div className="font-medium">AGRIBANK</div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-gray-500 mb-1">Số tài khoản</div>
                                <div className="font-medium">6706202903085</div>
                            </div>
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy('6706202903085', 'số tài khoản')}
                            >
                                Sao chép
                            </Button>
                        </div>

                        <div>
                            <div className="text-gray-500 mb-1">Tên tài khoản</div>
                            <div className="font-medium">BAO HIEM XA HOI THI XA TINH BIEN</div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-gray-500 mb-1">Số tiền</div>
                                <div className="font-medium text-blue-600">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(batch?.payment_amount || 0)}
                                </div>
                            </div>
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(batch?.payment_amount || '', 'số tiền')}
                            >
                                Sao chép
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-gray-500 mb-1">Nội dung chuyển khoản</div>
                                <div className="font-medium break-all">
                                    {`bhxh ${userDepartmentCode} ${batch?.id} dong bhxh NV${batch?.employee_code || ''}`}
                                </div>
                            </div>
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(
                                    `bhxh ${userDepartmentCode} ${batch?.id} dong bhxh NV${batch?.employee_code || ''}`,
                                    'nội dung chuyển khoản'
                                )}
                            >
                                Sao chép
                            </Button>
                        </div>

                        <div className="pt-4 flex justify-between">
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadQR}
                            >
                                Tải mã QR
                            </Button>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={handleConfirmPayment}
                                loading={confirmLoading}
                            >
                                Xác nhận đã thanh toán
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-gray-500 text-sm">
                    Sử dụng ứng dụng ngân hàng để quét mã QR và thanh toán
                </div>
            </Modal>

            {/* Modal upload ảnh bill */}
            <Modal
                title="Upload ảnh bill thanh toán"
                open={showUploadModal}
                onOk={handleUpload}
                onCancel={() => {
                    setShowUploadModal(false);
                    setFileList([]);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
                confirmLoading={uploading}
            >
                <div className="space-y-4">
                    <div className="text-gray-500 mb-2">
                        Vui lòng upload ảnh bill thanh toán để xác nhận:
                    </div>
                    <Upload.Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">Nhấp hoặc kéo thả file ảnh vào đây</p>
                        <p className="ant-upload-hint text-gray-500">
                            Chỉ chấp nhận file ảnh, kích thước tối đa 5MB
                        </p>
                    </Upload.Dragger>
                </div>
            </Modal>
        </>
    );
};

const PaymentQR = (props) => {
    return (
        <App>
            <PaymentQRContent {...props} />
        </App>
    );
};

export default PaymentQR; 