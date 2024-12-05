import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { User } from "../User";
import { Game } from "@/features/game/models/Game";

export class LoginResponseDTO {
    user: User;

    constructor(data: any) {
        if (
            !data.username ||
            !data.email ||
            data.games === null ||
            data.matchmaking === null ||
            data.computer_points === null ||
            data.online_rating === null
        ) {
            throw new NetworkError("User, email, games, matchmaking, computer points, or online rating not provided in response", data?.status, data);
        }

        let userGames: Game[] = []
        for (const userGame of data.games) {
            const game: Game = Game.fromData(userGame);
            userGames.push(game);
        }

        this.user = new User(
            data.username,
            data.email,
            userGames,
            data.matchmaking,
            data.computer_points,
            data.online_rating
        )
    }
}
