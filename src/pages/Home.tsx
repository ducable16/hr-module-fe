import React, { PropsWithChildren } from 'react';
import { Layout } from 'antd';
import AppHeader from '../components/Header';
import Sidebar from '../components/Sidebar';

const { Content } = Layout;

const Home: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: 0, padding: 24, background: '#fff', minHeight: 'calc(100vh - 64px)' }}>
          {/* Hiển thị component theo menu đã chọn, ví dụ: <ProjectList /> */}
          {children ? children : <div>Welcome to Mini HR System!</div>}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home; 