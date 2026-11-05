import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';
import { HEADERS, URL_EXT } from '@/lib/networkRequests/NetworkConstants';

const STORAGE_KEY = 'pushToken';

// Push is best effort: nothing here may stop someone signing in or out, so every failure is swallowed.
export const PushService = {
    // Asks for permission if needed, then registers this device with the server. Returns the Expo token or null.
    async register(authToken: string): Promise<string | null> {
        try {
            if (Platform.OS === 'web' || !Device.isDevice) return null;

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Game updates',
                    importance: Notifications.AndroidImportance.DEFAULT,
                });
            }

            let { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                ({ status } = await Notifications.requestPermissionsAsync());
            }
            if (status !== 'granted') return null;

            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
            const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

            await networkRequest(
                URL_EXT.DEVICES,
                RequestMethod.POST,
                { ...HEADERS(authToken).AUTH, ...HEADERS().JSON },
                JSON.stringify({ token: pushToken, platform: Platform.OS })
            );
            await AsyncStorage.setItem(STORAGE_KEY, pushToken);
            return pushToken;
        } catch (error) {
            console.warn('Push registration failed:', error);
            return null;
        }
    },

    // Forgets this device's stored token and returns it so the caller can have the server drop it too.
    async forget(): Promise<string | null> {
        try {
            const pushToken = await AsyncStorage.getItem(STORAGE_KEY);
            await AsyncStorage.removeItem(STORAGE_KEY);
            return pushToken;
        } catch {
            return null;
        }
    },
};
