import React, { createContext, ReactNode, useEffect, useRef, useState } from 'react';
import { Game } from '@/features/game/models/Game';
import { User } from '@/features/auth/User';
import { GameRecord } from '@/features/game/models/GameRecord';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  // For screens to show: changing it re-renders them.
  user: User | null;
  // For callbacks, effects and timers that need the latest user without re-running: the same user, read directly.
  userRef: React.MutableRefObject<User | null>;
  setUser: (user: User | null) => void;
  updateUserGames: (games: Game[], extras?: { record: GameRecord | null; hasMoreCompleted: boolean }) => void;
  updateMatchmaking: (matchmaking: number[]) => void;
  updateUserComputerScore: (computerLevel: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const userRef = useRef<User | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const setUser = async (newUser: User | null) => {
    userRef.current = newUser
    setUserState(newUser)
    if (!userRef.current) {
      await AsyncStorage.removeItem('user')
    } else {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    }
  }

  useEffect(() => {
    const setStoredUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const plainUser = JSON.parse(storedUser);
        const currentUser = new User (
          plainUser.username,
          plainUser.email,
          plainUser.games,
          plainUser.matchmaking,
          plainUser.computerPoints,
          plainUser.onlineRating,
          plainUser.record ?? null,
          plainUser.hasMoreCompleted === true
        );
        setUser(currentUser);
      }
    };

    setStoredUser();
  }, []);

  const updateUserGames = (games: Game[], extras?: { record: GameRecord | null; hasMoreCompleted: boolean }) => {
    if (!userRef.current) return;
    setUser(userRef.current.with({ games, ...extras }));
  };

  const updateMatchmaking = (matchmaking: number[]) => {
    if (!userRef.current) return;
    setUser(userRef.current.with({ matchmaking }));
  };

  const updateUserComputerScore = (computerLevel: number) => {
    if (!userRef.current) return;
    setUser(userRef.current.with({ computerPoints: userRef.current.computerPoints + computerLevel }));
  }

  return (
    <UserContext.Provider value={{ user, userRef, setUser, updateUserGames, updateMatchmaking, updateUserComputerScore }}>
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
