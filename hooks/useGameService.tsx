import { useAuth } from "@/contexts/AuthContext";
import { GameService } from "../features/game/GameService";
import { useToast } from "@/contexts/ToastContext";
import { formatTime } from "@/lib/TimeFormatUtil";
import { registerForPush } from "@/features/notifications/pushRegistration";
import { ChallengeService } from "../features/challenges/ChallengeService";

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
            setUserTokenWarned([true, true, true]); //TODO: User token warned could probably be a variable within this hook
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

    const getAllGames = async (completedLimit?: number) => {
        const token = await getToken();
        return await GameService.getAllGames(token, completedLimit);
    };

    const makeMove = async (id: number, row: number, col: number) => {
        const token = await getToken();
        return await GameService.makeMove(id, row, col, token);
    };

    const resign = async (id: number) => {
        const token = await getToken();
        return await GameService.resign(id, token);
    };

    const getMatchmaking = async () => {
        const token = await getToken();
        return await GameService.getMatchmaking(token);
    };

    const startMatchmaking = async (days: number) => {
        const token = await getToken();
        return await GameService.startMatchmaking(token, days);
    };

    const stopMatchmaking = async (days: number) => {
        const token = await getToken();
        return await GameService.stopMatchmaking(token, days);
    }

    const updateComputerScore = async (computerLevel: number) => {
        const token = await getToken();
        return await GameService.updateComputerScore(token, computerLevel);
    }

    const getChallenges = async () => {
        const token = await getToken();
        return await ChallengeService.list(token);
    };

    const sendChallenge = async (username: string, days: number) => {
        const token = await getToken();
        return await ChallengeService.send(token, username, days);
    };

    const createInvite = async (days: number) => {
        const token = await getToken();
        return await ChallengeService.createInvite(token, days);
    };

    const previewInvite = async (code: string) => {
        const token = await getToken();
        return await ChallengeService.previewInvite(token, code);
    };

    const acceptInvite = async (code: string) => {
        const token = await getToken();
        return await ChallengeService.acceptInvite(token, code);
    };

    const requestRematch = async (gameId: number) => {
        const token = await getToken();
        return await ChallengeService.rematch(token, gameId);
    };

    const acceptChallenge = async (id: number) => {
        const token = await getToken();
        return await ChallengeService.accept(token, id);
    };

    const declineChallenge = async (id: number) => {
        const token = await getToken();
        return await ChallengeService.decline(token, id);
    };

    const cancelChallenge = async (id: number) => {
        const token = await getToken();
        return await ChallengeService.cancel(token, id);
    };

    // Refreshes this device's push token for an already signed-in user. Does not show the permission prompt.
    const refreshPushRegistration = async () => {
        const token = await getToken();
        await registerForPush(token, false);
    };

    // Shows the permission prompt (once per install) and registers this device if it is granted.
    const enablePushNotifications = async () => {
        const token = await getToken();
        await registerForPush(token, true);
    };

    return {
        refreshPushRegistration,
        enablePushNotifications,
        getAllGames,
        makeMove,
        resign,
        getChallenges,
        sendChallenge,
        createInvite,
        previewInvite,
        acceptInvite,
        requestRematch,
        acceptChallenge,
        declineChallenge,
        cancelChallenge,
        getMatchmaking,
        startMatchmaking,
        stopMatchmaking,
        updateComputerScore
    };
}
