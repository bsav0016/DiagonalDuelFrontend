// Which puzzle is today's. The bank (data/puzzles.json, see docs/puzzles.md) is shipped with the app and every phone
// shows the same puzzle on the same local calendar day, with no server.
import bank from '@/data/puzzles.json';

export type Cell = [number, number];

export interface Puzzle {
    id: number;
    /** The fewest moves the side to move needs to force a win: 1, 2 or 3. */
    depth: 1 | 2 | 3;
    /** 1 is red (moves first in a real game), 2 is yellow. */
    toMove: 1 | 2;
    /** The moves that reach the position, alternating from red. */
    moves: Cell[];
    /** The only first move that forces the win. */
    answer: Cell;
}

export const PUZZLES = bank.puzzles as unknown as Puzzle[];

const [EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY] = bank.epoch.split('-').map(Number);
const MS_PER_DAY = 86_400_000;

/**
 * Whole calendar days since the bank's start date, by the phone's local date. Counting local calendar days (not 24-hour
 * spans) means the puzzle changes at local midnight and a streak is not broken by travel or daylight saving.
 */
export function dayNumber(date: Date): number {
    const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((local - Date.UTC(EPOCH_YEAR, EPOCH_MONTH - 1, EPOCH_DAY)) / MS_PER_DAY);
}

/** The puzzle for a day number. Wraps round when the bank runs out (and before the start date). */
export function puzzleForDay(day: number): Puzzle {
    const n = PUZZLES.length;
    return PUZZLES[((day % n) + n) % n];
}

/** Milliseconds until the next local midnight, when the next puzzle appears. */
export function msUntilNextPuzzle(now: Date): number {
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return next.getTime() - now.getTime();
}
