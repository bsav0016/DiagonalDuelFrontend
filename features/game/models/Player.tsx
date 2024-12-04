export class Player {
    username: string;
    rating: number;
    computerLevel?: number | null;

    constructor(username: string, rating: number = 1000, computerLevel: number | null = null) {
        this.username = username;
        this.rating = rating;
        this.computerLevel = computerLevel;
    }
}