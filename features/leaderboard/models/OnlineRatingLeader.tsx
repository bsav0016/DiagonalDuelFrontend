export class OnlineRatingLeader {
    username: string;
    onlineRating: number;
    rank: number;

    constructor(username: string, onlineRating: number, rank: number) {
        this.username = username
        this.onlineRating = onlineRating
        this.rank = rank
    }
}