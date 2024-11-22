import { Game } from "../game/models/Game";

export class User {
    username: string;
    email: string;
    token: string;
    games: Game[]

    constructor(username: string, email: string, token: string, games: Game[]) {
        this.username = username
        this.email = email
        this.token = token
        this.games = games
    }
}