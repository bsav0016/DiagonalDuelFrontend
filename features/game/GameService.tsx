import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { Game } from "./models/Game";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { MoveDTO } from "./dtos/MoveDTO";
import { jwtDecode } from "jwt-decode";

interface RefreshTokenReturn {
    newToken: string;
}

export const GameService = {
    isTokenExpiring(token: string, bufferTimeMilliseconds: number): number | null { //TODO: This maybe should get moved to AuthService
        try {
            const decoded: any = jwtDecode(token);
            const expDate = decoded.exp * 1000;
            const expiresIn: number = expDate - Date.now()
            if (expiresIn <= bufferTimeMilliseconds) {
                return expiresIn / 1000;
            } else {
                return null
            }
        } catch (error) {
            console.error("Error decoding token:", error);
            return 0;
        }
    },

    async refreshToken(refreshToken: string): Promise<RefreshTokenReturn> { //TODO: This maybe should get moved to AuthService
        try {
            const headers = {
                ...HEADERS().JSON 
            };
            const body = {
                refresh: refreshToken,
            };
            const response = await networkRequest(
                URL_EXT.TOKEN_REFRESH,
                RequestMethod.POST,
                headers,
                JSON.stringify(body)
            );
            const data = response.data;
            if (data && data.access) {
                return { newToken: data.access };
            } else {
                throw new NetworkError("Failed to refresh token");
            }
        } catch (error) {
            console.error("Error refreshing token:", error);
            throw new NetworkError("Could not refresh token");
        }
    },

    async getAllGames(token: string): Promise<Game[]> {
        try {
            const headers = {
                ...HEADERS(token).AUTH
            }
            const response = await networkRequest(
                URL_EXT.GAMES, 
                RequestMethod.GET,
                headers
            )
            const data = response.data
            if (!data.games) {
                throw new NetworkError("Couldn't get games");
            }
            const userGames = []
            for (const game of data.games) {
                const userGame = Game.fromData(game);
                userGames.push(userGame);
            }
            return userGames;
        } catch (error) {
            throw(error);
        }
    },

    async makeMove(id: number, row: number, col: number, token: string): Promise<boolean> {
        const moveDTO: MoveDTO = new MoveDTO(row, col);
        try {
            const headers = {
                ...HEADERS(token).AUTH,
                ...HEADERS(token).JSON
            }
            await networkRequest(
                `${URL_EXT.GAMES}${id}/${URL_EXT.MOVES}`,
                RequestMethod.POST,
                headers,
                moveDTO.jsonify()
            )
            return true;
        } catch (error) {
            throw(error)
        }
    },

    async getMatchmaking(token: string): Promise<number[]> {
        try {
            const headers = {
                ...HEADERS(token).AUTH
            }
            const response = await networkRequest(
                URL_EXT.MATCHMAKING, 
                RequestMethod.GET,
                headers 
            )
            const data = response.data
            if (data.matchmaking === null) {
                throw new NetworkError("Couldn't get matchmaking");
            }
            return data.matchmaking;
        } catch (error) {
            throw(error);
        }
    },

    async startMatchmaking(token: string, days: number): Promise<boolean> {
        try {
            const headers = {
                ...HEADERS(token).AUTH,
                ...HEADERS(token).JSON
            }
            const body = JSON.stringify({ time_limit_days: days }) //TODO: Create DTO for this
            const response = await networkRequest(
                URL_EXT.MATCHMAKING,
                RequestMethod.POST,
                headers,
                body
            )

            if (response.status === 201) {
                return true
            }
            else if (response.status === 200) {
                return false
            } else {
                throw new NetworkError('Unexpected error', response.statusCode);
            }
        } catch (error) {
            throw error
        }
    },

    async stopMatchmaking(token: string, days: number): Promise<void> {
        try {
            const headers = {
                ...HEADERS(token).AUTH,
                ...HEADERS(token).JSON
            }
            const body = JSON.stringify({
                time_limit_days: days
            })
            await networkRequest(
                URL_EXT.MATCHMAKING,
                RequestMethod.DELETE,
                headers,
                body
            );
            return
        } catch (error) {
            throw error;
        }
    },

    async updateComputerScore(token: string, computerLevel: number): Promise<void> {
        try {
            const headers = {
                ...HEADERS(token).AUTH,
                ...HEADERS(token).JSON
            }
            const body = JSON.stringify({
                computer_level: computerLevel
            })
            await networkRequest(
                URL_EXT.UPDATE_COMPUTER_SCORE,
                RequestMethod.POST,
                headers,
                body
            );
            return
        } catch (error) {
            throw error;
        }
    }
}
