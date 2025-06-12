import React, { useEffect, useState } from 'react';
import { Table, message, Button, Modal, Select, Space, Popconfirm, DatePicker, Form, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config/api';
import { authFetch } from '../../utils/authFetch';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PMProjectList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberData, setMemberData] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [workloadBlocks, setWorkloadBlocks] = useState<any[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<any[]>([]);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(3, 'month'),
    dayjs().add(3, 'month')
  ]);
  const [editForm] = Form.useForm();
  const [workloadRemain, setWorkloadRemain] = useState<number | null>(null);
  const watchedStartDate = Form.useWatch('startDate', editForm);
  const watchedEndDate = Form.useWatch('endDate', editForm);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        let url = '';
        if (filter === 'active') url = `${API_BASE_URL}/project/project-manager/current`;
        else url = `${API_BASE_URL}/project/project-manager/completed`;
        const res = await authFetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const result = await res.json();
          setData(Array.isArray(result.data) ? result.data : []);
        } else {
          toast.error('Failed to fetch managed projects');
        }
      } catch {
        toast.error('Failed to fetch managed projects');
      }
      setLoading(false);
      setSelectedProject(null);
    };
    fetchProjects();
  }, [filter]);

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
        toast.error('Failed to fetch project members');
      }
    } catch {
      setMemberData([]);
      toast.error('Failed to fetch project members');
    }
    setMemberLoading(false);
  };

  const fetchWorkloadBlocks = async (member: any) => {
    const now = dayjs();
    const rangeStart = range[0].format('YYYY-MM-DD');
    const rangeEnd = range[1].format('YYYY-MM-DD');
    const token = localStorage.getItem('accessToken');
    const res = await authFetch(`${API_BASE_URL}/employee/${member.employeeId}/workload-blocks?projectId=${selectedProject.projectId}&rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const result = await res.json();
      setWorkloadBlocks(Array.isArray(result.data) ? result.data : []);
    } else {
      setWorkloadBlocks([]);
    }
  };

  const handleEditMember = async (member: any) => {
    setEditingMember(member);
    setExpandedRowKeys([member.assignmentId]);
    setWorkloadBlocks([]);
    editForm.setFieldsValue({
      workloadPercent: member.workloadPercent,
      startDate: member.startDate ? dayjs(member.startDate, 'DD-MM-YYYY') : null,
      endDate: member.endDate ? dayjs(member.endDate, 'DD-MM-YYYY') : null,
    });
    await fetchWorkloadBlocks(member);
  };

  const handleCloseEditInline = () => {
    setEditingMember(null);
    setExpandedRowKeys([]);
    setWorkloadBlocks([]);
  };

  const handleUpdateAssignment = async (values: any) => {
    if (!editingMember) return;
    const token = localStorage.getItem('accessToken');
    const body = {
      assignmentId: editingMember.assignmentId,
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
      toast.success('Update successful');
      if (selectedProject) await handleViewMembers(selectedProject);
      await fetchWorkloadBlocks(editingMember);
      editForm.setFieldsValue({
        workloadPercent: values.workloadPercent,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      handleCloseEditInline();
    } else {
      let msg = 'Update failed';
      try {
        const result = await res.json();
        if (result && result.message) msg = result.message;
      } catch (e) {}
      toast.error(msg);
      await fetchWorkloadBlocks(editingMember);
    }
  };

  useEffect(() => {
    if (!editingMember) return;
    const startDate = watchedStartDate;
    const endDate = watchedEndDate;
    if (!startDate) {
      setWorkloadRemain(null);
      return;
    }
    const fetchRemain = async () => {
      const token = localStorage.getItem('accessToken');
      const body: any = {
        employeeId: editingMember.employeeId,
        startDate: startDate.format('DD-MM-YYYY'),
        endDate: endDate ? endDate.format('DD-MM-YYYY') : null,
        assignmentId: editingMember.assignmentId,
      };
      const res = await authFetch(`${API_BASE_URL}/project/workload-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const result = await res.json();
        setWorkloadRemain(result.data?.workloadPercent ?? null);
      } else {
        setWorkloadRemain(null);
      }
    };
    fetchRemain();
  }, [editingMember, watchedStartDate, watchedEndDate]);

  const handleDeleteAssignment = async (assignmentId: number) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await authFetch(`${API_BASE_URL}/project/assignment/${assignmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Delete successful');
        if (selectedProject) await handleViewMembers(selectedProject);
        setWorkloadBlocks([]);
      } else {
        let msg = 'Delete failed';
        try {
          const result = await res.json();
          if (result && result.message) msg = result.message;
        } catch (e) {}
        toast.error(msg);
      }
    } catch {
      toast.error('Delete failed');
    }
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
    ...(filter === 'active' ? [{
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditMember(record)} />
          <Popconfirm title="Are you sure to delete?" onConfirm={() => handleDeleteAssignment(record.assignmentId)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <div>
      <h2 style={{ textAlign: 'center', fontWeight: 700, margin: '0 0 24px 0' }}>Projects You Manage</h2>
      <div style={{ marginBottom: 16, textAlign: 'left' }}>
        <Select
          value={filter}
          onChange={val => setFilter(val)}
          style={{ width: 180 }}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
      </div>
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
            rowKey={record => record.assignmentId}
            columns={memberColumns}
            dataSource={memberData}
            loading={memberLoading}
            bordered
            pagination={false}
            expandedRowKeys={expandedRowKeys}
            onExpand={(expanded, record) => {
              if (!expanded) handleCloseEditInline();
            }}
            expandedRowRender={record =>
              editingMember && editingMember.assignmentId === record.assignmentId ? (
                <div style={{ background: '#f9f9f9', padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>Employee Workload (chọn khoảng thời gian)</h4>
                    <Button onClick={handleCloseEditInline}>Close</Button>
                  </div>
                  <DatePicker.RangePicker
                    value={range}
                    format="DD-MM-YYYY"
                    onChange={val => {
                      if (val) setRange(val as [dayjs.Dayjs, dayjs.Dayjs]);
                    }}
                    style={{ marginBottom: 16, marginRight: 8 }}
                  />
                  <Button onClick={() => fetchWorkloadBlocks(record)}>
                    View Chart
                  </Button>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(workloadBlocks.length > 0 ? workloadBlocks : [{ label: 'No Data', workloadPercent: 0 }]).map(b => {
                      let currentAssignmentWorkload = 0;
                      let otherWorkload = b.workloadPercent || 0;
                      if (editingMember && b.startDate && editingMember.startDate) {
                        const blockStart = dayjs(b.startDate, 'DD-MM-YYYY');
                        const blockEnd = b.endDate ? dayjs(b.endDate, 'DD-MM-YYYY') : dayjs('9999-12-31');
                        const assignStart = dayjs(editingMember.startDate, 'DD-MM-YYYY');
                        const assignEnd = editingMember.endDate ? dayjs(editingMember.endDate, 'DD-MM-YYYY') : dayjs('9999-12-31');
                        const overlap = (blockStart.isBefore(assignEnd, 'day') || blockStart.isSame(assignEnd, 'day')) &&
                                        (blockEnd.isAfter(assignStart, 'day') || blockEnd.isSame(assignStart, 'day'));
                        if (overlap) {
                          currentAssignmentWorkload = editingMember.workloadPercent || 0;
                          otherWorkload = Math.max(0, (b.workloadPercent || 0) - currentAssignmentWorkload);
                        }
                      }
                      return {
                        ...b,
                        label: b.label || (b.startDate && b.endDate
                          ? `${dayjs(b.startDate, 'DD-MM-YYYY').format('DD-MM-YYYY')} ~ ${dayjs(b.endDate, 'DD-MM-YYYY').format('DD-MM-YYYY')}`
                          : b.label),
                        currentAssignmentWorkload,
                        otherWorkload,
                      };
                    })} margin={{ bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={120} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="otherWorkload" stackId="a" fill="#1890ff" />
                      <Bar dataKey="currentAssignmentWorkload" stackId="a" fill="#888888" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 32, maxWidth: 400 }}>
                    <Form
                      form={editForm}
                      layout="vertical"
                      onFinish={handleUpdateAssignment}
                      initialValues={{
                        workloadPercent: record.workloadPercent,
                        startDate: record.startDate ? dayjs(record.startDate, 'DD-MM-YYYY') : null,
                        endDate: record.endDate ? dayjs(record.endDate, 'DD-MM-YYYY') : null,
                      }}
                    >
                      <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Chọn ngày bắt đầu!' }]}> 
                        <DatePicker 
                          style={{ width: '100%' }} 
                          format="DD-MM-YYYY" 
                          onChange={() => {
                            setTimeout(() => {
                              editForm.validateFields(["startDate", "endDate"]); // trigger validation
                            }, 0);
                          }}
                        />
                      </Form.Item>
                      <Form.Item name="endDate" label="End Date"
                        rules={[{
                          validator: (_, value) => {
                            const startDate = editForm.getFieldValue('startDate');
                            if (!value || !startDate) return Promise.resolve();
                            if (value.isBefore(startDate, 'day')) {
                              return Promise.reject(new Error('End date cannot be before start date!'));
                            }
                            return Promise.resolve();
                          },
                        }]}
                      >
                        <DatePicker 
                          style={{ width: '100%' }} 
                          format="DD-MM-YYYY" 
                          allowClear 
                          onChange={() => {
                            setTimeout(() => {
                              editForm.validateFields(["startDate", "endDate"]);
                            }, 0);
                          }}
                        />
                      </Form.Item>
                      {/* Workload remaining */}
                      {workloadRemain !== null && (
                        <div style={{ marginBottom: 8, color: workloadRemain < 0 ? 'red' : undefined }}>
                          Workload remaining: {workloadRemain}%
                        </div>
                      )}
                      <Form.Item name="workloadPercent" label="Workload (%)" rules={[{ required: true, message: 'Nhập workload!' }]}> 
                        <InputNumber min={1} max={100} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit">Update</Button>
                      </Form.Item>
                    </Form>
                  </div>
                </div>
              ) : null
            }
          />
        </div>
      )}
    </div>
  );
};

export default PMProjectList; 