import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";

// Tells the backend which push token belongs to the signed-in user (and which to forget).
export const PushService = {
    async registerDevice(token: string, pushToken: string, platform: string): Promise<void> {
        await networkRequest(
            URL_EXT.DEVICES,
            RequestMethod.POST,
            { ...HEADERS(token).AUTH, ...HEADERS().JSON },
            JSON.stringify({ token: pushToken, platform })
        );
    },

    async unregisterDevice(token: string, pushToken: string): Promise<void> {
        await networkRequest(
            URL_EXT.DEVICES,
            RequestMethod.DELETE,
            { ...HEADERS(token).AUTH, ...HEADERS().JSON },
            JSON.stringify({ token: pushToken })
        );
    }
}
