import { networkRequest } from '../NetworkRequest';
import { NetworkError } from '../NetworkError';
import { RequestMethod } from '../RequestMethod';
import { DB_URL } from '../NetworkConstants';

const respond = (status: number, body: unknown, jsonFails = false) =>
    ({ status, json: jest.fn(() => (jsonFails ? Promise.reject(new Error('not json')) : Promise.resolve(body))) });

describe('networkRequest', () => {
    const fetchMock = jest.fn();
    beforeEach(() => {
        fetchMock.mockReset();
        (globalThis as any).fetch = fetchMock;
    });

    it('sends the method, headers and body to the API address and returns the data with the status', async () => {
        fetchMock.mockResolvedValue(respond(201, { id: 7 }));

        const result = await networkRequest('games/', RequestMethod.POST, { 'Content-Type': 'application/json' }, '{"a":1}');

        expect(fetchMock).toHaveBeenCalledWith(`${DB_URL}games/`, {
            method: RequestMethod.POST,
            headers: { 'Content-Type': 'application/json' },
            body: '{"a":1}',
        });
        expect(result).toEqual({ data: { id: 7 }, status: 201 });
    });

    it('leaves headers and body out when none are given', async () => {
        fetchMock.mockResolvedValue(respond(200, []));
        await networkRequest('games/', RequestMethod.GET);
        expect(fetchMock.mock.calls[0][1]).toEqual({ method: RequestMethod.GET, headers: undefined, body: undefined });
    });

    it.each([200, 201])('accepts status %i', async (status) => {
        fetchMock.mockResolvedValue(respond(status, {}));
        await expect(networkRequest('x/', RequestMethod.GET)).resolves.toMatchObject({ status });
    });

    it.each([
        ['an error field', { error: 'Username already exists' }, 'Username already exists'],
        ['a text detail', { detail: 'Not found.' }, 'Not found.'],
        ['an object detail', { detail: { code: 'x' } }, '{"code":"x"}'],
        ['nothing recognisable', { other: 1 }, 'Unknown error occurred'],
    ])('turns a failure with %s into a NetworkError carrying the status and body', async (_name, body, message) => {
        fetchMock.mockResolvedValue(respond(409, body));

        const error = await networkRequest('x/', RequestMethod.POST).catch((e) => e);

        expect(error).toBeInstanceOf(NetworkError);
        expect(error.message).toBe(message);
        expect(error.status).toBe(409);
        expect(error.details).toEqual(body);
    });

    it('still reports the status when the failure body is not JSON', async () => {
        fetchMock.mockResolvedValue(respond(502, null, true));

        const error = await networkRequest('x/', RequestMethod.GET).catch((e) => e);

        expect(error).toBeInstanceOf(NetworkError);
        expect(error.message).toBe('Unknown error occurred');
        expect(error.status).toBe(502);
    });

    it('treats other 2xx codes as failures, since the app only expects 200 and 201', async () => {
        fetchMock.mockResolvedValue(respond(204, {}));
        await expect(networkRequest('x/', RequestMethod.DELETE)).rejects.toBeInstanceOf(NetworkError);
    });

    it('lets a network failure through unchanged', async () => {
        fetchMock.mockRejectedValue(new TypeError('Network request failed'));
        await expect(networkRequest('x/', RequestMethod.GET)).rejects.toThrow('Network request failed');
    });
});
