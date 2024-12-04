import { useAuth } from "@/contexts/AuthContext";
import { GameService } from "../features/game/GameService";
import { useToast } from "@/contexts/ToastContext";
import { formatTime } from "@/lib/TimeFormatUtil";

export function useGameService() {
    const { tokenRef, refreshTokenRef, userTokenWarnedRef, setToken, setUserTokenWarned, logout } = useAuth();
    const { addToast } = useToast();

    const addExpirationToast = (timeInSeconds: number) => {
        const updatedTime: number = timeInSeconds < 0 ? 0 : timeInSeconds
        addToast(`Login expires in ${formatTime(updatedTime)}. Logout and log back in or risk being automatically logged out in that time.`)
    }

    const checkUpcomingExpiration = () => {
        const fiveDays: number = 5 * 24 * 60 * 60 * 1000
        const threeDays: number = 3 * 24 * 60 * 60 * 1000
        const oneDay: number = 1 * 24 * 60 * 60 * 1000
        let expiresFiveDays: number | null = 0;
        let expiresThreeDays: number | null = 0;
        let expiresOneDay: number | null = 0;
        if (refreshTokenRef.current) {
            expiresFiveDays = GameService.isTokenExpiring(refreshTokenRef.current, fiveDays);
            expiresThreeDays = GameService.isTokenExpiring(refreshTokenRef.current, threeDays);
            expiresOneDay = GameService.isTokenExpiring(refreshTokenRef.current, oneDay);
        }
        if (expiresOneDay !== null && !userTokenWarnedRef.current[2]) {
            setUserTokenWarned([true, true, true]);
            addExpirationToast(expiresOneDay)
        }
        else if (expiresThreeDays !== null && !userTokenWarnedRef.current[1]) {
            setUserTokenWarned([true, true, false]);
            addExpirationToast(expiresThreeDays);
        }
        else if (expiresFiveDays !== null && !userTokenWarnedRef.current[0]) {
            setUserTokenWarned([true, false, false]);
            addExpirationToast(expiresFiveDays);
        }
    }

    const getToken = async () => {
        checkUpcomingExpiration();
        if (tokenRef.current && !GameService.isTokenExpiring(tokenRef.current, 0)) {
            return tokenRef.current;
        }
        if (!refreshTokenRef.current || GameService.isTokenExpiring(refreshTokenRef.current, 0)) {
            logout();
            console.error('No refresh token');
            throw new Error('No refresh token');
        }
        const { newToken } = await GameService.refreshToken(refreshTokenRef.current);
        setToken(newToken);
        return newToken;
    };

    const getAllGames = async () => {
        const token = await getToken();
        return await GameService.getAllGames(token);
    };

    const makeMove = async (id: number, row: number, col: number) => {
        const token = await getToken();
        return await GameService.makeMove(id, row, col, token);
    };

    const getMatchmaking = async () => {
        const token = await getToken();
        return await GameService.getMatchmaking(token);
    };

    const startMatchmaking = async (days: number) => {
        const token = await getToken();
        return await GameService.startMatchmaking(token, days);
    };

    const stopMatchmaking = async () => {
        const token = await getToken();
        return await GameService.stopMatchmaking(token);
    }

    return {
        getAllGames,
        makeMove,
        getMatchmaking,
        startMatchmaking,
        stopMatchmaking
    };
}
