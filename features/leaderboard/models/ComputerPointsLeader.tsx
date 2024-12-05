export class ComputerPointsLeader {
    username: string;
    computerPoints: number;
    rank: number;

    constructor(username: string, computerPoints: number, rank: number) {
        this.username = username
        this.computerPoints = computerPoints
        this.rank = rank
    }
}