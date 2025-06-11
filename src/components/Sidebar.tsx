import React from 'react';
import { Layout, Menu } from 'antd';
import {
  ProjectOutlined, TeamOutlined, UserOutlined, HistoryOutlined, DashboardOutlined,
  SmileOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const { Sider } = Layout;

const Logo = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 1.6rem;
  font-weight: bold;
  color: #0a66c2;
  letter-spacing: 1px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding-left: 24px;
`;

const StyledMenu = styled(Menu)`
  && {
    padding-top: 12px;
    .ant-menu-item {
      margin-bottom: 8px;
      border-radius: 8px;
      transition: background 0.2s, color 0.2s;
      font-size: 1.05rem;
      padding-left: 24px !important;
    }
    .ant-menu-item-selected {
      background: #e6f0fa !important;
      color: #0a66c2 !important;
      font-weight: 600;
    }
    .ant-menu-item:hover {
      background: #f0f6fa !important;
      color: #0a66c2 !important;
    }
    .ant-menu-item .anticon {
      font-size: 18px;
    }
    .ant-menu-item-group-title {
      font-size: 0.95rem;
      color: #888;
      margin-left: 8px;
      margin-top: 16px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }
`;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const selectedKey = location.pathname === '/' ? 'dashboard' : location.pathname.replace('/', '');

  return (
    <Sider width={250} style={{ background: '#fff', boxShadow: '2px 0 8px #f0f1f2', position: 'relative', minHeight: '100vh' }}>
      <Logo>
        <SmileOutlined style={{ color: '#0a66c2', fontSize: 28, marginRight: 10 }} />
        HR
      </Logo>
      <StyledMenu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ height: '100%', borderRight: 0, border: 'none' }}
        onClick={({ key }) => {
          if (key === 'dashboard') navigate('/home');
          else if (key === 'projects' && user?.role === 'PM') navigate('/pm-projects');
          else navigate(`/${key}`);
        }}
      >
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>Dashboard</Menu.Item>
        <Menu.Item key="projects" icon={<ProjectOutlined />}>Projects</Menu.Item>
        <Menu.Item key="employees" icon={<TeamOutlined />}>Employees</Menu.Item>
        <Menu.Item key="assignments" icon={<UserOutlined />}>Assignments</Menu.Item>
        <Menu.Item key="history" icon={<HistoryOutlined />}>History</Menu.Item>
      </StyledMenu>
    </Sider>
  );
};

export default Sidebar; 