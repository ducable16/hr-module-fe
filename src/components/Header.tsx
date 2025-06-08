import React, { useEffect, useState, createContext, useContext } from 'react';
import { Layout, Avatar, Dropdown, Menu, Spin } from 'antd';
import { API_BASE_URL } from '../config/api';

const { Header } = Layout;

export interface UserInfo {
  name: string;
  role: string;
  avatarUrl?: string;
  employeeId: number;
  email: string;
}

export const UserContext = createContext<UserInfo | null>(null);
export const useUser = () => useContext(UserContext);

const AppHeader: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/employee/info`, {
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

  const handleLogout = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={user}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: 64 }}>
        {loading ? (
          <Spin />
        ) : user ? (
          <>
            <Avatar src={user.avatarUrl} style={{ backgroundColor: '#1890ff', marginRight: 12 }}>
              {user.name?.[0] || 'U'}
            </Avatar>
            <span style={{ marginRight: 16 }}>{user.name} ({user.role})</span>
          </>
        ) : (
          <>
            <Avatar style={{ backgroundColor: '#1890ff', marginRight: 12 }}>U</Avatar>
            <span style={{ marginRight: 16 }}>User Name (Role)</span>
          </>
        )}
        <a onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</a>
      </Header>
    </UserContext.Provider>
  );
};

export default AppHeader; 