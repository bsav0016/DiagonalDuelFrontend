import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "./LoadingContext";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "./AuthContext";
import { Game } from "@/features/game/models/Game";
import { useGameService } from "@/hooks/useGameService";


interface GamePollContextType {
  pollUserGames: () => Promise<void>;
  createMatchmaking: (days: number) => Promise<void>;
  cancelMatchmaking: (days: number) => Promise<void>;
}

const GamePollContext = createContext<GamePollContextType>({
  pollUserGames: async () => {},
  createMatchmaking: async () => {},
  cancelMatchmaking: async () => {}
});

export const GamePollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userRef, updateUserGames, updateMatchmaking } = useUser();
  const { logout } = useAuth();
  const { setLoading } = useLoading();
  const { addToast } = useToast();
  const { getAllGames, getMatchmaking, startMatchmaking, stopMatchmaking } = useGameService();

  useEffect(() => {
    if (!userRef.current) return;
    const pollingGames = setInterval(() => {
      pollUserGames();
    }, 15000);

    return () => clearInterval(pollingGames);
  }, [userRef.current]);

  useEffect(() => {
    if (!userRef.current) return;
    const pollingMatchmaking = setInterval(() => {
      pollMatchmaking();
    }, 15000);

    return () => clearInterval(pollingMatchmaking);
  }, [userRef.current]);

  const pollUserGames = async () => {
    if (!userRef.current) return;
    try {
      const games: Game[] = await getAllGames();
      updateUserGames(games);
    } catch (error) {
      if (error instanceof Error && error.message === "Refresh token expired") {
        addToast("It has been over 30 days since you've been active. You must login again.");
        logout();
      }
      console.error("Error fetching user games:", error);
    }
  };

  const pollMatchmaking = async () => {
    if (!userRef.current || userRef.current.matchmaking.length == 0) return;
    try {
      const updatedMatchmaking = await getMatchmaking();
      if (!arraysAreEqual(userRef.current.matchmaking, updatedMatchmaking)) {
        setLoading(true);
        updateMatchmaking(updatedMatchmaking);
        await pollUserGames();
      }
    } catch (error) {
      console.error("Error fetching matchmaking: ", error);
      if (error instanceof Error && error.message === "Refresh token expired") {
        addToast("It has been over 30 days since you've been active. You must login again.");
        logout();
      }
    } finally {
        setLoading(false);
    }
  };

  function arraysAreEqual(arr1: number[], arr2: number[]) {
    if (arr1.length !== arr2.length) {
      return false;
    }
  
    for (let i = 0; i < arr1.length; i++) {
      let inArr2 = false
      for (let j = 0; j < arr2.length; j++) {
        if (arr1[i] === arr2[j]) {
          inArr2 = true
        }
      }
      if (!inArr2) {
        return false;
      }
    }
  
    return true;
  }

  const createMatchmaking = async (days: number) => {
    try {
      if (!userRef.current || userRef.current.matchmaking.includes(days)){
        throw new Error('Invalid request')
      };
      setLoading(true);
      const createdGame = await startMatchmaking(days);
      if (createdGame) {
        await pollUserGames();
      } else {
        let updatedMatchmaking: number[] = userRef.current.matchmaking
        updatedMatchmaking.push(days)
        updateMatchmaking(updatedMatchmaking);
      }
    } catch (error) {
      console.error("Error creating matchmaking: ", error);
    } finally {
      setLoading(false);
    }
  }

  const cancelMatchmaking = async (days: number) => {
    try {
      if (!userRef.current || !userRef.current.matchmaking.includes(days)){
        throw new Error('Invalid request')
      };
      setLoading(true);
      await stopMatchmaking(days);
      const updatedMatchmaking = userRef.current.matchmaking.filter(item => item !== days);
      updateMatchmaking(updatedMatchmaking);
    } catch (error) {
      console.error("Error cancelling matchmaking: ", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GamePollContext.Provider
      value={{ pollUserGames, createMatchmaking, cancelMatchmaking }}
    >
      {children}
    </GamePollContext.Provider>
  );
};

export const useGamePoll = () => useContext(GamePollContext);
