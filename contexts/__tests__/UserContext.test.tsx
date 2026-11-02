import React from 'react';
import { act, create } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProvider, useUser } from '../UserContext';
import { User } from '@/features/auth/User';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

async function mount() {
    let api!: ReturnType<typeof useUser>;
    let renders = 0;
    const Probe = () => { api = useUser(); renders += 1; return null; };
    await act(async () => { create(<UserProvider><Probe /></UserProvider>); });
    await act(async () => {});
    return { api: () => api, renders: () => renders };
}

const ann = () => new User('ann', 'ann@example.com', [], [3], 10, 1100);

describe('UserProvider', () => {
    beforeEach(async () => { await AsyncStorage.clear(); });

    it('starts with nobody signed in', async () => {
        const { api } = await mount();
        expect(api().user).toBeNull();
        expect(api().userRef.current).toBeNull();
    });

    it('keeps the state and the ref on the same user, and re-renders when the user is set', async () => {
        const { api, renders } = await mount();
        const before = renders();

        await act(async () => { await api().setUser(ann()); });

        expect(api().user?.username).toBe('ann');
        expect(api().userRef.current).toBe(api().user);
        expect(renders()).toBeGreaterThan(before);
    });

    it('saves the user, and forgets them on sign-out', async () => {
        const { api } = await mount();
        await act(async () => { await api().setUser(ann()); });
        expect(JSON.parse((await AsyncStorage.getItem('user'))!).username).toBe('ann');

        await act(async () => { await api().setUser(null); });
        expect(api().user).toBeNull();
        expect(api().userRef.current).toBeNull();
        expect(await AsyncStorage.getItem('user')).toBeNull();
    });

    it('brings back a saved user at launch', async () => {
        await AsyncStorage.setItem('user', JSON.stringify(ann()));
        const { api } = await mount();
        expect(api().user).toMatchObject({ username: 'ann', email: 'ann@example.com', matchmaking: [3], computerPoints: 10, onlineRating: 1100 });
        expect(api().user).toBeInstanceOf(User);
    });

    it('updates matchmaking, games and computer points on the shown user, leaving the rest alone', async () => {
        const { api } = await mount();
        await act(async () => { await api().setUser(ann()); });

        await act(async () => { api().updateMatchmaking([3, 7]); });
        expect(api().user?.matchmaking).toEqual([3, 7]);
        expect(api().user).toMatchObject({ username: 'ann', computerPoints: 10, onlineRating: 1100 });

        await act(async () => { api().updateUserComputerScore(5); });
        expect(api().user?.computerPoints).toBe(15);
        expect(api().user?.matchmaking).toEqual([3, 7]);

        await act(async () => { api().updateUserGames([]); });
        expect(api().user?.games).toEqual([]);
        expect(api().user?.computerPoints).toBe(15);
        expect(api().userRef.current).toBe(api().user);
    });

    it('ignores those updates when nobody is signed in', async () => {
        const { api } = await mount();
        await act(async () => { api().updateMatchmaking([1]); api().updateUserComputerScore(2); api().updateUserGames([]); });
        expect(api().user).toBeNull();
    });
});
