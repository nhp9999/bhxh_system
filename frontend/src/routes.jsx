import React from 'react';
import { Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import EmployeeLayout from './components/Layout/EmployeeLayout';
import AdminLayout from './components/Layout/AdminLayout';
import DeclarationList from './components/Employee/DeclarationList';
import DeclarationForm from './components/Employee/DeclarationForm';
import AdminDeclarationList from './components/Admin/AdminDeclarationList';
import BHXHHistory from './components/Employee/BHXHHistory';

const routes = [
    {
        path: '/',
        element: <Navigate to="/employee/declarations" replace />
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/register',
        element: <Register />
    },
    {
        path: '/employee',
        element: <EmployeeLayout />,
        children: [
            {
                path: 'declarations',
                element: <DeclarationList />
            },
            {
                path: 'declarations/create/batch',
                element: <DeclarationForm />
            },
            {
                path: 'declarations/history',
                element: <BHXHHistory />
            }
        ]
    },
    {
        path: '/admin',
        element: <AdminLayout />,
        children: [
            {
                path: 'declarations',
                element: <AdminDeclarationList />
            }
        ]
    }
];

export default routes; 