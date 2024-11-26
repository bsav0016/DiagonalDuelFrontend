import { Game } from "../game/models/Game";

export class User {
    username: string;
    email: string;
    games: Game[];
    isMatchmaking: boolean;

    constructor(
        username: string, 
        email: string,
        games: Game[], 
        isMatchmaking: boolean = false
    ) {
        this.username = username
        this.email = email
        this.games = games
        this.isMatchmaking = isMatchmaking
    }
}