import React from 'react';
import styled from 'styled-components';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #fff;
`;

const Title = styled.h1`
  color: #1890ff;
  font-size: 2.5rem;
  margin-bottom: 16px;
`;

const Description = styled.p`
  font-size: 1.2rem;
  color: #333;
`;

const Home: React.FC = () => {
  return (
    <HomeContainer>
      <Title>Welcome Home!</Title>
      <Description>You have successfully logged in.</Description>
    </HomeContainer>
  );
};

export default Home; 