import { NetworkError } from "@/lib/networkRequests/NetworkError";

// The same per-move time limits matchmaking offers.
export const CHALLENGE_DAY_OPTIONS: number[] = [1, 3, 5, 7];

// A friend challenge as the server describes it (only the pending ones are ever listed).
export interface Challenge {
    id: number;
    challenger: string;
    // Null for an open invite link (nobody named yet).
    recipient: string | null;
    days: number;
    expiresAt: Date;
    // True when it asks for a rematch of a finished game.
    rematch: boolean;
}

export function challengeFromData(data: any): Challenge {
    if (
        !data ||
        typeof data.id !== "number" ||
        typeof data.challenger !== "string" ||
        typeof data.time_limit_days !== "number" ||
        !data.expires_at
    ) {
        throw new NetworkError("Challenge doesn't have all parameters");
    }
    return {
        id: data.id,
        challenger: data.challenger,
        recipient: typeof data.recipient === "string" ? data.recipient : null,
        days: data.time_limit_days,
        expiresAt: new Date(data.expires_at),
        rematch: data.rematch_of !== null && data.rematch_of !== undefined,
    };
}
