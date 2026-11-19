import React from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import Leaderboard from '../leaderboard';
import { ComputerPointsLeader } from '@/features/leaderboard/models/ComputerPointsLeader';
import { OnlineRatingLeader } from '@/features/leaderboard/models/OnlineRatingLeader';

const mockGetLeaderboards = jest.fn();
const mockAddToast = jest.fn();
const mockRouteBack = jest.fn();
let mockUser: { username: string } | null = null;

jest.mock('@/hooks/useGameService', () => ({ useGameService: () => ({ getLeaderboards: mockGetLeaderboards }) }));
jest.mock('@/contexts/UserContext', () => ({ useUser: () => ({ user: mockUser }) }));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
jest.mock('@/contexts/LoadingContext', () => ({ useLoading: () => ({ setLoading: jest.fn() }) }));
jest.mock('@/contexts/RouteContext', () => ({ useRouteTo: () => ({ routeBack: mockRouteBack }) }));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));

const flatten = (node: any): string => (node == null ? '' : typeof node === 'string' ? node
    : Array.isArray(node) ? node.map(flatten).join(' ') : (node.children || []).map(flatten).join(''));

const top = [new ComputerPointsLeader('ann', 90, 1), new ComputerPointsLeader('bob', 40, 2)];
const rating = [new OnlineRatingLeader('bob', 1100, 1), new OnlineRatingLeader('ann', 1000, 2)];

let mounted: ReturnType<typeof create> | null = null;

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<Leaderboard />); });
    mounted = tree;
    // The tab buttons are touchables with a Text inside that says the tab's name.
    const openTab = async (name: string) => {
        const tab = tree.root.findAll((n: ReactTestInstance) => typeof n.props.onPress === 'function'
            && n.findAllByType(Text).some((t) => flatten(t.props.children) === name));
        await act(async () => { tab[0].props.onPress(); });
    };
    return { text: () => flatten(tree.toJSON()), openTab };
}

/** How many times a name appears on screen (a player in the list who is also shown on top appears twice). */
const times = (text: string, name: string) => text.split(name).length - 1;

describe('Leaderboard screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = null;
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    // The list schedules a timer when it renders; leaving the screen cancels it, so it cannot fire after the test ends.
    afterEach(() => {
        act(() => { mounted?.unmount(); });
        mounted = null;
    });

    it('shows the listed players with their ranks', async () => {
        mockGetLeaderboards.mockResolvedValue({
            computerPointsLeaderboard: top, onlineRatingLeaderboard: rating, computerPointsMe: null, onlineRatingMe: null });
        const { text } = await render();
        expect(text()).toContain('ann');
        expect(text()).toContain('90');
    });

    it("shows a signed-in player's own place from the server when they are not in the top list", async () => {
        mockUser = { username: 'cy' };
        mockGetLeaderboards.mockResolvedValue({
            computerPointsLeaderboard: top, onlineRatingLeaderboard: rating,
            computerPointsMe: new ComputerPointsLeader('cy', 12, 213), onlineRatingMe: new OnlineRatingLeader('cy', 980, 87) });
        const { text } = await render();
        expect(times(text(), 'cy')).toBe(1);
        expect(text()).toContain('213');
        expect(text()).toContain('12');
    });

    it('prefers the place the server gives over searching the list, so a stale list cannot mislead', async () => {
        mockUser = { username: 'bob' };
        mockGetLeaderboards.mockResolvedValue({
            computerPointsLeaderboard: top, onlineRatingLeaderboard: rating,
            computerPointsMe: new ComputerPointsLeader('bob', 41, 2), onlineRatingMe: null });
        const { text } = await render();
        expect(text()).toContain('41'); // the server's number, shown on the player's own row
    });

    it('falls back to finding the player in the list when the server sends no own place (older server)', async () => {
        mockUser = { username: 'bob' };
        mockGetLeaderboards.mockResolvedValue({
            computerPointsLeaderboard: top, onlineRatingLeaderboard: rating, computerPointsMe: null, onlineRatingMe: null });
        const { text } = await render();
        expect(times(text(), 'bob')).toBe(2); // once on the player's own row, once in the list
    });

    it('does the same on the online rating tab: the server place first, then the list', async () => {
        mockUser = { username: 'bob' };
        mockGetLeaderboards.mockResolvedValue({
            computerPointsLeaderboard: top, onlineRatingLeaderboard: rating, computerPointsMe: null, onlineRatingMe: null });
        const { text, openTab } = await render();
        await openTab('Online Rating');
        expect(times(text(), 'bob')).toBe(2); // found in the list, shown once on top and once in the list
        expect(text()).toContain('1100');
    });

    it('shows the server place on the online rating tab for a player outside the top list', async () => {
        mockUser = { username: 'cy' };
        mockGetLeaderboards.mockResolvedValue({
            computerPointsLeaderboard: top, onlineRatingLeaderboard: rating,
            computerPointsMe: null, onlineRatingMe: new OnlineRatingLeader('cy', 980, 87) });
        const { text, openTab } = await render();
        await openTab('Online Rating');
        expect(times(text(), 'cy')).toBe(1);
        expect(text()).toContain('87');
        expect(text()).toContain('980');
    });

    it('shows no own row for a signed-out player', async () => {
        mockGetLeaderboards.mockResolvedValue({
            computerPointsLeaderboard: top, onlineRatingLeaderboard: rating, computerPointsMe: null, onlineRatingMe: null });
        const { text } = await render();
        expect(times(text(), 'bob')).toBe(1);
    });

    it('says so and goes back when the leaderboard cannot be loaded', async () => {
        mockGetLeaderboards.mockRejectedValue(new Error('offline'));
        await render();
        expect(mockAddToast).toHaveBeenCalledWith('Could not get leaderboard');
        expect(mockRouteBack).toHaveBeenCalled();
    });
});
