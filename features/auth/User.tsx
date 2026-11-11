import { Game } from "../game/models/Game";
import { GameRecord } from "../game/models/GameRecord";

export class User {
    username: string;
    email: string;
    games: Game[];
    matchmaking: number[];
    computerPoints: number;
    onlineRating: number;
    // The server's count of every finished game, and whether older finished games than the ones in `games` exist.
    record: GameRecord | null;
    hasMoreCompleted: boolean;

    constructor(
        username: string, 
        email: string,
        games: Game[], 
        matchmaking: number[] = [],
        computerPoints: number = 0,
        onlineRating: number = 1000,
        record: GameRecord | null = null,
        hasMoreCompleted: boolean = false
    ) {
        this.username = username
        this.email = email
        this.games = games
        this.matchmaking = matchmaking
        this.computerPoints = computerPoints
        this.onlineRating = onlineRating
        this.record = record
        this.hasMoreCompleted = hasMoreCompleted
    }

    // A copy with some fields replaced, so an update cannot drop the ones it does not mention.
    with(changes: Partial<Pick<User, "games" | "matchmaking" | "computerPoints" | "onlineRating" | "record" | "hasMoreCompleted">>): User {
        return new User(
            this.username,
            this.email,
            changes.games ?? this.games,
            changes.matchmaking ?? this.matchmaking,
            changes.computerPoints ?? this.computerPoints,
            changes.onlineRating ?? this.onlineRating,
            changes.record === undefined ? this.record : changes.record,
            changes.hasMoreCompleted ?? this.hasMoreCompleted
        );
    }

    // The server's record when there is one (the game list is trimmed); otherwise counted from the games held.
    getWinsAndLosses(): { wins: number; losses: number; draws: number } {
        if (this.record) {
            return { wins: this.record.wins, losses: this.record.losses, draws: this.record.draws };
        }
        let wins = 0;
        let losses = 0;
        for (const game of this.games) {
            if (game.winner) {
                if (game.winner.split(" ")[0] === this.username) {
                    wins += 1;
                } else {
                    losses += 1;
                }
            }
        }
    
        return { wins, losses, draws: 0 };
    }
}