import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import GameScreen from '../game-screen';
import { GameType } from '@/features/game/models/GameType';
import { NetworkError } from '@/lib/networkRequests/NetworkError';

const mockAddToast = jest.fn();
const mockStart = jest.fn();
const mockFinish = jest.fn();
const mockLegacy = jest.fn();
const mockSetUser = jest.fn();
const mockUpdateLocalScore = jest.fn();
let mockGameParam: object | null = null;
let mockUser: { username: string; computerPoints: number; with: (changes: object) => object } | null = null;

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ game: mockGameParam ? encodeURIComponent(JSON.stringify(mockGameParam)) : undefined }),
}));
jest.mock('@/contexts/RouteContext', () => ({
    useRouteTo: () => ({ routeTo: jest.fn(), routeReplace: jest.fn(), routeBack: jest.fn() }),
}));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        user: mockUser, userRef: { current: mockUser }, setUser: mockSetUser, updateUserComputerScore: mockUpdateLocalScore,
    }),
}));
jest.mock('@/contexts/LoadingContext', () => ({ useLoading: () => ({ setLoading: jest.fn() }) }));
jest.mock('@/contexts/GamePollContext', () => ({ useGamePoll: () => ({ pollUserGames: jest.fn() }) }));
jest.mock('@/hooks/useGameService', () => ({
    useGameService: () => ({
        makeMove: jest.fn(), updateComputerScore: mockLegacy, startComputerGame: mockStart, finishComputerGame: mockFinish,
    }),
}));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));
jest.mock('@/features/game/components/GameBoard', () => ({ GameBoard: () => null }));
jest.mock('@/features/game/components/PlayerChips', () => ({ PlayerChips: () => null }));
// The computer opponent is not under test here (it searches for up to half a second a move).
jest.mock('@/features/game/models/GameAI', () => ({
    GameAI: class { async computeMove() { return null; } },
}));

jest.setTimeout(30000);

// The first player makes four in a row across the top on move 7.
const WIN_MOVES = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3]];
const human = { username: 'ann', rating: 1000, computerLevel: null };
const computer = (level: number) => ({ username: 'Computer', rating: 0, computerLevel: level });

function player(name: string) {
    return { username: name, rating: 1000, computerLevel: null };
}

/** A computer game in which `moves` (as [row, col]) were already played; the first player plays the first move. */
function computerGame(opts: { level: number; humanFirst: boolean; moves: number[][] }) {
    const first = opts.humanFirst ? human : computer(opts.level);
    const second = opts.humanFirst ? computer(opts.level) : human;
    return {
        gameType: GameType.Computer, gameId: null, player1: first, player2: second,
        moves: opts.moves.map(([row, column], i) => ({ player: i % 2 === 0 ? first : second, row, column })),
        lastUpdated: null, moveTime: null, winner: null,
    };
}

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<GameScreen />); });
    const button = (title: string) => tree.root.findAll(
        (n: ReactTestInstance) => typeof n.props.onPress === 'function' && n.props.title === title);
    return { button };
}

describe('Game screen: a win against the computer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = { username: 'ann', computerPoints: 100, with: (changes: object) => ({ ...mockUser, ...changes }) as any };
        mockStart.mockResolvedValue(31);
        mockFinish.mockResolvedValue({ pointsAwarded: 40, total: 140, alreadyFinished: false });
        mockLegacy.mockResolvedValue(undefined);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('registers the game when it starts and sends the moves when the player wins, then shows the points', async () => {
        mockGameParam = computerGame({ level: 40, humanFirst: true, moves: WIN_MOVES });
        await render();

        expect(mockStart).toHaveBeenCalledWith(40, true);
        expect(mockFinish).toHaveBeenCalledWith(31, WIN_MOVES);
        expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ computerPoints: 140 }));
        expect(mockAddToast).toHaveBeenCalledWith('Win verified: +40 points');
        expect(mockLegacy).not.toHaveBeenCalled();
    });

    it('tells the server the human went second when the computer made the first move', async () => {
        mockGameParam = computerGame({ level: 15, humanFirst: false, moves: [] });
        await render();
        expect(mockStart).toHaveBeenCalledWith(15, false);
    });

    it('does not take points for a game the computer won', async () => {
        // The computer is the first player here and makes four in a row.
        mockGameParam = computerGame({ level: 40, humanFirst: false, moves: WIN_MOVES });
        await render();
        expect(mockFinish).not.toHaveBeenCalled();
        expect(mockSetUser).not.toHaveBeenCalled();
        expect(mockLegacy).not.toHaveBeenCalled();
    });

    it('does nothing for a player who is not signed in, and for level 0', async () => {
        mockUser = null;
        mockGameParam = computerGame({ level: 40, humanFirst: true, moves: WIN_MOVES });
        await render();
        expect(mockStart).not.toHaveBeenCalled();
        expect(mockFinish).not.toHaveBeenCalled();

        mockUser = { username: 'ann', computerPoints: 0, with: () => ({}) as any };
        mockGameParam = computerGame({ level: 0, humanFirst: true, moves: WIN_MOVES });
        await render();
        expect(mockStart).not.toHaveBeenCalled();
    });

    it('does not register two-player games', async () => {
        mockGameParam = {
            gameType: GameType.TwoPlayer, gameId: null, player1: player('Player 1'), player2: player('Player 2'),
            moves: [], lastUpdated: null, moveTime: null, winner: null,
        };
        await render();
        expect(mockStart).not.toHaveBeenCalled();
    });

    it('says so, and adds nothing, when the server cannot verify the win', async () => {
        mockFinish.mockRejectedValue(new NetworkError('The game was too fast to be played', 400));
        mockGameParam = computerGame({ level: 40, humanFirst: true, moves: WIN_MOVES });
        await render();

        expect(mockAddToast).toHaveBeenCalledWith('This win could not be verified, so no points were added.');
        expect(mockSetUser).not.toHaveBeenCalled();
        expect(mockFinish).toHaveBeenCalledTimes(1);
    });

    it('offers to try again when the server cannot be reached, and credits the win when that works', async () => {
        jest.useFakeTimers();
        mockFinish.mockRejectedValue(new TypeError('Network request failed'));
        mockGameParam = computerGame({ level: 40, humanFirst: true, moves: WIN_MOVES });
        let tree!: ReturnType<typeof create>;
        await act(async () => { tree = create(<GameScreen />); });
        await act(async () => { await jest.advanceTimersByTimeAsync(2000); }); // the automatic retry after a pause
        jest.useRealTimers();

        expect(mockFinish).toHaveBeenCalledTimes(2);
        const [message, actions] = mockAddToast.mock.calls.find(([m]) => String(m).includes("Couldn't record"))!;
        expect(message).toContain('Check your connection');
        expect(actions[0].label).toBe('Try again');
        expect(mockSetUser).not.toHaveBeenCalled();

        mockFinish.mockResolvedValue({ pointsAwarded: 40, total: 140, alreadyFinished: true });
        await act(async () => { await actions[0].callback(); });
        expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ computerPoints: 140 }));
        tree.unmount();
    });

    it('explains that an offline start means the game does not count', async () => {
        mockStart.mockRejectedValue(new TypeError('Network request failed'));
        mockGameParam = computerGame({ level: 40, humanFirst: true, moves: WIN_MOVES });
        await render();

        expect(mockAddToast).toHaveBeenCalledWith("This game didn't count towards the leaderboard because you were offline when it started.");
        expect(mockFinish).not.toHaveBeenCalled();
        expect(mockLegacy).not.toHaveBeenCalled();
    });

    it('falls back to the old endpoint, as before, while the server has no computer-game endpoints yet', async () => {
        mockStart.mockRejectedValue(new NetworkError('Not found', 404));
        mockGameParam = computerGame({ level: 40, humanFirst: true, moves: WIN_MOVES });
        await render();

        expect(mockLegacy).toHaveBeenCalledWith(40);
        expect(mockUpdateLocalScore).toHaveBeenCalledWith(40);
        expect(mockFinish).not.toHaveBeenCalled();
    });

    it('registers a new game when the board is reset, with whoever moves first this time', async () => {
        const random = jest.spyOn(Math, 'random').mockReturnValue(0.9); // the human moves first after the reset
        mockGameParam = computerGame({ level: 40, humanFirst: false, moves: [] });
        const { button } = await render();
        expect(mockStart).toHaveBeenLastCalledWith(40, false);

        await act(async () => { button('Reset Board')[0].props.onPress(); });
        const [, actions] = mockAddToast.mock.calls.find(([m]) => m === 'Confirm Reset?')!;
        await act(async () => { actions[0].callback(); });

        expect(mockStart).toHaveBeenCalledTimes(2);
        expect(mockStart).toHaveBeenLastCalledWith(40, true);
        random.mockRestore();
    });
});
