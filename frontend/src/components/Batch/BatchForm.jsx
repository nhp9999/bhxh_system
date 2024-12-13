import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { createBatch } from '../../store/slices/batchSlice';
import { Button } from '../UI';
import { useToast } from '../../contexts/ToastContext';
import { useApiError } from '../../hooks/useApiError';

const schema = yup.object().shape({
    month: yup
        .number()
        .required('Vui lòng chọn tháng')
        .min(1, 'Tháng không hợp lệ')
        .max(12, 'Tháng không hợp lệ'),
    year: yup
        .number()
        .required('Vui lòng nhập năm')
        .min(2000, 'Năm không hợp lệ'),
    note: yup.string()
});

const BatchForm = ({ onSuccess }) => {
    const dispatch = useDispatch();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });
    const { showToast } = useToast();
    const { handleError } = useApiError();

    const onSubmit = async (data) => {
        try {
            await dispatch(createBatch(data)).unwrap();
            showToast('Tạo đợt kê khai thành công', 'success');
            onSuccess?.();
        } catch (error) {
            handleError(error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Tháng
                </label>
                <select
                    {...register('month')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                            Tháng {month}
                        </option>
                    ))}
                </select>
                {errors.month && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.month.message}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Năm
                </label>
                <input
                    type="number"
                    {...register('year')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                {errors.year && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.year.message}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Ghi chú
                </label>
                <textarea
                    {...register('note')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
            </div>

            <Button type="submit" className="w-full">
                Tạo đợt kê khai
            </Button>
        </form>
    );
};

export default BatchForm; 