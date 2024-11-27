const DEV_ENV: Boolean = true

let URL: string = DEV_ENV 
    ? "http://192.168.1.12:8000/"
    : "''"
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
    LOGOUT: 'logout/',
    GAMES: 'games/',
    MATCHMAKING: 'matchmaking/',
    MOVES: 'moves/',
    TOKEN: 'token/',
    TOKEN_REFRESH: 'token/refresh/'
}
