import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import { setReporter } from '@/lib/errorReporting';
import { scrubBreadcrumb, scrubEvent } from '@/lib/sentryScrub';

/**
 * Connects error reporting to Sentry when EXPO_PUBLIC_SENTRY_DSN is set (a DSN only allows sending events, so it may
 * ship in the app). Unset, and in development, nothing is started and errors go to the console as before.
 * Returns whether reporting is on.
 *
 * Every report is tagged with the app version and the over-the-air update it is running, so a bad update shows up as
 * its own group and can be rolled back (see docs/over-the-air-updates.md).
 */
export function initErrorReporting(dsn: string | undefined = process.env.EXPO_PUBLIC_SENTRY_DSN): boolean {
    if (!dsn || __DEV__) {
        return false;
    }
    Sentry.init({
        dsn,
        release: `diagonal-duel@${Constants.expoConfig?.version ?? 'unknown'}`,
        environment: 'production',
        sendDefaultPii: false,
        tracesSampleRate: 0,
        attachScreenshot: false,
        attachViewHierarchy: false,
        beforeSend: (event) => scrubEvent(event),
        beforeBreadcrumb: (crumb) => scrubBreadcrumb(crumb),
    });
    Sentry.setTag('update_id', Updates.updateId ?? 'embedded');
    Sentry.setTag('update_channel', Updates.channel ?? 'none');
    setReporter((error, context) => {
        Sentry.captureException(error, { level: context.fatal ? 'fatal' : 'error', tags: { where: context.where } });
    });
    return true;
}

/** Sends one harmless report so the setup can be checked end to end from a released build. */
export function sendTestReport(): boolean {
    if (!process.env.EXPO_PUBLIC_SENTRY_DSN || __DEV__) {
        return false;
    }
    Sentry.captureException(new Error('Test report from the Support screen (not a real problem)'), { tags: { where: 'test report' } });
    return true;
}
