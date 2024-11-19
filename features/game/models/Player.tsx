export class Player {
    username: string;
    computerLevel?: number | null;

    constructor(username: string, computerLevel: number | null = null) {
        this.username = username;
        this.computerLevel = computerLevel;
    }
}