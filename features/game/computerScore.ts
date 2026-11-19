// Getting a win against the computer onto the leaderboard. The server checks the game before it pays points
// (backend api/services.py, ComputerGameService): the app tells it when a computer game starts, and sends the
// moves when the player wins. This file is the logic for that, with the network calls passed in so every case is tested.
import { NetworkError } from "@/lib/networkRequests/NetworkError";

export type Cell = [number, number];

/** What the server answers when it credits a win. */
export interface FinishResult {
    pointsAwarded: number;
    /** The player's points after this win, as the server holds them. */
    total: number | null;
    /** True when this game had already been credited (a retry whose first answer was lost). */
    alreadyFinished: boolean;
}

export interface TrackerDeps {
    /** Registers the start of a computer game; resolves with its id. */
    startGame: (level: number, humanFirst: boolean) => Promise<number>;
    /** Sends the finished game; resolves when it was credited. */
    finishGame: (gameId: number, moves: Cell[]) => Promise<FinishResult>;
    /** The old endpoint that took the player's word for it. Only used while the server has no new endpoints. */
    legacyScore: (level: number) => Promise<void>;
    wait?: (ms: number) => Promise<void>;
}

export type WinOutcome =
    /** The server checked the game and credited it. */
    | { kind: 'credited'; points: number; total: number | null }
    /** The server has no computer-game endpoints yet, so the old endpoint was used. */
    | { kind: 'legacy' }
    /** The server looked at the game and said no (it cannot be verified). Asking again will not help. */
    | { kind: 'refused' }
    /** The server could not be reached, even after a retry. Asking again later may work. */
    | { kind: 'failed' }
    /** No server game was started (the phone was offline then), so this win cannot count. */
    | { kind: 'untracked' };

type Started = { mode: 'server'; id: number } | { mode: 'legacy' } | { mode: 'none' };

const RETRY_DELAY_MS = 1500;
// Statuses that mean "the server read the request and the answer is no", so repeating it is pointless.
const FINAL_STATUSES = [400, 404, 405, 409];

/** A server that has no such endpoint: an older backend. Anything else (offline, busy, an error) is not that. */
function endpointMissing(error: unknown): boolean {
    return error instanceof NetworkError && (error.status === 404 || error.status === 405);
}

function isFinalRefusal(error: unknown): boolean {
    return error instanceof NetworkError && error.status !== undefined && FINAL_STATUSES.includes(error.status);
}

export class ComputerGameTracker {
    private started: Promise<Started> | null = null;
    private busy = false;
    private deps: TrackerDeps;

    constructor(deps: TrackerDeps) {
        this.deps = deps;
    }

    /** Replaces the network calls. A screen calls this after each render so the calls always use the latest session. */
    setDeps(deps: TrackerDeps): void {
        this.deps = deps;
    }

    private wait(ms: number): Promise<void> {
        return this.deps.wait ? this.deps.wait(ms) : new Promise((resolve) => setTimeout(resolve, ms));
    }

    /** A computer game begins (also called again when the board is reset). Replaces any game not yet finished. */
    begin(level: number, humanFirst: boolean): void {
        this.started = this.deps
            .startGame(level, humanFirst)
            .then((id): Started => ({ mode: 'server', id }))
            .catch((error): Started => (endpointMissing(error) ? { mode: 'legacy' } : { mode: 'none' }));
    }

    /** Stops tracking the current game, for example when the player leaves it. */
    end(): void {
        this.started = null;
    }

    /**
     * The player beat the computer at `level` with this list of moves. Waits for the game to have been registered,
     * sends it, and tries once more after a short pause if the server could not be reached. A game that was credited
     * is forgotten, so asking again cannot pay twice (the server would refuse that as well).
     */
    async recordWin(level: number, moves: Cell[]): Promise<WinOutcome> {
        if (this.busy) return { kind: 'failed' };
        this.busy = true;
        try {
            const started: Started = this.started ? await this.started : { mode: 'none' };
            if (started.mode === 'none') return { kind: 'untracked' };
            if (started.mode === 'legacy') return await this.recordLegacy(level);
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const result = await this.deps.finishGame(started.id, moves);
                    this.started = null;
                    return { kind: 'credited', points: result.pointsAwarded, total: result.total };
                } catch (error) {
                    if (isFinalRefusal(error)) return { kind: 'refused' };
                    if (attempt === 0) await this.wait(RETRY_DELAY_MS);
                }
            }
            return { kind: 'failed' };
        } finally {
            this.busy = false;
        }
    }

    private async recordLegacy(level: number): Promise<WinOutcome> {
        try {
            await this.deps.legacyScore(level);
            this.started = null;
            return { kind: 'legacy' };
        } catch {
            return { kind: 'failed' };
        }
    }
}

/** The moves of a game as the server wants them: every move in order, first player first. */
export function movesForServer(moves: { row: number; column: number }[]): Cell[] {
    return moves.map((m) => [m.row, m.column]);
}

/** Who moved first, from the two players of a computer game (the computer's player has a level). */
export function humanMovedFirst(player1: { computerLevel?: number | null }): boolean {
    return player1.computerLevel === null || player1.computerLevel === undefined;
}
