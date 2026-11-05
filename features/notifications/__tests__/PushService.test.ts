import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PushService } from '../PushService';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'proj' } } } }));
jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const request = networkRequest as jest.Mock;

describe('PushService', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
        (Device as any).isDevice = true;
        Platform.OS = 'ios';
        notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
        notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]', type: 'expo' } as any);
        request.mockResolvedValue({ data: {}, status: 200 });
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('registers the device with the server and remembers the token', async () => {
        await expect(PushService.register('acc')).resolves.toBe('ExponentPushToken[abc]');

        const [url, method, headers, body] = request.mock.calls[0];
        expect(url).toBe('devices/');
        expect(method).toBe('POST');
        expect(headers.Authorization).toBe('Bearer acc');
        expect(JSON.parse(body)).toEqual({ token: 'ExponentPushToken[abc]', platform: 'ios' });
        expect(await AsyncStorage.getItem('pushToken')).toBe('ExponentPushToken[abc]');
    });

    it('asks for permission when it has not been granted yet', async () => {
        notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);
        notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);

        await PushService.register('acc');

        expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
        expect(request).toHaveBeenCalled();
    });

    it('does nothing when permission is refused', async () => {
        notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
        notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);

        await expect(PushService.register('acc')).resolves.toBeNull();
        expect(request).not.toHaveBeenCalled();
    });

    it('does nothing on a simulator', async () => {
        (Device as any).isDevice = false;
        await expect(PushService.register('acc')).resolves.toBeNull();
        expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });

    it('never throws when the server call fails', async () => {
        request.mockRejectedValue(new Error('down'));
        await expect(PushService.register('acc')).resolves.toBeNull();
        expect(await AsyncStorage.getItem('pushToken')).toBeNull();
    });

    it('forget returns the stored token and clears it', async () => {
        await AsyncStorage.setItem('pushToken', 'ExponentPushToken[abc]');
        await expect(PushService.forget()).resolves.toBe('ExponentPushToken[abc]');
        await expect(PushService.forget()).resolves.toBeNull();
    });
});
