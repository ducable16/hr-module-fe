import React, { useEffect, useState, useRef } from 'react';
import { Select, Input, InputNumber, DatePicker, Button, Form, message, Table, AutoComplete, Space, Typography } from 'antd';
import { API_BASE_URL } from '../../config/api';
import { authFetch } from '../../utils/authFetch';
import { useUser } from '../../context/UserContext';
import dayjs from 'dayjs';
import './AssignmentList.css';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const { Option } = Select;
const { Title } = Typography;

interface ProjectDto {
  projectId: number;
  projectCode: string;
  projectName: string;
  startDate: string;
  endDate: string;
}

interface EmployeeSearchDto {
  employeeId: number;
  fullName: string;
  email: string;
  role: string;
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
  const [members, setMembers] = useState<ProjectMemberDto[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeSearchDto[]>([]);
  const [employeeInput, setEmployeeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<number | null>(null);
  const [form] = Form.useForm();
  const watchedProjectId = Form.useWatch('projectId', form);
  const [workloadBlocks, setWorkloadBlocks] = useState<any[]>([]);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(3, 'month'),
    dayjs().add(3, 'month')
  ]);
  const [workloadRemain, setWorkloadRemain] = useState<number | null>(null);
  const watchedEmployeeId = Form.useWatch('employeeId', form);
  const watchedStartDate = Form.useWatch('startDate', form);
  const watchedEndDate = Form.useWatch('endDate', form);

  const isPM = user?.role === 'PM';

  // Fetch projects PM tham gia
  useEffect(() => {
    if (!isPM) return;
    const fetchProjects = async () => {
      const token = localStorage.getItem('accessToken');
      const res = await authFetch(`${API_BASE_URL}/project/project-manager/current`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        // Lọc bỏ các project không có projectId hợp lệ
        const validProjects = Array.isArray(result.data)
          ? result.data.filter((p: ProjectDto) => p.projectId !== undefined && p.projectId !== null)
          : [];
        setProjects(validProjects);
      }
    };
    fetchProjects();
  }, [isPM]);

  useEffect(() => {
    if (!watchedProjectId) return;
    const fetchMembers = async () => {
      const token = localStorage.getItem('accessToken');
      const res = await authFetch(`${API_BASE_URL}/project/${watchedProjectId}/members`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setMembers(Array.isArray(result.data) ? result.data : []);
      } else {
        setMembers([]);
      }
    };
    fetchMembers();
  }, [watchedProjectId]);

  // Debounce search employee
  const handleSearchEmployee = (value: string) => {
    setEmployeeInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value) {
      setEmployeeOptions([]);
      return;
    }
    searchTimeout.current = window.setTimeout(async () => {
      const token = localStorage.getItem('accessToken');
      const res = await authFetch(`${API_BASE_URL}/employee/search?email=${encodeURIComponent(value)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setEmployeeOptions(Array.isArray(result.data) ? result.data : []);
      }
    }, 100);
  };

  const handleSelectEmployee = async (value: string, option: any) => {
    setEmployeeInput(value);
    form.setFieldsValue({ employeeId: option.employeeId });
    // Fetch workload blocks
    const employeeId = option.employeeId;
    const projectId = form.getFieldValue('projectId');
    if (!employeeId || !projectId) return;
    fetchWorkloadBlocks(employeeId, projectId);
  };

  const fetchWorkloadBlocks = async (employeeId: number, projectId: number) => {
    const rangeStart = range[0].format('YYYY-MM-DD');
    const rangeEnd = range[1].format('YYYY-MM-DD');
    const token = localStorage.getItem('accessToken');
    const res = await authFetch(`${API_BASE_URL}/employee/${employeeId}/workload-blocks?projectId=${projectId}&rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const result = await res.json();
      setWorkloadBlocks(Array.isArray(result.data) ? result.data : []);
    } else {
      setWorkloadBlocks([]);
    }
  };

  const handleAssign = async (values: any) => {
    console.log('Form values before submit:', values);
    const projectId = values.projectId;
    const project = projects.find(p => p.projectId === projectId);
    if (!project) {
      message.error('Invalid project selected');
      return;
    }
    // Validate constraints
    const projectStart = dayjs(project.startDate, 'DD-MM-YYYY');
    const projectEnd = dayjs(project.endDate, 'DD-MM-YYYY');
    const assignStart = values.startDate;
    const assignEnd = values.endDate;
    let hasError = false;
    if (assignStart.isBefore(projectStart, 'day')) {
      form.setFields([
        { name: 'startDate', errors: ['Assignment start date cannot be before the project start date.'] },
      ]);
      hasError = true;
    }
    if (assignEnd && assignEnd.isAfter(projectEnd, 'day')) {
      form.setFields([
        { name: 'endDate', errors: ['Assignment end date cannot be after the project end date.'] },
      ]);
      hasError = true;
    }
    if (assignEnd && assignStart.isAfter(assignEnd, 'day')) {
      form.setFields([
        { name: 'startDate', errors: ['Assignment start date cannot be after assignment end date.'] },
      ]);
      hasError = true;
    }
    // Không cho phép assign trùng period với cùng 1 thành viên
    const overlap = members.some(m => {
      if (m.employeeCode !== values.employeeId) return false;
      const mStart = dayjs(m.startDate, 'DD-MM-YYYY');
      const mEnd = m.endDate ? dayjs(m.endDate, 'DD-MM-YYYY') : null;
      // Nếu assignment mới không có endDate, chỉ cần startDate nằm trong khoảng cũ hoặc ngược lại
      if (!assignEnd) {
        if (!mEnd) return assignStart.isSame(mStart, 'day'); // cả hai đều không có endDate
        return assignStart.isSameOrBefore(mEnd, 'day') && assignStart.isSameOrAfter(mStart, 'day');
      }
      if (!mEnd) {
        return assignEnd.isSameOrAfter(mStart, 'day');
      }
      return assignStart.isSameOrBefore(mEnd, 'day') && assignEnd.isSameOrAfter(mStart, 'day');
    });
    if (overlap) {
      form.setFields([
        { name: 'employeeId', errors: ['This employee already has an overlapping assignment period in this project.'] },
      ]);
      hasError = true;
    }
    if (hasError) return;
    const token = localStorage.getItem('accessToken');
    try {
      const body = {
        employeeId: values.employeeId,
        projectId: project.projectId, // submit đúng projectId dạng Long
        workloadPercent: values.workloadPercent,
        startDate: values.startDate.format('DD-MM-YYYY'),
        endDate: values.endDate ? values.endDate.format('DD-MM-YYYY') : null,
      };
      console.log('Request body:', body);
      const res = await authFetch(`${API_BASE_URL}/project/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Assigned successfully');
        form.resetFields();
        setEmployeeInput('');
        // Refetch members
        const refetch = await authFetch(`${API_BASE_URL}/project/${project.projectId}/members`, { headers: { Authorization: `Bearer ${token}` } });
        const result = await refetch.json();
        setMembers(Array.isArray(result.data) ? result.data : []);
      } else {
        let errorMsg = 'Assign failed';
        try {
          const errorRes = await res.json();
          if (errorRes && errorRes.message) {
            errorMsg = errorRes.message;
          }
        } catch {}
        console.log('Show error:', errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      toast.error('Assign failed');
    }
  };

  useEffect(() => {
    const checkWorkload = async () => {
      if (watchedEmployeeId && watchedStartDate) {
        const token = localStorage.getItem('accessToken');
        const body: any = {
          employeeId: watchedEmployeeId,
          startDate: watchedStartDate.format('DD-MM-YYYY'),
        };
        if (watchedEndDate) {
          body.endDate = watchedEndDate.format('DD-MM-YYYY');
        } else {
          body.endDate = null;
        }
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
      } else {
        setWorkloadRemain(null);
      }
    };
    checkWorkload();
  }, [watchedEmployeeId, watchedStartDate, watchedEndDate]);

  const columns = [
    { title: 'Employee Code', dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Full Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Workload (%)', dataIndex: 'workloadPercent', key: 'workloadPercent' },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate' },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
  ];

  if (!isPM) {
    return <div style={{ padding: 24 }}><Title level={4}>Only Project Manager (PM) can assign employees to projects.</Title></div>;
  }

  return (
    <div className="assignment-outer">
      <div className="assignment-card">
        {/* Card Header */}
        <div className="assignment-header">
          <div className="assignment-header-row" style={{ justifyContent: 'center' }}>
            <Title level={3} className="assignment-title">Assign Employee to Project</Title>
          </div>
        </div>
        {/* Card Body */}
        <div className="assignment-body">
          {/* Section: Form */}
          <div className="assignment-form-section">
            <Form form={form} layout="vertical" onFinish={handleAssign} className="assignment-form" style={{ width: '100%' }} validateTrigger={['onSubmit']}>
              <Form.Item name="projectId" label="Project" rules={[{ required: true, message: 'Select project!' }]}> 
                <Select
                  placeholder="Select project"
                  showSearch
                  optionFilterProp="children"
                  style={{ width: '100%' }}
                >
                  {projects && projects.length > 0 ? projects.map(p => {
                    const endDateLabel = p.endDate ? p.endDate : 'Ongoing';
                    const label = `${p.projectCode} - ${p.projectName} (${p.startDate} ~ ${endDateLabel})`;
                    return (
                      <Option key={p.projectId} value={p.projectId}>
                        {label}
                      </Option>
                    );
                  }) : null}
                </Select>
              </Form.Item>
              <Form.Item label="Employee" required>
                <AutoComplete
                  placeholder="Search by email"
                  onSearch={handleSearchEmployee}
                  options={employeeOptions.map(e => ({ value: `${e.fullName} (${e.email}) - ${e.role}`, employeeId: e.employeeId }))}
                  filterOption={false}
                  value={employeeInput}
                  onSelect={handleSelectEmployee}
                  onChange={val => {
                    setEmployeeInput(val);
                    form.setFieldsValue({ employeeId: null });
                  }}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="employeeId" style={{ display: 'none' }} rules={[{ required: true, message: 'Select employee!' }]}> 
                <Input />
              </Form.Item>
              <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Select start date!' }]}> 
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
              <Form.Item name="endDate" label="End Date"
                rules={[
                  {
                    validator: (_, value) => {
                      const startDate = form.getFieldValue('startDate');
                      if (!value || !startDate) return Promise.resolve();
                      if (value.isBefore(startDate, 'day')) {
                        return Promise.reject(new Error('End date cannot be before start date!'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" allowClear />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                {workloadRemain !== null && (
                  <div style={{ marginBottom: 8, color: '#0a66c2', fontWeight: 500 }}>
                    Workload remaining for this employee in selected period: <b>{workloadRemain}%</b>
                  </div>
                )}
              </Form.Item>
              <Form.Item name="workloadPercent" label="Workload %" rules={[{ required: true, message: 'Enter workload!' }]}> 
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item style={{ textAlign: 'center' }}>
                <Button type="primary" htmlType="submit" loading={loading} style={{ minWidth: 160, width: 200 }}>Assign</Button>
              </Form.Item>
            </Form>
          </div>
          {/* Hiển thị bảng current members nếu có project được chọn */}
          {form.getFieldValue('projectId') && (
            <div style={{ marginTop: 24 }}>
              <Table
                rowKey={record => record.employeeCode}
                columns={columns}
                dataSource={members}
                bordered
                pagination={false}
                title={() => 'Current Members'}
              />
            </div>
          )}
          {/* Chỉ hiển thị chart sau khi đã select employee */}
          {form.getFieldValue('employeeId') && (
            <div style={{ margin: '32px 0' }}>
              <DatePicker.RangePicker
                value={range}
                format="DD-MM-YYYY"
                onChange={val => {
                  if (val) setRange(val as [dayjs.Dayjs, dayjs.Dayjs]);
                }}
                style={{ marginBottom: 16, marginRight: 8 }}
              />
              <Button onClick={() => fetchWorkloadBlocks(form.getFieldValue('employeeId'), form.getFieldValue('projectId'))}>
                View Chart
              </Button>
              <h4>Employee Workload</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(workloadBlocks.length > 0 ? workloadBlocks : [{ label: 'No Data', workloadPercent: 0 }]).map(b => ({
                  ...b,
                  label: b.label || (b.startDate && b.endDate
                    ? `${dayjs(b.startDate, 'DD-MM-YYYY').format('DD-MM-YYYY')} ~ ${dayjs(b.endDate, 'DD-MM-YYYY').format('DD-MM-YYYY')}`
                    : b.label)
                }))} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={120} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="workloadPercent" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentList; 