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

    constructor(computerLevel: number, gameBoard: number[][], player: Player, computerNumber: number, maxRuntime = 500) {
        this.computerLevel = computerLevel;
        this.gameBoard = gameBoard;
        this.player = player
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
            //return [null, this.scoreBoard(gameBoard, computerNumber, availableMoves)];
            return [null, this.scorePosition(gameBoard)];
        }

        let bestScore = computerTurn ? -Infinity : Infinity;
        let bestMove: ComputerMove | null = null;

        let availableScores: { move: ComputerMove; score: number }[] = [];
        for (const move of availableMoves) {
            const newGame = this.applyMove(gameBoard, move, computerTurn ? this.computerNumber : this.opponentNumber);
            const newAvailableMoves = this.getValidMoves(newGame);
            //const score = this.scoreBoard(newGame, computerNumber, newAvailableMoves);
            const score = this.scorePosition(newGame);
            availableScores.push({ move, score });
        }
        availableScores.sort((a, b) => (computerTurn ? b.score - a.score : a.score - b.score));
        availableMoves = availableScores.map(item => item.move);

        for (const move of availableMoves) {
            const newBoard = this.applyMove(gameBoard, move, computerTurn ? this.computerNumber : this.opponentNumber);
            const [_, score] = await this.alphabeta(newBoard, depth - 1, alpha, beta, !computerTurn);
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
        let bestValue: number = -9999999;
        const availableMoves: ComputerMove[] = this.getValidMoves(board);
        let score = Number.MIN_SAFE_INTEGER;
        for (let move = 0; move < availableMoves.length; move++) {
            const row: number = availableMoves[move].row;
            const col: number = availableMoves[move].col;
            let tempBoard = [...board];
            tempBoard[row][col] = this.computerNumber;
            score = this.scoreBetterPosition(tempBoard);
            if (score > bestValue) {
                bestMove = availableMoves[move];
                bestValue = score;
            } else if (score === bestValue && Math.random() * 100 < 12) {
                bestMove = availableMoves[move];
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
        let score = 0;
        const howMany = window.filter(x => x === this.computerNumber).length;
        const howManyOpp = window.filter(x => x === this.opponentNumber).length;
        const howManyEmpty = window.filter(x => x === 0).length;
        if (howMany === 4) {
            score += this.winScore;
        } else if (howMany === 3 && howManyEmpty === 1) {
            score += 25;
        } else if (howMany === 2 && howManyEmpty === 2) {
            score += 1;
        }
        if (howManyOpp === 4) {
            score -= 2 * this.winScore;
        } else if (howManyOpp === 3 && howManyEmpty === 1) {
            score -= 52;
        } else if (howManyOpp === 2 && howManyEmpty === 2) {
            score -= 2;
        }
        return score;
    }

    private evaluateWindow5(window5: number[]): number {
        let score = 0;
        const howMany = window5.filter(piece => piece === this.computerNumber).length;
        const howManyOpp = window5.filter(piece => piece === this.opponentNumber).length;
        const howManyEmpty = window5.filter(piece => piece === 0).length;
    
        if (howMany === 3 && howManyEmpty === 2) {
            score += 40;
        } else if (howMany === 2 && howManyEmpty === 3) {
            score += 11;
        } else if (howMany === 1 && howManyEmpty === 4) {
            score += 4;
        }
    
        if (howManyOpp === 3 && howManyEmpty === 2) {
            score -= 200;
        } else if (howManyOpp === 2 && howManyEmpty === 3) {
            score -= 15;
        } else if (howManyOpp === 4 && howManyEmpty === 1) {
            score -= 200;
        } else if (howManyOpp === 1 && howManyEmpty === 4) {
            score -= 6;
        }
    
        return score;
    }
    
    private evaluateWindow5Enhanced(window5: number[]): number {
        let score = 0;
    
        if (
            window5[1] === this.computerNumber && 
            window5[2] === this.computerNumber && 
            window5[3] === this.computerNumber
        ) {
            score += 300;
        } else if (
            window5[1] === this.opponentNumber && 
            window5[2] === this.opponentNumber && 
            window5[3] === this.opponentNumber
        ) {
            score -= 550;
        }
    
        return score;
    }
    
    private scorePosition(board: number[][]): number {
        let score = 0;
    
        // Score horizontal
        for (let r = 0; r <= 7; r++) {
            const rowArray = board[r];
            for (let c = 0; c <= 4; c++) {
                const window = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3]];
                score += this.evaluateWindow(window);
            }
            for (let c = 0; c <= 3; c++) {
                const window5 = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3], rowArray[c + 4]];
                score += this.evaluateWindow5(window5);
            }
        }
    
        // Score vertical
        for (let c = 0; c <= 7; c++) {
            const colArray = this.getColumn(board, c);
            for (let r = 0; r <= 4; r++) {
                const window = [colArray[r], colArray[r + 1], colArray[r + 2], colArray[r + 3]];
                score += this.evaluateWindow(window);
            }
            for (let r = 0; r <= 3; r++) {
                const window5 = [colArray[r], colArray[r + 1], colArray[r + 2], colArray[r + 3], colArray[r + 4]];
                score += this.evaluateWindow5(window5);
            }
        }
    
        // Score positive sloped diagonal
        for (let r = 0; r <= 4; r++) {
            for (let c = 0; c <= 4; c++) {
                const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
                score += this.evaluateWindow(window);
            }
        }
        for (let r = 0; r <= 3; r++) {
            for (let c = 0; c <= 3; c++) {
                const window5 = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3], board[r + 4][c + 4]];
                score += this.evaluateWindow5(window5);
            }
        }
    
        // Score negative sloped diagonal
        for (let r = 0; r <= 4; r++) {
            for (let c = 0; c <= 4; c++) {
                const window = [board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]];
                score += this.evaluateWindow(window);
            }
        }
        for (let r = 0; r <= 3; r++) {
            for (let c = 0; c <= 3; c++) {
                const window5 = [board[r + 4][c], board[r + 3][c + 1], board[r + 2][c + 2], board[r + 1][c + 3], board[r][c + 4]];
                score += this.evaluateWindow5(window5);
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
    
        return score;
    }
    
    // Helper function to extract a column from a 2D array
    private getColumn(board: number[][], colIndex: number): number[] {
        return board.map(row => row[colIndex]);
    }

    private scoreBetterPosition(board: number[][]): number {
        let score: number = 0;
    
        // Score horizontal
        for (let r = 0; r < 8; r++) {
            const rowArray: number[] = board[r];
            for (let c = 0; c < 5; c++) {
                const window: number[] = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3]];
                score += this.evaluateWindow(window);
            }
            for (let c = 0; c < 4; c++) {
                const window5: number[] = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3], rowArray[c + 4]];
                score += this.evaluateWindow5Enhanced(window5);
            }
        }
    
        // Score vertical
        for (let c = 0; c < 8; c++) {
            const colArray: number[] = board.map(row => row[c]);
            for (let r = 0; r < 5; r++) {
                const window: number[] = [colArray[r], colArray[r + 1], colArray[r + 2], colArray[r + 3]];
                score += this.evaluateWindow(window);
            }
            for (let r = 0; r < 4; r++) {
                const window5: number[] = [colArray[r], colArray[r + 1], colArray[r + 2], colArray[r + 3], colArray[r + 4]];
                score += this.evaluateWindow5Enhanced(window5);
            }
        }
    
        // Score positive sloped diagonal
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const window: number[] = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
                score += this.evaluateWindow(window);
            }
        }
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const window5: number[] = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3], board[r + 4][c + 4]];
                score += this.evaluateWindow5Enhanced(window5);
            }
        }
    
        // Score negative sloped diagonal
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const window: number[] = [board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]];
                score += this.evaluateWindow(window);
            }
        }
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const window5: number[] = [board[r + 4][c], board[r + 3][c + 1], board[r + 2][c + 2], board[r + 1][c + 3], board[r][c + 4]];
                score += this.evaluateWindow5Enhanced(window5);
            }
        }
    
        // Score centers
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === this.computerNumber) {
                    const subValue: number = Math.abs(r - 3.5) + Math.abs(c - 3.5);
                    score += 5 * (8 - Math.floor(subValue));
                }
                if (board[r][c] === this.opponentNumber) {
                    const subValue: number = Math.abs(r - 3.5) + Math.abs(c - 3.5);
                    score -= 5 * (8 - Math.floor(subValue));
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
