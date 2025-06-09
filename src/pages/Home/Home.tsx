import React from 'react';
import type { PropsWithChildren } from 'react';
import { Layout } from 'antd';
import AppHeader from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import './Home.css';

const { Content } = Layout;

const Home: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <Layout className="home-layout">
      <Sidebar />
      <Layout>
        <AppHeader />
        <Content className="home-content">
          {/* Hiển thị component theo menu đã chọn, ví dụ: <ProjectList /> */}
          {children ? children : <div>Welcome to Mini HR System!</div>}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home; 