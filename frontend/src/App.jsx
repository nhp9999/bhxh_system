import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
                    element={<Navigate to="/employee/dashboard" replace />}
                />
            </Routes>
        </AuthProvider>
    );
};

export default App; 