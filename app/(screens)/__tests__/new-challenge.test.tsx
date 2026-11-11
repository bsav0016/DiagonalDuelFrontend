import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import NewChallengeScreen from '../new-challenge';
import { NetworkError } from '@/lib/networkRequests/NetworkError';

const mockAddToast = jest.fn();
const mockRouteBack = jest.fn();
const mockSendChallenge = jest.fn();
const mockEnablePush = jest.fn();
const mockCreateInvite = jest.fn();
const mockShareInvite = jest.fn();

jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
jest.mock('@/contexts/RouteContext', () => ({ useRouteTo: () => ({ routeBack: mockRouteBack }) }));
jest.mock('@/hooks/useGameService', () => ({
    useGameService: () => ({ sendChallenge: mockSendChallenge, createInvite: mockCreateInvite, enablePushNotifications: mockEnablePush }),
}));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));
jest.mock('@/components/LoadingSpinner', () => ({ LoadingSpinner: () => null }));
jest.mock('@/features/challenges/invite', () => ({ shareInvite: (...args: unknown[]) => mockShareInvite(...args) }));

jest.setTimeout(30000);

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<NewChallengeScreen />); });
    const input = () => tree.root.findAll((n: ReactTestInstance) => String(n.type) === 'TextInput')[0];
    const button = (title: string) => tree.root.findAll(
        (n: ReactTestInstance) => n.props.title === title && typeof n.props.onPress === 'function')[0];
    const variant = (title: string) => button(title).props.variant;
    const type = async (text: string) => act(async () => { input().props.onChangeText(text); });
    const press = async (title: string) => act(async () => { await button(title).props.onPress(); });
    return { type, press, variant };
}

describe('New challenge screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSendChallenge.mockResolvedValue({});
        mockEnablePush.mockResolvedValue(undefined);
        mockCreateInvite.mockResolvedValue({ inviteCode: 'ABCD2345' });
        mockShareInvite.mockResolvedValue(undefined);
    });

    it('offers the same time limits as matchmaking, starting at one day', async () => {
        const { variant } = await render();
        expect(variant('1 Day')).toBe('primary');
        for (const title of ['3 Days', '5 Days', '7 Days']) {
            expect(variant(title)).toBe('secondary');
        }
    });

    it('sends the challenge with the chosen days, then goes back', async () => {
        const { type, press, variant } = await render();
        await type('  bob ');
        await press('5 Days');
        expect(variant('5 Days')).toBe('primary');
        expect(variant('1 Day')).toBe('secondary');

        await press('Send Challenge');

        expect(mockSendChallenge).toHaveBeenCalledWith('bob', 5);
        expect(mockAddToast).toHaveBeenCalledWith('Challenge sent to bob');
        expect(mockRouteBack).toHaveBeenCalled();
    });

    it('asks for notification permission before sending, and does not depend on the answer', async () => {
        mockEnablePush.mockRejectedValue(new Error('denied'));
        const { type, press } = await render();
        await type('bob');

        await press('Send Challenge');

        expect(mockEnablePush).toHaveBeenCalled();
        expect(mockSendChallenge).toHaveBeenCalledWith('bob', 1);
    });

    it('needs a username', async () => {
        const { type, press } = await render();
        await type('   ');

        await press('Send Challenge');

        expect(mockSendChallenge).not.toHaveBeenCalled();
        expect(mockAddToast).toHaveBeenCalledWith("Enter your friend's username");
        expect(mockRouteBack).not.toHaveBeenCalled();
    });

    it('shows the server\'s reason and stays on the form when it refuses', async () => {
        mockSendChallenge.mockRejectedValue(new NetworkError('Player not found.', 404));
        const { type, press } = await render();
        await type('nobody');

        await press('Send Challenge');

        expect(mockAddToast).toHaveBeenCalledWith('Player not found.');
        expect(mockRouteBack).not.toHaveBeenCalled();
    });

    it('creates an open invite with the chosen days, opens the share sheet with its code, then goes back', async () => {
        const { press } = await render();
        await press('7 Days');

        await press('Invite With a Link');

        expect(mockCreateInvite).toHaveBeenCalledWith(7);
        expect(mockShareInvite).toHaveBeenCalledWith('ABCD2345', 7);
        expect(mockSendChallenge).not.toHaveBeenCalled();
        expect(mockRouteBack).toHaveBeenCalled();
    });

    it('does not need a username to invite', async () => {
        const { press } = await render();
        await press('Invite With a Link');
        expect(mockCreateInvite).toHaveBeenCalledWith(1);
        expect(mockAddToast).not.toHaveBeenCalled();
    });

    it('stays on the form with the server\'s reason when the invite cannot be created', async () => {
        mockCreateInvite.mockRejectedValue(new NetworkError('You already have 10 challenges waiting for an answer.', 400));
        const { press } = await render();

        await press('Invite With a Link');

        expect(mockAddToast).toHaveBeenCalledWith('You already have 10 challenges waiting for an answer.');
        expect(mockShareInvite).not.toHaveBeenCalled();
        expect(mockRouteBack).not.toHaveBeenCalled();
    });

    it('tells you the invite exists when the share sheet fails, and still goes back', async () => {
        mockShareInvite.mockRejectedValue(new Error('no share sheet'));
        const { press } = await render();

        await press('Invite With a Link');

        expect(mockAddToast).toHaveBeenCalledWith('Invite created. Share it again from Play Online.');
        expect(mockRouteBack).toHaveBeenCalled();
    });
});
