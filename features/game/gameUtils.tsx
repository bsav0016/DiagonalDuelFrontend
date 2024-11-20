import { Game } from "./models/Game";
import { GameType } from "./models/GameType";
import { Move } from "./models/Move";
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

export function checkWinner(gameBoard: number[][]): number | null {
    const checkDirection = (i: number, j: number, di: number, dj: number, player: number): boolean => {
        let count = 0;
        for (let k = 0; k < 4; k++) {
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
            if (gameBoard[i][j] === 0) continue;
            
            const player = gameBoard[i][j];
            if (
                checkDirection(i, j, 0, 1, player) ||
                checkDirection(i, j, 1, 0, player) ||
                checkDirection(i, j, 1, 1, player) ||
                checkDirection(i, j, 1, -1, player)
            ) {
                return player;
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
        const computerPlayer: Player = new Player("Computer", levelNumber);
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
        player1,
        player2,
        []
    )
}

export function computerMove(gameBoard: number[][], player: Player): Move | null {
    for (let rowIndex = 0; rowIndex < gameBoard.length; rowIndex++) {
        for (let colIndex = 0; colIndex < gameBoard[rowIndex].length; colIndex++) {
            if (validateMove(gameBoard, rowIndex, colIndex)) {
                const move: Move = new Move(player, rowIndex, colIndex);
                return move;
            }
        }
    }
    return null;
}