import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useUser } from '@/contexts/UserContext';
import { useRouteTo } from '@/contexts/RouteContext';
import { useGamePoll } from '@/contexts/GamePollContext';
import { useGameService } from '@/hooks/useGameService';
import { Routes } from '@/app/(screens)/Routes';
import { gameIdFromNotificationData } from '@/features/notifications/pushRegistration';

// The stored user loads a moment after launch, so wait for it (briefly) before acting.
const USER_WAIT_MS = 10000;
const USER_POLL_MS = 250;

/**
 * Renders nothing. Keeps this device's push token current, and opens the game a tapped notification
 * is about (including when the tap is what launched the app).
 */
export function NotificationRouter() {
    const { userRef } = useUser();
    const { routeTo } = useRouteTo();
    const { pollUserGames } = useGamePoll();
    const { refreshPushRegistration } = useGameService();
    const handledResponse = useRef<string | null>(null);
    const lastResponse = Notifications.useLastNotificationResponse();

    const whenUserLoaded = async (): Promise<boolean> => {
        for (let waited = 0; waited < USER_WAIT_MS; waited += USER_POLL_MS) {
            if (userRef.current) return true;
            await new Promise(resolve => setTimeout(resolve, USER_POLL_MS));
        }
        return false;
    };

    useEffect(() => {
        (async () => {
            if (await whenUserLoaded()) {
                refreshPushRegistration().catch(() => {});
            }
        })();
    }, []);

    useEffect(() => {
        if (!lastResponse) return;
        const id = lastResponse.notification.request.identifier;
        if (handledResponse.current === id) return;
        handledResponse.current = id;

        const gameId = gameIdFromNotificationData(lastResponse.notification.request.content.data);
        if (gameId === null) return;

        (async () => {
            if (!(await whenUserLoaded())) return;
            await pollUserGames();
            const game = userRef.current?.games.find(g => g.gameId === gameId);
            if (game) {
                routeTo(Routes.Game, { game: encodeURIComponent(JSON.stringify(game)) });
            }
        })();
    }, [lastResponse]);

    return null;
}
