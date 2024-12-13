import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../store/slices/uiSlice';

const ToastManager = () => {
    const toasts = useSelector(state => state.ui.toasts);
    const dispatch = useDispatch();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-lg shadow-lg ${
                        toast.type === 'success' ? 'bg-green-500' :
                        toast.type === 'error' ? 'bg-red-500' :
                        'bg-yellow-500'
                    } text-white`}
                >
                    <div className="flex items-center justify-between">
                        <span>{toast.message}</span>
                        <button
                            onClick={() => dispatch(removeToast(toast.id))}
                            className="ml-4 text-white hover:text-gray-200"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToastManager; 