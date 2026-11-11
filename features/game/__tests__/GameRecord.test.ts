import { gameRecordFromData } from '../models/GameRecord';

describe('gameRecordFromData', () => {
    it('reads the server\'s record', () => {
        expect(gameRecordFromData({ wins: 4, losses: 2, draws: 1 })).toEqual({ wins: 4, losses: 2, draws: 1 });
    });

    it('is null when the server sent none or sent something unusable, so callers count the games they have', () => {
        for (const bad of [undefined, null, {}, { wins: 1, losses: 2 }, { wins: '1', losses: 2, draws: 0 }, 'x']) {
            expect(gameRecordFromData(bad)).toBeNull();
        }
    });
});
