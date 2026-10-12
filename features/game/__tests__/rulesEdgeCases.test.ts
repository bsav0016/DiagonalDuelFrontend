import { checkWinner, getAllValidMoves, validateMove } from "../gameUtils";
import { boardWith, Cell, emptyBoard } from "../testUtils";

/** Small deterministic generator so "random" boards are the same on every run. */
function seeded(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 2 ** 32;
    };
}

/** Independent, deliberately naive win finder used as an oracle for checkWinner. */
function hasFourInARow(board: number[][]): number | null {
    const lines: Cell[][] = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
                const cells: Cell[] = [0, 1, 2, 3].map(k => [r + dr * k, c + dc * k] as Cell);
                if (cells.every(([rr, cc]) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8)) lines.push(cells);
            }
        }
    }
    for (const line of lines) {
        const values = line.map(([r, c]) => board[r][c]);
        if ((values[0] === 1 || values[0] === 2) && values.every(v => v === values[0])) return values[0];
    }
    return null;
}

describe("board corners and edges", () => {
    it("allows the empty corners of the top row and left column", () => {
        const board = emptyBoard();
        expect(validateMove(board, 0, 0)).toBe(true);
        expect(validateMove(board, 0, 7)).toBe(true);
        expect(validateMove(board, 7, 0)).toBe(true);
    });

    it("needs support for the far corner", () => {
        expect(validateMove(emptyBoard(), 7, 7)).toBe(false);
        expect(validateMove(boardWith({ 1: [[6, 6]] }), 7, 7)).toBe(true);
        expect(validateMove(boardWith({ 1: [[7, 6]] }), 7, 7)).toBe(true);
        expect(validateMove(boardWith({ 1: [[6, 7]] }), 7, 7)).toBe(true);
    });

    it("finds a vertical line on the last column and a horizontal one on the last row", () => {
        expect(checkWinner(boardWith({ 1: [[4, 7], [5, 7], [6, 7], [7, 7]] }))?.player).toBe(1);
        expect(checkWinner(boardWith({ 2: [[7, 0], [7, 1], [7, 2], [7, 3]] }))?.player).toBe(2);
    });

    it("finds diagonals that run corner to edge", () => {
        expect(checkWinner(boardWith({ 1: [[4, 4], [5, 5], [6, 6], [7, 7]] }))?.player).toBe(1);
        expect(checkWinner(boardWith({ 2: [[4, 3], [5, 2], [6, 1], [7, 0]] }))?.player).toBe(2);
        expect(checkWinner(boardWith({ 1: [[0, 7], [1, 6], [2, 5], [3, 4]] }))?.player).toBe(1);
    });

    it("does not read outside the board when a line starts near an edge", () => {
        const board = boardWith({ 1: [[7, 7], [6, 7], [5, 7]], 2: [[0, 0], [0, 1], [0, 2]] });
        expect(() => checkWinner(board)).not.toThrow();
        expect(checkWinner(board)).toBeNull();
    });
});

describe("full board", () => {
    const row = [1, 1, 2, 2, 1, 1, 2, 2];
    const other = [2, 2, 1, 1, 2, 2, 1, 1];
    const full = [row, other, row, other, row, other, row, other];

    it("has no winner and no playable cell (the situation a draw rule would detect)", () => {
        expect(checkWinner(full)).toBeNull();
        expect(getAllValidMoves(full).flat().filter(cell => cell === 3)).toHaveLength(0);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) expect(validateMove(full, r, c)).toBe(false);
        }
    });
});

describe("checkWinner against an independent oracle", () => {
    it("agrees on 400 seeded random boards", () => {
        const next = seeded(12345);
        for (let i = 0; i < 400; i++) {
            const density = 0.3 + next() * 0.6;
            const board = emptyBoard().map(rowCells => rowCells.map(() => (next() < density ? (next() < 0.5 ? 1 : 2) : 0)));
            const expected = hasFourInARow(board);
            const actual = checkWinner(board);
            expect(actual === null ? null : actual.player).toBe(expected);
        }
    });

    it("reports endpoints that really are four of the winner's pieces", () => {
        const next = seeded(777);
        let found = 0;
        for (let i = 0; i < 400; i++) {
            const board = emptyBoard().map(rowCells => rowCells.map(() => (next() < 0.7 ? (next() < 0.5 ? 1 : 2) : 0)));
            const win = checkWinner(board);
            if (!win) continue;
            found++;
            const dr = Math.sign(win.endRow - win.startRow);
            const dc = Math.sign(win.endCol - win.startCol);
            for (let k = 0; k < 4; k++) {
                expect(board[win.startRow + dr * k][win.startCol + dc * k]).toBe(win.player);
            }
        }
        expect(found).toBeGreaterThan(20); // the sample really exercises wins
    });
});

describe("legal-move generation on random positions", () => {
    it("highlights exactly the cells validateMove allows, never an occupied one", () => {
        const next = seeded(99);
        for (let i = 0; i < 100; i++) {
            const board = emptyBoard().map(rowCells => rowCells.map(() => (next() < 0.25 ? (next() < 0.5 ? 1 : 2) : 0)));
            const highlighted = getAllValidMoves(board);
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (board[r][c] !== 0) expect(highlighted[r][c]).toBe(board[r][c]);
                    else expect(highlighted[r][c] === 3).toBe(validateMove(board, r, c));
                }
            }
        }
    });
});
