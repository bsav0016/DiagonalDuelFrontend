import { Game } from "./models/Game";
import { GameType } from "./models/GameType";
import { Move } from "./models/Move";
import { Player } from "./models/Player";
import { inARow, positionScore } from "./scoreUtils";

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
        null,
        player1,
        player2,
        []
    )
}

interface ComputerMove {
    row: number;
    col: number;
}

export async function computerMove(
    gameBoard: number[][], 
    player: Player, 
    maxRuntime: number = 3000, 
    depth: number = 4
): Promise<Move | null> {
    const tempBoard: number[][] = hideValidMoves(gameBoard);
    const moveCount: number = gameBoard.reduce((count, row) => {
        return count + row.filter(cell => cell === 1 || cell === 2).length;
    }, 0);
    const computerNumber: number = moveCount % 2 === 0 ? 1 : 2;
    const computerMoveAndScore = await alphabeta(tempBoard, computerNumber, maxRuntime, depth);
    const computerMove = computerMoveAndScore[0];
    if (!computerMove) throw new Error("Couldn't get move");
    return new Move(player, computerMove.row, computerMove.col);
}

async function alphabeta(
    gameBoard: number[][],
    computerNumber: number,
    timeLeft: number,
    depth: number,
    alpha: number = -Infinity,
    beta: number = Infinity,
    computerTurn: boolean = true
): Promise<[ComputerMove | null, number]> {
    const startTime = Date.now();

    if (
        depth === 0 ||
        getValidRowsCols(gameBoard).length === 0 ||
        timeLeft < 100 ||
        checkWinner(gameBoard)
    ) {
        return [null, scoreBoard(gameBoard, computerNumber)];
    }

    const appliedNumber = computerTurn ? computerNumber : computerNumber === 1 ? 2 : 1

    let availableMoves = getValidRowsCols(gameBoard);
    let availableScores: { move: ComputerMove; score: number }[] = [];
    for (const move of availableMoves) {
        const newGame = applyMove(gameBoard, move, appliedNumber);
        const score = scoreBoard(newGame, computerNumber);
        availableScores.push({ move, score });
    }
    availableScores.sort((a, b) => (computerTurn ? b.score - a.score : a.score - b.score));
    availableMoves = availableScores.map(item => item.move);

    let overallBestScore = computerTurn ? -Infinity : Infinity;
    let overallBestMove: ComputerMove | null = null;

    for (const move of availableMoves) {
        const newGame = applyMove(gameBoard, move, appliedNumber);

        const elapsedTime = Date.now() - startTime;
        const remainingTime = timeLeft - elapsedTime;

        const [, bestScore] = await alphabeta(
            newGame,
            computerNumber,
            remainingTime,
            depth - 1,
            alpha,
            beta,
            !computerTurn
        );

        if (
            (computerTurn && bestScore > overallBestScore) ||
            (!computerTurn && bestScore < overallBestScore)
        ) {
            overallBestScore = bestScore;
            overallBestMove = move;
        }

        if (computerTurn) {
            alpha = Math.max(alpha, overallBestScore);
        } else {
            beta = Math.min(beta, overallBestScore);
        }

        if (beta <= alpha) {
            break;
        }
    }

    return [overallBestMove, overallBestScore];
}

function getValidRowsCols(gameBoard: number[][]): ComputerMove[] {
    const valid: ComputerMove[] = [];
    const numRows = gameBoard.length;
    const numCols = gameBoard[0].length;

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
        for (let colIndex = 0; colIndex < numCols; colIndex++) {
            if (validateMove(gameBoard, rowIndex, colIndex)) {
                valid.push({ row: rowIndex, col: colIndex});
            }
        }
    }
    return valid;
}

function applyMove(gameBoard: number[][], move: ComputerMove, playerNumber: number) {
    const newGameBoard: number[][] = gameBoard.map(row => [...row]);
    newGameBoard[move.row][move.col] = playerNumber;
    return newGameBoard;
}

function scoreBoard(gameBoard: number[][], playerNumber: number): number {
    let score: number = 0;
    const numRows = gameBoard.length;
    const numCols = gameBoard[0].length;

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
        for (let colIndex = 0; colIndex < numCols; colIndex++) {
            if (gameBoard[rowIndex][colIndex] === 0) {
                continue;
            }
            let locationScore: number = 0;
            const cell = gameBoard[rowIndex][colIndex];
            const multiplier = cell === playerNumber ? 1 : -1;
            locationScore += positionScore(rowIndex, colIndex);
            locationScore += inARow(gameBoard, rowIndex, colIndex, cell, 2, 1);
            locationScore += inARow(gameBoard, rowIndex, colIndex, cell, 3, 3);
            locationScore += inARow(gameBoard, rowIndex, colIndex, cell, 4, 99999999999);
            score += (locationScore * multiplier);
        }
    }
    console.log(score);
    return score;
}