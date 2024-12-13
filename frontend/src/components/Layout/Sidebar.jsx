import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const dispatch = useDispatch();
    const isAdmin = user?.role === 'admin';

    const handleLogout = () => {
        dispatch(logout());
    };

    const menuItems = [
        {
            label: 'Kê khai',
            path: '/',
            show: true
        },
        {
            label: 'Quản lý kê khai',
            path: '/admin/declarations',
            show: isAdmin
        },
        {
            label: 'Thống kê',
            path: '/admin/dashboard',
            show: isAdmin
        },
        {
            label: 'Báo cáo',
            path: '/admin/reports',
            show: isAdmin
        }
    ];

    return (
        <div className="w-64 bg-gray-800 text-white">
            <div className="p-4">
                <h2 className="text-xl font-semibold">BHXH System</h2>
                <div className="mt-2 text-sm">
                    {user?.full_name}
                </div>
            </div>

            <nav className="mt-8">
                {menuItems.filter(item => item.show).map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-2 hover:bg-gray-700 ${
                            location.pathname === item.path ? 'bg-gray-700' : ''
                        }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="absolute bottom-0 w-64 p-4">
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default Sidebar; 