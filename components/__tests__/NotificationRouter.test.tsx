import React from 'react';
import { act, create } from 'react-test-renderer';
import * as Notifications from 'expo-notifications';
import { NotificationRouter } from '../NotificationRouter';

const mockPoll = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-notifications', () => ({
    useLastNotificationResponse: jest.fn(() => null),
    addNotificationReceivedListener: jest.fn(),
}));
jest.mock('@/contexts/UserContext', () => ({ useUser: () => ({ userRef: { current: null } }) }));
jest.mock('@/contexts/RouteContext', () => ({ useRouteTo: () => ({ routeTo: jest.fn() }) }));
jest.mock('@/contexts/GamePollContext', () => ({ useGamePoll: () => ({ pollUserGames: mockPoll }) }));
jest.mock('@/hooks/useGameService', () => ({ useGameService: () => ({ refreshPushRegistration: jest.fn().mockResolvedValue(undefined) }) }));
jest.mock('@/features/notifications/pushRegistration', () => ({ gameIdFromNotificationData: jest.fn() }));

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
});
