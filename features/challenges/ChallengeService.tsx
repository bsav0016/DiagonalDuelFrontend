import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { Game } from "@/features/game/models/Game";
import { Challenge, challengeFromData } from "./Challenge";

export interface Challenges {
    incoming: Challenge[];
    outgoing: Challenge[];
}

const authJson = (token: string) => ({ ...HEADERS(token).AUTH, ...HEADERS().JSON });

// Friend challenges and rematches. A refusal comes back as a NetworkError whose message says why
// ("Player not found.", "You already challenged bob.", ...), ready to show to the player.
export const ChallengeService = {
    async list(token: string): Promise<Challenges> {
        const response = await networkRequest(URL_EXT.CHALLENGES, RequestMethod.GET, { ...HEADERS(token).AUTH });
        const { incoming, outgoing } = response.data ?? {};
        if (!Array.isArray(incoming) || !Array.isArray(outgoing)) {
            throw new NetworkError("Couldn't get challenges");
        }
        return { incoming: incoming.map(challengeFromData), outgoing: outgoing.map(challengeFromData) };
    },

    async send(token: string, username: string, days: number): Promise<Challenge> {
        const response = await networkRequest(
            URL_EXT.CHALLENGES,
            RequestMethod.POST,
            authJson(token),
            JSON.stringify({ username: username.trim(), time_limit_days: days })
        );
        return challengeFromData(response.data);
    },

    // The opponent and the time limit come from the finished game.
    async rematch(token: string, gameId: number): Promise<Challenge> {
        const response = await networkRequest(
            URL_EXT.CHALLENGES,
            RequestMethod.POST,
            authJson(token),
            JSON.stringify({ rematch_of: gameId })
        );
        return challengeFromData(response.data);
    },

    // Answers with the game that was created.
    async accept(token: string, id: number): Promise<Game> {
        const response = await networkRequest(
            `${URL_EXT.CHALLENGES}${id}/${URL_EXT.ACCEPT}`,
            RequestMethod.POST,
            { ...HEADERS(token).AUTH }
        );
        return Game.fromData(response.data?.game);
    },

    async decline(token: string, id: number): Promise<void> {
        await networkRequest(`${URL_EXT.CHALLENGES}${id}/${URL_EXT.DECLINE}`, RequestMethod.POST, { ...HEADERS(token).AUTH });
    },

    async cancel(token: string, id: number): Promise<void> {
        await networkRequest(`${URL_EXT.CHALLENGES}${id}/${URL_EXT.CANCEL}`, RequestMethod.POST, { ...HEADERS(token).AUTH });
    },
};
