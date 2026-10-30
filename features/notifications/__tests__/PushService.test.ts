import { PushService } from '../PushService';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

describe('PushService', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('registers a device with the token and platform', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 200 });

        await PushService.registerDevice('access', 'ExponentPushToken[abc]', 'ios');

        const [url, method, headers, body] = mockedRequest.mock.calls[0];
        expect(url).toBe('devices/');
        expect(method).toBe(RequestMethod.POST);
        expect(headers.Authorization).toBe('Bearer access');
        expect(JSON.parse(body)).toEqual({ token: 'ExponentPushToken[abc]', platform: 'ios' });
    });

    it('removes a device by token', async () => {
        mockedRequest.mockResolvedValue({ data: {}, status: 200 });

        await PushService.unregisterDevice('access', 'ExponentPushToken[abc]');

        const [url, method, headers, body] = mockedRequest.mock.calls[0];
        expect(url).toBe('devices/');
        expect(method).toBe(RequestMethod.DELETE);
        expect(headers.Authorization).toBe('Bearer access');
        expect(JSON.parse(body)).toEqual({ token: 'ExponentPushToken[abc]' });
    });
});
