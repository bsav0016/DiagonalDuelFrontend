import React from 'react';
import { act, create } from 'react-test-renderer';
import { GamePollProvider } from '../GamePollContext';
import { User } from '@/features/auth/User';

const POLL_MS = 15000;

const mockGetAllGames = jest.fn();
const mockGetMatchmaking = jest.fn();
const mockLogout = jest.fn();
const mockAddToast = jest.fn();
let mockUser: User | null = null;
const mockUserRef = { get current() { return mockUser; } };

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        user: mockUser, userRef: mockUserRef, updateUserGames: jest.fn(), updateMatchmaking: jest.fn(),
    }),
}));
jest.mock('../AuthContext', () => ({ useAuth: () => ({ logout: mockLogout }) }));
jest.mock('../LoadingContext', () => ({ useLoading: () => ({ setLoading: jest.fn() }) }));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
jest.mock('@/hooks/useGameService', () => ({
    useGameService: () => ({
        getAllGames: mockGetAllGames, getMatchmaking: mockGetMatchmaking, startMatchmaking: jest.fn(), stopMatchmaking: jest.fn(),
    }),
}));

const ann = (matchmaking: number[] = []) => new User('ann', 'a@b.c', [], matchmaking);

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<GamePollProvider><></></GamePollProvider>); });
    return tree;
}
const rerender = async (tree: ReturnType<typeof create>) =>
    act(async () => { tree.update(<GamePollProvider><></></GamePollProvider>); });
const tick = async (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });

describe('GamePollProvider polling', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockGetAllGames.mockResolvedValue([]);
        mockGetMatchmaking.mockResolvedValue([]);
        mockUser = null;
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => jest.useRealTimers());

    it('does not poll while nobody is signed in', async () => {
        await render();
        await tick(POLL_MS * 3);
        expect(mockGetAllGames).not.toHaveBeenCalled();
    });

    it('polls the games every 15 seconds once someone signs in', async () => {
        const tree = await render();
        mockUser = ann();
        await rerender(tree);

        await tick(POLL_MS);
        expect(mockGetAllGames).toHaveBeenCalledTimes(1);
        await tick(POLL_MS);
        expect(mockGetAllGames).toHaveBeenCalledTimes(2);
    });

    it('keeps its rhythm when the user object changes after a poll, instead of restarting the timer', async () => {
        const tree = await render();
        mockUser = ann();
        await rerender(tree);

        await tick(POLL_MS - 1000);
        mockUser = ann(); // a new object for the same person, as every update makes
        await rerender(tree);
        await tick(1000);

        expect(mockGetAllGames).toHaveBeenCalledTimes(1);
    });

    it('stops polling on sign-out', async () => {
        const tree = await render();
        mockUser = ann();
        await rerender(tree);
        await tick(POLL_MS);
        expect(mockGetAllGames).toHaveBeenCalledTimes(1);

        mockUser = null;
        await rerender(tree);
        await tick(POLL_MS * 3);
        expect(mockGetAllGames).toHaveBeenCalledTimes(1);
    });

    it('checks matchmaking only while the user is waiting for an opponent', async () => {
        const tree = await render();
        mockUser = ann([]);
        await rerender(tree);
        await tick(POLL_MS);
        expect(mockGetMatchmaking).not.toHaveBeenCalled();

        mockUser = ann([3]);
        await rerender(tree);
        await tick(POLL_MS);
        expect(mockGetMatchmaking).toHaveBeenCalled();
    });

    it('tells the user to sign in again, and signs them out, when the refresh token has expired', async () => {
        mockGetAllGames.mockRejectedValue(new Error('Refresh token expired'));
        const tree = await render();
        mockUser = ann();
        await rerender(tree);

        await tick(POLL_MS);

        expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('login again'));
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('carries on quietly after other poll errors', async () => {
        mockGetAllGames.mockRejectedValue(new Error('offline'));
        const tree = await render();
        mockUser = ann();
        await rerender(tree);

        await tick(POLL_MS * 2);

        expect(mockLogout).not.toHaveBeenCalled();
        expect(mockGetAllGames).toHaveBeenCalledTimes(2);
    });
});
