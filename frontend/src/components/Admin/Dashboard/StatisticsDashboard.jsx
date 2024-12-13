import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Chart } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { fetchStatistics } from '../../../store/slices/statisticsSlice';
import { useApiError } from '../../../hooks/useApiError';
import { Card } from '../../UI';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const StatisticsDashboard = () => {
    const dispatch = useDispatch();
    const { handleError } = useApiError();
    const [statistics, setStatistics] = useState({
        totalDeclarations: 0,
        pendingDeclarations: 0,
        approvedDeclarations: 0,
        rejectedDeclarations: 0,
        monthlyStats: [],
        objectTypeStats: []
    });

    useEffect(() => {
        const loadStatistics = async () => {
            try {
                const result = await dispatch(fetchStatistics()).unwrap();
                setStatistics(result);
            } catch (error) {
                handleError(error);
            }
        };
        loadStatistics();
    }, [dispatch, handleError]);

    const monthlyData = {
        labels: statistics.monthlyStats.map(stat => `Tháng ${stat.month}`),
        datasets: [
            {
                label: 'Số lượng kê khai',
                data: statistics.monthlyStats.map(stat => stat.count),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }
        ]
    };

    const objectTypeData = {
        labels: statistics.objectTypeStats.map(stat => {
            const typeMap = {
                HGD: 'Hộ gia đình',
                DTTS: 'Dân tộc thiểu số',
                NLNN: 'Nông lâm ngư nghiệp'
            };
            return typeMap[stat.type];
        }),
        datasets: [
            {
                label: 'Số lượng theo đối tượng',
                data: statistics.objectTypeStats.map(stat => stat.count),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.5)',
                    'rgba(16, 185, 129, 0.5)',
                    'rgba(245, 158, 11, 0.5)'
                ]
            }
        ]
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Thống kê kê khai</h2>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900">Tổng số kê khai</h3>
                        <p className="mt-2 text-3xl font-semibold text-blue-600">
                            {statistics.totalDeclarations}
                        </p>
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900">Chờ duyệt</h3>
                        <p className="mt-2 text-3xl font-semibold text-yellow-600">
                            {statistics.pendingDeclarations}
                        </p>
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900">Đã duyệt</h3>
                        <p className="mt-2 text-3xl font-semibold text-green-600">
                            {statistics.approvedDeclarations}
                        </p>
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900">Từ chối</h3>
                        <p className="mt-2 text-3xl font-semibold text-red-600">
                            {statistics.rejectedDeclarations}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Biểu đồ thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <div className="p-4">
                        <h3 className="text-lg font-medium mb-4">Thống kê theo tháng</h3>
                        <Chart type="bar" data={monthlyData} />
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h3 className="text-lg font-medium mb-4">Thống kê theo đối tượng</h3>
                        <Chart type="pie" data={objectTypeData} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StatisticsDashboard; 