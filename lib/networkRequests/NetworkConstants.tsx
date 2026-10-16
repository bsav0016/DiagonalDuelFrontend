export const PRODUCTION_URL: string = "https://diagonal-duel-b86db09cf052.herokuapp.com/"

// Set EXPO_PUBLIC_API_URL (e.g. in .env) to use another backend such as a local server.
// When it is not set, the app talks to the hosted production server.
export function resolveApiUrl(configuredUrl: string | undefined): string {
    const base = configuredUrl && configuredUrl.trim() ? configuredUrl.trim() : PRODUCTION_URL
    return (base.endsWith("/") ? base : base + "/") + "api/"
}

export const DB_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL)

export const ACCEPTABLE_STATUS_CODES: number[] = [200, 201]

export const HEADERS = (token: string | null = null) => {
    return {
        JSON: {'Content-Type': 'application/json'},
        AUTH: {'Authorization': `Bearer ${token}`}
    }
}

export const URL_EXT = {
    LOGIN: 'login/',
    REGISTER: 'register/',
    LOGOUT: 'logout/',
    ACCOUNT: 'account/',
    GAMES: 'games/',
    MATCHMAKING: 'matchmaking/',
    MOVES: 'moves/',
    TOKEN: 'token/',
    TOKEN_REFRESH: 'token/refresh/',
    LEADERBOARD: 'leaderboard/',
    UPDATE_COMPUTER_SCORE: 'update_computer_score/'
}
