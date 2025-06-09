import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../config/api';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = async (values: LoginFormData) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        setErrorMessage('Incorrect email or password!');
        throw new Error('Incorrect email or password!');
      }
      const data = await response.json();
      if (data && data.data && data.data.accessToken && data.data.refreshToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        message.success('Login successful!');
        window.location.href = '/home';
      } else {
        setErrorMessage('Incorrect email or password!');
        throw new Error('Incorrect email or password!');
      }
    } catch (error: any) {
      setErrorMessage('Incorrect email or password!');
      message.error('Incorrect email or password!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Sign in</h1>
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
          >
            {errorMessage && (
              <div className="login-error">Incorrect email or password!</div>
            )}
            <div className="styled-input">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ fontSize: 20, color: '#0a66c2' }} />}
                  placeholder="Email or phone"
                  size="large"
                  autoComplete="username"
                />
              </Form.Item>
            </div>
            <div className="styled-input">
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Please input your password!' },
                  { min: 6, message: 'Password must be at least 6 characters!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ fontSize: 20, color: '#0a66c2' }} />}
                  placeholder="Password"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>
            </div>
            <div className="styled-button">
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                >
                  Sign in
                </Button>
              </Form.Item>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login; 