import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/features/auth/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { AuthFields } from '@/features/auth/AuthFields';
import { AuthType } from '@/features/auth/AuthType';
import { useUser } from './UserContext';
import { router } from 'expo-router';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    refreshToken: string | null;
    userTokenWarned: Boolean[];
    setToken: (token: string | null) => void;
    setRefreshToken: (token: string | null) => void;
    setUserTokenWarned: (warned: Boolean[]) => void;
    auth: (fields: AuthFields, type: AuthType) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setUser } = useUser();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [userTokenWarned, setUserTokenWarned] = useState<Boolean[]>([false, false, false]);

    useEffect(() => {
        const setStoredAuthData = async () => {
            const storedToken = await AsyncStorage.getItem('token');
            const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
            if (storedToken && storedRefreshToken) {
                setToken(storedToken);
                setRefreshToken(storedRefreshToken);
                setIsAuthenticated(true);
            }
        };

        setStoredAuthData();
    }, []);

    const auth = async (fields: AuthFields, type: AuthType): Promise<boolean> => {
        try {
            const { user, refresh, access } = await AuthService.auth(fields, type);
            setUser(user);
            setToken(access);
            setRefreshToken(refresh);
            setIsAuthenticated(true);
            await AsyncStorage.setItem('token', access);
            await AsyncStorage.setItem('refreshToken', refresh);
            setUserTokenWarned([false, false, false]);
            return true;
        } catch (error) {
            if (error instanceof NetworkError && error.status === 403) {
                return false;
            }
            throw new Error('Network error');
        }
    };

    const logout = async () => {
        try {
            if (!token) return;
            setUser(null);
            setToken(null);
            setRefreshToken(null);
            setIsAuthenticated(false);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('refreshToken');
            await AuthService.logout(token);
        } catch (error) {
            throw error;
        } finally {
            router.push('/(screens)/login-screen');
        }
    };

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            token, 
            refreshToken, 
            userTokenWarned,
            setToken, 
            setRefreshToken,
            setUserTokenWarned,
            auth, 
            logout 
        }}>
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
