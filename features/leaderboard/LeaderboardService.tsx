import { URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { ComputerPointsLeader } from "./ComputerPointsLeader";
import { OnlineRatingLeader } from "./OnlineRatingLeader";

interface Leaderboards {
    computerPointsLeaderboard: ComputerPointsLeader[]
    onlineRatingLeaderboard: OnlineRatingLeader[]
}

export const LeaderboardService = {
    async getLeaderboards(): Promise<Leaderboards> {
        try {
            const response = await networkRequest(
                URL_EXT.LEADERBOARD, 
                RequestMethod.GET
            )
            const data = response.data
            if (data.computer_points_leaderboard === null || data.online_rating_leaderboard === null) {
                throw new NetworkError("Couldn't get leaderboards");
            }

            const computerPointsLeaderboard = []
            for (const leader of data.computer_points_leaderboard) {
                const newLeader = new ComputerPointsLeader(leader.username, leader.computer_points)
                computerPointsLeaderboard.push(newLeader);
            }

            const onlineRatingLeaderboard = []
            for (const leader of data.online_rating_leaderboard) {
                const newLeader = new OnlineRatingLeader(leader.username, leader.online_rating)
                onlineRatingLeaderboard.push(newLeader);
            }
            return { computerPointsLeaderboard, onlineRatingLeaderboard };
        } catch (error) {
            throw(error);
        }
    },
}