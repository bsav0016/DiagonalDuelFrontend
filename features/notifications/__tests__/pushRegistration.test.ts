import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameIdFromNotificationData, getPushToken, registerForPush, unregisterFromPush } from '../pushRegistration';
import { PushService } from '../PushService';

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn(),
    AndroidImportance: { MAX: 5 },
}));
let mockIsDevice = true;
jest.mock('expo-device', () => ({ get isDevice() { return mockIsDevice; } }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'project-1' } } } }));
jest.mock('@react-native-async-storage/async-storage', () => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn(async (key: string) => store[key] ?? null),
        setItem: jest.fn(async (key: string, value: string) => { store[key] = value; }),
        removeItem: jest.fn(async (key: string) => { delete store[key]; }),
        clear: jest.fn(async () => { store = {}; }),
    };
});
jest.mock('../PushService', () => ({ PushService: { registerDevice: jest.fn(), unregisterDevice: jest.fn() } }));

const permissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermission = Notifications.requestPermissionsAsync as jest.Mock;
const expoToken = Notifications.getExpoPushTokenAsync as jest.Mock;
const registerDevice = PushService.registerDevice as jest.Mock;
const unregisterDevice = PushService.unregisterDevice as jest.Mock;

beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockIsDevice = true;
    permissions.mockResolvedValue({ status: 'undetermined' });
    requestPermission.mockResolvedValue({ status: 'granted' });
    expoToken.mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    registerDevice.mockResolvedValue(undefined);
    unregisterDevice.mockResolvedValue(undefined);
});

describe('getPushToken', () => {
    it('asks once at first sign-in and returns the token when granted', async () => {
        await expect(getPushToken(true)).resolves.toBe('ExponentPushToken[abc]');
        expect(requestPermission).toHaveBeenCalledTimes(1);
        expect(expoToken).toHaveBeenCalledWith({ projectId: 'project-1' });
    });

    it('never asks a second time, even if the user did not allow it', async () => {
        requestPermission.mockResolvedValue({ status: 'denied' });
        await expect(getPushToken(true)).resolves.toBeNull();
        await expect(getPushToken(true)).resolves.toBeNull();
        expect(requestPermission).toHaveBeenCalledTimes(1);
    });

    it('does not show the prompt when asked not to', async () => {
        await expect(getPushToken(false)).resolves.toBeNull();
        expect(requestPermission).not.toHaveBeenCalled();
    });

    it('uses permission that was already granted without prompting', async () => {
        permissions.mockResolvedValue({ status: 'granted' });
        await expect(getPushToken(false)).resolves.toBe('ExponentPushToken[abc]');
        expect(requestPermission).not.toHaveBeenCalled();
    });

    it('returns null on a simulator', async () => {
        mockIsDevice = false;
        await expect(getPushToken(true)).resolves.toBeNull();
        expect(permissions).not.toHaveBeenCalled();
    });
});

describe('registerForPush', () => {
    it('sends the token to the backend and remembers it for sign-out', async () => {
        await registerForPush('access', true);
        expect(registerDevice).toHaveBeenCalledWith('access', 'ExponentPushToken[abc]', expect.any(String));
        expect(await AsyncStorage.getItem('pushToken')).toBe('ExponentPushToken[abc]');
    });

    it('does nothing when there is no token', async () => {
        requestPermission.mockResolvedValue({ status: 'denied' });
        await registerForPush('access', true);
        expect(registerDevice).not.toHaveBeenCalled();
    });

    it('swallows failures so sign-in is never blocked', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        expoToken.mockRejectedValue(new Error('no Firebase credentials'));
        await expect(registerForPush('access', true)).resolves.toBeUndefined();
        warn.mockRestore();
    });
});

describe('unregisterFromPush', () => {
    it('removes the remembered token from the backend and forgets it', async () => {
        await registerForPush('access', true);
        await unregisterFromPush('access');
        expect(unregisterDevice).toHaveBeenCalledWith('access', 'ExponentPushToken[abc]');
        expect(await AsyncStorage.getItem('pushToken')).toBeNull();
    });

    it('does nothing when no device was registered', async () => {
        await unregisterFromPush('access');
        expect(unregisterDevice).not.toHaveBeenCalled();
    });

    it('swallows failures so sign-out still completes', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        await registerForPush('access', true);
        unregisterDevice.mockRejectedValue(new Error('offline'));
        await expect(unregisterFromPush('access')).resolves.toBeUndefined();
        warn.mockRestore();
    });
});

describe('gameIdFromNotificationData', () => {
    it('reads the game id from a game notification', () => {
        expect(gameIdFromNotificationData({ type: 'game', gameId: 7 })).toBe(7);
    });

    it('ignores anything else', () => {
        const others = [null, undefined, 'x', {}, { type: 'game' }, { type: 'game', gameId: '7' }, { type: 'promo', gameId: 7 }];
        for (const data of others) {
            expect(gameIdFromNotificationData(data)).toBeNull();
        }
    });
});
