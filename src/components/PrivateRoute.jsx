import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // Kiểm tra xem người dùng đã đăng nhập chưa
  const isAuthenticated = localStorage.getItem('token');
  
  // Nếu chưa đăng nhập, chuyển hướng về trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Nếu đã đăng nhập, hiển thị các component con
  return children;
};

export default PrivateRoute; 