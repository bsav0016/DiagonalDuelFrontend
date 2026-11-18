import { Share } from 'react-native';
import { inviteLink, inviteMessage, shareInvite } from '../invite';

const { parseCode, appLink } = require('../../../site/join.js');

describe('invite sharing', () => {
    it('links to the invite page on the website with the code', () => {
        expect(inviteLink('ABCD2345')).toBe('https://bsav0016.github.io/DiagonalDuelFrontend/join.html?code=ABCD2345');
    });

    it('sends the link, the code and the time per move in one message', () => {
        const message = inviteMessage('ABCD2345', 3);
        expect(message).toContain('https://bsav0016.github.io/DiagonalDuelFrontend/join.html?code=ABCD2345');
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

// The website's invite page reads the code from that link, so the two have to agree.
describe('the invite page', () => {
    it('reads the code out of the link the app sends', () => {
        const link = inviteLink('ABCD2345');
        expect(parseCode(link.slice(link.indexOf('?')))).toBe('ABCD2345');
    });

    it('accepts any code the backend can make, in any case', () => {
        expect(parseCode('?code=abcd2345')).toBe('ABCD2345');
        expect(parseCode('?x=1&code=HJKLMNPQ')).toBe('HJKLMNPQ');
        expect(parseCode('?code=RSTUVWXY')).toBe('RSTUVWXY');
    });

    it('ignores anything that is not a code, so nothing odd is put in the page or the app link', () => {
        for (const bad of ['', '?', '?code=', '?code=ABC', '?code=ABCD23456', '?code=ABCDEFGI', '?code=ABCD0O1I', '?code=%3Cscript%3E', '?code=%E0%A4%A']) {
            expect(parseCode(bad)).toBeNull();
        }
        expect(parseCode(undefined)).toBeNull();
    });

    it('opens the app on the join screen with the code', () => {
        expect(appLink('ABCD2345')).toBe('diagonalduel://join-challenge?code=ABCD2345');
    });

    it('is the same screen the app listens for', () => {
        const { Routes } = require('@/app/(screens)/Routes');
        expect(appLink('ABCD2345')).toContain(`://${Routes.JoinChallenge}?`);
    });
});
