import { LeaderboardService } from '../LeaderboardService';
import { networkRequest } from '@/lib/networkRequests/NetworkRequest';
import { RequestMethod } from '@/lib/networkRequests/RequestMethod';

jest.mock('@/lib/networkRequests/NetworkRequest', () => ({ networkRequest: jest.fn() }));

const mockedRequest = networkRequest as jest.Mock;

const lists = {
    computer_points_leaderboard: [{ username: 'ann', computer_points: 90 }, { username: 'bob', computer_points: 40 }],
    online_rating_leaderboard: [{ username: 'bob', online_rating: 1100 }, { username: 'ann', online_rating: 1000 }],
};

describe('LeaderboardService.getLeaderboards', () => {
    beforeEach(() => mockedRequest.mockReset());

    it('reads both lists and numbers them from the top', async () => {
        mockedRequest.mockResolvedValue({ data: lists, status: 200 });
        const result = await LeaderboardService.getLeaderboards();

        expect(result.computerPointsLeaderboard.map((l) => [l.rank, l.username, l.computerPoints])).toEqual([[1, 'ann', 90], [2, 'bob', 40]]);
        expect(result.onlineRatingLeaderboard.map((l) => [l.rank, l.username, l.onlineRating])).toEqual([[1, 'bob', 1100], [2, 'ann', 1000]]);
    });

    it('asks without a token when signed out, so nothing about a player is sent', async () => {
        mockedRequest.mockResolvedValue({ data: lists, status: 200 });
        await LeaderboardService.getLeaderboards();
        const [url, method, headers] = mockedRequest.mock.calls[0];
        expect(url).toBe('leaderboard/');
        expect(method).toBe(RequestMethod.GET);
        expect(headers).toBeUndefined();
    });

    it('sends the token when there is one, and reads where that player stands', async () => {
        mockedRequest.mockResolvedValue({
            data: {
                ...lists,
                computer_points_me: { rank: 213, username: 'cy', computer_points: 12 },
                online_rating_me: { rank: 87, username: 'cy', online_rating: 980 },
            },
            status: 200,
        });
        const result = await LeaderboardService.getLeaderboards('access');

        expect(mockedRequest.mock.calls[0][2]).toEqual({ Authorization: 'Bearer access' });
        expect(result.computerPointsMe).toMatchObject({ rank: 213, username: 'cy', computerPoints: 12 });
        expect(result.onlineRatingMe).toMatchObject({ rank: 87, username: 'cy', onlineRating: 980 });
    });

    it('has no own place for a signed-out player or an older server that does not send one', async () => {
        mockedRequest.mockResolvedValue({ data: lists, status: 200 });
        const result = await LeaderboardService.getLeaderboards('access');
        expect(result.computerPointsMe).toBeNull();
        expect(result.onlineRatingMe).toBeNull();
    });

    it('ignores an own place that is not what it should be, instead of showing nonsense', async () => {
        for (const bad of [{ rank: 0, username: 'cy', computer_points: 1 }, { rank: '3', username: 'cy', computer_points: 1 },
            { rank: 3, username: 7, computer_points: 1 }, { rank: 3, username: 'cy' }, { rank: 1.5, username: 'cy', computer_points: 1 }, null, 'x']) {
            mockedRequest.mockResolvedValue({ data: { ...lists, computer_points_me: bad }, status: 200 });
            expect((await LeaderboardService.getLeaderboards('access')).computerPointsMe).toBeNull();
        }
    });

    it('refuses an answer without the two lists', async () => {
        mockedRequest.mockResolvedValue({ data: { computer_points_leaderboard: null, online_rating_leaderboard: null }, status: 200 });
        await expect(LeaderboardService.getLeaderboards()).rejects.toThrow("Couldn't get leaderboards");
    });
});
