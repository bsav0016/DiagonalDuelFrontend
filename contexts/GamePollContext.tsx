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
  cancelMatchmaking: () => Promise<void>;
}

const GamePollContext = createContext<GamePollContextType>({
  pollUserGames: async () => {},
  createMatchmaking: async () => {},
  cancelMatchmaking: async () => {}
});

export const GamePollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUserGames, updateMatchmaking } = useUser();
  const { logout } = useAuth();
  const { setLoading } = useLoading();
  const { addToast } = useToast();
  const { getAllGames, getMatchmaking, startMatchmaking, stopMatchmaking } = useGameService();

  useEffect(() => {
    if (!user) return;
    const pollingGames = setInterval(() => {
      pollUserGames();
    }, 15000);

    return () => clearInterval(pollingGames);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const pollingMatchmaking = setInterval(() => {
      pollMatchmaking();
    }, 15000);

    return () => clearInterval(pollingMatchmaking);
  }, [user]);

  const pollUserGames = async () => {
    if (!user) return;
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
    if (!user || !user.isMatchmaking) return;
    try {
      const stillMatchmaking = await getMatchmaking();
      if (stillMatchmaking === false) {
        setLoading(true);
        updateMatchmaking(false);
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

  const createMatchmaking = async (days: number) => {
    if (!user || user.isMatchmaking) return;
    try {
        setLoading(true);
        const createdGame = await startMatchmaking(days);
        if (createdGame) {
          await pollUserGames();
        } else {
          updateMatchmaking(true);
        }
    } catch (error) {
        console.error("Error creating matchmaking: ", error);
    } finally {
        setLoading(false);
    }
  }

  const cancelMatchmaking = async () => {
    if (!user || !user.isMatchmaking) return;
    try {
      setLoading(true);
      await stopMatchmaking();
      updateMatchmaking(false);
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
