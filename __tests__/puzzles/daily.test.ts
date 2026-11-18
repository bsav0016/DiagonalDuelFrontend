jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { dayNumber, msUntilNextPuzzle, PUZZLES, puzzleForDay } from '@/features/puzzles/puzzleBank';
import { correctMoves, playMove, revealHint, startSession, tries } from '@/features/puzzles/puzzleSession';
import { currentStreak, EMPTY_PROGRESS, parseProgress, recordSolved, triesToday } from '@/features/puzzles/progress';
import { puzzleShareMessage, storeUrl, APP_STORE_URL } from '@/features/puzzles/share';
import { checkWinner } from '@/features/game/gameUtils';
import { immediateWins } from '@/features/puzzles/engine/rules';

describe('which puzzle is today', () => {
    it('starts on the bank epoch and counts local calendar days', () => {
        expect(dayNumber(new Date(2026, 11, 7))).toBe(0); // 7 December 2026, a Monday
        expect(dayNumber(new Date(2026, 11, 7, 23, 59))).toBe(0);
        expect(dayNumber(new Date(2026, 11, 8, 0, 1))).toBe(1);
        expect(dayNumber(new Date(2027, 0, 1))).toBe(25);
    });

    it('is not moved by daylight saving: a day is a calendar day, not 24 hours', () => {
        // 2027-03-14 is the US spring-forward day; the days either side are still consecutive numbers.
        const before = dayNumber(new Date(2027, 2, 13, 12));
        expect(dayNumber(new Date(2027, 2, 14, 12))).toBe(before + 1);
        expect(dayNumber(new Date(2027, 2, 15, 12))).toBe(before + 2);
    });

    it('gives the weekday difficulty pattern: depth 1 Monday and Tuesday, 2 midweek, 3 weekend', () => {
        const depths = [0, 1, 2, 3, 4, 5, 6].map((d) => puzzleForDay(d).depth);
        expect(depths).toEqual([1, 1, 2, 2, 2, 3, 3]);
        expect(puzzleForDay(7).depth).toBe(1); // the next Monday
    });

    it('wraps round after the bank and before the start date, keeping the weekday pattern', () => {
        expect(PUZZLES.length % 7).toBe(0);
        expect(puzzleForDay(PUZZLES.length).id).toBe(PUZZLES[0].id);
        expect(puzzleForDay(-1).id).toBe(PUZZLES[PUZZLES.length - 1].id);
        expect(puzzleForDay(PUZZLES.length + 5).depth).toBe(puzzleForDay(5).depth);
    });

    it('says how long until the next puzzle', () => {
        const noon = new Date(2026, 11, 7, 12, 0, 0);
        expect(msUntilNextPuzzle(noon)).toBe(12 * 3600 * 1000);
        expect(msUntilNextPuzzle(new Date(2026, 11, 7, 23, 59, 59))).toBe(1000);
    });
});

describe('playing a puzzle', () => {
    it('can be solved by perfect play, for every puzzle in the bank', () => {
        for (const puzzle of PUZZLES) {
            let session = startSession(puzzle);
            expect(session.remaining).toBe(puzzle.depth);
            expect(correctMoves(session)).toEqual([puzzle.answer]);
            let guard = 0;
            while (!session.solved) {
                const [move] = correctMoves(session);
                const result = playMove(session, move);
                expect(['correct', 'solved']).toContain(result.outcome);
                session = result.session;
                if (++guard > 4) throw new Error(`puzzle ${puzzle.id} did not end`);
            }
            expect(checkWinner(session.board)?.player).toBe(puzzle.toMove);
            expect(tries(session)).toBe(1);
        }
    });

    it('takes at most as many moves as the depth says, and the defender cannot make it last longer', () => {
        for (const puzzle of PUZZLES.filter((p) => p.depth === 3).slice(0, 40)) {
            let session = startSession(puzzle);
            let moves = 0;
            while (!session.solved) {
                session = playMove(session, correctMoves(session)[0]).session;
                moves++;
            }
            expect(moves).toBeLessThanOrEqual(3);
        }
    });

    it('has the defender take one of the winning squares when every reply loses anyway', () => {
        for (const p of PUZZLES.filter((q) => q.depth === 2).slice(0, 60)) {
            const first = playMove(startSession(p), p.answer).session;
            const reply = first.lastMove!;
            // The reply is a square where the player would have won, now taken by the defender.
            const before = startSession(p).board.map((row) => row.slice());
            before[p.answer[0]][p.answer[1]] = p.toMove;
            const threats = immediateWins(before, p.toMove);
            expect(threats.some(([r, c]: number[]) => r === reply[0] && c === reply[1])).toBe(true);
        }
    });

    const puzzle = PUZZLES.find((p) => p.depth === 2)!;

    it('counts a wrong move as a try and leaves the board as it was', () => {
        const start = startSession(puzzle);
        const wrong = (() => {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const isAnswer = r === puzzle.answer[0] && c === puzzle.answer[1];
                    if (!isAnswer && start.board[r][c] === 0 && (r === 0 || c === 0)) return [r, c] as [number, number];
                }
            }
            throw new Error('no wrong cell');
        })();
        const result = playMove(start, wrong);
        expect(result.outcome).toBe('wrong');
        expect(result.session.wrongMoves).toBe(1);
        expect(result.session.board).toEqual(start.board);
        expect(tries(result.session)).toBe(2);
    });

    it('ignores a square that is taken or cannot be played, without a penalty', () => {
        const start = startSession(puzzle);
        const taken = puzzle.moves[0];
        expect(playMove(start, taken).outcome).toBe('ignored');
        expect(playMove(start, [7, 7]).outcome).toBe('ignored'); // far from every piece
        expect(playMove(start, taken).session.wrongMoves).toBe(0);
    });

    it('lets a hint show the winning move for the price of a try', () => {
        const start = startSession(puzzle);
        const hint = revealHint(start);
        expect(hint.cell).toEqual(puzzle.answer);
        expect(tries(hint.session)).toBe(2);
        expect(playMove(hint.session, hint.cell).outcome).toMatch(/correct|solved/);
    });

    it('does nothing once solved', () => {
        let session = startSession(PUZZLES[0]);
        session = playMove(session, correctMoves(session)[0]).session;
        expect(session.solved).toBe(true);
        expect(playMove(session, [0, 0]).outcome).toBe('ignored');
    });
});

describe('the streak', () => {
    it('starts at one, grows on consecutive days and resets after a missed day', () => {
        let p = recordSolved(EMPTY_PROGRESS, 10, 1);
        expect(p.streak).toBe(1);
        p = recordSolved(p, 11, 2);
        p = recordSolved(p, 12, 1);
        expect(p).toMatchObject({ streak: 3, best: 3, lastSolvedDay: 12 });
        p = recordSolved(p, 14, 1); // 13 was missed
        expect(p).toMatchObject({ streak: 1, best: 3, lastSolvedDay: 14 });
    });

    it('counts only the first solve of a day, so a replay changes nothing', () => {
        const once = recordSolved(EMPTY_PROGRESS, 5, 3);
        expect(recordSolved(once, 5, 1)).toBe(once);
        expect(triesToday(once, 5)).toBe(3);
        expect(triesToday(once, 6)).toBeNull();
    });

    it('shows the streak while it is alive and zero once a day has been missed', () => {
        const p = recordSolved(recordSolved(EMPTY_PROGRESS, 20, 1), 21, 1);
        expect(currentStreak(p, 21)).toBe(2);
        expect(currentStreak(p, 22)).toBe(2); // yesterday was solved, today still can be
        expect(currentStreak(p, 23)).toBe(0);
        expect(currentStreak(EMPTY_PROGRESS, 1)).toBe(0);
    });

    it('does not let a clock set backwards change the streak, and forgets old days', () => {
        let p = recordSolved(recordSolved(EMPTY_PROGRESS, 40, 1), 41, 1);
        p = recordSolved(p, 39, 2);
        expect(p).toMatchObject({ streak: 2, lastSolvedDay: 41 });
        expect(triesToday(p, 39)).toBe(2);
        p = recordSolved(p, 100, 1);
        expect(Object.keys(p.solved)).toEqual(['100']);
    });

    it('reads stored data defensively', () => {
        const good = recordSolved(EMPTY_PROGRESS, 3, 2);
        expect(parseProgress(JSON.stringify(good))).toEqual(good);
        for (const bad of [null, '', 'nope', '[]', '{"streak":"x"}', '{"lastSolvedDay":1.5,"streak":1,"best":1}', '{"lastSolvedDay":null,"streak":-1,"best":0}']) {
            expect(parseProgress(bad)).toEqual(EMPTY_PROGRESS);
        }
        expect(parseProgress('{"lastSolvedDay":2,"streak":1,"best":1,"solved":{"2":3,"x":4,"5":0}}').solved).toEqual({ '2': 3 });
    });
});

describe('sharing', () => {
    it('words the result and links the app, with nothing about the player', () => {
        expect(puzzleShareMessage({ puzzleId: 12, tries: 1, streak: 1, platform: 'ios' })).toBe(
            `Diagonal Duel Puzzle #12 ✅ Solved on the first try\nCan you find the winning move?\n${APP_STORE_URL}`);
        const longer = puzzleShareMessage({ puzzleId: 12, tries: 3, streak: 5, platform: 'android' });
        expect(longer).toContain('Solved in 3 tries 🔥 5 day streak');
        expect(longer.split('\n')).toHaveLength(3);
    });

    it('sends Android phones to the page that exists', () => {
        expect(storeUrl('android')).toBe(APP_STORE_URL);
    });
});
