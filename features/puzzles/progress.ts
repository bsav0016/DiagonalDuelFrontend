// The player's puzzle record: which days they solved, how many tries it took, and the streak. Lives on the phone only.
// The rules are pure functions (tested); load and save wrap AsyncStorage and never throw.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Progress {
    /** The latest day number solved, or null. */
    lastSolvedDay: number | null;
    /** Consecutive days solved, ending at lastSolvedDay. */
    streak: number;
    best: number;
    /** Tries taken on each recent day that was solved (older days are dropped). */
    solved: Record<string, number>;
}

export const EMPTY_PROGRESS: Progress = { lastSolvedDay: null, streak: 0, best: 0, solved: {} };

const KEEP_DAYS = 30;
const STORAGE_KEY = 'dailyPuzzleProgress';

/** Records a solved puzzle. Only the first solve of a day counts, so replaying cannot change a streak or a result. */
export function recordSolved(progress: Progress, day: number, tries: number): Progress {
    if (progress.solved[String(day)] !== undefined) return progress;
    let streak = progress.streak;
    let lastSolvedDay = progress.lastSolvedDay;
    if (lastSolvedDay === null || day > lastSolvedDay) {
        streak = lastSolvedDay === day - 1 ? streak + 1 : 1;
        lastSolvedDay = day;
    }
    // A day earlier than the latest one (the clock was set back) is kept as a result but never changes the streak.
    const solved: Record<string, number> = { [String(day)]: Math.max(1, Math.round(tries)) };
    for (const [d, t] of Object.entries(progress.solved)) {
        if (Number(d) >= (lastSolvedDay ?? day) - KEEP_DAYS) solved[d] = t;
    }
    return { lastSolvedDay, streak, best: Math.max(progress.best, streak), solved };
}

/** The streak to show today: it carries on if yesterday or today was solved, and is zero once a day was missed. */
export function currentStreak(progress: Progress, today: number): number {
    const last = progress.lastSolvedDay;
    return last !== null && (last === today || last === today - 1) ? progress.streak : 0;
}

/** How many tries today's puzzle took, or null if it has not been solved today. */
export function triesToday(progress: Progress, today: number): number | null {
    return progress.solved[String(today)] ?? null;
}

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Reads stored data defensively: anything that is not the expected shape is ignored, never thrown on. */
export function parseProgress(raw: string | null): Progress {
    if (!raw) return EMPTY_PROGRESS;
    try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return EMPTY_PROGRESS;
        const lastOk = data.lastSolvedDay === null || (typeof data.lastSolvedDay === 'number' && Number.isInteger(data.lastSolvedDay));
        if (!lastOk || !isCount(data.streak) || !isCount(data.best)) return EMPTY_PROGRESS;
        const solved: Record<string, number> = {};
        if (data.solved && typeof data.solved === 'object') {
            for (const [d, t] of Object.entries(data.solved)) if (/^-?\d+$/.test(d) && isCount(t) && t >= 1) solved[d] = t;
        }
        return { lastSolvedDay: data.lastSolvedDay, streak: data.streak, best: data.best, solved };
    } catch {
        return EMPTY_PROGRESS;
    }
}

export async function loadProgress(): Promise<Progress> {
    try {
        return parseProgress(await AsyncStorage.getItem(STORAGE_KEY));
    } catch {
        return EMPTY_PROGRESS;
    }
}

export async function saveProgress(progress: Progress): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
        // A result that cannot be saved is not worth an error on screen; it just will not be remembered.
    }
}
