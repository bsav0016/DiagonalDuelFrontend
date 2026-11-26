import { NetworkError } from '@/lib/networkRequests/NetworkError';

/**
 * Where problems that are not the player's doing are recorded.
 *
 * Code that used to end a catch block with console.error calls report() instead. In development, and until an error
 * reporting service is connected with setReporter(), it prints to the console exactly as before. Expected conditions
 * (being offline, the server refusing a request with a 4xx answer, a sign-in that has run out) are not reported, so
 * they neither fill a quota nor hide the problems that matter.
 */

export type ErrorContext = {
    /** Short label for where it happened, e.g. "games poll". Never put names, emails, tokens or request bodies here. */
    where: string;
    /** True when the app could not carry on (a screen failed to draw, or an error nothing caught). */
    fatal?: boolean;
};

export type Reporter = (error: Error, context: ErrorContext) => void;

let reporter: Reporter | null = null;

/** Connects a service that receives the errors worth knowing about. Pass null to go back to the console. */
export function setReporter(next: Reporter | null) {
    reporter = next;
}

const OFFLINE_MESSAGES = /network request (failed|timed out)|failed to fetch|network error|the internet connection appears to be offline/i;

// Raised by the app itself when a sign-in has run out; the player is sent back to the sign-in screen.
const EXPECTED_MESSAGES = ['No refresh token', 'Refresh token expired', 'Could not refresh token'];

export function asError(value: unknown): Error {
    if (value instanceof Error) {
        return value;
    }
    return new Error(typeof value === 'string' ? value : 'Non-error value thrown');
}

/** True for conditions that are normal for a phone and a server: offline, refused requests, an expired sign-in. */
export function isExpectedError(error: unknown): boolean {
    if (error instanceof NetworkError) {
        // No status means the request never got an answer; 4xx is the server saying no (wrong password, game over, throttled).
        return error.status === undefined || error.status < 500
            || EXPECTED_MESSAGES.includes(error.message);
    }
    if (error instanceof Error) {
        return EXPECTED_MESSAGES.includes(error.message)
            || (error instanceof TypeError && OFFLINE_MESSAGES.test(error.message));
    }
    return false;
}

/** Records an error that was caught (or, with fatal, one that stopped the app). Never throws. */
export function report(error: unknown, context: ErrorContext) {
    try {
        if (!context.fatal && isExpectedError(error)) {
            return;
        }
        const failure = asError(error);
        if (reporter) {
            reporter(failure, context);
        }
        if (reporter === null || __DEV__) {
            console.error(`[${context.where}]`, failure);
        }
    } catch {
        // Reporting a problem must never cause another.
    }
}

type ErrorHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsLike = { getGlobalHandler: () => ErrorHandler; setGlobalHandler: (handler: ErrorHandler) => void };

/**
 * Reports errors that nothing caught (thrown from a timer or event handler), then lets React Native handle them as it
 * always did. Call once at start-up; calling it again does not report twice.
 */
export function installGlobalErrorHandler(utils: ErrorUtilsLike | undefined = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils) {
    if (!utils) {
        return;
    }
    const previous = utils.getGlobalHandler();
    if ((previous as { reportsErrors?: boolean }).reportsErrors) {
        return;
    }
    const handler: ErrorHandler = (error, isFatal) => {
        report(error, { where: 'uncaught error', fatal: !!isFatal });
        previous(error, isFatal);
    };
    (handler as { reportsErrors?: boolean }).reportsErrors = true;
    utils.setGlobalHandler(handler);
}
