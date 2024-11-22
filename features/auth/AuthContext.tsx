import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/features/auth/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { User } from '@/features/auth/User';
import { AuthFields } from './AuthFields';
import { AuthType } from './AuthType';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  auth: (fields: AuthFields, type: AuthType) => Promise<void>;
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

  const auth = async (fields: AuthFields, type: AuthType): Promise<void> => {
    try {
      const authUser = await AuthService.auth(fields, type);
      setUser(authUser);
      setIsAuthenticated(true);
      AsyncStorage.setItem('user', JSON.stringify(authUser));
    } catch (error) {
      if (error instanceof NetworkError) {
        if (error.status == 403) {
          throw new Error('Invalid username and password')
        }
      }
      throw new Error('Network error');
    }
  };

  const logout = async () => {
    try {
      const userToken = user?.token
      if (!userToken) {
        return;
      }
      await AuthService.logout(userToken);
      setUser(null);
      setIsAuthenticated(false);
      AsyncStorage.removeItem('user');
    } catch (error) {
      throw(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, auth, logout }}>
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
