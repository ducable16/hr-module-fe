import React, { useEffect, useState } from 'react';
import { Table, message, Button, Modal } from 'antd';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config/api';
import { authFetch } from '../../utils/authFetch';
import { EyeOutlined } from '@ant-design/icons';

const PMProjectList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberData, setMemberData] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await authFetch(`${API_BASE_URL}/project/project-manager`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData(Array.isArray(result.data) ? result.data : []);
        } else {
          message.error('Failed to fetch managed projects');
        }
      } catch {
        message.error('Failed to fetch managed projects');
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const handleViewMembers = async (project: any) => {
    setSelectedProject(project);
    setMemberLoading(true);
    setMemberData([]);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await authFetch(`${API_BASE_URL}/project/${project.projectId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setMemberData(Array.isArray(result.data) ? result.data : []);
      } else {
        setMemberData([]);
        message.error('Failed to fetch project members');
      }
    } catch {
      setMemberData([]);
      message.error('Failed to fetch project members');
    }
    setMemberLoading(false);
  };

  const columns = [
    { title: 'Project ID', dataIndex: 'projectId', key: 'projectId', width: 80 },
    { title: 'Project Code', dataIndex: 'projectCode', key: 'projectCode', width: 120 },
    { title: 'Project Name', dataIndex: 'projectName', key: 'projectName', width: 180 },
    { title: 'PM Email', dataIndex: 'pmEmail', key: 'pmEmail', width: 180 },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', width: 120, render: (date: string) => date || '-' },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate', width: 120, render: (date: string) => date || '-' },
    { title: 'Description', dataIndex: 'description', key: 'description', width: 200 },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (date: string) => date ? dayjs(date).format('DD-MM-YYYY') : '-' },
    { title: 'Updated At', dataIndex: 'updatedAt', key: 'updatedAt', width: 150, render: (date: string) => date ? dayjs(date).format('DD-MM-YYYY') : '-' },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button icon={<EyeOutlined />} onClick={() => handleViewMembers(record)}>
          View Members
        </Button>
      ),
    },
  ];

  const memberColumns = [
    { title: 'Employee Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 120 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
    { title: 'Role', dataIndex: 'role', key: 'role', width: 120 },
    { title: 'Full Name', dataIndex: 'fullName', key: 'fullName', width: 180 },
    { title: 'Workload (%)', dataIndex: 'workloadPercent', key: 'workloadPercent', width: 120 },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', width: 120, render: (date: string) => date || '-' },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate', width: 120, render: (date: string) => date || '-' },
  ];

  return (
    <div>
      <h2 style={{ textAlign: 'center', fontWeight: 700, margin: '0 0 24px 0' }}>Projects You Manage</h2>
      <Table
        rowKey={record => record.projectId}
        columns={columns}
        dataSource={data}
        loading={loading}
        bordered
        scroll={{ x: 1200 }}
        pagination={false}
      />
      {selectedProject && (
        <div style={{ marginTop: 32 }}>
          <h3>Members of Project: {selectedProject.projectName}</h3>
          <Table
            rowKey={record => record.employeeCode}
            columns={memberColumns}
            dataSource={memberData}
            loading={memberLoading}
            bordered
            pagination={false}
          />
        </div>
      )}
    </div>
  );
};

export default PMProjectList; 