import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { asError, installGlobalErrorHandler, isExpectedError, report, setReporter } from '../errorReporting';

describe('which errors count as expected', () => {
    it.each([
        ['being offline (React Native)', new TypeError('Network request failed')],
        ['a timeout', new TypeError('Network request timed out')],
        ['being offline (web)', new TypeError('Failed to fetch')],
        ['the server refusing a request', new NetworkError('Invalid credentials', 403)],
        ['a missing game', new NetworkError('Not found', 404)],
        ['being throttled', new NetworkError('Too many requests', 429)],
        ['a request that got no answer', new NetworkError('No answer')],
        ['a sign-in that has run out', new Error('No refresh token')],
        ['a failed token refresh', new NetworkError('Could not refresh token', 500)],
    ])('%s is expected', (_, error) => {
        expect(isExpectedError(error)).toBe(true);
    });

    it.each([
        ['a server error', new NetworkError('Internal error', 500)],
        ['a bug', new TypeError("Cannot read properties of undefined (reading 'row')")],
        ['an ordinary error', new Error('Selected move not set before confirm move')],
        ['something thrown that is not an error', 'oops'],
    ])('%s is not', (_, error) => {
        expect(isExpectedError(error)).toBe(false);
    });
});

describe('report', () => {
    let consoleError: jest.SpyInstance;
    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        setReporter(null);
        consoleError.mockRestore();
    });

    it('prints to the console while no service is connected, as the old code did', () => {
        const error = new Error('boom');
        report(error, { where: 'games poll' });
        expect(consoleError).toHaveBeenCalledWith('[games poll]', error);
    });

    it('hands the error and where it happened to the connected service', () => {
        const reporter = jest.fn();
        setReporter(reporter);
        const error = new Error('boom');
        report(error, { where: 'resign' });
        expect(reporter).toHaveBeenCalledWith(error, { where: 'resign' });
    });

    it('does not report expected conditions', () => {
        const reporter = jest.fn();
        setReporter(reporter);
        report(new TypeError('Network request failed'), { where: 'games poll' });
        report(new NetworkError('Not found', 404), { where: 'resign' });
        expect(reporter).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('always reports a fatal error', () => {
        const reporter = jest.fn();
        setReporter(reporter);
        report(new TypeError('Network request failed'), { where: 'screen failed to draw', fatal: true });
        expect(reporter).toHaveBeenCalledTimes(1);
    });

    it('turns a thrown string into an error', () => {
        const reporter = jest.fn();
        setReporter(reporter);
        report('plain text', { where: 'x' });
        expect(reporter.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(asError('plain text').message).toBe('plain text');
    });

    it('never throws, even when the service does', () => {
        setReporter(() => {
            throw new Error('service down');
        });
        expect(() => report(new Error('boom'), { where: 'x' })).not.toThrow();
    });
});

describe('installGlobalErrorHandler', () => {
    const fakeUtils = () => {
        const previous = jest.fn();
        let current: (error: unknown, isFatal?: boolean) => void = previous;
        return {
            previous,
            utils: { getGlobalHandler: () => current, setGlobalHandler: (handler: typeof current) => { current = handler; } },
            fire: (error: unknown, isFatal?: boolean) => current(error, isFatal),
        };
    };

    afterEach(() => setReporter(null));

    it('reports an uncaught error and still passes it on to React Native', () => {
        const reporter = jest.fn();
        setReporter(reporter);
        const { utils, previous, fire } = fakeUtils();
        installGlobalErrorHandler(utils);
        const error = new Error('uncaught');
        fire(error, true);
        expect(reporter).toHaveBeenCalledWith(error, { where: 'uncaught error', fatal: true });
        expect(previous).toHaveBeenCalledWith(error, true);
    });

    it('does not report twice when installed twice', () => {
        const reporter = jest.fn();
        setReporter(reporter);
        const { utils, fire } = fakeUtils();
        installGlobalErrorHandler(utils);
        installGlobalErrorHandler(utils);
        fire(new Error('uncaught'), false);
        expect(reporter).toHaveBeenCalledTimes(1);
    });

    it('does nothing where there is no ErrorUtils', () => {
        expect(() => installGlobalErrorHandler(undefined)).not.toThrow();
    });
});
