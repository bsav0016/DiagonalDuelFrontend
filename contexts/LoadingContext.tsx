import React, { createContext, useState, useContext, ReactNode } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

interface LoadingContextType {
    setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ setLoading }}>
            {children}
            {loading && (
                <LoadingScreen />
            )}
        </LoadingContext.Provider>
    );
};

export const useLoading = (): LoadingContextType => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
