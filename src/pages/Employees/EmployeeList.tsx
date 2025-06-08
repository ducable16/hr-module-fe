import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface Employee {
  id: number;
  code: string;
  name: string;
  email: string;
  role: 'Admin' | 'PM' | 'Employee';
}

const initialData: Employee[] = [
  { id: 1, code: 'E001', name: 'Nguyen Van A', email: 'a@example.com', role: 'Admin' },
  { id: 2, code: 'E002', name: 'Tran Thi B', email: 'b@example.com', role: 'PM' },
  { id: 3, code: 'E003', name: 'Le Van C', email: 'c@example.com', role: 'Employee' },
];

const EmployeeList: React.FC = () => {
  const [data, setData] = useState<Employee[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();

  const showAddModal = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (record: Employee) => {
    setEditingEmployee(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setData(data.filter(emp => emp.id !== id));
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingEmployee) {
        setData(data.map(emp => emp.id === editingEmployee.id ? { ...editingEmployee, ...values } : emp));
      } else {
        const newId = Math.max(...data.map(emp => emp.id), 0) + 1;
        setData([...data, { id: newId, ...values }]);
      }
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Employee) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Popconfirm title="Are you sure to delete?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Employee List</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} style={{ marginBottom: 16 }}>
        Add Employee
      </Button>
      <Table rowKey="id" columns={columns} dataSource={data} />
      <Modal
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Please input code!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input name!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select role!' }]}> 
            <Select>
              <Select.Option value="Admin">Admin</Select.Option>
              <Select.Option value="PM">PM</Select.Option>
              <Select.Option value="Employee">Employee</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeList; 