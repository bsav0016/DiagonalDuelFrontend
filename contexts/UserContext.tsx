import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { Game } from '@/features/game/models/Game';
import { User } from '@/features/auth/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUserGames: (games: Game[]) => void;
  updateMatchmaking: (matchmaking: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const setStoredUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    setStoredUser();
  }, []);

  useEffect(() => {
    const updateUser = async () => {
      if (!user) {
        await AsyncStorage.removeItem('user')
      } else {
        AsyncStorage.setItem('user', JSON.stringify(user));
      }
    }

    updateUser();
  }, [user]);

  const updateUserGames = (games: Game[]) => {
    if (!user) return;
    const updatedUser = new User(user.username, user.email, games, user.isMatchmaking);
    setUser(updatedUser);
  };

  const updateMatchmaking = (matchmaking: boolean) => {
    if (!user) return;
    const updatedUser = new User(user.username, user.email, user.games, matchmaking);
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUserGames, updateMatchmaking }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
