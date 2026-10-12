import React, { createContext, useEffect, useRef, ReactNode } from 'react';
import { AuthService } from '@/features/auth/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { AuthFields } from '@/features/auth/AuthFields';
import { AuthType } from '@/features/auth/AuthType';
import { useUser } from './UserContext';
import { router } from 'expo-router';

interface AuthContextType {
    tokenRef: React.MutableRefObject<string | null>;
    refreshTokenRef: React.MutableRefObject<string | null>;
    userTokenWarnedRef: React.MutableRefObject<Boolean[]>;
    setToken: (token: string | null) => void;
    setRefreshToken: (token: string | null) => void;
    setUserTokenWarned: (warned: Boolean[]) => void;
    auth: (fields: AuthFields, type: AuthType) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setUser } = useUser();
    const tokenRef = useRef<string | null>(null);
    const setToken = (newToken: string | null) => {
        tokenRef.current = newToken
    }

    const refreshTokenRef = useRef<string | null>(null);
    const setRefreshToken = (newRefreshToken: string | null) => {
        refreshTokenRef.current = newRefreshToken
    }

    const userTokenWarnedRef = useRef<Boolean[]>([false, false, false]);
    const setUserTokenWarned = (newWarned: Boolean[]) => {
        userTokenWarnedRef.current = newWarned;
    };

    useEffect(() => {
        const setStoredAuthData = async () => {
            const storedToken = await AsyncStorage.getItem('token');
            const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
            if (storedToken && storedRefreshToken) {
                setToken(storedToken);
                setRefreshToken(storedRefreshToken);
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
            await AsyncStorage.setItem('token', access);
            await AsyncStorage.setItem('refreshToken', refresh);
            setUserTokenWarned([false, false, false]);
            return true;
        } catch (error) {
            if (error instanceof NetworkError && error.status === 403) {
                return false;
            }
            if (error instanceof NetworkError && error.status === 409) {
                if (error.message.includes("username already exists")) {
                    throw new Error("Username already taken")
                } else if (error.message.includes("email already exists")) {
                    throw new Error("Email already taken");
                } else if (error.message.includes("valid email")) {
                    throw new Error("Enter a valid email");
                }
            }
            throw new Error('Network error');
        }
    };

    const logout = async () => {
        try {
            if (!tokenRef.current) return;
            setUser(null);
            setToken(null);
            setRefreshToken(null);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('refreshToken');
            await AuthService.logout(tokenRef.current);
        } catch (error) {
            throw error;
        } finally {
            router.push('/(screens)/login-screen');
        }
    };

    return (
        <AuthContext.Provider value={{ 
            tokenRef, 
            refreshTokenRef, 
            userTokenWarnedRef,
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
