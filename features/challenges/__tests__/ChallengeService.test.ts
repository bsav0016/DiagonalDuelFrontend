import { ChallengeService } from '../ChallengeService';
import { challengeFromData } from '../Challenge';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';
import { NetworkError } from '@/lib/networkRequests/NetworkError';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

const challengeData = (overrides: object = {}) => ({
    id: 5, challenger: 'ann', recipient: 'bob', time_limit_days: 3, status: 'pending',
    created_at: '2026-11-10T10:00:00Z', expires_at: '2026-11-17T10:00:00Z', rematch_of: null, game: null,
    invite_token: null, ...overrides,
});

const gameData = () => ({
    id: 9, player1: 'ann', player1_rating: 1000, player2: 'bob', player2_rating: 1010, moves: [],
    updated_at: '2026-11-10T10:00:00Z', time_limit: '3 00:00:00', winner: null,
});

describe('challengeFromData', () => {
    it('reads a named challenge', () => {
        expect(challengeFromData(challengeData())).toEqual({
            id: 5, challenger: 'ann', recipient: 'bob', days: 3,
            expiresAt: new Date('2026-11-17T10:00:00Z'), rematch: false,
        });
    });

    it('marks a rematch and an open invite', () => {
        const challenge = challengeFromData(challengeData({ recipient: null, rematch_of: 4 }));
        expect(challenge.recipient).toBeNull();
        expect(challenge.rematch).toBe(true);
    });

    it('refuses data with a missing field', () => {
        for (const bad of [null, {}, challengeData({ id: '5' }), challengeData({ challenger: undefined }),
            challengeData({ time_limit_days: undefined }), challengeData({ expires_at: undefined })]) {
            expect(() => challengeFromData(bad)).toThrow(NetworkError);
        }
    });
});

describe('ChallengeService', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('lists incoming and outgoing challenges', async () => {
        mockedRequest.mockResolvedValue({
            status: 200,
            data: { incoming: [challengeData({ id: 1 })], outgoing: [challengeData({ id: 2, recipient: null })] },
        });

        const result = await ChallengeService.list('access');

        const [url, method, headers] = mockedRequest.mock.calls[0];
        expect(url).toBe('challenges/');
        expect(method).toBe(RequestMethod.GET);
        expect(headers.Authorization).toBe('Bearer access');
        expect(result.incoming.map((c) => c.id)).toEqual([1]);
        expect(result.outgoing.map((c) => [c.id, c.recipient])).toEqual([[2, null]]);
    });

    it('rejects a list response that is not shaped like one', async () => {
        mockedRequest.mockResolvedValue({ status: 200, data: { incoming: [] } });
        await expect(ChallengeService.list('access')).rejects.toThrow("Couldn't get challenges");
    });

    it('sends a challenge to a trimmed username with the chosen days', async () => {
        mockedRequest.mockResolvedValue({ status: 201, data: challengeData() });

        const challenge = await ChallengeService.send('access', '  bob ', 3);

        const [url, method, headers, body] = mockedRequest.mock.calls[0];
        expect(url).toBe('challenges/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers.Authorization).toBe('Bearer access');
        expect(JSON.parse(body)).toEqual({ username: 'bob', time_limit_days: 3 });
        expect(challenge.recipient).toBe('bob');
    });

    it('asks for a rematch by game id only', async () => {
        mockedRequest.mockResolvedValue({ status: 201, data: challengeData({ rematch_of: 4 }) });

        const challenge = await ChallengeService.rematch('access', 4);

        expect(JSON.parse(mockedRequest.mock.calls[0][3])).toEqual({ rematch_of: 4 });
        expect(challenge.rematch).toBe(true);
    });

    it('accepts and returns the game that was created', async () => {
        mockedRequest.mockResolvedValue({ status: 200, data: { challenge: challengeData(), game: gameData() } });

        const game = await ChallengeService.accept('access', 5);

        const [url, method, headers] = mockedRequest.mock.calls[0];
        expect(url).toBe('challenges/5/accept/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers.Authorization).toBe('Bearer access');
        expect(game.gameId).toBe(9);
        expect(game.player1.username).toBe('ann');
    });

    it('declines and cancels through their own endpoints', async () => {
        mockedRequest.mockResolvedValue({ status: 200, data: {} });

        await ChallengeService.decline('access', 5);
        await ChallengeService.cancel('access', 6);

        expect(mockedRequest.mock.calls.map((call) => [call[0], call[1]])).toEqual([
            ['challenges/5/decline/', RequestMethod.POST],
            ['challenges/6/cancel/', RequestMethod.POST],
        ]);
    });

    it('lets the server\'s reason reach the caller', async () => {
        mockedRequest.mockRejectedValue(new NetworkError('You already challenged bob.', 400));
        await expect(ChallengeService.send('access', 'bob', 1)).rejects.toThrow('You already challenged bob.');
    });
});
