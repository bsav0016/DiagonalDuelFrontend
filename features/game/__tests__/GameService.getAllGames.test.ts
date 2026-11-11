import { GameService } from '../GameService';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

const gameData = (id: number, winner: string | null = null) => ({
    id, player1: 'ann', player1_rating: 1000, player2: 'bob', player2_rating: 1000, moves: [],
    updated_at: '2026-11-10T10:00:00Z', time_limit: '1 00:00:00', winner,
});

describe('GameService.getAllGames', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('asks for the given number of finished games', async () => {
        mockedRequest.mockResolvedValue({ status: 200, data: { games: [] } });

        await GameService.getAllGames('access', 40);

        const [url, method, headers] = mockedRequest.mock.calls[0];
        expect(url).toBe('games/?completed_limit=40');
        expect(method).toBe(RequestMethod.GET);
        expect(headers.Authorization).toBe('Bearer access');
    });

    it('asks for everything when no number is given', async () => {
        mockedRequest.mockResolvedValue({ status: 200, data: { games: [] } });
        await GameService.getAllGames('access');
        expect(mockedRequest.mock.calls[0][0]).toBe('games/');
    });

    it('returns the games, whether older finished games exist, and the record', async () => {
        mockedRequest.mockResolvedValue({
            status: 200,
            data: { games: [gameData(1), gameData(2, 'bob wins!')], has_more_completed: true, record: { wins: 1, losses: 2, draws: 0 } },
        });

        const list = await GameService.getAllGames('access', 20);

        expect(list.games.map((g) => g.gameId)).toEqual([1, 2]);
        expect(list.hasMoreCompleted).toBe(true);
        expect(list.record).toEqual({ wins: 1, losses: 2, draws: 0 });
    });

    it('copes with a backend that does not send the new fields', async () => {
        mockedRequest.mockResolvedValue({ status: 200, data: { games: [gameData(1)] } });

        const list = await GameService.getAllGames('access', 20);

        expect(list.games).toHaveLength(1);
        expect(list.hasMoreCompleted).toBe(false);
        expect(list.record).toBeNull();
    });

    it('refuses a reply with no games', async () => {
        mockedRequest.mockResolvedValue({ status: 200, data: {} });
        await expect(GameService.getAllGames('access', 20)).rejects.toThrow("Couldn't get games");
    });
});
