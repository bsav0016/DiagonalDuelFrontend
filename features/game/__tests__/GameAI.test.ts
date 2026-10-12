import { validateMove } from "../gameUtils";
import { GameAI } from "../models/GameAI";
import { GameType } from "../models/GameType";
import { Player } from "../models/Player";
import { boardWith, Cell, emptyBoard, gameWithMoves } from "../testUtils";

// Short search budget keeps the suite fast; the cases below only need a shallow search.
const FAST = 150;

const human = new Player("Player");
const computerAs = (level: number) => new Player("Computer", 0, level);

/** A computer game where the computer is player `number` and `cells` have been played. */
function computerGame(cells: Cell[], computerNumber: 1 | 2, level = 100) {
    const computer = computerAs(level);
    const [player1, player2] = computerNumber === 1 ? [computer, human] : [human, computer];
    const game = gameWithMoves(cells, GameType.Computer, player1, player2);
    const ai = new GameAI(level, game.initializeGameArray(), computer, computerNumber, FAST);
    return { game, ai, computer };
}

beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("GameAI.computeMove", () => {
    // Mid-game position, computer (player 2) to move.
    const midGame: Cell[] = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 3], [2, 0], [4, 0]];
    const randomDraws = [0, 0.5, 0.99]; // pick the search, the heuristic and the random branch

    it.each([0, 25, 49, 50, 75, 100])("always plays a legal move at level %i", async level => {
        for (const draw of randomDraws) {
            jest.spyOn(Math, "random").mockReturnValue(draw);
            const { game, ai } = computerGame(midGame, 2, level);
            const before = game.initializeGameArray();

            const result = await ai.computeMove(game);

            expect(result).not.toBeNull();
            const { row, column } = result!.newMove;
            expect(validateMove(before, row, column)).toBe(true);
        }
    });

    it("returns a new game with exactly one extra move by the computer", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0);
        const { game, ai, computer } = computerGame(midGame, 2);

        const { updatedGame, newMove } = (await ai.computeMove(game))!;

        expect(updatedGame).not.toBe(game);
        expect(updatedGame.moves).toHaveLength(midGame.length + 1);
        expect(updatedGame.moves[updatedGame.moves.length - 1]).toBe(newMove);
        expect(newMove.player).toBe(computer);
        expect(updatedGame.gameType).toBe(GameType.Computer);
    });

    it("does not modify the game it was given", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0.99);
        const { game, ai } = computerGame(midGame, 2, 10);
        const snapshot = JSON.stringify(game);

        await ai.computeMove(game);

        expect(JSON.stringify(game)).toBe(snapshot);
    });

    it("plays on an empty board as the first player", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0);
        const { game, ai } = computerGame([], 1);

        const { newMove } = (await ai.computeMove(game))!;

        expect(validateMove(game.initializeGameArray(), newMove.row, newMove.column)).toBe(true);
    });

    it("takes an immediate win at the top level", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0.5);
        // Computer (player 1) holds (0,0)-(0,2); (0,3) completes four. Player 2's stones are harmless.
        const cells: Cell[] = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [5, 0]];
        const { game, ai } = computerGame(cells, 1, 100);

        const { newMove } = (await ai.computeMove(game))!;

        expect([newMove.row, newMove.column]).toEqual([0, 3]);
    });

    it("blocks the opponent's immediate win at the top level", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0.5);
        // Player 1 (human) holds (0,0)-(0,2) and threatens (0,3); the computer (player 2) must block it.
        const cells: Cell[] = [[0, 0], [1, 0], [0, 1], [2, 0], [0, 2]];
        const { game, ai } = computerGame(cells, 2, 100);

        const { newMove } = (await ai.computeMove(game))!;

        expect([newMove.row, newMove.column]).toEqual([0, 3]);
    });
});

describe("GameAI.blockFourRow", () => {
    const blockFourRow = (ai: GameAI, board: number[][]) => (ai as any).blockFourRow(board);
    const ai = new GameAI(50, [], computerAs(50), 2, FAST);

    it("returns the playable cell that completes the opponent's row of three", () => {
        // Player 1 (opponent of computer player 2) holds (4,0)-(4,2); (3,3) supports (4,3).
        const board = boardWith({ 1: [[4, 0], [4, 1], [4, 2], [3, 3]] });
        expect(blockFourRow(ai, board)).toEqual({ row: 4, col: 3 });
    });

    it("finds the gap when the three have a hole in them", () => {
        const board = boardWith({ 1: [[0, 0], [0, 1], [0, 3]] });
        expect(blockFourRow(ai, board)).toEqual({ row: 0, col: 2 });
    });

    it("does not suggest a window that the computer has already blocked", () => {
        const board = boardWith({ 1: [[0, 0], [0, 1], [0, 2]], 2: [[0, 3]] });
        expect(blockFourRow(ai, board)).toBeNull();
    });

    it("ignores rows that are not a threat", () => {
        expect(blockFourRow(ai, boardWith({ 1: [[0, 0], [0, 1]] }))).toBeNull();
        expect(blockFourRow(ai, boardWith({ 2: [[0, 0], [0, 1], [0, 2]] }))).toBeNull();
        expect(blockFourRow(ai, emptyBoard())).toBeNull();
    });
});
