import React from 'react';
import { Share } from 'react-native';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import DailyPuzzleScreen from '../daily-puzzle';
import { puzzleForDay } from '@/features/puzzles/puzzleBank';
import { correctMoves, startSession } from '@/features/puzzles/puzzleSession';
import { validMoves, winsAt } from '@/features/puzzles/engine/rules';

const mockAddToast = jest.fn();
const mockShare = jest.fn();
let mockStore: Record<string, string> = {};
let mockBoardProps: any = null;

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(async (k: string) => (k in mockStore ? mockStore[k] : null)),
    setItem: jest.fn(async (k: string, v: string) => { mockStore[k] = v; }),
}));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: mockAddToast }) }));
// A Wednesday in the bank (day 2): a win in two, so the test does not depend on the date it runs.
jest.mock('@/features/puzzles/puzzleBank', () => ({ ...jest.requireActual('@/features/puzzles/puzzleBank'), dayNumber: () => 2 }));
jest.mock('@/components/CustomHeaderView', () => ({ CustomHeaderView: ({ children }: any) => children }));
jest.mock('@/features/game/components/GameBoard', () => ({
    GameBoard: (props: any) => { mockBoardProps = props; return null; },
}));

jest.setTimeout(30000);

const today = () => 2;
const puzzle = () => puzzleForDay(today());

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<DailyPuzzleScreen />); });
    const button = (title: string) => tree.root.findAll(
        (n: ReactTestInstance) => typeof n.props.onPress === 'function' && n.props.title === title);
    // All the words on screen. Text split by the renderer into pieces ("1", " day streak") is joined back together.
    const flatten = (node: any): string => (node == null ? '' : typeof node === 'string' ? node
        : Array.isArray(node) ? node.map(flatten).join(' ') : (node.children || []).map(flatten).join(''));
    const text = () => flatten(tree.toJSON());
    const tap = async (row: number, col: number) => { await act(async () => { mockBoardProps.onCellClick(row, col); }); };
    const yes = async () => { await act(async () => { await button('Yes')[0].props.onPress(); }); };
    return { button, text, tap, yes };
}

/** A square next to the pieces that is not the winning move. */
function wrongCell(): [number, number] {
    const session = startSession(puzzle());
    const answer = correctMoves(session)[0];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r === 0 || c === 0) && session.board[r][c] === 0 && !(r === answer[0] && c === answer[1])) return [r, c];
        }
    }
    throw new Error('no wrong cell');
}

describe('Daily puzzle screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStore = {};
        mockBoardProps = null;
        jest.spyOn(Share, 'share').mockImplementation(mockShare);
    });

    it("shows today's puzzle: who moves and how many moves the win takes", async () => {
        const { text } = await render();
        const p = puzzle();
        expect(text()).toContain(`Puzzle #${p.id}`);
        expect(text()).toContain(`${p.toMove === 1 ? 'Red' : 'Yellow'} to move. Win in ${p.depth}.`);
        expect(mockBoardProps.disabled).toBe(false);
    });

    it('asks for confirmation before a move, and a wrong move says so and keeps the puzzle open', async () => {
        const { tap, yes, button, text } = await render();
        const [r, c] = wrongCell();
        await tap(r, c);
        expect(button('Yes')).toHaveLength(1);
        await yes();
        expect(mockAddToast).toHaveBeenCalledWith("That doesn't force a win. Try again");
        expect(text()).not.toContain('Solved');
        expect(mockBoardProps.disabled).toBe(false);
    });

    it('can be cancelled before the move is played', async () => {
        const { tap, button } = await render();
        await tap(...wrongCell());
        await act(async () => { button('No')[0].props.onPress(); });
        expect(button('Yes')).toHaveLength(0);
        expect(mockAddToast).not.toHaveBeenCalled();
    });

    it('solves the puzzle with the right moves, records a streak of one and offers to share', async () => {
        const { tap, yes, text, button } = await render();
        let guard = 0;
        while (!text().includes('Solved') && guard++ < 4) {
            const session = startSession(puzzle());
            // After a defender reply the right move changes, so ask the board props for the current position.
            const board: number[][] = mockBoardProps.gameArray;
            const cell = guard === 1 ? correctMoves(session)[0] : findWinningCell(board);
            await tap(cell[0], cell[1]);
            await yes();
        }
        expect(text()).toContain('Solved in 1 try!');
        expect(text()).toContain('1 day streak');
        expect(JSON.parse(mockStore.dailyPuzzleProgress)).toMatchObject({ streak: 1, lastSolvedDay: today() });
        expect(mockBoardProps.disabled).toBe(true);

        await act(async () => { await button('Share')[0].props.onPress(); });
        expect(mockShare).toHaveBeenCalledTimes(1);
        expect(mockShare.mock.calls[0][0].message).toContain(`Puzzle #${puzzle().id}`);
    });

    it('treats a replay of an already solved puzzle as practice: no change to the result', async () => {
        mockStore.dailyPuzzleProgress = JSON.stringify({
            lastSolvedDay: today(), streak: 4, best: 4, solved: { [String(today())]: 2 },
        });
        const { text } = await render();
        expect(text()).toContain("You solved today's puzzle in 2 tries");
        expect(text()).toContain('does not change your streak');
    });
});

/** The winning move in a position the screen shows after the defender replied: the first playable square that wins. */
function findWinningCell(board: number[][]): [number, number] {
    const player = puzzle().toMove;
    const cell = validMoves(board).find(([r, c]: number[]) => winsAt(board, r, c, player));
    if (!cell) throw new Error('no immediate win on screen');
    return cell as [number, number];
}
