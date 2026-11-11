import { GameService } from '../GameService';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

describe('GameService.resign', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('posts to the game\'s resign endpoint with the access token', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 200 });

        await GameService.resign(42, 'access');

        const [url, method, headers] = mockedRequest.mock.calls[0];
        expect(url).toBe('games/42/resign/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers.Authorization).toBe('Bearer access');
    });

    it('lets a refusal reach the caller', async () => {
        mockedRequest.mockRejectedValue(new Error('Game is already complete.'));

        await expect(GameService.resign(42, 'access')).rejects.toThrow('already complete');
    });
});
