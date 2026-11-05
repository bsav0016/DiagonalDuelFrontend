import { AuthService } from '../AuthService';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

describe('AuthService password reset', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('posts the trimmed email to the request endpoint without a token', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 200 });

        await AuthService.requestPasswordReset(' me@example.com ');

        const [url, method, headers, body] = mockedRequest.mock.calls[0];
        expect(url).toBe('password-reset/request/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers.Authorization).toBeUndefined();
        expect(JSON.parse(body)).toEqual({ email: 'me@example.com' });
    });

    it('posts the email, code and new password to the confirm endpoint', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 200 });

        await AuthService.confirmPasswordReset('me@example.com', ' 123456 ', 'N3w-pass!');

        const [url, method, , body] = mockedRequest.mock.calls[0];
        expect(url).toBe('password-reset/confirm/');
        expect(method).toBe(RequestMethod.POST);
        expect(JSON.parse(body)).toEqual({ email: 'me@example.com', code: '123456', new_password: 'N3w-pass!' });
    });

    it('lets the server\'s reason reach the screen when the code is wrong', async () => {
        mockedRequest.mockRejectedValue(new NetworkError('That code is wrong or has expired.', 400));

        await expect(AuthService.confirmPasswordReset('a@b.c', '000000', 'pw')).rejects.toThrow('wrong or has expired');
    });
});
