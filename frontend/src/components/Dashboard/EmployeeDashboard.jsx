import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { FiFileText, FiLogOut } from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import DeclarationBatchList from '../DeclarationBatch/DeclarationBatchList';
import DeclarationForm from '../Declaration/DeclarationForm';

const EmployeeDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState('declarations');

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const getBreadcrumb = () => {
        const path = location.pathname;
        if (path.includes('/declarations/create')) {
            return 'Thêm mới kê khai';
        }
        if (path.includes('/declarations')) {
            return 'Quản lý kê khai';
        }
        return '';
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-gray-800">BHYT System</h1>
                </div>
                <nav className="mt-6">
                    <button
                        onClick={() => {
                            setActiveMenu('declarations');
                            navigate('/employee/declarations');
                        }}
                        className={`w-full flex items-center px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${
                            activeMenu === 'declarations' ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                    >
                        <FiFileText className="mr-3" />
                        Quản lý kê khai
                    </button>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow">
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {getBreadcrumb()}
                                </h2>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-gray-600 hover:text-gray-800"
                            >
                                <FiLogOut className="mr-2" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content area */}
                <main className="flex-1 overflow-auto bg-gray-50 p-6">
                    <Routes>
                        <Route path="/" element={<Navigate to="declarations" replace />} />
                        <Route path="declarations" element={<DeclarationBatchList />} />
                        <Route path="declarations/create/:batchId" element={<DeclarationForm />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default EmployeeDashboard; 