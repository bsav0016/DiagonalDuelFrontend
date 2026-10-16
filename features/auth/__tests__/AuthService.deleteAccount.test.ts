import { AuthService } from '../AuthService';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

describe('AuthService.deleteAccount', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('sends a DELETE to the account endpoint with the token and password', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 200 });

        await expect(AuthService.deleteAccount('tok', 'secret')).resolves.toBe(true);

        const [url, method, headers, body] = mockedRequest.mock.calls[0];
        expect(url).toBe('account/');
        expect(method).toBe(RequestMethod.DELETE);
        expect(headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(body)).toEqual({ password: 'secret' });
    });

    it('resolves false when the server rejects the password', async () => {
        mockedRequest.mockRejectedValue(new NetworkError('Incorrect password', 403));

        await expect(AuthService.deleteAccount('tok', 'wrong')).resolves.toBe(false);
    });

    it('rethrows other failures so the screen can tell the user', async () => {
        mockedRequest.mockRejectedValue(new NetworkError('Unauthorized', 401));

        await expect(AuthService.deleteAccount('tok', 'secret')).rejects.toThrow('Unauthorized');
    });
});
