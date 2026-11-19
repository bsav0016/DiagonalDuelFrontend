import { GameService } from '../GameService';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';
import { NetworkError } from '@/lib/networkRequests/NetworkError';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

describe('GameService.startComputerGame', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('posts the level and who moved first, with the token, and returns the game id', async () => {
        mockedRequest.mockResolvedValue({ data: { id: 31, level: 40, human_first: false }, status: 201 });

        const id = await GameService.startComputerGame('access', 40, false);

        const [url, method, headers, body] = mockedRequest.mock.calls[0];
        expect(url).toBe('computer-games/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers.Authorization).toBe('Bearer access');
        expect(headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(body)).toEqual({ level: 40, human_first: false });
        expect(id).toBe(31);
    });

    it('refuses an answer that has no game id', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 201 });
        await expect(GameService.startComputerGame('access', 40, true)).rejects.toThrow("Couldn't start");
    });

    it('lets the server\'s refusal, with its status, reach the caller', async () => {
        mockedRequest.mockRejectedValue(new NetworkError('Not found', 404));
        await expect(GameService.startComputerGame('access', 40, true)).rejects.toMatchObject({ status: 404 });
    });
});

describe('GameService.finishComputerGame', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('posts the moves to the game\'s finish endpoint and reads the result', async () => {
        mockedRequest.mockResolvedValue({
            data: { id: 31, status: 'won', points_awarded: 40, computer_points: 140, already_finished: false }, status: 200 });

        const result = await GameService.finishComputerGame('access', 31, [[0, 0], [1, 0]]);

        const [url, method, headers, body] = mockedRequest.mock.calls[0];
        expect(url).toBe('computer-games/31/finish/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers.Authorization).toBe('Bearer access');
        expect(JSON.parse(body)).toEqual({ moves: [[0, 0], [1, 0]] });
        expect(result).toEqual({ pointsAwarded: 40, total: 140, alreadyFinished: false });
    });

    it('reads a repeat answer, and a missing total, safely', async () => {
        mockedRequest.mockResolvedValue({ data: { points_awarded: 5, already_finished: true }, status: 200 });
        expect(await GameService.finishComputerGame('access', 1, [])).toEqual({ pointsAwarded: 5, total: null, alreadyFinished: true });
    });

    it('does not send the level or points, only the moves: the server decides what a win is worth', async () => {
        mockedRequest.mockResolvedValue({ data: { points_awarded: 1 }, status: 200 });
        await GameService.finishComputerGame('access', 1, [[0, 0]]);
        expect(Object.keys(JSON.parse(mockedRequest.mock.calls[0][3]))).toEqual(['moves']);
    });

    it('refuses an answer it cannot read', async () => {
        mockedRequest.mockResolvedValue({ data: { status: 'won' }, status: 200 });
        await expect(GameService.finishComputerGame('access', 1, [])).rejects.toThrow("Couldn't read");
    });
});
