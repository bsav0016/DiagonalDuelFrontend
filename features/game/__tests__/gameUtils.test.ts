import {
    checkWinner,
    getAllValidMoves,
    hideValidMoves,
    isBoardFull,
    isDraw,
    resetGameInstance,
    validateMove,
} from "../gameUtils";
import { Game } from "../models/Game";
import { GameType } from "../models/GameType";
import { Player } from "../models/Player";
import { boardWith, emptyBoard, gameWithMoves } from "../testUtils";

describe("validateMove", () => {
    it("rejects occupied cells", () => {
        const board = boardWith({ 1: [[0, 0]], 2: [[0, 1]] });
        expect(validateMove(board, 0, 0)).toBe(false);
        expect(validateMove(board, 0, 1)).toBe(false);
    });

    it("allows every empty cell on the top row and left column", () => {
        const board = emptyBoard();
        for (let i = 0; i < 8; i++) {
            expect(validateMove(board, 0, i)).toBe(true);
            expect(validateMove(board, i, 0)).toBe(true);
        }
    });

    it("rejects floating cells on an empty board", () => {
        const board = emptyBoard();
        expect(validateMove(board, 1, 1)).toBe(false);
        expect(validateMove(board, 4, 4)).toBe(false);
    });

    it("allows a cell supported from above, from the left or diagonally up-left", () => {
        for (const support of [[2, 3], [3, 2], [2, 2]] as [number, number][]) {
            const board = boardWith({ 2: [support] });
            expect(validateMove(board, 3, 3)).toBe(true);
        }
    });

    it("does not treat pieces below or to the right as support", () => {
        for (const neighbour of [[4, 3], [3, 4], [4, 4], [2, 4], [4, 2]] as [number, number][]) {
            const board = boardWith({ 1: [neighbour] });
            expect(validateMove(board, 3, 3)).toBe(false);
        }
    });

    it("treats a highlighted valid-move marker (3) as an empty cell", () => {
        // A highlighted cell is still playable...
        expect(validateMove(boardWith({ 3: [[0, 2]] }), 0, 2)).toBe(true);
        // ...but it does not count as a piece that supports its neighbours.
        expect(validateMove(boardWith({ 3: [[2, 3]] }), 3, 3)).toBe(false);
    });
});

describe("valid move highlighting", () => {
    it("marks exactly the playable cells with 3 and leaves pieces alone", () => {
        const board = boardWith({ 1: [[0, 0]], 2: [[1, 0]] });
        const highlighted = getAllValidMoves(board);

        expect(highlighted[0][0]).toBe(1);
        expect(highlighted[1][0]).toBe(2);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === 0) {
                    expect(highlighted[r][c] === 3).toBe(validateMove(board, r, c));
                }
            }
        }
    });

    it("does not mutate the board it was given", () => {
        const board = emptyBoard();
        getAllValidMoves(board);
        expect(board).toEqual(emptyBoard());
    });

    it("hideValidMoves removes the markers and nothing else", () => {
        const board = boardWith({ 1: [[0, 0]], 2: [[1, 0]] });
        expect(hideValidMoves(getAllValidMoves(board))).toEqual(board);
    });
});

describe("checkWinner", () => {
    const filler: [number, number][] = [[7, 0], [7, 1], [7, 2], [7, 4]];

    it("returns null for an empty board and for three in a row", () => {
        expect(checkWinner(emptyBoard())).toBeNull();
        expect(checkWinner(boardWith({ 1: [[0, 0], [0, 1], [0, 2]] }))).toBeNull();
    });

    it("finds a horizontal line and reports its endpoints", () => {
        const result = checkWinner(boardWith({ 1: [[2, 1], [2, 2], [2, 3], [2, 4]], 2: filler }));
        expect(result).toEqual({ player: 1, startRow: 2, startCol: 1, endRow: 2, endCol: 4 });
    });

    it("finds a vertical line and reports its endpoints", () => {
        const result = checkWinner(boardWith({ 2: [[1, 5], [2, 5], [3, 5], [4, 5]], 1: filler }));
        expect(result).toEqual({ player: 2, startRow: 1, startCol: 5, endRow: 4, endCol: 5 });
    });

    it("finds a down-right diagonal and reports its endpoints", () => {
        const result = checkWinner(boardWith({ 1: [[0, 0], [1, 1], [2, 2], [3, 3]], 2: filler }));
        expect(result).toEqual({ player: 1, startRow: 0, startCol: 0, endRow: 3, endCol: 3 });
    });

    it("finds a down-left diagonal and reports its endpoints", () => {
        const result = checkWinner(boardWith({ 2: [[0, 7], [1, 6], [2, 5], [3, 4]], 1: filler }));
        expect(result).toEqual({ player: 2, startRow: 0, startCol: 7, endRow: 3, endCol: 4 });
    });

    it("finds lines that touch the bottom-right corner", () => {
        const result = checkWinner(boardWith({ 1: [[7, 4], [7, 5], [7, 6], [7, 7]] }));
        expect(result?.player).toBe(1);
    });

    it("does not count four cells split by an opponent piece", () => {
        const board = boardWith({ 1: [[0, 0], [0, 1], [0, 3], [0, 4]], 2: [[0, 2]] });
        expect(checkWinner(board)).toBeNull();
    });

    it("does not wrap a line around the board edge", () => {
        const board = boardWith({ 1: [[0, 6], [0, 7], [1, 0], [1, 1]] });
        expect(checkWinner(board)).toBeNull();
    });

    it("ignores valid-move markers when looking for a line", () => {
        const board = boardWith({ 3: [[0, 0], [0, 1], [0, 2], [0, 3]] });
        expect(checkWinner(board)).toBeNull();
    });

    it("reports a run of five as a win", () => {
        const result = checkWinner(boardWith({ 1: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] }));
        expect(result?.player).toBe(1);
    });

    it("finds no winner on a full board with no four in a row", () => {
        const row = [1, 1, 2, 2, 1, 1, 2, 2];
        const other = [2, 2, 1, 1, 2, 2, 1, 1];
        const full = [row, other, row, other, row, other, row, other];
        expect(checkWinner(full)).toBeNull();
    });
});

describe("resetGameInstance", () => {
    afterEach(() => jest.restoreAllMocks());

    it("starts a fresh two-player game with default names and no moves", () => {
        const old = gameWithMoves([[0, 0], [1, 0]], GameType.TwoPlayer);
        const fresh = resetGameInstance(old);

        expect(fresh.gameType).toBe(GameType.TwoPlayer);
        expect(fresh.moves).toEqual([]);
        expect(fresh.player1.username).toBe("Player 1");
        expect(fresh.player2.username).toBe("Player 2");
    });

    it("keeps the computer level and puts the computer first or second at random", () => {
        const computer = new Player("Computer", 0, 42);
        const human = new Player("Player");
        const old = gameWithMoves([[0, 0]], GameType.Computer, human, computer);

        jest.spyOn(Math, "random").mockReturnValue(0.1);
        const computerFirst = resetGameInstance(old);
        expect(computerFirst.player1.computerLevel).toBe(42);
        expect(computerFirst.player2.computerLevel).toBeNull();
        expect(computerFirst.moves).toEqual([]);

        jest.spyOn(Math, "random").mockReturnValue(0.9);
        const humanFirst = resetGameInstance(old);
        expect(humanFirst.player1.computerLevel).toBeNull();
        expect(humanFirst.player2.computerLevel).toBe(42);
    });

    it("returns a new Game and leaves the old one untouched", () => {
        const old = gameWithMoves([[0, 0]]);
        const fresh = resetGameInstance(old);
        expect(fresh).toBeInstanceOf(Game);
        expect(fresh).not.toBe(old);
        expect(old.moves).toHaveLength(1);
    });
});

describe("draw detection", () => {
    const row = [1, 1, 2, 2, 1, 1, 2, 2];
    const other = [2, 2, 1, 1, 2, 2, 1, 1];
    const drawnBoard = [row, other, row, other, row, other, row, other];

    it("a full board with no four in a row is a draw", () => {
        expect(isBoardFull(drawnBoard)).toBe(true);
        expect(isDraw(drawnBoard)).toBe(true);
    });

    it("an empty or partly filled board is not a draw", () => {
        expect(isBoardFull(emptyBoard())).toBe(false);
        expect(isDraw(emptyBoard())).toBe(false);

        const almost = drawnBoard.map(r => [...r]);
        almost[7][7] = 0;
        expect(isBoardFull(almost)).toBe(false);
        expect(isDraw(almost)).toBe(false);
    });

    it("a valid-move marker (3) does not count as a filled cell", () => {
        const marked = drawnBoard.map(r => [...r]);
        marked[7][7] = 3;
        expect(isBoardFull(marked)).toBe(false);
    });

    it("a full board that contains four in a row is a win, not a draw", () => {
        const won = drawnBoard.map(r => [...r]);
        won[0] = [1, 1, 1, 1, 2, 2, 1, 1];
        expect(isBoardFull(won)).toBe(true);
        expect(checkWinner(won)?.player).toBe(1);
        expect(isDraw(won)).toBe(false);
    });
});
