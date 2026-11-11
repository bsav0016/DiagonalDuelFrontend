import React, { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "./LoadingContext";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "./AuthContext";
import { useGameService } from "@/hooks/useGameService";


// How many finished games the list asks for to begin with, how many more each "load more" adds, and the most the server allows.
export const COMPLETED_PAGE = 20;
export const MAX_COMPLETED = 200;

interface GamePollContextType {
  pollUserGames: () => Promise<void>;
  loadMoreCompleted: () => Promise<void>;
  createMatchmaking: (days: number) => Promise<void>;
  cancelMatchmaking: (days: number) => Promise<void>;
  enablePushNotifications: () => Promise<void>;
}

const GamePollContext = createContext<GamePollContextType>({
  pollUserGames: async () => {},
  loadMoreCompleted: async () => {},
  createMatchmaking: async () => {},
  cancelMatchmaking: async () => {},
  enablePushNotifications: async () => {}
});

export const GamePollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userRef, updateUserGames, updateMatchmaking } = useUser();
  // Polling runs while someone is signed in; a new user object alone (after each poll) must not restart it.
  const signedIn = user !== null;
  const { logout } = useAuth();
  const { setLoading } = useLoading();
  const { addToast } = useToast();
  // How many finished games each poll asks for; "load more" raises it, signing out resets it.
  const completedLimitRef = useRef(COMPLETED_PAGE);
  const { getAllGames, getMatchmaking, startMatchmaking, stopMatchmaking, enablePushNotifications } = useGameService();

  useEffect(() => {
    if (!signedIn) completedLimitRef.current = COMPLETED_PAGE;
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const pollingGames = setInterval(() => {
      pollUserGames();
    }, 15000);

    return () => clearInterval(pollingGames);
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const pollingMatchmaking = setInterval(() => {
      pollMatchmaking();
    }, 15000);

    return () => clearInterval(pollingMatchmaking);
  }, [signedIn]);

  const pollUserGames = async () => {
    if (!userRef.current) return;
    try {
      const list = await getAllGames(completedLimitRef.current);
      updateUserGames(list.games, { record: list.record, hasMoreCompleted: list.hasMoreCompleted });
    } catch (error) {
      if (error instanceof Error && error.message === "Refresh token expired") {
        addToast("It has been over 30 days since you've been active. You must login again.");
        logout();
      }
      console.error("Error fetching user games:", error);
    }
  };

  // Shows more finished games: every later poll asks for the bigger number too, so they stay on screen.
  const loadMoreCompleted = async () => {
    completedLimitRef.current = Math.min(completedLimitRef.current + COMPLETED_PAGE, MAX_COMPLETED);
    await pollUserGames();
  };

  const pollMatchmaking = async () => {
    if (!userRef.current || userRef.current.matchmaking.length === 0) return;
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
      value={{ pollUserGames, loadMoreCompleted, createMatchmaking, cancelMatchmaking, enablePushNotifications }}
    >
      {children}
    </GamePollContext.Provider>
  );
};

export const useGamePoll = () => useContext(GamePollContext);
