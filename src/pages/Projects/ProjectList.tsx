import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Popconfirm, Space, AutoComplete } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config/api';
import { authFetch } from '../../utils/authFetch';
import { useUser } from '../../context/UserContext';
import './ProjectList.css';
import { toast } from 'react-toastify';

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
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [isEditPeriodModalOpen, setIsEditPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [periodForm] = Form.useForm();
  const [pmOptions, setPmOptions] = useState<any[]>([]);
  const [pmInput, setPmInput] = useState('');

  const fetchProjects = async (page = 1, size = 10) => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    let url = '';
    if (user.role === 'ADMIN') url = `${API_BASE_URL}/project/admin?page=${page - 1}&size=${size}`;
    else url = `${API_BASE_URL}/project/${user.employeeId}`;
    try {
      const res = await authFetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        if (user.role === 'ADMIN') {
          setData(Array.isArray(result.data?.content) ? result.data.content : []);
          setPagination({
            current: page,
            pageSize: size,
            total: result.data?.totalElements || 0,
          });
        } else {
          setData(Array.isArray(result.data) ? result.data : []);
        }
      } else {
        toast.error('Failed to fetch projects');
      }
    } catch { toast.error('Failed to fetch projects'); }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchProjects(1, 10);
    else fetchProjects();
  }, [user]);

  const handleAdd = async (values: any) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await authFetch(`${API_BASE_URL}/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          projectName: values.projectName,
          pmEmail: values.pmEmail,
          startDate: values.startDate.format('DD-MM-YYYY'),
          endDate: values.endDate ? values.endDate.format('DD-MM-YYYY') : null,
          description: values.description,
        }),
      });
      if (res.ok) {
        console.log('Project created!');
        toast.success('Project created successfully');
        setIsModalOpen(false);
        form.resetFields();
        // Refetch
        const url = `${API_BASE_URL}/project/admin?page=${pagination.current - 1}&size=${pagination.pageSize}`;
        const refetchRes = await authFetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const refetchResult = await refetchRes.json();
        setData(Array.isArray(refetchResult.data?.content) ? refetchResult.data.content : []);
        setPagination(prev => ({ ...prev, total: refetchResult.data?.totalElements || 0 }));
      } else {
        toast.error('Create failed');
      }
    } catch {
      toast.error('Create failed');
    }
  };

  const handleEdit = async (values: any) => {
    const token = localStorage.getItem('accessToken');
    // Lấy projectId từ editingProject
    const projectId = (editingProject as any)?.projectId;
    if (!projectId) {
      toast.error('Cannot find projectId for this project!');
      return;
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/project`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          projectId,
          projectName: values.projectName,
          pmEmail: values.pmEmail,
          startDate: values.startDate.format('DD-MM-YYYY'),
          endDate: values.endDate ? values.endDate.format('DD-MM-YYYY') : null,
          description: values.description,
        }),
      });
      if (res.ok) {
        toast.success('Project updated successfully');
        setIsModalOpen(false);
        form.resetFields();
        // Refetch
        const url = `${API_BASE_URL}/project/admin?page=${pagination.current - 1}&size=${pagination.pageSize}`;
        const refetchRes = await authFetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const refetchResult = await refetchRes.json();
        setData(Array.isArray(refetchResult.data?.content) ? refetchResult.data.content : []);
        setPagination(prev => ({ ...prev, total: refetchResult.data?.totalElements || 0 }));
      } else {
        toast.error('Update failed');
      }
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (projectCode: string) => {
    const token = localStorage.getItem('accessToken');
    // Tìm project theo projectCode để lấy projectId
    const project = data.find(proj => proj.projectCode === projectCode);
    if (!project || !(project as any).projectId) {
      toast.error('Cannot find projectId for this project!');
      return;
    }
    const projectId = (project as any).projectId;
    try {
      const res = await authFetch(`${API_BASE_URL}/project/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(data.filter(proj => (proj as any).projectId !== projectId));
        toast.success('Deleted successfully');
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Delete failed');
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
        startDate: record.startDate ? dayjs(record.startDate, 'DD-MM-YYYY') : null,
        endDate: record.endDate ? dayjs(record.endDate, 'DD-MM-YYYY') : null,
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
      toast.error('Save failed');
    }
  };

  const handleViewPeriods = async (project: any) => {
    if (!user) return;
    setSelectedProject(project);
    setPeriodLoading(true);
    setPeriods([]);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await authFetch(`${API_BASE_URL}/employee/${project.projectId}/${user.employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setPeriods(Array.isArray(result.data) ? result.data : []);
      } else {
        setPeriods([]);
        window.alert('Failed to fetch participation periods');
      }
    } catch {
      setPeriods([]);
      window.alert('Failed to fetch participation periods');
    }
    setPeriodLoading(false);
  };

  const showEditPeriodModal = (period: any) => {
    setEditingPeriod(period);
    setIsEditPeriodModalOpen(true);
    setTimeout(() => {
      periodForm.setFieldsValue({
        startDate: period.startDate ? dayjs(period.startDate, 'DD-MM-YYYY') : null,
        endDate: period.endDate ? dayjs(period.endDate, 'DD-MM-YYYY') : null,
        workloadPercent: period.workloadPercent,
      });
    }, 0);
  };

  const handleEditPeriodOk = async () => {
    try {
      const values = await periodForm.validateFields();
      const token = localStorage.getItem('accessToken');
      const assignmentId = editingPeriod.assignmentId;
      const body = {
        assignmentId,
        workloadPercent: values.workloadPercent,
        startDate: values.startDate ? values.startDate.format('DD-MM-YYYY') : null,
        endDate: values.endDate ? values.endDate.format('DD-MM-YYYY') : null,
      };
      const res = await authFetch(`${API_BASE_URL}/project/update-assignment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setIsEditPeriodModalOpen(false);
        setEditingPeriod(null);
        periodForm.resetFields();
        toast.success('Cập nhật thành công');
        // Refetch lại participation periods
        if (selectedProject) handleViewPeriods(selectedProject);
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch {
      toast.error('Lưu thất bại');
    }
  };

  const columns = [
    { title: 'Project Code', dataIndex: 'projectCode', key: 'projectCode', width: 120, render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span> },
    { title: 'Project Name', dataIndex: 'projectName', key: 'projectName', width: 180 },
    { title: 'PM Email', dataIndex: 'pmEmail', key: 'pmEmail', width: 200, render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span> },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', width: 120, render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{date}</span> },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate', width: 120, render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{date}</span> },
    { title: 'Description', dataIndex: 'description', key: 'description', width: 220 },
    (isAdmin ? {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: ProjectDto) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Popconfirm title="Are you sure to delete?" onConfirm={() => handleDelete(record.projectCode)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    } :
    (user && user.role !== 'ADMIN' && user.role !== 'PM') ? {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, record: ProjectDto) => (
        <Button icon={<EyeOutlined />} onClick={() => handleViewPeriods(record)}>
          View My Periods
        </Button>
      ),
    } : null),
  ].filter(col => col !== null);

  // Bảng participation periods
  const periodColumns = [
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', width: 120 },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate', width: 120 },
    { title: 'Workload (%)', dataIndex: 'workloadPercent', key: 'workloadPercent', width: 120 },
    ...(user && user.role === 'PM' ? [{
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button icon={<EditOutlined />} onClick={() => showEditPeriodModal(record)}>
          Edit
        </Button>
      ),
    }] : []),
  ].filter(col => col !== null);

  const handleSearchPM = (value: string) => {
    setPmInput(value);
    if (!value) {
      setPmOptions([]);
      return;
    }
    setTimeout(async () => {
      const token = localStorage.getItem('accessToken');
      const res = await authFetch(`${API_BASE_URL}/employee/search?role=PM&email=${encodeURIComponent(value)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setPmOptions(Array.isArray(result.data) ? result.data : []);
      }
    }, 200);
  };

  return (
    <div>
      <h2>Project List</h2>
      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            Add Project
          </Button>
        </div>
      )}
      <Table columns={columns} dataSource={data} pagination={pagination} />

      {/* Hiển thị periods khi chọn project */}
      {selectedProject && (
        <div style={{ marginTop: 32 }}>
          <h3>Participation Periods for: {selectedProject.projectName}</h3>
          <Table
            columns={periodColumns}
            dataSource={periods}
            loading={periodLoading}
            pagination={false}
            rowKey={record => record.assignmentId}
          />
        </div>
      )}

      <Modal
        title="Add Project"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectName" label="Project Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="pmEmail" label="PM Email" rules={[{ required: true }, { type: 'email', message: 'Please enter a valid email!' }]}>
            <AutoComplete
              placeholder="Search PM by email"
              onSearch={handleSearchPM}
              options={pmOptions.map(e => ({ value: e.email, label: `${e.fullName} (${e.email}) - ${e.role}` }))}
              filterOption={false}
              value={pmInput}
              onSelect={(value, option) => {
                setPmInput(value);
                form.setFieldsValue({ pmEmail: value });
              }}
              onChange={val => {
                setPmInput(val);
                form.setFieldsValue({ pmEmail: val });
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }, ({ getFieldValue }) => ({
            validator(_, value) {
              const endDate = getFieldValue('endDate');
              if (!value || !endDate) return Promise.resolve();
              if (value.isAfter(endDate, 'day')) {
                return Promise.reject(new Error('Start date must be before end date!'));
              }
              return Promise.resolve();
            },
          })]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Edit Period"
        open={isEditPeriodModalOpen}
        onOk={handleEditPeriodOk}
        onCancel={() => setIsEditPeriodModalOpen(false)}
      >
        <Form form={periodForm} layout="vertical">
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="workloadPercent" label="Workload (%)">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectList; 