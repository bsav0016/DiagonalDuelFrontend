import { ComputerGameTracker, humanMovedFirst, movesForServer, type Cell, type FinishResult, type TrackerDeps } from '../computerScore';
import { NetworkError } from '@/lib/networkRequests/NetworkError';

const MOVES: Cell[] = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3]];
const credited = (over: Partial<FinishResult> = {}): FinishResult => ({ pointsAwarded: 10, total: 110, alreadyFinished: false, capped: false, ...over });

function setup(over: Partial<TrackerDeps> = {}) {
    const waits: number[] = [];
    const deps = {
        startGame: jest.fn().mockResolvedValue(5),
        finishGame: jest.fn().mockResolvedValue(credited()),
        legacyScore: jest.fn().mockResolvedValue(undefined),
        wait: async (ms: number) => { waits.push(ms); },
        ...over,
    };
    return { tracker: new ComputerGameTracker(deps), deps, waits };
}

describe('registering a game and sending the win', () => {
    it('starts a server game with the level and who moved first, then sends the moves of the win', async () => {
        const { tracker, deps } = setup();
        tracker.begin(10, false);
        const outcome = await tracker.recordWin(10, MOVES);

        expect(deps.startGame).toHaveBeenCalledWith(10, false);
        expect(deps.finishGame).toHaveBeenCalledWith(5, MOVES);
        expect(outcome).toEqual({ kind: 'credited', points: 10, total: 110, capped: false });
        expect(deps.legacyScore).not.toHaveBeenCalled();
    });

    it('passes on whether the daily point limit held some of the win back', async () => {
        const { tracker } = setup({ finishGame: jest.fn().mockResolvedValue(credited({ pointsAwarded: 3, capped: true })) });
        tracker.begin(10, true);
        expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'credited', points: 3, total: 110, capped: true });
    });

    it('waits for the start to finish before it sends the win, even when the start is slow', async () => {
        let release!: (id: number) => void;
        const { tracker, deps } = setup({ startGame: jest.fn(() => new Promise<number>((r) => { release = r; })) });
        tracker.begin(3, true);
        const pending = tracker.recordWin(3, MOVES);
        await Promise.resolve();
        expect(deps.finishGame).not.toHaveBeenCalled();
        release(9);
        expect(await pending).toMatchObject({ kind: 'credited' });
        expect(deps.finishGame).toHaveBeenCalledWith(9, MOVES);
    });

    it('does not credit a game twice: after a credit, asking again finds nothing to send', async () => {
        const { tracker, deps } = setup();
        tracker.begin(10, true);
        await tracker.recordWin(10, MOVES);
        expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'untracked' });
        expect(deps.finishGame).toHaveBeenCalledTimes(1);
    });

    it('a new game replaces the last one that was not finished', async () => {
        const start = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
        const { tracker, deps } = setup({ startGame: start });
        tracker.begin(10, true);
        tracker.begin(10, false);
        await tracker.recordWin(10, MOVES);
        expect(deps.finishGame).toHaveBeenCalledWith(2, MOVES);
    });

    it('has nothing to send for a game that was never started or that was ended', async () => {
        const { tracker, deps } = setup();
        expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'untracked' });
        tracker.begin(10, true);
        tracker.end();
        expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'untracked' });
        expect(deps.finishGame).not.toHaveBeenCalled();
    });
});

describe('when the server cannot be reached', () => {
    it('cannot count a win for a game whose start failed (offline, busy or throttled)', async () => {
        for (const error of [new TypeError('Network request failed'), new NetworkError('Too many requests', 429), new NetworkError('boom', 500)]) {
            const { tracker, deps } = setup({ startGame: jest.fn().mockRejectedValue(error) });
            tracker.begin(10, true);
            expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'untracked' });
            expect(deps.legacyScore).not.toHaveBeenCalled();
        }
    });

    it('tries a second time after a pause when the first send fails, and credits it if that works', async () => {
        const finish = jest.fn().mockRejectedValueOnce(new TypeError('Network request failed')).mockResolvedValueOnce(credited());
        const { tracker, waits } = setup({ finishGame: finish });
        tracker.begin(10, true);
        expect(await tracker.recordWin(10, MOVES)).toMatchObject({ kind: 'credited' });
        expect(finish).toHaveBeenCalledTimes(2);
        expect(waits).toEqual([1500]);
    });

    it('gives up after the retry, keeps the game so a later try can still succeed, and never pays twice', async () => {
        const finish = jest.fn()
            .mockRejectedValueOnce(new NetworkError('down', 503)).mockRejectedValueOnce(new TypeError('Network request failed'))
            .mockResolvedValueOnce(credited({ alreadyFinished: true }));
        const { tracker } = setup({ finishGame: finish });
        tracker.begin(10, true);
        expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'failed' });
        expect(await tracker.recordWin(10, MOVES)).toMatchObject({ kind: 'credited', points: 10 }); // the "Try again" button
        expect(finish).toHaveBeenCalledTimes(3);
        expect(finish.mock.calls.every(([id]) => id === 5)).toBe(true);
    });

    it('treats a throttled answer as worth trying again, not as a refusal', async () => {
        const finish = jest.fn().mockRejectedValue(new NetworkError('Request was throttled', 429));
        const { tracker } = setup({ finishGame: finish });
        tracker.begin(10, true);
        expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'failed' });
        expect(finish).toHaveBeenCalledTimes(2);
    });
});

describe('when the server says no', () => {
    it.each([400, 404, 409])('does not retry a %i answer: the win cannot be verified', async (status) => {
        const finish = jest.fn().mockRejectedValue(new NetworkError('The game was too fast to be played', status));
        const { tracker, waits } = setup({ finishGame: finish });
        tracker.begin(10, true);
        expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'refused' });
        expect(finish).toHaveBeenCalledTimes(1);
        expect(waits).toEqual([]);
    });
});

describe('an older server without the computer-game endpoints', () => {
    it.each([404, 405])('falls back to the old score endpoint when starting answers %i', async (status) => {
        const { tracker, deps } = setup({ startGame: jest.fn().mockRejectedValue(new NetworkError('Not found', status)) });
        tracker.begin(25, true);
        expect(await tracker.recordWin(25, MOVES)).toEqual({ kind: 'legacy' });
        expect(deps.legacyScore).toHaveBeenCalledWith(25);
        expect(deps.finishGame).not.toHaveBeenCalled();
    });

    it('reports a failure, and can try again, when the old endpoint is unreachable', async () => {
        const legacy = jest.fn().mockRejectedValueOnce(new TypeError('down')).mockResolvedValueOnce(undefined);
        const { tracker } = setup({ startGame: jest.fn().mockRejectedValue(new NetworkError('Not found', 404)), legacyScore: legacy });
        tracker.begin(25, true);
        expect(await tracker.recordWin(25, MOVES)).toEqual({ kind: 'failed' });
        expect(await tracker.recordWin(25, MOVES)).toEqual({ kind: 'legacy' });
    });
});

describe('guards', () => {
    it('ignores a second report while one is in flight', async () => {
        let release!: () => void;
        const finish = jest.fn(() => new Promise<FinishResult>((resolve) => { release = () => resolve(credited()); }));
        const { tracker } = setup({ finishGame: finish });
        tracker.begin(10, true);
        const first = tracker.recordWin(10, MOVES);
        await new Promise((r) => setTimeout(r, 0));
        expect(await tracker.recordWin(10, MOVES)).toEqual({ kind: 'failed' });
        release();
        expect(await first).toMatchObject({ kind: 'credited' });
        expect(finish).toHaveBeenCalledTimes(1);
    });

    it('uses the latest network calls after they are replaced', async () => {
        const { tracker } = setup();
        const newer = { startGame: jest.fn().mockResolvedValue(77), finishGame: jest.fn().mockResolvedValue(credited()), legacyScore: jest.fn() };
        tracker.setDeps(newer);
        tracker.begin(10, true);
        await tracker.recordWin(10, MOVES);
        expect(newer.finishGame).toHaveBeenCalledWith(77, MOVES);
    });
});

describe('helpers', () => {
    it('lists the moves in order as [row, column] pairs', () => {
        expect(movesForServer([{ row: 0, column: 0 }, { row: 1, column: 0 }])).toEqual([[0, 0], [1, 0]]);
        expect(movesForServer([])).toEqual([]);
    });

    it('knows the human moved first when the first player has no computer level', () => {
        expect(humanMovedFirst({ computerLevel: null })).toBe(true);
        expect(humanMovedFirst({})).toBe(true);
        expect(humanMovedFirst({ computerLevel: 40 })).toBe(false);
        expect(humanMovedFirst({ computerLevel: 0 })).toBe(false);
    });
});
