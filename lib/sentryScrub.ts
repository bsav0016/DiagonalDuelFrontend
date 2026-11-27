/**
 * What is removed from error reports before they leave the phone. Kept free of any Sentry import so it can be tested
 * without the native module.
 *
 * Reports carry the error, the stack, the app version and the update it came from. They do not carry user names,
 * emails, IP addresses, request bodies, headers or tokens, and invite codes (which let anyone with them accept a
 * challenge) are masked in every address.
 */

const INVITE_PATH = /(\/challenges\/invite\/)[^/?#\s"']+/g;

export function maskInviteCodes(text: string): string {
    return text.replace(INVITE_PATH, '$1[code]');
}

type ReportEvent = {
    user?: unknown;
    request?: { url?: string; data?: unknown; headers?: unknown; cookies?: unknown; query_string?: unknown; env?: unknown };
    message?: string;
    exception?: { values?: { value?: string }[] };
    breadcrumbs?: Breadcrumb[];
};

type Breadcrumb = { category?: string; message?: string; data?: Record<string, unknown> };

export function scrubEvent<T extends ReportEvent>(event: T): T {
    delete event.user;
    if (event.request) {
        for (const key of ['data', 'headers', 'cookies', 'query_string', 'env'] as const) {
            delete event.request[key];
        }
        if (typeof event.request.url === 'string') {
            event.request.url = maskInviteCodes(event.request.url);
        }
    }
    if (typeof event.message === 'string') {
        event.message = maskInviteCodes(event.message);
    }
    for (const exception of event.exception?.values ?? []) {
        if (typeof exception.value === 'string') {
            exception.value = maskInviteCodes(exception.value);
        }
    }
    if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb).filter((crumb): crumb is Breadcrumb => crumb !== null);
    }
    return event;
}

/** Returns null to drop the breadcrumb. Console lines are dropped (they can hold anything); addresses are masked. */
export function scrubBreadcrumb<T extends Breadcrumb>(crumb: T): T | null {
    if (crumb.category === 'console') {
        return null;
    }
    if (typeof crumb.message === 'string') {
        crumb.message = maskInviteCodes(crumb.message);
    }
    if (crumb.data) {
        for (const key of ['url', 'to', 'from']) {
            if (typeof crumb.data[key] === 'string') {
                crumb.data[key] = maskInviteCodes(crumb.data[key] as string);
            }
        }
    }
    return crumb;
}
