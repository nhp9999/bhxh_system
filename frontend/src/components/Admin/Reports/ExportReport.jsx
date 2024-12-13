import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Card, DatePicker } from '../../UI';
import { useApiError } from '../../../hooks/useApiError';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../api';

const ExportReport = () => {
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });
    const [loading, setLoading] = useState(false);
    const { handleError } = useApiError();
    const { showToast } = useToast();

    const handleExport = async (format) => {
        try {
            setLoading(true);
            const response = await api.get('/reports/export', {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    format
                },
                responseType: 'blob'
            });

            // Tạo URL cho file download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bao-cao-${format}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            showToast('Xuất báo cáo thành công', 'success');
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <div className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Xuất báo cáo</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Từ ngày
                        </label>
                        <DatePicker
                            selected={dateRange.startDate}
                            onChange={date => setDateRange(prev => ({ ...prev, startDate: date }))}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Đến ngày
                        </label>
                        <DatePicker
                            selected={dateRange.endDate}
                            onChange={date => setDateRange(prev => ({ ...prev, endDate: date }))}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="flex space-x-4">
                    <Button
                        onClick={() => handleExport('xlsx')}
                        disabled={loading || !dateRange.startDate || !dateRange.endDate}
                    >
                        Xuất Excel
                    </Button>
                    <Button
                        onClick={() => handleExport('pdf')}
                        disabled={loading || !dateRange.startDate || !dateRange.endDate}
                    >
                        Xuất PDF
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ExportReport; 