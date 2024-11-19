const DEV_ENV: Boolean = true

export const DB_URL: string = DEV_ENV 
    ? "http://127.0.0.1:8000/"
    : "''"

export const ACCEPTABLE_STATUS_CODES: number[] = [200, 201]

export const HEADERS = (token?: string) => {
    return {
        JSON: {'Content-Type': 'application/json'},
        AUTH: {'Authorization': `Token ${token}`}
    }
}

export const URL_EXT = {
    LOGIN: 'login/',
    LOGOUT: 'logout/'
}
