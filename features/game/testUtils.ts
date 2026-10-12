import { Game } from "./models/Game";
import { GameType } from "./models/GameType";
import { Player } from "./models/Player";

export type Cell = [number, number];

export const emptyBoard = (): number[][] => Array.from({ length: 8 }, () => new Array(8).fill(0));

export function boardWith(cells: { 1?: Cell[]; 2?: Cell[]; 3?: Cell[] }): number[][] {
    const board = emptyBoard();
    for (const piece of [1, 2, 3] as const) {
        for (const [row, col] of cells[piece] ?? []) {
            board[row][col] = piece;
        }
    }
    return board;
}

/** Build a game and replay `cells` in order, player 1 first. */
export function gameWithMoves(
    cells: Cell[],
    gameType: GameType = GameType.TwoPlayer,
    player1: Player = new Player("Player 1"),
    player2: Player = new Player("Player 2"),
): Game {
    const game = new Game(gameType, null, player1, player2);
    cells.forEach(([row, col], index) => {
        game.moves.push({ player: index % 2 === 0 ? player1 : player2, row, column: col });
    });
    return game;
}
