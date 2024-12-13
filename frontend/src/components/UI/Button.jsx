import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = ({ 
    children, 
    type = 'button', 
    className = '', 
    loading = false,
    disabled = false,
    onClick 
}) => {
    return (
        <button
            type={type}
            className={`
                px-4 py-2 
                bg-indigo-600 
                text-white 
                rounded-md 
                hover:bg-indigo-700 
                focus:outline-none 
                focus:ring-2 
                focus:ring-indigo-500 
                focus:ring-offset-2
                disabled:opacity-50
                disabled:cursor-not-allowed
                ${className}
            `}
            disabled={loading || disabled}
            onClick={onClick}
        >
            {loading ? (
                <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang xử lý...
                </div>
            ) : children}
        </button>
    );
};

export default Button; 