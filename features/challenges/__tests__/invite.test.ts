import { Share } from 'react-native';
import { inviteLink, inviteMessage, shareInvite } from '../invite';

jest.mock('expo-linking', () => ({
    createURL: (path: string, options?: { queryParams?: Record<string, string> }) =>
        `diagonalduel://${path}${options?.queryParams ? '?' + new URLSearchParams(options.queryParams).toString() : ''}`,
}));

describe('invite sharing', () => {
    it('links to the join screen with the code', () => {
        expect(inviteLink('ABCD2345')).toBe('diagonalduel://join-challenge?code=ABCD2345');
    });

    it('sends the link, the code and the time per move in one message', () => {
        const message = inviteMessage('ABCD2345', 3);
        expect(message).toContain('diagonalduel://join-challenge?code=ABCD2345');
        expect(message).toContain('enter: ABCD2345');
        expect(message).toContain('3 days');
    });

    it('says "1 day", not "1 days"', () => {
        expect(inviteMessage('ABCD2345', 1)).toContain('1 day.');
    });

    it('opens the share sheet with that message', async () => {
        const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction } as any);
        await shareInvite('ABCD2345', 5);
        expect(share).toHaveBeenCalledWith({ message: inviteMessage('ABCD2345', 5) });
    });
});
