import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { ComputerPointsLeader } from "./models/ComputerPointsLeader";
import { OnlineRatingLeader } from "./models/OnlineRatingLeader";

interface Leaderboards {
    computerPointsLeaderboard: ComputerPointsLeader[]
    onlineRatingLeaderboard: OnlineRatingLeader[]
    // The signed-in player's own place in each, from the server. The lists hold only the top players, so this is what
    // shows where everyone else stands. Null when signed out, or when the server is older and does not send it.
    computerPointsMe: ComputerPointsLeader | null
    onlineRatingMe: OnlineRatingLeader | null
}

function positiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

export const LeaderboardService = {
    // With the player's access token, the answer also says where that player stands.
    async getLeaderboards(token?: string): Promise<Leaderboards> {
        try {
            const response = await networkRequest(
                URL_EXT.LEADERBOARD, 
                RequestMethod.GET,
                token ? { ...HEADERS(token).AUTH } : undefined
            )
            const data = response.data
            if (data.computer_points_leaderboard === null || data.online_rating_leaderboard === null) {
                throw new NetworkError("Couldn't get leaderboards");
            }

            let index = 1
            const computerPointsLeaderboard = []
            for (const leader of data.computer_points_leaderboard) {
                const newLeader = new ComputerPointsLeader(leader.username, leader.computer_points, index);
                index += 1;
                computerPointsLeaderboard.push(newLeader);
            }

            index = 1;
            const onlineRatingLeaderboard = []
            for (const leader of data.online_rating_leaderboard) {
                const newLeader = new OnlineRatingLeader(leader.username, leader.online_rating, index);
                index += 1;
                onlineRatingLeaderboard.push(newLeader);
            }
            const meComputer = data.computer_points_me;
            const computerPointsMe = meComputer && positiveInteger(meComputer.rank) && typeof meComputer.username === 'string'
                && typeof meComputer.computer_points === 'number'
                ? new ComputerPointsLeader(meComputer.username, meComputer.computer_points, meComputer.rank) : null;
            const meRating = data.online_rating_me;
            const onlineRatingMe = meRating && positiveInteger(meRating.rank) && typeof meRating.username === 'string'
                && typeof meRating.online_rating === 'number'
                ? new OnlineRatingLeader(meRating.username, meRating.online_rating, meRating.rank) : null;
            return { computerPointsLeaderboard, onlineRatingLeaderboard, computerPointsMe, onlineRatingMe };
        } catch (error) {
            throw(error);
        }
    },
}