const DEV_ENV: Boolean = false

const URL: string = DEV_ENV 
    ? "http://192.168.1.144:8000/"
    : "https://diagonal-duel-b86db09cf052.herokuapp.com/"
export const DB_URL = URL + "api/"

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
    GAMES: 'games/',
    MATCHMAKING: 'matchmaking/',
    MOVES: 'moves/',
    TOKEN: 'token/',
    TOKEN_REFRESH: 'token/refresh/',
    LEADERBOARD: 'leaderboard/',
    UPDATE_COMPUTER_SCORE: 'update_computer_score/'
}
