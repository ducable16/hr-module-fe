import { createContext, useContext } from 'react';

export interface UserInfo {
  name: string;
  role: string;
  avatarUrl?: string;
  employeeId: number;
  email: string;
}

export const UserContext = createContext<UserInfo | null>(null);
export const useUser = () => useContext(UserContext); 