import React from 'react';
import { Layout, Avatar, Spin } from 'antd';
import { useUser } from '../context/UserContext';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const user = useUser();

  const handleLogout = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await fetch('/auth/logout', {
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
    <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!user ? (
          <Spin />
        ) : (
          <>
            <Avatar src={user.avatarUrl} style={{ backgroundColor: '#1890ff', marginRight: 12 }}>
              {user.name?.[0] || 'U'}
            </Avatar>
            <span style={{ fontWeight: 500 }}>{user.name} ({user.role})</span>
          </>
        )}
      </div>
      <a onClick={handleLogout} style={{ cursor: 'pointer', fontWeight: 500 }}>Logout</a>
    </Header>
  );
};

export default AppHeader; 