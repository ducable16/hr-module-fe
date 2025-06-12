import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import './App.css';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from './config/api';
import { UserContext } from './context/UserContext';
import type { UserInfo } from './context/UserContext';
import { authFetch } from './utils/authFetch';
import { message as antdMessage, Button } from 'antd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

antdMessage.success('Test message from App');

function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      setLoading(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/employee/info`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({
            name: `${data.data.firstName || ''} ${data.data.lastName || ''}`.trim(),
            role: data.data.role || 'Employee',
            avatarUrl: data.data.avatarUrl,
            employeeId: data.data.employeeId,
            email: data.data.email,
          });
        }
      } catch {}
      setLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={user}>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-center" autoClose={4000} />
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
