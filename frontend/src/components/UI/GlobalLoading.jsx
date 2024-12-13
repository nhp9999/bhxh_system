import React from 'react';
import { useSelector } from 'react-redux';

const GlobalLoading = () => {
    const isLoading = useSelector(state => state.ui.loading);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Đang xử lý...</p>
            </div>
        </div>
    );
};

export default GlobalLoading; 