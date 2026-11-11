import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import { ChallengeList } from '../ChallengeList';
import { Challenge } from '@/features/challenges/Challenge';

const challenge = (overrides: Partial<Challenge> = {}): Challenge => ({
    id: 1, challenger: 'ann', recipient: 'bob', days: 3, expiresAt: new Date('2026-11-17T10:00:00Z'), rematch: false, inviteCode: null,
    ...overrides,
});

async function render(incoming: Challenge[], outgoing: Challenge[], withShare = false) {
    const handlers = { onAccept: jest.fn(), onDecline: jest.fn(), onCancel: jest.fn() };
    const onShare = jest.fn();
    let tree!: ReturnType<typeof create>;
    await act(async () => {
        tree = create(<ChallengeList incoming={incoming} outgoing={outgoing} {...handlers} onShare={withShare ? onShare : undefined} />);
    });
    const text = () => JSON.stringify(tree.toJSON());
    const button = (title: string) => tree.root.findAll(
        (n: ReactTestInstance) => n.props.title === title && typeof n.props.onPress === 'function');
    return { tree, text, button, onShare, ...handlers };
}

describe('ChallengeList', () => {
    it('says so when nothing is waiting', async () => {
        const { text } = await render([], []);
        expect(text()).toContain('No challenges waiting');
    });

    it('shows who challenged you and for how long', async () => {
        const { text } = await render([challenge({ challenger: 'carol', days: 5 })], []);
        expect(text()).toContain('carol challenged you (5-day turns)');
    });

    it('words a rematch request as one', async () => {
        const { text } = await render([challenge({ challenger: 'carol', rematch: true })], []);
        expect(text()).toContain('carol wants a rematch');
    });

    it('accepts and declines the challenge that was tapped', async () => {
        const first = challenge({ id: 1, challenger: 'ann' });
        const second = challenge({ id: 2, challenger: 'carol' });
        const { button, onAccept, onDecline } = await render([first, second], []);

        await act(async () => { button('Accept')[1].props.onPress(); });
        await act(async () => { button('Decline')[0].props.onPress(); });

        expect(onAccept).toHaveBeenCalledWith(second);
        expect(onDecline).toHaveBeenCalledWith(first);
    });

    it('shows who a sent challenge is waiting on, and cancels it', async () => {
        const sent = challenge({ id: 7, recipient: 'dave', days: 1 });
        const { tree, text, onCancel } = await render([], [sent]);
        expect(text()).toContain('Waiting for dave (1-day turns)');

        const cancel = tree.root.findByProps({ testID: 'cancel-7' });
        await act(async () => { cancel.props.onPress(); });

        expect(onCancel).toHaveBeenCalledWith(sent);
    });

    it('describes an open invite that has nobody named', async () => {
        const { text } = await render([], [challenge({ recipient: null })]);
        expect(text()).toContain('Waiting for someone to open your invite');
    });

    it('offers Share on an open invite that has a code, and shares that challenge', async () => {
        const invite = challenge({ id: 8, recipient: null, inviteCode: 'ABCD2345' });
        const { tree, onShare } = await render([], [invite], true);

        await act(async () => { tree.root.findByProps({ testID: 'share-8' }).props.onPress(); });

        expect(onShare).toHaveBeenCalledWith(invite);
    });

    it('offers no Share on a challenge sent to a named player, or when sharing is not wired up', async () => {
        const named = await render([], [challenge({ id: 1, inviteCode: null })], true);
        expect(named.tree.root.findAllByProps({ testID: 'share-1' })).toHaveLength(0);

        const unwired = await render([], [challenge({ id: 2, recipient: null, inviteCode: 'ABCD2345' })], false);
        expect(unwired.tree.root.findAllByProps({ testID: 'share-2' })).toHaveLength(0);
    });
});
