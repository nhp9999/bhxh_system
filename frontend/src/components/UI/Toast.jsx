import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500'
    }[type];

    return (
        <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg`}>
            <div className="flex items-center">
                <span>{message}</span>
                <button 
                    onClick={onClose}
                    className="ml-4 text-white hover:text-gray-200"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast; 