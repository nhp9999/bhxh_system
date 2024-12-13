import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import LoginForm from './components/Auth/LoginForm';
import UnauthorizedPage from './components/Common/UnauthorizedPage';
import AdminLayout from './components/Admin/AdminLayout';
import EmployeeLayout from './components/Employee/EmployeeLayout';
import { adminRoutes } from './routes/admin';
import { employeeRoutes } from './routes/employee';
import EmployeeDashboard from './components/Employee/EmployeeDashboard';

const App = () => {
    return (
        <AuthProvider>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Admin routes */}
                <Route 
                    path="/admin/*" 
                    element={
                        <PrivateRoute roles={['admin']}>
                            <AdminLayout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    {adminRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={route.element}
                        />
                    ))}
                </Route>

                {/* Employee routes */}
                <Route 
                    path="/employee/*" 
                    element={
                        <PrivateRoute roles={['employee']}>
                            <EmployeeLayout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    {employeeRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={route.element}
                        />
                    ))}
                </Route>

                {/* Default redirect */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <DefaultRedirect />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </AuthProvider>
    );
};

// Component xử lý redirect mặc định
const DefaultRedirect = () => {
    const { user } = useAuth();
    return (
        <Navigate 
            to={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} 
            replace 
        />
    );
};

export default App; 