import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Các route công khai */}
        <Route path="/login" element={<Login />} />
        
        {/* Route được bảo vệ */}
        <Route
          path="/employee/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        
        {/* Các route khác... */}
      </Routes>
    </Router>
  );
}

export default App; 