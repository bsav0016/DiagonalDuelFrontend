import React from 'react';
import { act, create } from 'react-test-renderer';
import * as Notifications from 'expo-notifications';
import { NotificationRouter } from '../NotificationRouter';
import { Routes } from '@/app/(screens)/Routes';

const mockPoll = jest.fn().mockResolvedValue(undefined);
const mockRouteTo = jest.fn();
jest.mock('expo-notifications', () => ({
    useLastNotificationResponse: jest.fn(() => null),
    addNotificationReceivedListener: jest.fn(),
}));
jest.mock('@/contexts/UserContext', () => ({ useUser: () => ({ userRef: { current: { games: [] } } }) }));
jest.mock('@/contexts/RouteContext', () => ({ useRouteTo: () => ({ routeTo: mockRouteTo }) }));
jest.mock('@/contexts/GamePollContext', () => ({ useGamePoll: () => ({ pollUserGames: mockPoll }) }));
jest.mock('@/hooks/useGameService', () => ({ useGameService: () => ({ refreshPushRegistration: jest.fn().mockResolvedValue(undefined) }) }));
jest.mock('@/features/notifications/pushRegistration', () => ({
    gameIdFromNotificationData: jest.fn(),
    // Same rule as the real helper, which has its own tests (loading the real module needs native storage).
    isChallengeNotification: (data: any) => data?.type === 'challenge',
}));

describe('NotificationRouter', () => {
    it('refreshes the games when a notification arrives while the app is open, and stops listening on unmount', async () => {
        const remove = jest.fn();
        const add = Notifications.addNotificationReceivedListener as jest.Mock;
        add.mockReturnValue({ remove });

        let tree!: ReturnType<typeof create>;
        await act(async () => { tree = create(<NotificationRouter />); });

        expect(add).toHaveBeenCalledTimes(1);
        await act(async () => { add.mock.calls[0][0]({}); });
        expect(mockPoll).toHaveBeenCalledTimes(1);

        await act(async () => { tree.unmount(); });
        expect(remove).toHaveBeenCalled();
    });

    it('opens Play Online when a challenge notification is tapped', async () => {
        const response = { notification: { request: { identifier: 'n1', content: { data: { type: 'challenge', challengeId: 5 } } } } };
        (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(response);
        (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

        await act(async () => { create(<NotificationRouter />); });

        expect(mockRouteTo).toHaveBeenCalledWith(Routes.PlayOnline);
        expect(mockRouteTo).toHaveBeenCalledTimes(1);
    });

    it('does not open anything for a notification it does not know', async () => {
        mockRouteTo.mockClear();
        const response = { notification: { request: { identifier: 'n2', content: { data: { type: 'promo' } } } } };
        (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(response);
        (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

        await act(async () => { create(<NotificationRouter />); });

        expect(mockRouteTo).not.toHaveBeenCalled();
    });
});
