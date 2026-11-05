import React from 'react';
import { act, create } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { AuthProvider, useAuth } from '../AuthContext';
import { AuthService } from '@/features/auth/AuthService';
import { AuthType } from '@/features/auth/AuthType';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { User } from '@/features/auth/User';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/auth/AuthService', () => ({
    AuthService: { auth: jest.fn(), logout: jest.fn(), deleteAccount: jest.fn() },
}));
const mockSetUser = jest.fn();
const mockRegister = jest.fn();
const mockForget = jest.fn();
jest.mock('@/features/notifications/PushService', () => ({
    PushService: { register: (...a: any[]) => mockRegister(...a), forget: () => mockForget() },
}));
jest.mock('../UserContext', () => ({ useUser: () => ({ setUser: mockSetUser }) }));

const service = AuthService as jest.Mocked<typeof AuthService>;
const FIELDS = { username: 'ann', password: 'pw' };

async function mount() {
    let api!: ReturnType<typeof useAuth>;
    const Probe = () => { api = useAuth(); return null; };
    await act(async () => { create(<AuthProvider><Probe /></AuthProvider>); });
    await act(async () => {});
    return () => api;
}

describe('AuthProvider', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('restores saved tokens at launch, but only when both are there', async () => {
        await AsyncStorage.setItem('token', 'a');
        await AsyncStorage.setItem('refreshToken', 'r');
        const api = await mount();
        expect(api().tokenRef.current).toBe('a');
        expect(api().refreshTokenRef.current).toBe('r');
    });

    it('ignores a saved access token with no refresh token', async () => {
        await AsyncStorage.setItem('token', 'a');
        const api = await mount();
        expect(api().tokenRef.current).toBeNull();
    });

    it('signs in: keeps the user and both tokens in memory and in storage and resets the expiry warnings', async () => {
        const user = new User('ann', 'a@b.c', []);
        service.auth.mockResolvedValue({ user, access: 'acc', refresh: 'ref' });
        const api = await mount();
        api().setUserTokenWarned([true, true, true]);

        let ok: boolean | undefined;
        await act(async () => { ok = await api().auth(FIELDS, AuthType.Login); });

        expect(ok).toBe(true);
        expect(mockSetUser).toHaveBeenCalledWith(user);
        expect(api().tokenRef.current).toBe('acc');
        expect(api().refreshTokenRef.current).toBe('ref');
        expect(await AsyncStorage.getItem('token')).toBe('acc');
        expect(await AsyncStorage.getItem('refreshToken')).toBe('ref');
        expect(api().userTokenWarnedRef.current).toEqual([false, false, false]);
    });

    it('returns false for wrong credentials (403) and stores nothing', async () => {
        service.auth.mockRejectedValue(new NetworkError('Invalid credentials', 403));
        const api = await mount();

        let ok: boolean | undefined;
        await act(async () => { ok = await api().auth(FIELDS, AuthType.Login); });

        expect(ok).toBe(false);
        expect(await AsyncStorage.getItem('token')).toBeNull();
        expect(mockSetUser).not.toHaveBeenCalled();
    });

    it.each([
        ['A user with that username already exists', 'Username already taken'],
        ['A user with that email already exists', 'Email already taken'],
        ['Enter a valid email address', 'Enter a valid email'],
    ])('explains a registration conflict (409): %s', async (serverMessage, shown) => {
        service.auth.mockRejectedValue(new NetworkError(serverMessage, 409));
        const api = await mount();
        await act(async () => {
            await expect(api().auth(FIELDS, AuthType.Register)).rejects.toThrow(shown);
        });
    });

    it('reports anything else as a network error', async () => {
        service.auth.mockRejectedValue(new NetworkError('Server error', 500));
        const api = await mount();
        await act(async () => {
            await expect(api().auth(FIELDS, AuthType.Login)).rejects.toThrow('Network error');
        });
    });

    it('signs out: clears the user and tokens locally, tells the server, and goes to the login screen', async () => {
        service.auth.mockResolvedValue({ user: new User('ann', 'a@b.c', []), access: 'acc', refresh: 'ref' });
        service.logout.mockResolvedValue(true);
        const api = await mount();
        await act(async () => { await api().auth(FIELDS, AuthType.Login); });
        mockSetUser.mockClear();

        await act(async () => { await api().logout(); });

        expect(service.logout).toHaveBeenCalledTimes(1);
        expect(mockSetUser).toHaveBeenCalledWith(null);
        expect(api().tokenRef.current).toBeNull();
        expect(await AsyncStorage.getItem('token')).toBeNull();
        expect(router.push).toHaveBeenCalledWith('/(screens)/login-screen');
    });

    it('tells the server which token is signing out, and which device to stop notifying', async () => {
        service.auth.mockResolvedValue({ user: new User('ann', 'a@b.c', []), access: 'acc', refresh: 'ref' });
        service.logout.mockResolvedValue(true);
        mockForget.mockResolvedValue('ExponentPushToken[abc]');
        const api = await mount();
        await act(async () => { await api().auth(FIELDS, AuthType.Login); });

        await act(async () => { await api().logout(); });

        expect(service.logout).toHaveBeenCalledWith('acc', 'ExponentPushToken[abc]');
    });

    it('registers the device for push after signing in', async () => {
        service.auth.mockResolvedValue({ user: new User('ann', 'a@b.c', []), access: 'acc', refresh: 'ref' });
        const api = await mount();
        await act(async () => { await api().auth(FIELDS, AuthType.Login); });
        expect(mockRegister).toHaveBeenCalledWith('acc');
    });

    it('registers the device for push when a saved session is restored at launch', async () => {
        await AsyncStorage.setItem('token', 'a');
        await AsyncStorage.setItem('refreshToken', 'r');
        await mount();
        expect(mockRegister).toHaveBeenCalledWith('a');
    });

    it('does nothing on sign-out when nobody is signed in', async () => {
        const api = await mount();
        await act(async () => { await api().logout(); });
        expect(service.logout).not.toHaveBeenCalled();
    });

    it('still ends up on the login screen when the server cannot be told about the sign-out', async () => {
        service.auth.mockResolvedValue({ user: new User('ann', 'a@b.c', []), access: 'acc', refresh: 'ref' });
        service.logout.mockRejectedValue(new Error('offline'));
        const api = await mount();
        await act(async () => { await api().auth(FIELDS, AuthType.Login); });

        await act(async () => { await expect(api().logout()).rejects.toThrow('offline'); });

        expect(api().tokenRef.current).toBeNull();
        expect(router.push).toHaveBeenCalledWith('/(screens)/login-screen');
    });

    it('deletes the account: signs out locally only when the server accepted the password', async () => {
        service.auth.mockResolvedValue({ user: new User('ann', 'a@b.c', []), access: 'acc', refresh: 'ref' });
        const api = await mount();
        await act(async () => { await api().auth(FIELDS, AuthType.Login); });

        service.deleteAccount.mockResolvedValueOnce(false);
        let deleted: boolean | undefined;
        await act(async () => { deleted = await api().deleteAccount('wrong'); });
        expect(deleted).toBe(false);
        expect(api().tokenRef.current).toBe('acc');

        service.deleteAccount.mockResolvedValueOnce(true);
        await act(async () => { deleted = await api().deleteAccount('right'); });
        expect(deleted).toBe(true);
        expect(service.deleteAccount).toHaveBeenLastCalledWith('acc', 'right');
        expect(api().tokenRef.current).toBeNull();
        expect(router.push).toHaveBeenCalledWith('/(screens)/login-screen');
    });

    it('refuses to delete an account when nobody is signed in', async () => {
        const api = await mount();
        let deleted: boolean | undefined;
        await act(async () => { deleted = await api().deleteAccount('pw'); });
        expect(deleted).toBe(false);
        expect(service.deleteAccount).not.toHaveBeenCalled();
    });
});
