import { Game } from "../game/models/Game";

export class User {
    username: string;
    email: string;
    games: Game[];
    matchmaking: number[];
    computerPoints: number;
    onlineRating: number;

    constructor(
        username: string, 
        email: string,
        games: Game[], 
        matchmaking: number[] = [],
        computerPoints: number = 0,
        onlineRating: number = 1000
    ) {
        this.username = username
        this.email = email
        this.games = games
        this.matchmaking = matchmaking
        this.computerPoints = computerPoints
        this.onlineRating = onlineRating
    }
}