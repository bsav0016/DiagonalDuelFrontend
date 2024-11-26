import { Player } from './Player';
import { Move } from './Move';
import { GameType } from './GameType';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { parseCustomDuration } from '@/lib/TimeFormatUtil';

export class Game {
    gameType: GameType;
    gameId: number | null;
    player1: Player;
    player2: Player;
    moves: Move[];
    lastUpdated: Date | null;
    moveTime: number | null;
    winner: string | null;

    constructor(
        gameType: GameType, 
        gameId: number | null,
        player1: Player, 
        player2: Player, 
        moves: Move[] = [], 
        lastUpdated: Date | null = null,
        moveTime: number | null = null,
        winner: string | null = null,
    ) {
        this.gameType = gameType;
        this.gameId = gameId;
        this.player1 = player1;
        this.player2 = player2;
        this.moves = moves;
        this.lastUpdated = lastUpdated;
        this.moveTime = moveTime;
        this.winner = winner;
    }

    static fromParams(params: any): Game {
        const { gameType, gameId, player1, player2, moves, lastUpdated, moveTime, winner } = params;
        const reconstructedPlayer1 = new Player(player1.username, player1.computerLevel);
        const reconstructedPlayer2 = new Player(player2.username, player2.computerLevel);
        const reconstructedMoves = moves ? moves.map((m: any) => new Move(m.player, m.row, m.column)) : [];
        const game = new Game(
            gameType, 
            gameId,
            reconstructedPlayer1, 
            reconstructedPlayer2, 
            reconstructedMoves, 
            lastUpdated,
            moveTime,
            winner
        );
        return game;
    }

    static fromData(data: any): Game {
        if (!data.id || !data.player1 || !data.player2 || !data.moves || !data.updated_at || !data.time_limit) {
            throw new NetworkError("Game doesn't have all parameters");
        }
        const player1 = new Player(data.player1)
        const player2 = new Player(data.player2)
        let moves: Move[] = []
        for (const move of data.moves) {
            if (!move.player || !move.player.username) {
                throw new NetworkError("Can't get move username")
            } 
            else if (move.row === null || move.column === null) {
                throw new NetworkError("Can't get move row and column")
            }
            const movePlayer: Player = new Player(move.player.username);
            const gameMove: Move = new Move(movePlayer, move.row, move.column);
            moves.push(gameMove);
        }
        const lastUpdated: Date = new Date(data.updated_at)
        const moveTime: number = parseCustomDuration(data.time_limit)
        let winner: string | null;
        if (data.winner) {
            winner = data.winner
        } else {
            winner = null;
        }
        const game = new Game(
            GameType.Online,
            data.id,
            player1,
            player2,
            moves,
            lastUpdated,
            moveTime,
            winner
        )
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

    turnUsername() {
        return this.playerTurn().username
    }

    initializeGameArray() {
        const matrix: number[][] = [];
        for (let i = 0; i < 8; i++) {
            matrix[i] = new Array(8).fill(0);
        }
        for (const move of this.moves) {
            if (move.player.username === this.player1.username) {
                matrix[move.row][move.column] = 1
            } else {
                matrix[move.row][move.column] = 2
            }
        }
        return matrix;
    }
  }