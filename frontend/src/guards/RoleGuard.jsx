import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleGuard = ({ children, allowedRole }) => {
    const { user } = useAuth();

    if (user.role !== allowedRole) {
        // Redirect về dashboard tương ứng với role
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default RoleGuard; 