import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import GameScreen from '../game-screen';
import { GameType } from '@/features/game/models/GameType';

const mockAddToast = jest.fn();
const mockResign = jest.fn();
const mockPoll = jest.fn();
const mockRouteBack = jest.fn();
const mockSetLoading = jest.fn();
let mockGameParam: object | null = null;
let mockUser: { username: string } | null = { username: 'ann' };

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ game: mockGameParam ? encodeURIComponent(JSON.stringify(mockGameParam)) : undefined }),
}));
jest.mock('@/contexts/RouteContext', () => ({
    useRouteTo: () => ({ routeTo: jest.fn(), routeReplace: jest.fn(), routeBack: mockRouteBack }),
}));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({ user: mockUser, userRef: { current: mockUser }, updateUserComputerScore: jest.fn() }),
}));
jest.mock('@/contexts/LoadingContext', () => ({ useLoading: () => ({ setLoading: mockSetLoading }) }));
jest.mock('@/contexts/GamePollContext', () => ({ useGamePoll: () => ({ pollUserGames: mockPoll }) }));
jest.mock('@/hooks/useGameService', () => ({
    useGameService: () => ({ makeMove: jest.fn(), resign: mockResign, updateComputerScore: jest.fn() }),
}));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));
jest.mock('@/features/game/components/GameBoard', () => ({ GameBoard: () => null }));
jest.mock('@/features/game/components/PlayerChips', () => ({ PlayerChips: () => null }));

// Loading the screen compiles a lot on a cold CI machine.
jest.setTimeout(30000);

const onlineGame = (winner: string | null = null) => ({
    gameType: GameType.Online, gameId: 7,
    player1: { username: 'ann', rating: 1000 }, player2: { username: 'bob', rating: 1000 },
    moves: [], lastUpdated: new Date().toISOString(), moveTime: 86400000, winner,
});

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<GameScreen />); });
    const resignButton = () => tree.root.findAll(
        (n: ReactTestInstance) => typeof n.props.onPress === 'function' && n.props.title === 'Resign');
    return { tree, resignButton };
}

describe('Game screen resign button', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = { username: 'ann' };
        mockResign.mockResolvedValue(undefined);
        mockPoll.mockResolvedValue(undefined);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('is offered in an online game that is still going', async () => {
        mockGameParam = onlineGame();
        const { resignButton } = await render();
        expect(resignButton()).toHaveLength(1);
    });

    it('is not offered once the game is over', async () => {
        mockGameParam = onlineGame('bob wins!');
        const { resignButton } = await render();
        expect(resignButton()).toHaveLength(0);
    });

    it('is not offered against the computer or in a local game', async () => {
        for (const gameType of [GameType.Computer, GameType.TwoPlayer]) {
            mockGameParam = { ...onlineGame(), gameType, gameId: null };
            const { resignButton } = await render();
            expect(resignButton()).toHaveLength(0);
        }
    });

    it('asks first, naming the opponent, and does nothing until confirmed', async () => {
        mockGameParam = onlineGame();
        const { resignButton } = await render();

        await act(async () => { resignButton()[0].props.onPress(); });

        expect(mockAddToast).toHaveBeenCalledTimes(1);
        expect(mockAddToast.mock.calls[0][0]).toContain('bob');
        expect(mockAddToast.mock.calls[0][1].map((a: any) => a.label)).toEqual(['Resign']);
        expect(mockResign).not.toHaveBeenCalled();
    });

    it('resigns, refreshes the games and goes back once confirmed', async () => {
        mockGameParam = onlineGame();
        const { resignButton } = await render();
        await act(async () => { resignButton()[0].props.onPress(); });

        await act(async () => { await mockAddToast.mock.calls[0][1][0].callback(); });

        expect(mockResign).toHaveBeenCalledWith(7);
        expect(mockPoll).toHaveBeenCalled();
        expect(mockRouteBack).toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });

    it('stays on the game and says so when the server refuses', async () => {
        mockGameParam = onlineGame();
        mockResign.mockRejectedValue(new Error('Game is already complete.'));
        const { resignButton } = await render();
        await act(async () => { resignButton()[0].props.onPress(); });
        const confirm = mockAddToast.mock.calls[0][1][0].callback;
        mockAddToast.mockClear();

        await act(async () => { await confirm(); });

        expect(mockRouteBack).not.toHaveBeenCalled();
        expect(mockAddToast.mock.calls[0][0]).toContain('Could not resign');
        expect(mockPoll).toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });
});
