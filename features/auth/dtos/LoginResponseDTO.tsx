import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { User } from "../User";
import { Game } from "@/features/game/models/Game";
import { Player } from "@/features/game/models/Player";
import { Move } from "@/features/game/models/Move";
import { GameType } from "@/features/game/models/GameType";

const parseISODuration = (isoDuration: string): number => {
    const regex = /P(?:([0-9]+)D)?T?(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/;
    const [, days, hours, minutes, seconds] = isoDuration.match(regex) || [];
    return (
        (parseInt(days || "0") * 24 * 60 * 60 +
        parseInt(hours || "0") * 60 * 60 +
        parseInt(minutes || "0") * 60 +
        parseInt(seconds || "0")) * 1000
    );
};

export class LoginResponseDTO {
    user: User;

    constructor(data: any) {
        if (!data.token || !data.username || !data.email || data.games === null) {
            throw new NetworkError("User, token, email, or games not provided in response", data?.status, data);
        }

        let userGames: Game[] = []
        for (const userGame of data.games) {
            if (!userGame.player1 || !userGame.player2 || !userGame.moves || !userGame.updated_at || !userGame.time_limit) {
                throw new NetworkError("Game doesn't have all parameters");
            }
            const player1 = new Player(userGame.player1)
            const player2 = new Player(userGame.player2)
            let moves: Move[] = []
            for (const move of userGame.moves) {
                if (!move.player || !move.player.username || !move.row || !move.column) {
                    throw new NetworkError("Move doesn't have all parameters")
                }
                const movePlayer: Player = new Player(move.player.username)
                const gameMove: Move = new Move(movePlayer, move.row, move.column)
                moves.push(gameMove)
            }
            const lastUpdated: Date = new Date(userGame.updated_at)
            const moveTime: number = parseISODuration(userGame.time_limit)
            let winner: string | null;
            if (userGame.winner) {
                winner = userGame.winner
            } else {
                winner = null;
            }
            const game = new Game(
                GameType.Online,
                player1,
                player2,
                moves,
                lastUpdated,
                moveTime,
                winner
            )
        }

        this.user = new User(
            data.username,
            data.email,
            data.token,
            userGames
        )
    }
}
