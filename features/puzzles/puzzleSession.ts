// Playing one puzzle: the player finds a move that keeps the forced win, the defender answers with its best defence,
// and so on until the win. Pure functions, so every case is tested. The judging uses the same exact solver that proved
// the puzzles (features/puzzles/engine), so a move is accepted exactly when it still forces the win.
import { boardFromMoves, immediateWins, other, validMove, validMoves, winsAt } from './engine/rules';
import { winDepth, winningFirstMoves } from './engine/solver';
import type { Cell, Puzzle } from './puzzleBank';

export interface Session {
    puzzle: Puzzle;
    board: number[][];
    /** The side the player is moving for (1 red, 2 yellow). */
    player: 1 | 2;
    /** How many more of the player's own moves the shortest forced win needs. */
    remaining: number;
    /** The latest piece placed, for highlighting (the defender's reply, or the winning move). */
    lastMove: Cell | null;
    wrongMoves: number;
    hints: number;
    solved: boolean;
}

export type Outcome = 'ignored' | 'wrong' | 'correct' | 'solved';

export function startSession(puzzle: Puzzle): Session {
    return {
        puzzle,
        board: boardFromMoves(puzzle.moves),
        player: puzzle.toMove,
        remaining: puzzle.depth,
        lastMove: puzzle.moves.length ? puzzle.moves[puzzle.moves.length - 1] : null,
        wrongMoves: 0,
        hints: 0,
        solved: false,
    };
}

/** What the result counts: the first attempt is one try, every wrong move or hint adds one. */
export function tries(session: Session): number {
    return 1 + session.wrongMoves + session.hints;
}

/** Every move that keeps the forced win from here (one for a fresh puzzle, possibly several later on). */
export function correctMoves(session: Session): Cell[] {
    return winningFirstMoves(session.board, session.player, session.remaining) as Cell[];
}

const copy = (board: number[][]) => board.map((row) => row.slice());

/**
 * The player puts a piece on `cell`.
 *  - A square that cannot be played (taken, or not touching the pieces) changes nothing ('ignored').
 *  - A move that does not keep the forced win costs a try and leaves the board as it was ('wrong').
 *  - A move that wins, or keeps the forced win, is played; the defender then answers with the reply that delays the
 *    loss longest ('correct'), or the puzzle is over ('solved').
 */
export function playMove(session: Session, cell: Cell): { session: Session; outcome: Outcome } {
    const [r, c] = cell;
    if (session.solved || !validMove(session.board, r, c)) return { session, outcome: 'ignored' };

    const good = correctMoves(session);
    if (!good.some(([gr, gc]) => gr === r && gc === c)) {
        return { session: { ...session, wrongMoves: session.wrongMoves + 1 }, outcome: 'wrong' };
    }

    const board = copy(session.board);
    const wins = winsAt(board, r, c, session.player);
    board[r][c] = session.player;
    if (wins) return { session: { ...session, board, lastMove: cell, solved: true }, outcome: 'solved' };

    // The best defence: the reply after which the player needs the most moves, so a puzzle never ends sooner than it must.
    // When every reply loses equally fast (a double threat), the defender at least takes one of the winning squares,
    // which is what a real opponent would do, instead of a meaningless move elsewhere.
    const defender = other(session.player);
    const threats = immediateWins(board, session.player);
    let reply: Cell | null = null;
    let longest = -1;
    let blocks = false;
    for (const [rr, cc] of validMoves(board)) {
        board[rr][cc] = defender;
        const depth = winDepth(board, session.player, session.remaining - 1) ?? 0;
        board[rr][cc] = 0;
        const blocking = threats.some(([tr, tc]: number[]) => tr === rr && tc === cc);
        if (depth > longest || (depth === longest && blocking && !blocks)) {
            longest = depth;
            reply = [rr, cc];
            blocks = blocking;
        }
    }
    if (!reply) return { session: { ...session, board, lastMove: cell, solved: true }, outcome: 'solved' };
    board[reply[0]][reply[1]] = defender;
    return {
        session: { ...session, board, lastMove: reply, remaining: Math.max(1, longest) },
        outcome: 'correct',
    };
}

/** Shows a winning move and counts it as a try. */
export function revealHint(session: Session): { session: Session; cell: Cell } {
    const [cell] = correctMoves(session);
    return { session: { ...session, hints: session.hints + 1 }, cell };
}
