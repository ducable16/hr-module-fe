import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Popconfirm, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { API_BASE_URL } from '../../config/api';
import { authFetch } from '../../utils/authFetch';
import { useUser } from '../../context/UserContext';
import './EmployeeList.css';
import { toast } from 'react-toastify';

interface EmployeeDto {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  dob: string;
  createdAt: string;
  updatedAt: string;
}

interface ParticipationPeriodDto {
  startDate: string;
  endDate: string;
  workloadPercent: number;
}

const EmployeeList: React.FC = () => {
  const [data, setData] = useState<EmployeeDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDto | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [roleList, setRoleList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [roleLoadingId, setRoleLoadingId] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyEmployeeId, setHistoryEmployeeId] = useState<number | null>(null);
  const user = useUser();

  dayjs.extend(customParseFormat);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/employee/role-list`);
        if (res.ok) {
          const result = await res.json();
          setRoleList(Array.isArray(result.data) ? result.data : []);
        }
      } catch {}
    };
    fetchRoles();
  }, []);

  const fetchEmployees = async (page = 1, size = 10, role?: string) => {
    setLoading(true);
    try {
      if (user?.role === 'ADMIN') {
        let url = `${API_BASE_URL}/employee/admin?page=${page - 1}&size=${size}`;
        if (role) url += `&role=${role}`;
        const res = await authFetch(url);
        if (res.ok) {
          const result = await res.json();
          setData(Array.isArray(result.data?.content) ? result.data.content : []);
          setPagination({
            current: page,
            pageSize: size,
            total: result.data?.totalElements || 0,
          });
        } else {
          toast.error('Failed to fetch employees');
        }
      } else if (user) {
        const token = localStorage.getItem('accessToken');
        const res = await authFetch(`${API_BASE_URL}/employee/info`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData(result.data ? [result.data] : []);
          setPagination({ current: 1, pageSize: 10, total: 1 });
        } else {
          toast.error('Failed to fetch employee info');
        }
      }
    } catch {
      toast.error('Failed to fetch employees');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees(1, 10, filterRole);
    // eslint-disable-next-line
  }, [filterRole, user]);

  const showAddModal = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (record: EmployeeDto) => {
    setEditingEmployee(record);
    setIsModalOpen(true);
    setTimeout(() => {
      form.setFieldsValue({
        employeeId: record.employeeId,
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        dob: record.dob ? dayjs(record.dob, 'DD-MM-YYYY') : null,
        role: record.role,
      });
    }, 0);
  };

  const handleDelete = async (employeeId: number) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/employee/${employeeId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Employee deleted successfully');
        fetchEmployees(pagination.current, pagination.pageSize, filterRole);
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingEmployee) {
        // Update
        const res = await authFetch(`${API_BASE_URL}/employee`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: editingEmployee.employeeId,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            dob: values.dob ? values.dob.format('DD-MM-YYYY') : null,
            role: values.role,
          }),
        });
        if (res.ok) {
          toast.success('Employee updated successfully');
          setIsModalOpen(false);
          form.resetFields();
          fetchEmployees(pagination.current, pagination.pageSize, filterRole);
        } else {
          toast.error('Update failed');
        }
      } else {
        // Create
        const res = await authFetch(`${API_BASE_URL}/employee`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            dob: values.dob ? values.dob.format('DD-MM-YYYY') : null,
            role: values.role,
          }),
        });
        if (res.ok) {
          toast.success('Employee created successfully');
          setIsModalOpen(false);
          form.resetFields();
          fetchEmployees(1, pagination.pageSize, filterRole);
        } else {
          toast.error('Create failed');
        }
      }
    } catch {
      toast.error('Save failed');
    }
  };

  const handleShowHistory = async (employeeId: number) => {
    setHistoryLoading(true);
    setHistoryEmployeeId(employeeId);
    setHistoryData([]);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await authFetch(`${API_BASE_URL}/employee/project-history/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setHistoryData(Array.isArray(result.data) ? result.data : []);
      } else {
        setHistoryData([]);
        toast.error('Failed to fetch assignment history');
      }
    } catch {
      setHistoryData([]);
      toast.error('Failed to fetch assignment history');
    }
    setHistoryLoading(false);
  };

  const columns = [
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 130, render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span> },
    { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 110 },
    { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 150 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 280, ellipsis: false, render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span> },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string, record: EmployeeDto) => {
      if (user?.role !== 'ADMIN') {
        return <span>{role}</span>;
      }
      if (editingRoleId === record.employeeId) {
        return (
          <Select
            size="small"
            style={{ width: 120 }}
            defaultValue={role}
            loading={roleLoadingId === record.employeeId}
            onChange={async (newRole) => {
              setRoleLoadingId(record.employeeId);
              try {
                const res = await authFetch(`${API_BASE_URL}/employee/change-role`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ employeeId: record.employeeId, role: newRole }),
                });
                if (res.ok) {
                  toast.success('Role updated successfully');
                  setEditingRoleId(null);
                  fetchEmployees(pagination.current, pagination.pageSize, filterRole);
                } else {
                  toast.error('Update role failed');
                }
              } catch {
                toast.error('Update role failed');
              }
              setRoleLoadingId(null);
            }}
            onBlur={() => setEditingRoleId(null)}
          >
            {roleList.map(r => (
              <Select.Option key={r} value={r}>{r}</Select.Option>
            ))}
          </Select>
        );
      }
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{role}</span>
          <Button size="small" type="link" style={{ marginLeft: 'auto', paddingRight: 0 }} onClick={() => setEditingRoleId(record.employeeId)}>Edit</Button>
        </div>
      );
    } },
    { title: 'DOB', dataIndex: 'dob', key: 'dob', width: 110 },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text ? dayjs(text).format('DD-MM-YYYY') : ''}</span> },
    { title: 'Updated At', dataIndex: 'updatedAt', key: 'updatedAt', width: 180, render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text ? dayjs(text).format('DD-MM-YYYY') : ''}</span> },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: EmployeeDto) => (
        <Space>
          {user?.role === 'ADMIN' && (
            <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          )}
          <Button icon={<HistoryOutlined />} onClick={() => handleShowHistory(record.employeeId)} />
          {(
            user?.role === 'ADMIN' && record.role !== 'ADMIN' ||
            (user && user.employeeId !== record.employeeId && record.role !== 'ADMIN')
          ) && (
            <Popconfirm title="Are you sure to delete?" onConfirm={() => handleDelete(record.employeeId)}>
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Employee List</h2>
      {user?.role === 'ADMIN' && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            Add Employee
          </Button>
          <Select
            allowClear
            placeholder="Filter by role"
            style={{ width: 200 }}
            value={filterRole}
            onChange={val => {
              setFilterRole(val);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
          >
            {roleList.map(role => (
              <Select.Option key={role} value={role}>{role}</Select.Option>
            ))}
          </Select>
        </div>
      )}
      <Table
        rowKey="employeeId"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={user?.role === 'ADMIN' ? {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
            fetchEmployees(page, pageSize, filterRole);
          },
        } : false}
        scroll={{ y: 500, x: 1200 }}
      />
      <Modal
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose={false}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {editingEmployee && (
            <Form.Item name="employeeId" label="Employee ID">
              <Input disabled />
            </Form.Item>
          )}
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Please input first name!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Please input last name!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please input email!' }, { type: 'email', message: 'Please enter a valid email!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="dob" label="Date of Birth">
            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>
          {!editingEmployee && (
            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select role!' }]}> 
              <Select placeholder="Select role">
                {roleList.map(role => (
                  <Select.Option key={role} value={role}>{role}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
      {/* Assignment History Table */}
      {historyEmployeeId && (
        <div style={{ marginTop: 32 }}>
          <h3>Assignment History for Employee ID: {historyEmployeeId}</h3>
          {historyLoading ? (
            <div>Loading...</div>
          ) : historyData.length === 0 ? (
            <div>No data found.</div>
          ) : (
            <Table
              rowKey={record => record.projectId}
              columns={[
                { title: 'Project Code', dataIndex: 'projectCode', key: 'projectCode', width: 120 },
                { title: 'Project Name', dataIndex: 'projectName', key: 'projectName', width: 180 },
                { title: 'Project Duration', key: 'projectDuration', width: 200, render: (_: any, record: any) => `${record.projectStartDate} - ${record.projectEndDate ? record.projectEndDate : 'Ongoing'}` },
                { title: 'Participation Period', key: 'participationPeriod', width: 220, render: (_: any, record: any) => (
                  record.participations && record.participations.length > 0 ? (
                    <div>
                      {[...record.participations]
                        .sort((a, b) => dayjs(b.startDate, 'DD-MM-YYYY').valueOf() - dayjs(a.startDate, 'DD-MM-YYYY').valueOf())
                        .map((p: ParticipationPeriodDto, i: number) => (
                          <div key={i}>{p.startDate} - {p.endDate ? p.endDate : 'Ongoing'}</div>
                        ))}
                    </div>
                  ) : <span>No participation periods</span>
                ) },
                { title: 'Workload (%)', key: 'workload', width: 120, render: (_: any, record: any) => (
                  record.participations && record.participations.length > 0 ? (
                    <div>
                      {[...record.participations]
                        .sort((a, b) => dayjs(b.startDate, 'DD-MM-YYYY').valueOf() - dayjs(a.startDate, 'DD-MM-YYYY').valueOf())
                        .map((p: ParticipationPeriodDto, i: number) => (
                          <div key={i}>{p.workloadPercent}</div>
                        ))}
                    </div>
                  ) : <span>-</span>
                ) },
              ]}
              dataSource={historyData}
              pagination={false}
              bordered
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeList; 