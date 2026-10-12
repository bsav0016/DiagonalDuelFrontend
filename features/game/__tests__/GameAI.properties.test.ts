import { checkWinner, validateMove } from "../gameUtils";
import { Game } from "../models/Game";
import { GameAI } from "../models/GameAI";
import { GameType } from "../models/GameType";
import { Player } from "../models/Player";
import { Cell, gameWithMoves } from "../testUtils";

// These tests check what a good move must satisfy (legal, wins when it can, blocks when it must),
// not which single cell the search happens to prefer.

const FAST = 150;
const human = new Player("Player");

function setup(cells: Cell[], computerNumber: 1 | 2, level: number) {
    const computer = new Player("Computer", 0, level);
    const [player1, player2] = computerNumber === 1 ? [computer, human] : [human, computer];
    const game = gameWithMoves(cells, GameType.Computer, player1, player2);
    const ai = new GameAI(level, game.initializeGameArray(), computer, computerNumber, FAST);
    return { game, ai };
}

async function moveOf(cells: Cell[], computerNumber: 1 | 2, level: number): Promise<Cell> {
    const { game, ai } = setup(cells, computerNumber, level);
    const { newMove } = (await ai.computeMove(game))!;
    return [newMove.row, newMove.column];
}

beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    // 0 makes every level take the search branch.
    jest.spyOn(Math, "random").mockReturnValue(0);
});
afterEach(() => jest.restoreAllMocks());

describe("computer takes a winning move when one exists", () => {
    // [description, moves played (computer is player 1 and to move), acceptable winning cells]
    const cases: [string, Cell[], Cell[]][] = [
        ["vertical", [[0, 0], [0, 5], [1, 0], [0, 7], [2, 0], [5, 0]], [[3, 0]]],
        ["diagonal", [[0, 0], [0, 5], [1, 1], [0, 7], [2, 2], [5, 0]], [[3, 3]]],
        ["open-ended horizontal (two winning cells)", [[0, 1], [5, 0], [0, 2], [6, 0], [0, 3], [0, 7]], [[0, 0], [0, 4]]],
    ];

    it.each(cases)("%s", async (_name, moves, winningCells) => {
        for (const level of [0, 50, 100]) {
            const cell = await moveOf(moves, 1, level);
            expect(winningCells).toContainEqual(cell);

            // Confirm the fixture itself: playing that cell really ends the game.
            const after = gameWithMoves([...moves, cell]).initializeGameArray();
            expect(checkWinner(after)?.player).toBe(1);
        }
    });
});

describe("computer blocks the opponent's winning move when it cannot win itself", () => {
    // Human is player 1 with three in line; computer (player 2) is to move.
    const cases: [string, Cell[], Cell][] = [
        ["vertical", [[0, 0], [0, 5], [1, 0], [0, 7], [2, 0]], [3, 0]],
        ["diagonal", [[0, 0], [0, 5], [1, 1], [0, 7], [2, 2]], [3, 3]],
        ["horizontal at the edge", [[0, 0], [1, 0], [0, 1], [2, 0], [0, 2]], [0, 3]],
    ];

    it.each(cases)("%s", async (_name, moves, blockCell) => {
        for (const level of [50, 100]) {
            expect(await moveOf(moves, 2, level)).toEqual(blockCell);
        }
    });

    it("leaves the human with no winning reply after the block", async () => {
        const [, moves] = cases[0];
        const cell = await moveOf(moves, 2, 100);
        const after = gameWithMoves([...moves, cell]);
        const board = after.initializeGameArray();
        const humanWins = [...Array(8).keys()].some(r =>
            [...Array(8).keys()].some(c => {
                if (!validateMove(board, r, c)) return false;
                const trial = board.map(row => [...row]);
                trial[r][c] = 1;
                return checkWinner(trial)?.player === 1;
            }),
        );
        expect(humanWins).toBe(false);
    });
});

describe("whole games", () => {
    it("two computers never play an illegal move and the game ends correctly", async () => {
        // Seeded randomness so each level exercises search, heuristic and random branches.
        let state = 2024;
        jest.spyOn(Math, "random").mockImplementation(() => {
            state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
            return state / 2 ** 32;
        });

        const weak = new Player("Weak", 0, 20);
        const strong = new Player("Strong", 0, 80);
        let game: Game = new Game(GameType.Computer, null, weak, strong);
        const ais = [new GameAI(20, game.initializeGameArray(), weak, 1, 15), new GameAI(80, game.initializeGameArray(), strong, 2, 15)];

        let finished = false;
        for (let turn = 0; turn < 64; turn++) {
            const before = game.initializeGameArray();
            if (checkWinner(before)) { finished = true; break; }

            const result = await ais[turn % 2].computeMove(game);
            expect(result).not.toBeNull();
            const { row, column } = result!.newMove;
            expect(validateMove(before, row, column)).toBe(true);
            game = result!.updatedGame;
        }

        const finalBoard = game.initializeGameArray();
        finished = finished || !!checkWinner(finalBoard);
        const filled = finalBoard.flat().filter(cell => cell === 1 || cell === 2).length;
        expect(filled).toBe(game.moves.length);
        expect(finished || filled === 64).toBe(true);
    }, 60000);
});
