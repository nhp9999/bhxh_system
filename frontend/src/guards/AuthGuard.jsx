import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const AuthGuard = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (location.pathname === '/') {
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default AuthGuard; 