import { Player } from './Player';
import { Move } from './Move';
import { GameType } from './GameType';

export class Game {
    gameType: GameType;
    player1: Player;
    player2: Player;
    moves: Move[];
    lastUpdated: Date | null;
    moveTime: number | null;
    winner: string | null;

    constructor(
        gameType: GameType, 
        player1: Player, 
        player2: Player, 
        moves: Move[] = [], 
        lastUpdated: Date | null = null,
        moveTime: number | null = null,
        winner: string | null = null
    ) {
        this.gameType = gameType;
        this.player1 = player1;
        this.player2 = player2;
        this.moves = moves;
        this.lastUpdated = lastUpdated;
        this.moveTime = moveTime;
        this.winner = winner;
    }

    static fromParams(params: any): Game {
        const { gameType, player1, player2, moves, lastUpdated, moveTime, winner } = params;
        const reconstructedPlayer1 = new Player(player1.username, player1.computerLevel);
        const reconstructedPlayer2 = new Player(player2.username, player2.computerLevel);
        const reconstructedMoves = moves ? moves.map((m: any) => new Move(m.player, m.row, m.column)) : [];
        const game = new Game(
            gameType, 
            reconstructedPlayer1, 
            reconstructedPlayer2, 
            reconstructedMoves, 
            lastUpdated,
            moveTime,
            winner
        );
        return game;
    }

    addMove(player: Player, row: number, col: number) {
        const move = new Move(player, row, col);
        this.moves.push(move)
    }

    playerTurn() {
        if (this.moves.length % 2 === 0) {
            return this.player1
        } else {
            return this.player2
        }
    }

    isComputerTurn() {
        if (this.playerTurn().computerLevel !== null) {
            return true;
        } else {
            return false;
        }
    }

    computerPlayer() {
        if (this.player1.computerLevel !== null) {
            return this.player1;
        }
        else if (this.player2.computerLevel !== null) {
            return this.player2;
        }
        else {
            return null;
        }
    }

    initializeGameArray() {
        const matrix: number[][] = [];
        for (let i = 0; i < 8; i++) {
            matrix[i] = new Array(8).fill(0);
        }
        for (const move of this.moves) {
            if (move.player === this.player1) {
                matrix[move.row][move.column] = 1
            } else {
                matrix[move.row][move.column] = 2
            }
        }
        return matrix;
    }
  }