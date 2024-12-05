import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Game } from '@/features/game/models/Game';
import { User } from '@/features/auth/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  userRef: React.MutableRefObject<User | null>;
  setUser: (user: User | null) => void;
  updateUserGames: (games: Game[]) => void;
  updateMatchmaking: (matchmaking: number[]) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const userRef = useRef<User | null>(null);
  const setUser = async (newUser: User | null) => {
    userRef.current = newUser
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
          plainUser.onlineRating
        );
        setUser(currentUser);
      }
    };

    setStoredUser();
  }, []);

  const updateUserGames = (games: Game[]) => {
    if (!userRef.current) return;
    const updatedUser = new User(
      userRef.current.username, 
      userRef.current.email, 
      games, 
      userRef.current.matchmaking,
      userRef.current.computerPoints,
      userRef.current.onlineRating
    );
    setUser(updatedUser);
  };

  const updateMatchmaking = (matchmaking: number[]) => {
    if (!userRef.current) return;
    const updatedUser = new User(
      userRef.current.username, 
      userRef.current.email, 
      userRef.current.games, 
      matchmaking,
      userRef.current.computerPoints,
      userRef.current.onlineRating
    );
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider value={{ userRef, setUser, updateUserGames, updateMatchmaking }}>
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
