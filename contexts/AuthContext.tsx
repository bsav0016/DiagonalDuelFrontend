import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/features/auth/AuthService';
import { LoginDTO } from '@/features/auth/LoginDTO';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  username: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (loginDTO: LoginDTO) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const setStoredUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    }

    setStoredUser();
  }, []);

  const login = async (loginDTO: LoginDTO) => {
    try {
        let token = await AuthService.login(loginDTO);
        const user: User = { username: loginDTO.username, token: token }
        setUser(user);
        setIsAuthenticated(true);
        AsyncStorage.setItem('user', JSON.stringify(user));
        return true;
    } catch (error) {
        throw(error);
    }
  };

  const logout = async () => {
    try {
      const userToken = user?.token
      if (!userToken) {
        return false
      }
      await AuthService.logout(userToken);
      setUser(null);
      setIsAuthenticated(false);
      AsyncStorage.removeItem('user');
      return true;
    } catch (error) {
      throw(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
