import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBatches, submitBatch, deleteBatch } from '../../store/slices/batchSlice';
import { fetchDeclarationsByBatch } from '../../store/slices/declarationSlice';
import { Button, Modal, Table } from '../UI';
import { FiPlus, FiSend, FiEye, FiTrash2 } from 'react-icons/fi';
import DeclarationBatchForm from './DeclarationBatchForm';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DeclarationBatchList = () => {
    const dispatch = useDispatch();
    const { items, loading } = useSelector(state => state.batches);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const navigate = useNavigate();
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [showDeclarationsModal, setShowDeclarationsModal] = useState(false);
    const { items: declarations } = useSelector(state => state.declarations);

    useEffect(() => {
        dispatch(fetchBatches());
    }, [dispatch]);

    const handleSubmit = async (batchId) => {
        if (!window.confirm('Bạn có chắc chắn muốn gửi đợt kê khai này?')) {
            return;
        }

        try {
            await dispatch(submitBatch(batchId)).unwrap();
            toast.success('Gửi đợt kê khai thành công');
            dispatch(fetchBatches());
        } catch (error) {
            console.error('Submit batch error:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi gửi đợt kê khai');
        }
    };

    const handleViewDeclarations = async (batchId) => {
        try {
            await dispatch(fetchDeclarationsByBatch(batchId)).unwrap();
            setSelectedBatch(items.find(item => item.id === batchId));
            setShowDeclarationsModal(true);
        } catch (error) {
            console.error('Fetch declarations error:', error);
            toast.error('Không thể tải danh sách kê khai');
        }
    };

    const handleDelete = async (batchId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đợt kê khai này?')) {
            return;
        }

        try {
            await dispatch(deleteBatch(batchId)).unwrap();
            toast.success('Xóa đợt kê khai thành công');
            dispatch(fetchBatches());
        } catch (error) {
            console.error('Delete batch error:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi xóa đợt kê khai');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            submitted: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };

        const labels = {
            pending: 'Chờ gửi',
            submitted: 'Đã gửi',
            approved: 'Đã duyệt',
            rejected: 'Từ chối'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const columns = [
        {
            header: 'THÁNG/NĂM',
            cell: (row) => (
                <div className="font-medium">
                    {row.month}/{row.year}
                </div>
            )
        },
        {
            header: 'SỐ ĐỢT',
            cell: (row) => (
                <div className="text-center">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                        Đợt {row.batch_number}
                    </span>
                </div>
            )
        },
        {
            header: 'TRẠNG THÁI',
            cell: (row) => getStatusBadge(row.status)
        },
        {
            header: 'SỐ LƯỢNG KÊ KHAI',
            cell: (row) => (
                <div className="text-center">
                    <span className="font-medium">{row.total_declarations || 0}</span>
                </div>
            )
        },
        {
            header: 'THAO TÁC',
            cell: (row) => (
                <div className="flex justify-center space-x-2">
                    <button
                        onClick={() => navigate(`/employee/declarations/create/${row.id}`)}
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Thêm kê khai"
                        disabled={row.status !== 'pending'}
                    >
                        <FiPlus size={20} />
                    </button>
                    {row.total_declarations > 0 && (
                        <button
                            onClick={() => handleViewDeclarations(row.id)}
                            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Xem danh sách kê khai"
                        >
                            <FiEye size={20} />
                        </button>
                    )}
                    {row.status === 'pending' && row.total_declarations > 0 && (
                        <button
                            onClick={() => handleSubmit(row.id)}
                            className="p-2 text-green-600 hover:text-green-800 transition-colors"
                            title="Gửi đợt kê khai"
                        >
                            <FiSend size={20} />
                        </button>
                    )}
                    {row.status === 'pending' && (
                        <button
                            onClick={() => handleDelete(row.id)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            title="Xóa đợt kê khai"
                        >
                            <FiTrash2 size={20} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Danh sách đợt kê khai</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                    <FiPlus className="mr-2" />
                    Tạo đợt mới
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table
                    data={items}
                    columns={columns}
                    loading={loading}
                />
            </div>

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Tạo đợt kê khai mới"
            >
                <DeclarationBatchForm
                    onSuccess={() => {
                        setShowCreateModal(false);
                        dispatch(fetchBatches());
                    }}
                    onClose={() => setShowCreateModal(false)}
                />
            </Modal>

            <Modal
                isOpen={showDeclarationsModal}
                onClose={() => setShowDeclarationsModal(false)}
                title={`Danh sách kê khai - Đợt ${selectedBatch?.batch_number}/${selectedBatch?.month}/${selectedBatch?.year}`}
                size="lg"
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Họ và tên
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    CCCD
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mã BHXH
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {declarations.map((declaration) => (
                                <tr key={declaration.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {declaration.full_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {declaration.cccd}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {declaration.bhxh_code}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            declaration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            declaration.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                            declaration.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {declaration.status === 'pending' ? 'Chờ gửi' :
                                             declaration.status === 'submitted' ? 'Chờ duyệt' :
                                             declaration.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
};

export default DeclarationBatchList;