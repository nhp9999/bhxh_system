import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';

const DeclarationBatchForm = ({ onSuccess, onClose }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        batch_number: 1,
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getNextBatchNumber = async () => {
            try {
                const response = await api.get('/declaration-batch/next-number', {
                    params: {
                        month: formData.month,
                        year: formData.year
                    }
                });
                setFormData(prev => ({
                    ...prev,
                    batch_number: response.data.nextNumber || 1
                }));
            } catch (error) {
                console.error('Error getting next batch number:', error);
                toast.error('Không thể lấy số đợt tiếp theo');
            }
        };

        getNextBatchNumber();
    }, [formData.month, formData.year]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/declaration-batch', formData);
            const result = response.data;
            
            toast.success('Tạo đợt kê khai mới thành công');
            onSuccess?.(result);
            onClose?.();
            
            navigate(`/employee/declarations/create/${result.id}`);
        } catch (error) {
            console.error('Create batch error:', error);
            if (error.response?.data?.error === 'DUPLICATE_BATCH_NUMBER' && error.response?.data?.suggestedNumber) {
                setFormData(prev => ({
                    ...prev,
                    batch_number: error.response.data.suggestedNumber
                }));
                toast.error('Số đợt đã tồn tại, đã tự động cập nhật số đợt mới');
            } else {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đợt kê khai');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Tháng <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="month"
                        value={formData.month}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            month: parseInt(e.target.value)
                        }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Năm <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            year: parseInt(e.target.value)
                        }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        min={2000}
                        max={2100}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Số đợt <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        batch_number: parseInt(e.target.value)
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min={1}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Ghi chú
                </label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notes: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                />
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? 'Đang xử lý...' : 'Tạo mới'}
                </button>
            </div>
        </form>
    );
};

export default DeclarationBatchForm; 