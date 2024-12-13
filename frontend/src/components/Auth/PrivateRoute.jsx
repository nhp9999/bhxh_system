import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, roles }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default PrivateRoute; 