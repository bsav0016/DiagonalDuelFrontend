import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PushService } from './PushService';

const ASKED_KEY = 'pushPermissionAsked';
const PUSH_TOKEN_KEY = 'pushToken';

// Show a banner for a notification that arrives while the app is open; the game list also refreshes by polling.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

/**
 * Works out this device's Expo push token, or null if there is none to use (simulator, notifications
 * refused, or the build has no push credentials). With `askIfNeeded` the system permission prompt is
 * shown, but only once per install: after the user has been asked we never ask again, even if they
 * did not answer, and they can still turn notifications on in system settings.
 */
export async function getPushToken(askIfNeeded: boolean): Promise<string | null> {
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Games',
            importance: Notifications.AndroidImportance.MAX,
        });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && askIfNeeded && !(await AsyncStorage.getItem(ASKED_KEY))) {
        await AsyncStorage.setItem(ASKED_KEY, 'true');
        ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
}

/**
 * Registers this device for the signed-in user. Never throws: push is optional and a failure here
 * (for example an Android build without Firebase credentials) must not get in the way of logging in.
 */
export async function registerForPush(accessToken: string, askIfNeeded: boolean): Promise<void> {
    try {
        const pushToken = await getPushToken(askIfNeeded);
        if (!pushToken) return;
        await PushService.registerDevice(accessToken, pushToken, Platform.OS);
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);
    } catch (error) {
        console.warn('Could not register for push notifications', error);
    }
}

// Stops notifications for this device when the user signs out. Never throws.
export async function unregisterFromPush(accessToken: string): Promise<void> {
    try {
        const pushToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        if (!pushToken) return;
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
        await PushService.unregisterDevice(accessToken, pushToken);
    } catch (error) {
        console.warn('Could not unregister from push notifications', error);
    }
}

// The backend puts {"type": "game", "gameId": <number>} on every notification.
export function gameIdFromNotificationData(data: unknown): number | null {
    if (!data || typeof data !== 'object') return null;
    const { type, gameId } = data as { type?: unknown; gameId?: unknown };
    return type === 'game' && typeof gameId === 'number' ? gameId : null;
}
