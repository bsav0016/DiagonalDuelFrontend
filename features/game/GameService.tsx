import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { Game } from "./models/Game";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { MoveDTO } from "./dtos/MoveDTO";
import { GameRecord, gameRecordFromData } from "./models/GameRecord";
import { jwtDecode } from "jwt-decode";
import type { Cell, FinishResult } from "./computerScore";

// What the server says about the user's games: the ones to show, whether older finished ones exist,
// and the win/loss/draw record over all of them.
export interface GameList {
    games: Game[];
    hasMoreCompleted: boolean;
    record: GameRecord | null;
}

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

    // Every game still being played plus the `completedLimit` most recent finished ones (all of them if omitted).
    async getAllGames(token: string, completedLimit?: number): Promise<GameList> {
        try {
            const headers = {
                ...HEADERS(token).AUTH
            }
            const response = await networkRequest(
                completedLimit === undefined ? URL_EXT.GAMES : `${URL_EXT.GAMES}?completed_limit=${completedLimit}`,
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
            return {
                games: userGames,
                hasMoreCompleted: data.has_more_completed === true,
                record: gameRecordFromData(data.record),
            };
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

    // Gives up an online game: the server ends it at once in the opponent's favour.
    async resign(id: number, token: string): Promise<void> {
        await networkRequest(
            `${URL_EXT.GAMES}${id}/${URL_EXT.RESIGN}`,
            RequestMethod.POST,
            { ...HEADERS(token).AUTH }
        );
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

    // Tells the server a computer game has started, so a win can be checked before it earns points. Resolves with
    // the game's id. The server refuses a level outside 0 to 100 and answers 404 if it has no such endpoint yet.
    async startComputerGame(token: string, level: number, humanFirst: boolean): Promise<number> {
        const response = await networkRequest(
            URL_EXT.COMPUTER_GAMES,
            RequestMethod.POST,
            { ...HEADERS(token).AUTH, ...HEADERS().JSON },
            JSON.stringify({ level, human_first: humanFirst })
        );
        const id = response.data?.id;
        if (typeof id !== 'number') {
            throw new NetworkError("Couldn't start the computer game");
        }
        return id;
    },

    // Sends the moves of a won computer game. The server replays them and credits the points only if it was a legal
    // game the player won. Sending the same game again is safe: it is never credited twice.
    async finishComputerGame(token: string, gameId: number, moves: Cell[]): Promise<FinishResult> {
        const response = await networkRequest(
            `${URL_EXT.COMPUTER_GAMES}${gameId}/${URL_EXT.FINISH}`,
            RequestMethod.POST,
            { ...HEADERS(token).AUTH, ...HEADERS().JSON },
            JSON.stringify({ moves })
        );
        const data = response.data ?? {};
        if (typeof data.points_awarded !== 'number') {
            throw new NetworkError("Couldn't read the computer game result");
        }
        return {
            pointsAwarded: data.points_awarded,
            total: typeof data.computer_points === 'number' ? data.computer_points : null,
            alreadyFinished: data.already_finished === true,
        };
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
