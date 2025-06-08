import styled from 'styled-components';
import { Card } from 'antd';

export const LoginWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
`;

export const Logo = styled.div`
  padding: 40px 0 0 60px;
  @media (max-width: 600px) {
    padding: 24px 0 0 16px;
  }
`;

export const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const LoginCard = styled(Card)`
  width: 100%;
  max-width: 480px;
  background: #fff !important;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.10);
  border-radius: 16px !important;
  border: none;
  padding: 36px 32px 24px 32px;
  @media (max-width: 600px) {
    max-width: 100vw;
    margin: 0;
    padding: 20px 6px 20px 6px;
    border-radius: 10px !important;
  }
`;

export const LoginTitle = styled.h1`
  text-align: left;
  margin-bottom: 24px;
  color: #191919;
  font-size: 2.2rem;
  font-weight: 700;
`;

export const LoginSubtitle = styled.p`
  text-align: center;
  margin-bottom: 28px;
  color: #6b7280;
  font-size: 1.1rem;
  font-weight: 500;
`;

export const StyledForm = styled.form``;

export const StyledInput = styled.div`
  width: 100%;
  .ant-input-affix-wrapper, .ant-input {
    border-radius: 8px !important;
    border: 2px solid #b3d3f2;
    font-size: 1.08rem;
    background: #fff;
    transition: border 0.2s;
    min-height: 44px;
  }
  .ant-input-affix-wrapper-focused, .ant-input:focus {
    border-color: #0a66c2;
    box-shadow: 0 0 0 2px #0a66c233;
  }
`;

export const StyledButton = styled.div`
  .ant-btn-primary {
    background: #0a66c2;
    border: none;
    border-radius: 24px;
    font-size: 1.1rem;
    font-weight: 600;
    height: 44px;
    margin-top: 8px;
    box-shadow: 0 2px 8px 0 #0a66c222;
    transition: background 0.2s, box-shadow 0.2s;
  }
  .ant-btn-primary:hover, .ant-btn-primary:focus {
    background: #004182;
    box-shadow: 0 4px 16px 0 #0a66c244;
  }
`;

export const BottomText = styled.div`
  text-align: center;
  margin-top: 32px;
  color: #666;
  font-size: 1rem;
  a {
    color: #0a66c2;
    font-weight: 600;
    margin-left: 4px;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const ForgotPassword = styled.a`
  color: #0a66c2;
  font-size: 1rem;
  font-weight: 500;
  float: right;
  margin-bottom: 8px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export const CheckboxWrapper = styled.div`
  margin-bottom: 8px;
  .ant-checkbox-inner {
    border-radius: 4px;
  }
  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: #0a66c2;
    border-color: #0a66c2;
  }
`; 