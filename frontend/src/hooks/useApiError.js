import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

export const useApiError = () => {
    const { showToast } = useToast();

    const handleError = useCallback((error) => {
        if (error.response) {
            // Validation errors
            if (error.response.status === 422) {
                const errors = error.response.data.errors;
                Object.values(errors).forEach(error => {
                    showToast(error[0], 'error');
                });
                return;
            }

            // Other errors with response
            showToast(
                error.response.data.message || 'Có lỗi xảy ra',
                'error'
            );
            return;
        }

        // Network errors
        if (error.request) {
            showToast('Không thể kết nối đến server', 'error');
            return;
        }

        // Other errors
        showToast('Có lỗi xảy ra', 'error');
    }, [showToast]);

    return { handleError };
}; 