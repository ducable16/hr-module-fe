import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Popconfirm, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config/api';
import { useUser } from '../../context/UserContext';

interface ProjectDto {
  projectCode: string;
  projectName: string;
  pmEmail: string;
  startDate: string;
  endDate: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

const ProjectList: React.FC = () => {
  const user = useUser();
  const [data, setData] = useState<ProjectDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);
  const [form] = Form.useForm();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      const token = localStorage.getItem('accessToken');
      let url = '';
      if (user.role === 'ADMIN') url = `${API_BASE_URL}/project/admin`;
      else url = `${API_BASE_URL}/project/employee/${user.employeeId}`;
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const result = await res.json();
          setData(Array.isArray(result.data) ? result.data : []);
        } else {
          message.error('Failed to fetch projects');
        }
      } catch (e) { message.error('Failed to fetch projects'); }
    };
    fetchProjects();
  }, [user]);

  const handleAdd = async (values: any) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE_URL}/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          projectName: values.projectName,
          pmEmail: values.pmEmail,
          startDate: values.startDate.format('YYYY-MM-DD'),
          endDate: values.endDate.format('YYYY-MM-DD'),
          description: values.description,
        }),
      });
      if (res.ok) {
        message.success('Created successfully');
        setIsModalOpen(false);
        form.resetFields();
        // Refetch
        const url = `${API_BASE_URL}/project/admin`;
        const refetchRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const refetchResult = await refetchRes.json();
        setData(Array.isArray(refetchResult.data) ? refetchResult.data : []);
      } else {
        message.error('Create failed');
      }
    } catch {
      message.error('Create failed');
    }
  };

  const handleEdit = async (values: any) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE_URL}/project`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...values,
          projectCode: editingProject?.projectCode,
          startDate: values.startDate.format('YYYY-MM-DD'),
          endDate: values.endDate.format('YYYY-MM-DD'),
        }),
      });
      if (res.ok) {
        message.success('Updated successfully');
        setIsModalOpen(false);
        form.resetFields();
        // Refetch
        const url = `${API_BASE_URL}/project/admin`;
        const refetchRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const refetchResult = await refetchRes.json();
        setData(Array.isArray(refetchResult.data) ? refetchResult.data : []);
      } else {
        message.error('Update failed');
      }
    } catch {
      message.error('Update failed');
    }
  };

  const handleDelete = async (projectCode: string) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE_URL}/project/${projectCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(data.filter(proj => proj.projectCode !== projectCode));
        message.success('Deleted successfully');
      } else {
        message.error('Delete failed');
      }
    } catch {
      message.error('Delete failed');
    }
  };

  const showAddModal = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (record: ProjectDto) => {
    setEditingProject(record);
    setIsModalOpen(true);
    setTimeout(() => {
      form.setFieldsValue({
        projectCode: record.projectCode ?? '',
        projectName: record.projectName ?? '',
        pmEmail: record.pmEmail ?? '',
        startDate: record.startDate ? dayjs(record.startDate) : null,
        endDate: record.endDate ? dayjs(record.endDate) : null,
        description: record.description ?? '',
      });
    }, 0);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingProject) await handleEdit(values);
      else await handleAdd(values);
    } catch {
      message.error('Save failed');
    }
  };

  const columns = [
    { title: 'Project Code', dataIndex: 'projectCode', key: 'projectCode' },
    { title: 'Project Name', dataIndex: 'projectName', key: 'projectName' },
    { title: 'PM Email', dataIndex: 'pmEmail', key: 'pmEmail' },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate' },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    isAdmin && {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ProjectDto) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Popconfirm title="Are you sure to delete?" onConfirm={() => handleDelete(record.projectCode)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(Boolean);

  return (
    <div>
      <h2>Project List</h2>
      {isAdmin && (
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} style={{ marginBottom: 16 }}>
          Add Project
        </Button>
      )}
      <Table rowKey="projectCode" columns={columns as any} dataSource={data} scroll={{ y: 500 }} />
      <Modal
        title={editingProject ? 'Edit Project' : 'Add Project'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose={false}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {editingProject && (
            <Form.Item name="projectCode" label="Project Code">
              <Input disabled />
            </Form.Item>
          )}
          <Form.Item name="projectName" label="Project Name" rules={[{ required: true, message: 'Please input project name!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="pmEmail" label="PM Email" rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Please select start date!' }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" rules={[{ required: true, message: 'Please select end date!' }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectList; 