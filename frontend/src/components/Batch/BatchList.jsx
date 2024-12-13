import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBatches, submitBatch } from '../../store/slices/batchSlice';
import { Table, Pagination, Button } from '../UI';
import Modal from '../UI/Modal';
import { useToast } from '../../contexts/ToastContext';

const BatchList = () => {
    const dispatch = useDispatch();
    const { items, loading, pagination } = useSelector(state => state.batches);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const { showToast } = useToast();
    
    useEffect(() => {
        dispatch(fetchBatches({ page: 1 }));
    }, [dispatch]);
    
    const columns = [
        { 
            header: 'Đợt kê khai',
            cell: (row) => `Tháng ${row.month}/${row.year}`
        },
        { 
            header: 'Số lượng hồ sơ',
            accessor: 'declaration_count'
        },
        { 
            header: 'Trạng thái',
            cell: (row) => {
                const statusMap = {
                    draft: 'Nháp',
                    submitted: 'Đã gửi',
                    approved: 'Đã duyệt',
                    rejected: 'Từ chối'
                };
                return statusMap[row.status];
            }
        },
        { 
            header: 'Thao tác',
            cell: (row) => (
                <div className="flex space-x-2">
                    <Button 
                        variant="outline"
                        onClick={() => navigate(`/batches/${row.id}`)}
                    >
                        Chi tiết
                    </Button>
                    {row.status === 'draft' && (
                        <Button 
                            variant="primary"
                            onClick={() => setSelectedBatch(row)}
                        >
                            Gửi duyệt
                        </Button>
                    )}
                </div>
            )
        }
    ];
    
    const handleSubmit = async (id) => {
        try {
            await dispatch(submitBatch(id)).unwrap();
            showToast('Gửi duyệt đợt kê khai thành công', 'success');
            setSelectedBatch(null);
        } catch (error) {
            showToast(error.message || 'Có lỗi xảy ra', 'error');
        }
    };
    
    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">Danh sách đợt kê khai</h2>
                    <Button onClick={() => navigate('/batches/new')}>
                        Tạo đợt mới
                    </Button>
                </div>
                
                <Table 
                    data={items}
                    columns={columns}
                    loading={loading}
                />
                
                <Pagination
                    currentPage={pagination.page}
                    totalPages={Math.ceil(pagination.total / pagination.limit)}
                    onPageChange={(page) => dispatch(fetchBatches({ page }))}
                />
            </div>
            
            <Modal
                isOpen={!!selectedBatch}
                onClose={() => setSelectedBatch(null)}
                title="Xác nhận gửi duyệt"
            >
                <p>Bạn có chắc chắn muốn gửi duyệt đợt kê khai này?</p>
                <div className="mt-4 flex justify-end space-x-3">
                    <Button 
                        variant="outline"
                        onClick={() => setSelectedBatch(null)}
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={() => handleSubmit(selectedBatch.id)}
                    >
                        Xác nhận
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default BatchList; 