import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import { GameBoard } from '../GameBoard';
import { Colors } from '@/constants/Colors';
import { boardWith, emptyBoard } from '../../testUtils';

jest.mock('@/components/CountdownTimer', () => ({ CountdownTimer: () => null }));

type Props = React.ComponentProps<typeof GameBoard>;

async function render(overrides: Partial<Props> = {}) {
    const onCellClick = jest.fn();
    const props: Props = {
        gameArray: emptyBoard(), selectedMove: null, lastMove: null, time: null, winnerDetails: null,
        disabled: false, onCellClick, timeExpired: null, ...overrides,
    };
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<GameBoard {...props} />); });
    const cells = () => tree.root.findAllByType(TouchableOpacity) as ReactTestInstance[];
    return { tree, cells, onCellClick };
}

describe('GameBoard', () => {
    it('draws an 8 by 8 grid of cells', async () => {
        const { cells } = await render();
        expect(cells()).toHaveLength(64);
    });

    it('reports the row and column of the cell that was tapped', async () => {
        const { cells, onCellClick } = await render();
        // Cells are listed row by row: index = row * 8 + column.
        await act(async () => { cells()[2 * 8 + 5].props.onPress(); });
        expect(onCellClick).toHaveBeenCalledWith(2, 5);
        await act(async () => { cells()[7 * 8 + 0].props.onPress(); });
        expect(onCellClick).toHaveBeenLastCalledWith(7, 0);
    });

    it('turns every cell off while the board is disabled', async () => {
        const { cells } = await render({ disabled: true });
        expect(cells().every((cell) => cell.props.disabled === true)).toBe(true);
    });

    it('leaves the cells on when it is the player\'s turn', async () => {
        const { cells } = await render({ disabled: false });
        expect(cells().every((cell) => cell.props.disabled === false)).toBe(true);
    });

    it('shows a dot on each cell that is a valid move, and nowhere else', async () => {
        const gameArray = boardWith({ 1: [[0, 0]], 2: [[0, 1]], 3: [[3, 3], [4, 4]] });
        const { tree } = await render({ gameArray });
        const dots = tree.root.findAll((n) => {
            const style = ([] as any[]).concat(n.props.style ?? []).flat();
            return String(n.type) === 'View' && style.some((s) => s && s.backgroundColor === Colors.board.valid);
        });
        expect(dots).toHaveLength(2);
    });

    it('shows no dots when no moves are valid', async () => {
        const { tree } = await render();
        const dots = tree.root.findAll((n) => {
            const style = ([] as any[]).concat(n.props.style ?? []).flat();
            return String(n.type) === 'View' && style.some((s) => s && s.backgroundColor === Colors.board.valid);
        });
        expect(dots).toHaveLength(0);
    });

    it('draws the winning line only when there is a winner', async () => {
        const without = await render();
        expect(without.tree.root.findAllByProps({ pointerEvents: 'none' }).length).toBe(0);

        const withWinner = await render({ winnerDetails: { startRow: 1, startCol: 1, endRow: 4, endCol: 4 } as any });
        expect(withWinner.tree.root.findAllByProps({ pointerEvents: 'none' }).length).toBeGreaterThan(0);
    });
});
