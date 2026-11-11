import { User } from '../User';
import { Game } from '@/features/game/models/Game';
import { GameType } from '@/features/game/models/GameType';
import { Player } from '@/features/game/models/Player';

const finished = (winner: string) => new Game(GameType.Online, 1, new Player('ann'), new Player('bob'), [], null, null, winner);

describe('User.getWinsAndLosses', () => {
    it('uses the server\'s record when there is one, whatever games are held', () => {
        const user = new User('ann', 'a@b.c', [finished('ann wins!')], [], 0, 1000, { wins: 9, losses: 4, draws: 2 }, true);
        expect(user.getWinsAndLosses()).toEqual({ wins: 9, losses: 4, draws: 2 });
    });

    it('counts the games it holds when there is no record', () => {
        const user = new User('ann', 'a@b.c', [finished('ann wins!'), finished('bob wins!'), finished('ann wins by timeout')]);
        expect(user.getWinsAndLosses()).toEqual({ wins: 2, losses: 1, draws: 0 });
    });

    it('ignores games that are not finished when counting', () => {
        const unfinished = new Game(GameType.Online, 2, new Player('ann'), new Player('bob'));
        expect(new User('ann', 'a@b.c', [unfinished]).getWinsAndLosses()).toEqual({ wins: 0, losses: 0, draws: 0 });
    });
});

describe('User.with', () => {
    const user = new User('ann', 'a@b.c', [], [3], 10, 1100, { wins: 1, losses: 1, draws: 0 }, true);

    it('replaces only what it is given', () => {
        const changed = user.with({ matchmaking: [1, 3] });
        expect(changed).toMatchObject({ username: 'ann', email: 'a@b.c', matchmaking: [1, 3], computerPoints: 10, onlineRating: 1100, hasMoreCompleted: true });
        expect(changed.record).toEqual({ wins: 1, losses: 1, draws: 0 });
        expect(changed).not.toBe(user);
        expect(user.matchmaking).toEqual([3]);
    });

    it('can set the record to nothing', () => {
        expect(user.with({ record: null }).record).toBeNull();
    });

    it('can turn "more finished games" off', () => {
        expect(user.with({ hasMoreCompleted: false }).hasMoreCompleted).toBe(false);
    });
});
