import { maskInviteCodes, scrubBreadcrumb, scrubEvent } from '../sentryScrub';

const mockInit = jest.fn();
const mockSetTag = jest.fn();
const mockCaptureException = jest.fn();

jest.mock('@sentry/react-native', () => ({
    init: (...args: unknown[]) => mockInit(...args),
    setTag: (...args: unknown[]) => mockSetTag(...args),
    captureException: (...args: unknown[]) => mockCaptureException(...args),
}));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '3.3.0' } } }));
jest.mock('expo-updates', () => ({ updateId: 'update-123', channel: 'production' }));

import { setReporter, report } from '../errorReporting';
import { initErrorReporting, sendTestReport } from '../sentry';

const DSN = 'https://key@o1.ingest.sentry.io/2';

describe('initErrorReporting', () => {
    const globals = globalThis as unknown as { __DEV__: boolean };
    let wasDev: boolean;
    beforeEach(() => {
        wasDev = globals.__DEV__;
        globals.__DEV__ = false;
        jest.clearAllMocks();
    });
    afterEach(() => {
        globals.__DEV__ = wasDev;
        setReporter(null);
        delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    });

    it('does nothing without a DSN', () => {
        expect(initErrorReporting(undefined)).toBe(false);
        expect(initErrorReporting('')).toBe(false);
        expect(mockInit).not.toHaveBeenCalled();
    });

    it('does nothing in development even with a DSN', () => {
        globals.__DEV__ = true;
        expect(initErrorReporting(DSN)).toBe(false);
        expect(mockInit).not.toHaveBeenCalled();
    });

    it('starts with no personal data, tags the version and the update, and takes over reporting', () => {
        expect(initErrorReporting(DSN)).toBe(true);
        const options = mockInit.mock.calls[0][0];
        expect(options).toMatchObject({
            dsn: DSN, release: 'diagonal-duel@3.3.0', sendDefaultPii: false, tracesSampleRate: 0,
            attachScreenshot: false, attachViewHierarchy: false,
        });
        expect(mockSetTag).toHaveBeenCalledWith('update_id', 'update-123');
        expect(mockSetTag).toHaveBeenCalledWith('update_channel', 'production');

        const error = new Error('boom');
        report(error, { where: 'resign' });
        expect(mockCaptureException).toHaveBeenCalledWith(error, { level: 'error', tags: { where: 'resign' } });
        report(error, { where: 'screen failed to draw', fatal: true });
        expect(mockCaptureException).toHaveBeenLastCalledWith(error, { level: 'fatal', tags: { where: 'screen failed to draw' } });
    });

    it('scrubs events and breadcrumbs before they are sent', () => {
        initErrorReporting(DSN);
        const { beforeSend, beforeBreadcrumb } = mockInit.mock.calls[0][0];
        expect(beforeSend({ user: { id: 1 } }).user).toBeUndefined();
        expect(beforeBreadcrumb({ category: 'console', message: 'anything' })).toBeNull();
    });

    it('sends a test report only when reporting is on', () => {
        expect(sendTestReport()).toBe(false);
        process.env.EXPO_PUBLIC_SENTRY_DSN = DSN;
        expect(sendTestReport()).toBe(true);
        expect(mockCaptureException).toHaveBeenCalledTimes(1);
    });
});

describe('scrubbing', () => {
    it('masks invite codes wherever an address appears', () => {
        expect(maskInviteCodes('GET https://x.herokuapp.com/api/challenges/invite/K7M2QXPA/ failed'))
            .toBe('GET https://x.herokuapp.com/api/challenges/invite/[code]/ failed');
        expect(maskInviteCodes('/api/games/4/moves/')).toBe('/api/games/4/moves/');
    });

    it('removes the user and everything a request carries', () => {
        const event = scrubEvent({
            user: { id: 'u', ip_address: '1.2.3.4' },
            request: { url: 'https://x/api/challenges/invite/ABCD2345/', data: { password: 'p' }, headers: { Authorization: 'Bearer t' }, cookies: { a: 'b' } },
            message: 'failed for /challenges/invite/ABCD2345/',
            exception: { values: [{ value: 'bad /challenges/invite/ABCD2345/' }] },
        });
        expect(event.user).toBeUndefined();
        expect(event.request).toEqual({ url: 'https://x/api/challenges/invite/[code]/' });
        expect(event.message).toBe('failed for /challenges/invite/[code]/');
        expect(event.exception?.values?.[0].value).toBe('bad /challenges/invite/[code]/');
    });

    it('drops console breadcrumbs and masks the addresses in the others', () => {
        expect(scrubBreadcrumb({ category: 'console', message: 'x' })).toBeNull();
        const crumb = scrubBreadcrumb({ category: 'fetch', data: { url: 'https://x/api/challenges/invite/ABCD2345/', status_code: 404 } });
        expect(crumb?.data).toEqual({ url: 'https://x/api/challenges/invite/[code]/', status_code: 404 });
        const kept = scrubBreadcrumb({ category: 'navigation', data: { from: '/a', to: '/b' } });
        expect(kept?.data).toEqual({ from: '/a', to: '/b' });
    });

    it('filters crumbs inside an event', () => {
        const event = scrubEvent({ breadcrumbs: [{ category: 'console', message: 'secret' }, { category: 'ui.click', message: 'Play' }] });
        expect(event.breadcrumbs).toEqual([{ category: 'ui.click', message: 'Play' }]);
    });
});
