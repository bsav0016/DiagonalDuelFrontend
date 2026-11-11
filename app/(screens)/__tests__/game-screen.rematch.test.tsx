import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import GameScreen from '../game-screen';
import { GameType } from '@/features/game/models/GameType';
import { NetworkError } from '@/lib/networkRequests/NetworkError';

const mockAddToast = jest.fn();
const mockRequestRematch = jest.fn();
const mockSetLoading = jest.fn();
let mockGameParam: object | null = null;
let mockUser: { username: string } | null = { username: 'ann' };

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ game: mockGameParam ? encodeURIComponent(JSON.stringify(mockGameParam)) : undefined }),
}));
jest.mock('@/contexts/RouteContext', () => ({
    useRouteTo: () => ({ routeTo: jest.fn(), routeReplace: jest.fn(), routeBack: jest.fn() }),
}));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({ user: mockUser, userRef: { current: mockUser }, updateUserComputerScore: jest.fn() }),
}));
jest.mock('@/contexts/LoadingContext', () => ({ useLoading: () => ({ setLoading: mockSetLoading }) }));
jest.mock('@/contexts/GamePollContext', () => ({ useGamePoll: () => ({ pollUserGames: jest.fn() }) }));
jest.mock('@/hooks/useGameService', () => ({
    useGameService: () => ({ makeMove: jest.fn(), requestRematch: mockRequestRematch, updateComputerScore: jest.fn() }),
}));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));
jest.mock('@/features/game/components/GameBoard', () => ({ GameBoard: () => null }));
jest.mock('@/features/game/components/PlayerChips', () => ({ PlayerChips: () => null }));

jest.setTimeout(30000);

const onlineGame = (winner: string | null) => ({
    gameType: GameType.Online, gameId: 7,
    player1: { username: 'ann', rating: 1000 }, player2: { username: 'bob', rating: 1000 },
    moves: [], lastUpdated: new Date().toISOString(), moveTime: 86400000, winner,
});

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<GameScreen />); });
    const rematchButton = () => tree.root.findAll(
        (n: ReactTestInstance) => typeof n.props.onPress === 'function' && n.props.title === 'Rematch');
    return { rematchButton };
}

describe('Game screen rematch button', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = { username: 'ann' };
        mockRequestRematch.mockResolvedValue({});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('is offered once an online game is over, including a draw', async () => {
        for (const winner of ['bob wins!', 'Draw']) {
            mockGameParam = onlineGame(winner);
            const { rematchButton } = await render();
            expect(rematchButton()).toHaveLength(1);
        }
    });

    it('is not offered while the game is still going', async () => {
        mockGameParam = onlineGame(null);
        const { rematchButton } = await render();
        expect(rematchButton()).toHaveLength(0);
    });

    it('is not offered for computer or two-player games', async () => {
        for (const gameType of [GameType.Computer, GameType.TwoPlayer]) {
            mockGameParam = { ...onlineGame('Player 1 wins!'), gameType, gameId: null };
            const { rematchButton } = await render();
            expect(rematchButton()).toHaveLength(0);
        }
    });

    it('asks the opponent for a rematch of that game and then hides the button', async () => {
        mockGameParam = onlineGame('bob wins!');
        const { rematchButton } = await render();

        await act(async () => { await rematchButton()[0].props.onPress(); });

        expect(mockRequestRematch).toHaveBeenCalledWith(7);
        expect(mockAddToast).toHaveBeenCalledWith('Rematch request sent to bob');
        expect(rematchButton()).toHaveLength(0);
        expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });

    it('names the opponent correctly when you were player two', async () => {
        mockUser = { username: 'bob' };
        mockGameParam = onlineGame('ann wins!');
        const { rematchButton } = await render();

        await act(async () => { await rematchButton()[0].props.onPress(); });

        expect(mockAddToast).toHaveBeenCalledWith('Rematch request sent to ann');
    });

    it('shows the server\'s reason and keeps the button when it refuses', async () => {
        mockGameParam = onlineGame('bob wins!');
        mockRequestRematch.mockRejectedValue(new NetworkError('You already challenged bob.', 400));
        const { rematchButton } = await render();

        await act(async () => { await rematchButton()[0].props.onPress(); });

        expect(mockAddToast).toHaveBeenCalledWith('You already challenged bob.');
        expect(rematchButton()).toHaveLength(1);
        expect(mockSetLoading).toHaveBeenLastCalledWith(false);
    });
});
