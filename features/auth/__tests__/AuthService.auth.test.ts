import { AuthService } from '../AuthService';
import { AuthType } from '../AuthType';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

const loginData = (extra: object = {}) => ({
    username: 'ann', email: 'ann@example.com', games: [], matchmaking: [3], computer_points: 12, online_rating: 1100,
    access_token: 'access-1', refresh_token: 'refresh-1', ...extra,
});

describe('AuthService.auth', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('logs in: posts the credentials as JSON and returns the user with both tokens', async () => {
        mockedRequest.mockResolvedValue({ data: loginData(), status: 200 });

        const result = await AuthService.auth({ username: 'ann', password: 'pw' }, AuthType.Login);

        const [url, method, headers, body] = mockedRequest.mock.calls[0];
        expect(url).toBe('login/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(body)).toEqual({ username: 'ann', password: 'pw' });
        expect(result.access).toBe('access-1');
        expect(result.refresh).toBe('refresh-1');
        expect(result.user).toMatchObject({ username: 'ann', email: 'ann@example.com', matchmaking: [3], computerPoints: 12, onlineRating: 1100 });
    });

    it('registers: posts username, email and password (not the confirmation) and starts a new player at 1000', async () => {
        mockedRequest.mockResolvedValue({
            data: { user: { username: 'bo', email: 'bo@example.com' }, access_token: 'a', refresh_token: 'r' }, status: 201,
        });

        const result = await AuthService.auth(
            { username: 'bo', email: 'bo@example.com', password: 'pw', confirmPassword: 'pw' }, AuthType.Register,
        );

        const [url, , , body] = mockedRequest.mock.calls[0];
        expect(url).toBe('register/');
        expect(JSON.parse(body)).toEqual({ username: 'bo', email: 'bo@example.com', password: 'pw' });
        expect(result.user).toMatchObject({ username: 'bo', games: [], matchmaking: [], computerPoints: 0, onlineRating: 1000 });
    });

    it('refuses to register when the two passwords differ, without calling the server', async () => {
        await expect(
            AuthService.auth({ username: 'bo', email: 'b@e.c', password: 'one', confirmPassword: 'two' }, AuthType.Register),
        ).rejects.toThrow("Password's don't match");
        expect(mockedRequest).not.toHaveBeenCalled();
    });

    it('fails when the server leaves out a token', async () => {
        mockedRequest.mockResolvedValue({ data: loginData({ refresh_token: undefined }), status: 200 });
        await expect(AuthService.auth({ username: 'ann', password: 'pw' }, AuthType.Login)).rejects.toThrow('Tokens not provided');
    });

    it('fails when the login response has no user details', async () => {
        mockedRequest.mockResolvedValue({ data: loginData({ email: '' }), status: 200 });
        await expect(AuthService.auth({ username: 'ann', password: 'pw' }, AuthType.Login)).rejects.toBeInstanceOf(NetworkError);
    });

    it('passes server errors on so the screen can react to the status', async () => {
        mockedRequest.mockRejectedValue(new NetworkError('Invalid credentials', 403));
        await expect(AuthService.auth({ username: 'ann', password: 'bad' }, AuthType.Login)).rejects.toMatchObject({ status: 403 });
    });
});

describe('AuthService.logout', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('posts to the logout endpoint with the bearer token', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 200 });

        await expect(AuthService.logout('tok')).resolves.toBe(true);

        const [url, method, headers] = mockedRequest.mock.calls[0];
        expect(url).toBe('logout/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers.Authorization).toBe('Bearer tok');
    });

    it('sends the push token so the server stops notifying this device', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 200 });

        await AuthService.logout('tok', 'ExponentPushToken[abc]');

        const [, , , body] = mockedRequest.mock.calls[0];
        expect(JSON.parse(body)).toEqual({ push_token: 'ExponentPushToken[abc]' });
    });

    it('rethrows a failure', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockedRequest.mockRejectedValue(new NetworkError('Unauthorized', 401));
        await expect(AuthService.logout('tok')).rejects.toThrow('Unauthorized');
    });
});
