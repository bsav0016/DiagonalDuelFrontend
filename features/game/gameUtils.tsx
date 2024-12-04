import { Game } from "./models/Game";
import { GameType } from "./models/GameType";
import { Player } from "./models/Player";

export function validateMove(gameBoard: number[][], r: number, c: number) {
    const playedLocations: number[] = [1, 2]
    if (playedLocations.includes(gameBoard[r][c])) {
        return false;
    }
    else if (r === 0) {
        return true;
    }
    else if (c === 0) {
        return true;
    }
    else if (
        playedLocations.includes(gameBoard[r-1][c-1]) ||
        playedLocations.includes(gameBoard[r-1][c]) ||
        playedLocations.includes(gameBoard[r][c-1])
    ) {
        return true;
    }
    else {
        return false;
    }
}

export function getAllValidMoves(gameBoard: number[][]) {
    return gameBoard.map((row, rowIndex) => 
        row.map((cell, colIndex) => {
            return validateMove(gameBoard, rowIndex, colIndex) ? 3 : cell
        })
    );
}

export function hideValidMoves(gameBoard: number[][]) {
    return gameBoard.map(row => 
        row.map(cell => (cell === 3 ? 0 : cell))
    );
}

export interface WinnerInterface {
    player: number;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
}

export function checkWinner(gameBoard: number[][]): WinnerInterface | null {
    const checkDirection = (i: number, j: number, di: number, dj: number, player: number): boolean => {
        let count = 1;
        for (let k = 1; k < 4; k++) {
            const row = i + di * k;
            const col = j + dj * k;

            if (row >= 0 && row < 8 && col >= 0 && col < 8 && gameBoard[row][col] === player) {
                count++;
            } else {
                break;
            }
        }
        return count === 4;
    };

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (gameBoard[i][j] !== 1 && gameBoard[i][j] !== 2) continue;
            
            const player = gameBoard[i][j];
            if (checkDirection(i, j, 0, 1, player)) {
                return { player: player, startRow: i, startCol: j, endRow: i, endCol: j+3 }
            }
            if (checkDirection(i, j, 1, 0, player)) {
                return { player: player, startRow: i, startCol: j, endRow: i+3, endCol: j }
            }
            if (checkDirection(i, j, 1, 1, player)) {
                return { player: player, startRow: i, startCol: j, endRow: i+3, endCol: j+3 }
            }
            if (checkDirection(i, j, 1, -1, player)) {
                return { player: player, startRow: i, startCol: j, endRow: i+3, endCol: j-3 }
            }
        }
    }
    return null;
}

export function resetGameInstance(game: Game) {
    let player1: Player;
    let player2: Player;
    let levelNumber: number = 0
    if (game.gameType === GameType.Computer) {
        if (game.player1.computerLevel) {
            levelNumber = game.player1.computerLevel
        }
        else if (game.player2.computerLevel) {
            levelNumber = game.player2.computerLevel
        }
        const computerPlayer: Player = new Player("Computer", 0, levelNumber);
        const userPlayer: Player = new Player("Player");
        const computerFirst: Boolean = Math.random() < 0.5;
        player1 = computerFirst ? computerPlayer : userPlayer;
        player2 = computerFirst ? userPlayer : computerPlayer;
    } else {
        player1 = new Player("Player 1");
        player2 = new Player("Player 2");
    }
    return new Game(
        game.gameType,
        null,
        player1,
        player2,
        []
    )
}
