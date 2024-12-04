import { Game } from "../game/models/Game";

export class User {
    username: string;
    email: string;
    games: Game[];
    matchmaking: number[];

    constructor(
        username: string, 
        email: string,
        games: Game[], 
        matchmaking: number[] = []
    ) {
        this.username = username
        this.email = email
        this.games = games
        this.matchmaking = matchmaking
    }
}