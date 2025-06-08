import React, { useEffect, useState, useRef } from 'react';
import { Select, InputNumber, DatePicker, Button, Form, message, Table, AutoComplete, Space, Typography } from 'antd';
import { API_BASE_URL } from '../../config/api';
import { useUser } from '../../context/UserContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title } = Typography;

interface ProjectDto {
  projectId: number;
  projectCode: string;
  projectName: string;
}

interface EmployeeSearchDto {
  employeeId: number;
  fullName: string;
  email: string;
}

interface ProjectMemberDto {
  employeeCode: string;
  fullName: string;
  workloadPercent: number;
  startDate: string;
  endDate: string;
}

const AssignmentList: React.FC = () => {
  const user = useUser();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [members, setMembers] = useState<ProjectMemberDto[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeSearchDto[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<number | null>(null);
  const [form] = Form.useForm();

  const isPM = user?.role === 'PM';

  // Fetch projects PM quản lý
  useEffect(() => {
    if (!isPM) return;
    const fetchProjects = async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/project/admin`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setProjects(Array.isArray(result.data) ? result.data : []);
      }
    };
    fetchProjects();
  }, [isPM]);

  // Fetch members when select project
  useEffect(() => {
    if (!selectedProject) return;
    const fetchMembers = async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/project/${selectedProject}/members`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setMembers(Array.isArray(result.data) ? result.data : []);
      } else {
        setMembers([]);
      }
    };
    fetchMembers();
  }, [selectedProject]);

  // Debounce search employee
  const handleSearchEmployee = (value: string) => {
    setSearchValue(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value) {
      setEmployeeOptions([]);
      return;
    }
    searchTimeout.current = window.setTimeout(async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/employee/search?email=${encodeURIComponent(value)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setEmployeeOptions(Array.isArray(result) ? result : []);
      }
    }, 100);
  };

  const handleAssign = async (values: any) => {
    if (!selectedProject) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE_URL}/project/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          employeeId: values.employeeId,
          projectId: selectedProject,
          workloadPercent: values.workloadPercent,
          startDate: values.startDate.format('YYYY-MM-DD'),
          endDate: values.endDate.format('YYYY-MM-DD'),
        }),
      });
      if (res.ok) {
        message.success('Assigned successfully');
        form.resetFields();
        // Refetch members
        const refetch = await fetch(`${API_BASE_URL}/project/${selectedProject}/members`, { headers: { Authorization: `Bearer ${token}` } });
        const result = await refetch.json();
        setMembers(Array.isArray(result.data) ? result.data : []);
      } else {
        message.error('Assign failed');
      }
    } catch {
      message.error('Assign failed');
    }
  };

  const columns = [
    { title: 'Employee Code', dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: 'Full Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Workload (%)', dataIndex: 'workloadPercent', key: 'workloadPercent' },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate' },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
  ];

  if (!isPM) {
    return <div style={{ padding: 24 }}><Title level={4}>Only PM can assign employees to projects.</Title></div>;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 48, width: '100%' }}>
        <Title level={3} style={{ marginBottom: 32 }}>Assign Employee to Project</Title>
        <Form form={form} layout="vertical" onFinish={handleAssign} style={{ marginBottom: 40 }}>
          <Form.Item name="projectId" label="Project" rules={[{ required: true, message: 'Select project!' }]}
            style={{ marginBottom: 24 }}>
            <Select
              placeholder="Select project"
              onChange={pid => setSelectedProject(pid)}
              value={selectedProject || undefined}
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {projects.map(p => (
                <Option key={p.projectId} value={p.projectId}>{p.projectCode} - {p.projectName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Select employee!' }]}
            style={{ marginBottom: 24 }}>
            <AutoComplete
              placeholder="Search by email"
              onSearch={handleSearchEmployee}
              options={employeeOptions.map(e => ({ value: e.employeeId, label: `${e.fullName} (${e.email})` }))}
              filterOption={false}
              open={!!searchValue && employeeOptions.length > 0}
              onSelect={() => setSearchValue('')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="workloadPercent" label="Workload %" rules={[{ required: true, message: 'Enter workload!' }]}
            style={{ marginBottom: 24 }}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Select start date!' }]}
            style={{ marginBottom: 24 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" rules={[{ required: true, message: 'Select end date!' }]}
            style={{ marginBottom: 24 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} style={{ minWidth: 120 }}>Assign</Button>
          </Form.Item>
        </Form>
        <Table
          rowKey="employeeCode"
          columns={columns}
          dataSource={members}
          pagination={false}
          scroll={{ y: 400 }}
          bordered
          title={() => <b>Project Members</b>}
        />
      </div>
    </div>
  );
};

export default AssignmentList; 