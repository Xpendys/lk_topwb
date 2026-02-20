import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CabinetPage from './pages/CabinetPage';
import ProtectedRoute from './components/ProtectedRoute';
import { apiRequest } from './api/client';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    apiRequest('/api/user/me')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setCheckedAuth(true));
  }, []);

  if (!checkedAuth) {
    return <div className="card">Проверка сессии...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/cabinet' : '/login'} replace />} />
      <Route path="/login" element={<LoginPage onAuth={setIsAuthenticated} />} />
      <Route path="/register" element={<RegisterPage onAuth={setIsAuthenticated} />} />
      <Route
        path="/cabinet"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <CabinetPage onLogout={() => setIsAuthenticated(false)} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
