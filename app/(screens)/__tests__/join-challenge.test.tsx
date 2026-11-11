import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import JoinChallengeScreen from '../join-challenge';
import { Routes } from '../Routes';
import { Game } from '@/features/game/models/Game';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { User } from '@/features/auth/User';

const mockAddToast = jest.fn();
const mockRouteBack = jest.fn();
const mockRouteReplace = jest.fn();
const mockPoll = jest.fn();
const mockPreview = jest.fn();
const mockAccept = jest.fn();
let mockParams: Record<string, string> = {};
let mockUser: User | null = new User('ann', 'a@b.c', []);

jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
jest.mock('@/contexts/RouteContext', () => ({
    useRouteTo: () => ({ routeBack: mockRouteBack, routeReplace: mockRouteReplace, routeTo: jest.fn() }),
}));
jest.mock('@/contexts/UserContext', () => ({ useUser: () => ({ user: mockUser }) }));
jest.mock('@/contexts/GamePollContext', () => ({ useGamePoll: () => ({ pollUserGames: mockPoll }) }));
jest.mock('@/hooks/useGameService', () => ({
    useGameService: () => ({ previewInvite: mockPreview, acceptInvite: mockAccept }),
}));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));
jest.mock('@/components/LoadingSpinner', () => ({ LoadingSpinner: () => 'spinner' }));

jest.setTimeout(30000);

const challenge = { id: 1, challenger: 'bob', recipient: null, days: 3, expiresAt: new Date(), rematch: false, inviteCode: null };
const newGame = () => Game.fromData({
    id: 9, player1: 'bob', player1_rating: 1000, player2: 'ann', player2_rating: 1000, moves: [],
    updated_at: '2026-11-10T10:00:00Z', time_limit: '3 00:00:00', winner: null,
});

// Screens are unmounted after each test so their timers (a wait for the stored user, the 15-second poll) stop.
const rendered: ReturnType<typeof create>[] = [];
afterEach(async () => { await act(async () => { rendered.splice(0).forEach((tree) => tree.unmount()); }); });

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<JoinChallengeScreen />); });
    rendered.push(tree);
    const text = () => JSON.stringify(tree.toJSON());
    const input = () => tree.root.findAll((n: ReactTestInstance) => String(n.type) === 'TextInput')[0];
    const button = (title: string) => tree.root.findAll(
        (n: ReactTestInstance) => n.props.title === title && typeof n.props.onPress === 'function');
    const type = async (value: string) => act(async () => { input().props.onChangeText(value); });
    const press = async (title: string) => act(async () => { await button(title)[0].props.onPress(); });
    return { tree, text, input, button, type, press };
}

describe('Join challenge screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        mockParams = {};
        mockUser = new User('ann', 'a@b.c', []);
        mockPreview.mockResolvedValue({ challenge, canAccept: true });
        mockAccept.mockResolvedValue(newGame());
        mockPoll.mockResolvedValue(undefined);
    });

    it('looks up a code that came with the link straight away, without accepting it', async () => {
        mockParams = { code: 'ABCD2345' };

        const { text, input } = await render();

        expect(mockPreview).toHaveBeenCalledWith('ABCD2345');
        expect(input().props.value).toBe('ABCD2345');
        expect(text()).toContain('bob invites you to play, with 3-day turns.');
        expect(mockAccept).not.toHaveBeenCalled();
    });

    it('looks up a typed code on request', async () => {
        const { text, type, press } = await render();
        expect(mockPreview).not.toHaveBeenCalled();

        await type('abcd 2345');
        await press('Look Up');

        expect(mockPreview).toHaveBeenCalledWith('abcd 2345');
        expect(text()).toContain('bob invites you to play');
    });

    it('asks for a code before looking anything up', async () => {
        const { type, press } = await render();
        await type('   ');

        await press('Look Up');

        expect(mockPreview).not.toHaveBeenCalled();
        expect(mockAddToast).toHaveBeenCalledWith('Enter the code your friend sent you');
    });

    it('accepting refreshes the games and opens the new game in place of this screen', async () => {
        mockParams = { code: 'ABCD2345' };
        const { press } = await render();

        await press('Accept');

        expect(mockAccept).toHaveBeenCalledWith('ABCD2345');
        expect(mockPoll).toHaveBeenCalled();
        const [route, params] = mockRouteReplace.mock.calls[0];
        expect(route).toBe(Routes.Game);
        expect(JSON.parse(decodeURIComponent(params.game)).gameId).toBe(9);
    });

    it('shows the server\'s reason when the code is not found', async () => {
        mockPreview.mockRejectedValue(new NetworkError('Challenge not found.', 404));
        const { type, press, button } = await render();
        await type('NOPE');

        await press('Look Up');

        expect(mockAddToast).toHaveBeenCalledWith('Challenge not found.');
        expect(button('Accept')).toHaveLength(0);
    });

    it('explains an invite that cannot be accepted instead of offering Accept', async () => {
        mockParams = { code: 'ABCD2345' };
        mockPreview.mockResolvedValue({ challenge, canAccept: false });

        const { text, button } = await render();

        expect(text()).toContain('This invite cannot be accepted');
        expect(button('Accept')).toHaveLength(0);
    });

    it('goes back to looking up when accepting fails, with the server\'s reason', async () => {
        mockParams = { code: 'ABCD2345' };
        mockAccept.mockRejectedValue(new NetworkError('This challenge was accepted.', 400));
        const { press, button } = await render();

        await press('Accept');

        expect(mockAddToast).toHaveBeenCalledWith('This challenge was accepted.');
        expect(mockRouteReplace).not.toHaveBeenCalled();
        expect(button('Look Up')).toHaveLength(1);
    });

    it('forgets the looked-up invite when the code is edited', async () => {
        mockParams = { code: 'ABCD2345' };
        const { type, button } = await render();
        expect(button('Accept')).toHaveLength(1);

        await type('ABCD234');

        expect(button('Accept')).toHaveLength(0);
        expect(button('Look Up')).toHaveLength(1);
    });

    it('waits for the stored user before saying nobody is signed in, then offers Sign In', async () => {
        jest.useFakeTimers();
        mockUser = null;
        mockParams = { code: 'ABCD2345' };

        const { text, button } = await render();
        expect(text()).toContain('spinner');
        expect(button('Sign In')).toHaveLength(0);

        await act(async () => { jest.advanceTimersByTime(3100); });

        expect(text()).toContain('Sign in or create an account first');
        expect(mockPreview).not.toHaveBeenCalled();
        await act(async () => { button('Sign In')[0].props.onPress(); });
        expect(mockRouteReplace).toHaveBeenCalledWith(Routes.Login);
    });
});
