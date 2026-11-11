import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import PlayOnline from '../play-online';
import { Routes } from '../Routes';
import { Game } from '@/features/game/models/Game';
import { Challenge } from '@/features/challenges/Challenge';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { User } from '@/features/auth/User';

const mockRouteTo = jest.fn();
const mockAddToast = jest.fn();
const mockPoll = jest.fn();
const mockSetLoading = jest.fn();
const mockGetChallenges = jest.fn();
const mockAccept = jest.fn();
const mockDecline = jest.fn();
const mockCancel = jest.fn();
const mockUser = new User('ann', 'a@b.c', []);

jest.mock('expo-router', () => {
    const React = jest.requireActual('react');
    // Run the focus effect when it changes, as if the screen had just been focused.
    return { useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(() => effect(), [effect]) };
});
jest.mock('@/contexts/RouteContext', () => ({
    useRouteTo: () => ({ routeTo: mockRouteTo, routeReplace: jest.fn(), routeBack: jest.fn() }),
}));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
jest.mock('@/contexts/UserContext', () => ({ useUser: () => ({ user: mockUser }) }));
jest.mock('@/contexts/LoadingContext', () => ({ useLoading: () => ({ setLoading: mockSetLoading }) }));
jest.mock('@/contexts/GamePollContext', () => ({
    useGamePoll: () => ({
        pollUserGames: mockPoll, createMatchmaking: jest.fn(), cancelMatchmaking: jest.fn(), enablePushNotifications: jest.fn(),
    }),
}));
jest.mock('@/hooks/useGameService', () => ({
    useGameService: () => ({
        getChallenges: mockGetChallenges, acceptChallenge: mockAccept, declineChallenge: mockDecline, cancelChallenge: mockCancel,
    }),
}));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));
jest.mock('@/components/CountdownTimer', () => ({ CountdownTimer: () => null }));

jest.setTimeout(30000);

const challenge = (overrides: Partial<Challenge> = {}): Challenge => ({
    id: 1, challenger: 'bob', recipient: 'ann', days: 3, expiresAt: new Date('2026-11-17T10:00:00Z'), rematch: false,
    ...overrides,
});

const newGame = () => Game.fromData({
    id: 9, player1: 'bob', player1_rating: 1000, player2: 'ann', player2_rating: 1000, moves: [],
    updated_at: '2026-11-10T10:00:00Z', time_limit: '3 00:00:00', winner: null,
});

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<PlayOnline />); });
    const text = () => JSON.stringify(tree.toJSON());
    const button = (title: string) => tree.root.findAll(
        (n: ReactTestInstance) => n.props.title === title && typeof n.props.onPress === 'function');
    return { tree, text, button };
}

describe('Play Online challenges', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetChallenges.mockResolvedValue({ incoming: [challenge()], outgoing: [challenge({ id: 2, challenger: 'ann', recipient: 'carol' })] });
        mockPoll.mockResolvedValue(undefined);
        mockAccept.mockResolvedValue(newGame());
        mockDecline.mockResolvedValue(undefined);
        mockCancel.mockResolvedValue(undefined);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('loads the challenges when the screen opens and lists them', async () => {
        const { text } = await render();
        expect(mockGetChallenges).toHaveBeenCalled();
        expect(text()).toContain('bob challenged you (3-day turns)');
        expect(text()).toContain('Waiting for carol (3-day turns)');
    });

    it('opens the challenge form', async () => {
        const { button } = await render();
        await act(async () => { button('Challenge a Friend')[0].props.onPress(); });
        expect(mockRouteTo).toHaveBeenCalledWith(Routes.NewChallenge);
    });

    it('accepting refreshes the games and opens the new game', async () => {
        const { button } = await render();

        await act(async () => { await button('Accept')[0].props.onPress(); });

        expect(mockAccept).toHaveBeenCalledWith(1);
        expect(mockPoll).toHaveBeenCalled();
        const [route, params] = mockRouteTo.mock.calls[0];
        expect(route).toBe(Routes.Game);
        expect(JSON.parse(decodeURIComponent(params.game)).gameId).toBe(9);
        expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });

    it('shows the server\'s reason, stays put and refreshes when accepting fails', async () => {
        mockAccept.mockRejectedValue(new NetworkError('This challenge has expired.', 400));
        const { button } = await render();
        mockGetChallenges.mockClear();

        await act(async () => { await button('Accept')[0].props.onPress(); });

        expect(mockAddToast).toHaveBeenCalledWith('This challenge has expired.');
        expect(mockRouteTo).not.toHaveBeenCalled();
        expect(mockGetChallenges).toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });

    it('declining and cancelling use their own calls and refresh the list', async () => {
        const { tree, button } = await render();
        mockGetChallenges.mockClear();

        await act(async () => { await button('Decline')[0].props.onPress(); });
        await act(async () => { await tree.root.findByProps({ testID: 'cancel-2' }).props.onPress(); });

        expect(mockDecline).toHaveBeenCalledWith(1);
        expect(mockCancel).toHaveBeenCalledWith(2);
        expect(mockGetChallenges).toHaveBeenCalledTimes(2);
    });

    it('keeps the screen usable when the challenges cannot be loaded', async () => {
        mockGetChallenges.mockRejectedValue(new Error('offline'));
        const { text } = await render();
        expect(text()).toContain('No challenges waiting');
    });
});
