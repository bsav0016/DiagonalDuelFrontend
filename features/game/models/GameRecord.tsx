// Wins, losses and draws over every finished online game, counted by the server (the game list is trimmed,
// so it cannot be worked out from the games the app holds).
export interface GameRecord {
    wins: number;
    losses: number;
    draws: number;
}

// Null when the server did not send one (an older backend), so callers fall back to counting the games they have.
export function gameRecordFromData(data: any): GameRecord | null {
    if (!data || [data.wins, data.losses, data.draws].some((n) => typeof n !== "number")) {
        return null;
    }
    return { wins: data.wins, losses: data.losses, draws: data.draws };
}
