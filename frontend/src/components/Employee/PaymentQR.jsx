import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Spin, message, Button } from 'antd';
import axios from 'axios';
import api from '../../api';

// Cache object để lưu mã QR
const qrCache = new Map();

const PaymentQR = ({ visible, onClose, batch, userDepartmentCode }) => {
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Tạo key cho cache dựa trên thông tin batch
    const cacheKey = useMemo(() => {
        if (!batch) return null;
        return `${batch.id}_${batch.total_amount}_${userDepartmentCode}`;
    }, [batch, userDepartmentCode]);

    // Tạo nội dung chuyển khoản
    const transferContent = useMemo(() => {
        if (!userDepartmentCode) return '';
        return `bhxh 103 00 BI0113G53 08907 dong bhxh Cty TNHH Thuong Mai Dich Vu Huy Phuc ${userDepartmentCode}`;
    }, [userDepartmentCode]);

    // Xử lý số tiền
    const formatAmount = useCallback((value) => {
        if (!value) return '0';
        const amount = Math.floor(Number(value)).toString();
        return amount.length > 13 ? amount.slice(0, 13) : amount;
    }, []);

    // Hàm tạo QR code
    const generateQR = useCallback(async () => {
        if (!visible || !batch || !cacheKey) return;

        // Kiểm tra cache
        if (qrCache.has(cacheKey)) {
            setQrCode(qrCache.get(cacheKey));
            return;
        }

        setLoading(true);
        try {
            const clientId = import.meta.env.VITE_VIETQR_CLIENT_ID;
            const apiKey = import.meta.env.VITE_VIETQR_API_KEY;

            if (!clientId || !apiKey) {
                throw new Error('Thiếu thông tin xác thực VietQR');
            }

            const amount = formatAmount(batch.total_amount);
            if (amount === '0') {
                throw new Error('Số tiền không hợp lệ');
            }

            const data = {
                accountNo: '6706202903085', // STK Agribank
                accountName: 'BAO HIEM XA HOI THI XA TINH BIEN', // Tên tài khoản
                acqId: '970405', // Mã ngân hàng Agribank
                amount: amount,
                addInfo: transferContent,
                format: 'text',
                template: 'compact2'
            };

            const response = await axios({
                method: 'post',
                url: 'https://api.vietqr.io/v2/generate',
                headers: {
                    'x-client-id': clientId,
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                data: data
            });

            if (response.data.code === '00' && response.data.data?.qrDataURL) {
                const qrDataURL = response.data.data.qrDataURL;
                // Lưu vào cache
                qrCache.set(cacheKey, qrDataURL);
                setQrCode(qrDataURL);
            } else {
                throw new Error(response.data.desc || 'Không thể tạo mã QR');
            }
        } catch (error) {
            console.error('Error generating QR:', error);
            let errorMessage = 'Có lỗi xảy ra khi tạo mã QR thanh toán';
            
            if (error.response) {
                errorMessage = error.response.data?.desc || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            message.error(errorMessage);
            setQrCode(null);
        } finally {
            setLoading(false);
        }
    }, [visible, batch, cacheKey, transferContent, formatAmount]);

    // Gọi API khi modal mở
    useEffect(() => {
        if (visible) {
            generateQR();
        }
    }, [visible, generateQR]);

    // Xóa QR code khi đóng modal
    useEffect(() => {
        if (!visible) {
            setQrCode(null);
        }
    }, [visible]);

    const formatCurrency = useCallback((value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    }, []);

    const handlePaymentConfirm = async () => {
        try {
            setSubmitting(true);
            const response = await api.post(`/declarations/batch/${batch.id}/confirm-payment`);
            if (response.data.success) {
                message.success('Xác nhận thanh toán thành công');
                onClose();
                // Reload trang để cập nhật trạng thái
                window.location.reload();
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Thanh toán qua VietQR"
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Đóng
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    loading={submitting}
                    onClick={handlePaymentConfirm}
                >
                    Đã thanh toán
                </Button>
            ]}
            width={400}
            destroyOnClose={true}
        >
            <div className="text-center">
                {loading ? (
                    <div className="py-8">
                        <Spin size="large" tip="Đang tạo mã QR..." />
                    </div>
                ) : qrCode ? (
                    <div className="space-y-4">
                        <div className="text-sm font-medium mb-4">
                            <div>NGÂN HÀNG: AGRIBANK</div>
                            <div>STK: 6706202903085</div>
                            <div>TÊN: BAO HIEM XA HOI THI XA TINH BIEN</div>
                        </div>
                        <img 
                            src={qrCode} 
                            alt="QR Code" 
                            className="mx-auto"
                            style={{ maxWidth: '300px' }}
                            loading="eager"
                        />
                        <div className="text-sm text-gray-500">
                            Quét mã QR bằng ứng dụng Mobile Banking để thanh toán
                        </div>
                        <div className="text-sm font-medium">
                            Số tiền: {formatCurrency(batch?.total_amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Nội dung chuyển khoản: {transferContent}
                        </div>
                    </div>
                ) : (
                    <div className="text-red-500">
                        Không thể tạo mã QR. Vui lòng thử lại sau.
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default PaymentQR; 