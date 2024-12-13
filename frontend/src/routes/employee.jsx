import { DashboardOutlined, FormOutlined } from '@ant-design/icons';
import BatchList from '../components/Employee/BatchList';
import BatchForm from '../components/Employee/BatchForm';
import BatchEdit from '../components/Employee/BatchEdit';
import BatchDetail from '../components/Employee/BatchDetail';
import DeclarationForm from '../components/Employee/DeclarationForm';
import EmployeeDashboard from '../components/Employee/EmployeeDashboard';

// Định nghĩa routes cho employee
export const employeeRoutes = [
    {
        path: 'dashboard',
        element: <EmployeeDashboard />,
    },
    {
        path: 'declarations/create/batch',
        element: <BatchList />,
    },
    {
        path: 'declarations/create/batch/new',
        element: <BatchForm />,
    },
    {
        path: 'declarations/edit/batch/:id',
        element: <BatchEdit />,
    },
    {
        path: 'declarations/batch/:id',
        element: <BatchDetail />,
    },
    {
        path: 'declarations/:batchId/create',
        element: <DeclarationForm />,
    }
];

// Menu items cho sidebar
export const employeeMenuItems = [
    {
        key: '/employee/dashboard',
        icon: <DashboardOutlined />,
        label: 'Tổng quan',
    },
    {
        key: '/employee/declarations/create/batch',
        icon: <FormOutlined />,
        label: 'Quản lý đợt kê khai',
    }
]; 