// What a player sends when they share a solved puzzle: the puzzle number, how it went and the streak, with a link to
// the app. Contains nothing about the player.
export const APP_STORE_URL = 'https://apps.apple.com/us/app/diagonal-duel/id1532290974';
/** Not set until the Android listing exists; Android phones are sent the App Store page, which opens in any browser. */
export const PLAY_STORE_URL: string | null = null;

export function storeUrl(platform: string): string {
    return platform === 'android' && PLAY_STORE_URL ? PLAY_STORE_URL : APP_STORE_URL;
}

export function puzzleShareMessage(input: { puzzleId: number; tries: number; streak: number; platform: string }): string {
    const how = input.tries <= 1 ? 'Solved on the first try' : `Solved in ${input.tries} tries`;
    const streak = input.streak >= 2 ? ` 🔥 ${input.streak} day streak` : '';
    return `Diagonal Duel Puzzle #${input.puzzleId} ✅ ${how}${streak}\nCan you find the winning move?\n${storeUrl(input.platform)}`;
}
