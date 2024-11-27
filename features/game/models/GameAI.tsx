import { checkWinner, validateMove } from "../gameUtils";
import { scoreGroupOfFour } from "../scoreUtils";
import { ComputerMove } from "./ComputerMove";
import { Move } from "./Move";
import { Player } from "./Player";


export class GameAI {
    private gameBoard: number[][];
    private player: Player;
    private computerNumber: number;
    private opponentNumber: number;
    private maxRuntime: number;

    constructor(gameBoard: number[][], player: Player, maxRuntime = 1000) {
        this.gameBoard = gameBoard;
        this.player = player
        this.computerNumber = this.calculateComputerNumber();
        this.opponentNumber = this.getOpponent(this.computerNumber);
        this.maxRuntime = maxRuntime;
    }

    private totalMoves(): number {
        return this.gameBoard.flat().filter(cell => cell === 1 || cell === 2).length;
    }

    private calculateComputerNumber(): number {
        return this.totalMoves() % 2 === 0 ? 1 : 2;
    }

    private getOpponent(playerNumber: number): number {
        return playerNumber === 1 ? 2 : 1;
    }

    private hideValidMoves(): number[][] {
        return this.gameBoard.map(row => row.map(cell => (cell === 3 ? 0 : cell)));
    }

    async computeMove(updatedGameArray: number[][] | null): Promise<Move | null> {
        if (updatedGameArray) {
            this.gameBoard = updatedGameArray;
        }
        const start = Date.now();
        const tempBoard = this.hideValidMoves();
        const [computerMove] = await this.iterativeDeepening(tempBoard, this.computerNumber, this.maxRuntime);
        if (!computerMove) throw new Error("Couldn't get move");
        console.log(`AI computed move in ${Date.now() - start}ms`);
        return new Move(this.player, computerMove.row, computerMove.col);
    }

    private async iterativeDeepening(gameBoard: number[][], computerNumber: number, maxRuntime: number): Promise<[ComputerMove | null, number]> {
        const startTime = Date.now();
        let bestMove: [ComputerMove | null, number] = [null, 0];
        const maxDepth = 64 - this.totalMoves()
        for (let depth = 1; depth <= maxDepth; depth++) {
            if (maxRuntime - (Date.now() - startTime) < 0) {
                console.log(depth);
                break;
            }
            bestMove = await this.alphabeta(gameBoard, computerNumber, depth);
        }
        return bestMove;
    }

    private async alphabeta(
        gameBoard: number[][],
        computerNumber: number,
        depth: number,
        alpha = -Infinity,
        beta = Infinity,
        computerTurn = true
    ): Promise<[ComputerMove | null, number]> {
        let availableMoves = this.getValidMoves(gameBoard);
        if (depth === 0 || availableMoves.length === 0 || checkWinner(gameBoard)) {
            return [null, this.scoreBoard(gameBoard, computerNumber, availableMoves)];
        }

        let bestScore = computerTurn ? -Infinity : Infinity;
        let bestMove: ComputerMove | null = null;

        let availableScores: { move: ComputerMove; score: number }[] = [];
        for (const move of availableMoves) {
            const newGame = this.applyMove(gameBoard, move, computerTurn ? this.computerNumber : this.opponentNumber);
            const newAvailableMoves = this.getValidMoves(newGame);
            const score = this.scoreBoard(newGame, computerNumber, newAvailableMoves);
            availableScores.push({ move, score });
        }
        availableScores.sort((a, b) => (computerTurn ? b.score - a.score : a.score - b.score));
        availableMoves = availableScores.map(item => item.move);

        for (const move of availableMoves) {
            const newBoard = this.applyMove(gameBoard, move, computerTurn ? this.computerNumber : this.opponentNumber);
            const [_, score] = await this.alphabeta(newBoard, computerNumber, depth - 1, alpha, beta, !computerTurn);
            if ((computerTurn && score > bestScore) || (!computerTurn && score < bestScore)) {
                bestScore = score;
                bestMove = move;
            }
            if (computerTurn) alpha = Math.max(alpha, bestScore);
            else beta = Math.min(beta, bestScore);
            if (beta <= alpha) break;
        }

        return [bestMove, bestScore];
    }

    private getValidMoves(gameBoard: number[][]): ComputerMove[] {
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

    private applyMove(gameBoard: number[][], move: ComputerMove, playerNumber: number): number[][] {
        const newGameBoard = [...gameBoard];
        newGameBoard[move.row] = [...gameBoard[move.row]];
        newGameBoard[move.row][move.col] = playerNumber;
        return newGameBoard;
    }

    private scoreBoard(gameBoard: number[][], playerNumber: number, availableMoves: ComputerMove[]): number {
        const numRows = gameBoard.length;
        const numCols = gameBoard[0].length;
        let totalScore = 0;

        for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
            for (let colIndex = 0; colIndex < numCols; colIndex++) {
                const cell = gameBoard[rowIndex][colIndex];
                if (cell === 0) continue;
                const multiplier = cell === playerNumber ? 1 : -1;
                totalScore += scoreGroupOfFour(gameBoard, rowIndex, colIndex, cell, availableMoves) * multiplier;
            }
        }

        return totalScore;
    }
}
