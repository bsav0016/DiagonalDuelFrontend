import { checkWinner, validateMove } from "../gameUtils";
import { scoreGroupOfFour, scoreGroupOfFive, prioritizeCenter } from "../scoreUtils";
import { ComputerMove } from "./ComputerMove";
import { Game } from "./Game";
import { Move } from "./Move";
import { Player } from "./Player";


export class GameAI {
    private computerLevel: number;
    private gameBoard: number[][];
    private player: Player;
    private computerNumber: number;
    private opponentNumber: number;
    private maxRuntime: number;

    constructor(computerLevel: number, gameBoard: number[][], player: Player, computerNumber: number, maxRuntime = 550) {
        this.computerLevel = computerLevel;
        this.gameBoard = gameBoard;
        this.player = player;
        this.computerNumber = computerNumber;
        this.opponentNumber = this.getOpponent(this.computerNumber);
        this.maxRuntime = maxRuntime;
    }

    private getOpponent(playerNumber: number): number {
        return playerNumber === 1 ? 2 : 1;
    }

    private hideValidMoves(): number[][] {
        return this.gameBoard.map(row => row.map(cell => (cell === 3 ? 0 : cell)));
    }

    async computeMove(game: Game): Promise<{ updatedGame: Game, newMove: Move} | null> {
        this.gameBoard = game.initializeGameArray();
        const start = Date.now();
        const tempBoard = this.hideValidMoves();

        let chooseBestChance: number;
        let chooseSelfChance: number;
        if (this.computerLevel < 50) {
            chooseBestChance = Math.ceil(this.computerLevel * 2 / 5 + 10);
            chooseSelfChance = Math.ceil(80 - this.computerLevel * 4 / 5);
        } else {
            chooseBestChance = Math.ceil(this.computerLevel * 7 / 5 - 40);
            chooseSelfChance = Math.ceil(this.computerLevel * 4 / 5);
        }
        const moveChoice: number = Math.random() * 100;
        let computerMove: ComputerMove | null;
        if (moveChoice <= chooseBestChance) {
            [computerMove] = await this.iterativeDeepening(tempBoard);
        }
        else if (moveChoice <= chooseBestChance + chooseSelfChance) {
            computerMove = this.chooseBetterBestMove(tempBoard);
        }
        else {
            computerMove = this.chooseRandomMove(tempBoard);
        }

        if (!computerMove) throw new Error("Couldn't get move");
        console.log(`AI computed move in ${Date.now() - start}ms`);
        const move = new Move(this.player, computerMove.row, computerMove.col);

        const newGame = new Game(
            game.gameType,
            game.gameId,
            game.player1,
            game.player2,
            [...game.moves, move],
            game.lastUpdated,
            game.moveTime,
            game.winner
        )
        return { updatedGame: newGame, newMove: move }
    }

    private async iterativeDeepening(
        gameBoard: number[][] 
    ): Promise<[ComputerMove | null, number]> {
        const startTime = Date.now();
        let bestMove: [ComputerMove | null, number] = [null, 0];
        const maxDepth = 64 - gameBoard.flat().filter(cell => cell === 1 || cell === 2).length;
        for (let depth = 1; depth <= maxDepth; depth++) {
            if (this.maxRuntime - (Date.now() - startTime) < 0) {
                break;
            }
            bestMove = await this.alphabeta(gameBoard, depth);
        }
        return bestMove;
    }

    private async alphabeta(
        gameBoard: number[][],
        depth: number,
        alpha = -Infinity,
        beta = Infinity,
        computerTurn = true
    ): Promise<[ComputerMove | null, number]> {
        let availableMoves = this.getValidMoves(gameBoard);
    
        if (depth === 0 || availableMoves.length === 0 || checkWinner(gameBoard)) {
            return [null, this.scorePosition(gameBoard)];
        }
    
        let bestScore = computerTurn ? -Infinity : Infinity;
        let bestMove: ComputerMove | null = null;
    
        let scoredMoves: { move: ComputerMove; score: number }[] = [];
        for (const move of availableMoves) {
            const newBoard = this.applyMove(gameBoard, move, computerTurn ? this.computerNumber : this.opponentNumber);
            const score = this.scorePosition(newBoard);
            scoredMoves.push({ move, score });
        }
    
        scoredMoves.sort((a, b) => (computerTurn ? b.score - a.score : a.score - b.score));
        availableMoves = scoredMoves.map(item => item.move);
    
        for (const move of availableMoves) {
            const newBoard = this.applyMove(gameBoard, move, computerTurn ? this.computerNumber : this.opponentNumber);    
            const [_, score] = await this.alphabeta(newBoard, depth - 1, alpha, beta, !computerTurn);
    
            if (computerTurn) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, bestScore);
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                beta = Math.min(beta, bestScore);
            }
    
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
                if (cell === 0) {
                    totalScore += scoreGroupOfFive(gameBoard, rowIndex, colIndex, playerNumber, availableMoves)
                } else {
                    const multiplier = cell === playerNumber ? 1 : -1;
                    totalScore += prioritizeCenter(rowIndex, colIndex) * multiplier;
                    totalScore += scoreGroupOfFour(gameBoard, rowIndex, colIndex, cell, availableMoves) * multiplier;
                }
            }
        }

        return totalScore;
    }

    //From Swift version
    private winScore: number = 9999999999;
    private playableWinScore: number = this.winScore * 99999 //TODO: Figure out how to add this in

    private chooseRandomMove(gameBoard: number[][]): ComputerMove | null {
        const availableMoves: ComputerMove[] = this.getValidMoves(gameBoard);
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }
    
    private chooseBetterBestMove(board: number[][]): ComputerMove {
        let bestMove: ComputerMove = {row: 0, col: 0};
        let bestValue: number = Number.MIN_SAFE_INTEGER;
        const availableMoves: ComputerMove[] = this.getValidMoves(board);
        for (let moveIdx = 0; moveIdx < availableMoves.length; moveIdx++) {
            const move = availableMoves[moveIdx];
            let tempBoard = this.applyMove(board, move, this.computerNumber);
            let score = this.scorePosition(tempBoard);
            if (score > bestValue) {
                bestMove = move;
                bestValue = score;
            } else if (score === bestValue && Math.random() * 100 < 12) {
                bestMove = move;
            }
        }
        const blockFour: ComputerMove | null = this.blockFourRow(board);
        if (blockFour && Math.random() * 100 < 90 && bestValue < this.winScore / 10) {
            bestMove = blockFour;
        }
        return bestMove;
    }
    
    private blockFourRow(board: number[][]): ComputerMove | null {
        let blockFour: ComputerMove | null = null;
        const availableMoves = this.getValidMoves(board);
        for (let r = 0; r <= 7; r++) {
            const rowArray: number[] = board[r];
            for (let c = 0; c <= 4; c++) {
                const window = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3]];
                const howMany = window.filter(x => x === this.opponentNumber).length;
                const howManyEmpty = window.filter(x => x === 0).length;
                if (howMany === 3 && howManyEmpty === 1) {
                    for (let i = 0; i < 4; i++) {
                        const blockMove = {row: r, col: c};
                        if (rowArray[c + i] === 0 && availableMoves.includes(blockMove)) {
                            blockFour = blockMove;
                        }
                    }
                }
            }
        }
        return blockFour;
    }
    
    private evaluateWindow(window: number[]): number {
        const howMany = window.filter(x => x === this.computerNumber).length;
        const howManyOpp = window.filter(x => x === this.opponentNumber).length;

        if (howMany > 0 && howManyOpp > 0) {
            return 0;
        }
        else if (howMany === 4) {
            return this.winScore;
        } 
        else if (howMany === 3) {
            return 25;
        } 
        else if (howMany === 2) {
            return 1;
        }

        else if (howManyOpp === 4) {
            return -2 * this.winScore;
        } else if (howManyOpp === 3) {
            return -52;
        } else if (howManyOpp === 2) {
            return -2;
        }

        return 0;
    }

    private evaluateWindow5(window5: number[]): number {
        const howMany = window5.filter(piece => piece === this.computerNumber).length;
        const howManyOpp = window5.filter(piece => piece === this.opponentNumber).length;
    
        if (howMany > 0 && howManyOpp > 0) {
            return 0;
        }
        else if (howMany === 4) {
            return 40;
        } else if (howMany === 3) {
            return 40;
        } else if (howMany === 2) {
            return 11;
        } else if (howMany === 1) {
            return 4;
        }
    
        else if (howManyOpp === 4) {
            return -200;
        } else if (howManyOpp === 3) {
            return -200;
        } else if (howManyOpp === 2) {
            return -15;
        } else if (howManyOpp === 1) {
            return -6;
        }
    
        return 0;
    }
    
    private scorePosition(board: number[][]): number {
        let score = 0;

        for (let i = 0; i <= 7; i++) {
            const rowArray = board[i]
            const colArray = board.map(row => row[i]);
            for (let j = 0; j <= 4; j++) {
                const horizontalWindow = [rowArray[j], rowArray[j + 1], rowArray[j + 2], rowArray[j + 3]];
                const verticalWindow = [colArray[j], colArray[j + 1], colArray[j + 2], colArray[j + 3]];
                score += this.evaluateWindow(horizontalWindow);
                score += this.evaluateWindow(verticalWindow);
                if (j < 4) {
                    horizontalWindow.push(rowArray[j + 4]);
                    verticalWindow.push(colArray[j + 4]);
                    score += this.evaluateWindow5(horizontalWindow);
                    score += this.evaluateWindow5(verticalWindow);
                }
            }
        }

        for (let r = 0; r <= 4; r++) {
            for (let c = 0; c <= 4; c++) {
                const positiveDiagonalWindow = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
                let negativeDiagonalWindow = [board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]];
                score += this.evaluateWindow(positiveDiagonalWindow);
                score += this.evaluateWindow(negativeDiagonalWindow);
                if (c < 4 && r < 4) {
                    positiveDiagonalWindow.push(board[r + 4][c + 4]);
                    negativeDiagonalWindow = [board[r + 4][c], board[r + 3][c + 1], board[r + 2][c + 2], board[r + 1][c + 3], board[r][c + 4]];
                    score += this.evaluateWindow5(positiveDiagonalWindow);
                    score += this.evaluateWindow5(negativeDiagonalWindow);
                }
            }
        }
    
        // Score centers
        for (let r = 0; r <= 7; r++) {
            for (let c = 0; c <= 7; c++) {
                if (board[r][c] === this.computerNumber) {
                    const subValue = Math.abs(r - 3) + Math.abs(c - 3);
                    score += 8 - subValue;
                }
                if (board[r][c] === this.opponentNumber) {
                    const subValue = Math.abs(r - 3) + Math.abs(c - 3);
                    score -= 8 - subValue;
                }
            }
        }

        // Score open options
        for (let r = 1; r < 7; r++) {
            for (let c = 1; c < 7; c++) {
                if (board[r][c] === this.computerNumber || board[r][c] === this.opponentNumber) {
                    const delta = board[r][c] === this.computerNumber ? 3 : -3;
                    const deltaZero = board[r][c] === this.computerNumber ? 1 : -1;
                    const directions = [
                        [1, 0], [-1, 0], [0, 1], [0, -1],
                        [1, 1], [-1, 1], [1, -1], [-1, -1]
                    ];
                    for (const [dr, dc] of directions) {
                        if (board[r + dr][c + dc] === board[r][c]) {
                            score += delta;
                        }
                        if (board[r + dr][c + dc] === 0) {
                            score += deltaZero;
                        }
                    }
                }
            }
        }
    
        return score;
    }
    
}
