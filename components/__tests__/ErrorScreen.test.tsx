import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import { ErrorScreen } from '../ErrorScreen';
import { setReporter } from '@/lib/errorReporting';

describe('ErrorScreen', () => {
    afterEach(() => setReporter(null));

    it('says what happened, offers to try again and reports the error once', async () => {
        const reporter = jest.fn();
        setReporter(reporter);
        const retry = jest.fn();
        const error = new Error('render failed');
        let tree!: ReturnType<typeof create>;
        await act(async () => {
            tree = create(<ErrorScreen error={error} retry={retry} />);
        });
        const text = JSON.stringify(tree.toJSON());
        expect(text).toContain('Something went wrong');
        expect(text).toContain('Your games are safe on the server');
        expect(reporter).toHaveBeenCalledTimes(1);
        expect(reporter).toHaveBeenCalledWith(error, { where: 'screen failed to draw', fatal: true });

        const button = tree.root.findAll((n: ReactTestInstance) => n.props.title === 'Try again' && typeof n.props.onPress === 'function');
        await act(async () => button[0].props.onPress());
        expect(retry).toHaveBeenCalledTimes(1);
    });
});
