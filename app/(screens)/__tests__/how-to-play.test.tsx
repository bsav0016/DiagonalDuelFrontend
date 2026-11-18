import React from 'react';
import { act, create } from 'react-test-renderer';
import HowToPlay from '../how-to-play';

jest.mock('@/contexts/RouteContext', () => ({ useRouteTo: () => ({ routeBack: jest.fn() }) }));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));

const flatten = (node: any): string => (node == null ? '' : typeof node === 'string' ? node
    : Array.isArray(node) ? node.map(flatten).join(' ') : (node.children || []).map(flatten).join(''));

describe('How to Play', () => {
    it('explains the rules and the daily puzzle, and describes the valid-move marker as it looks', async () => {
        let tree!: ReturnType<typeof create>;
        await act(async () => { tree = create(<HowToPlay />); });
        const text = flatten(tree.toJSON());
        expect(text).toContain('Take turns');
        expect(text).toContain('Get four in a row');
        expect(text).toContain('Try the daily puzzle');
        expect(text).toContain('small light dot');
        expect(text).not.toContain('purple'); // the marker is a pale dot, not purple
    });
});
