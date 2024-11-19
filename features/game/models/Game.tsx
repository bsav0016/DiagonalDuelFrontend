import { Player } from './Player';
import { Move } from './Move';
import { GameType } from './GameType';

export class Game {
    gameType: GameType;
    player1: Player;
    player2: Player;
    moves: Move[];
    winner?: string | null;

    constructor(gameType: GameType, player1: Player, player2: Player, moves: Move[] = []) {
        this.gameType = gameType;
        this.player1 = player1;
        this.player2 = player2;
        this.moves = moves;
        this.winner = null;
    }

    static fromParams(params: any): Game {
        const { gameType, player1, player2, moves, winner } = params;
        const reconstructedPlayer1 = new Player(player1.username, player1.computerLevel);
        const reconstructedPlayer2 = new Player(player2.username, player2.computerLevel);
        const reconstructedMoves = moves ? moves.map((m: any) => new Move(m.player, m.row, m.column)) : [];
        const game = new Game(gameType, reconstructedPlayer1, reconstructedPlayer2, reconstructedMoves);
        game.winner = winner ?? null;
        return game;
    }
  
    addMove(player: Player, row: number, column: number) {
        const move: Move = new Move(player, row, column);
        this.moves.push(move);
    }
  
    determineWinner() {
        // Logic to determine winner goes here
        // For now, just setting a placeholder
        if (false) {
            this.winner = Math.random() > 0.5 ? this.player1.username : this.player2.username;
        }
        return this.winner
    }

    playerTurn() {
        if (this.moves.length % 2 === 0) {
            return this.player1
        } else {
            return this.player2
        }
    }

    isComputerTurn() {
        if (this.playerTurn().computerLevel) {
            return true;
        } else {
            return false;
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