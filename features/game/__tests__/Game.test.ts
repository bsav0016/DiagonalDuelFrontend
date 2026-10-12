import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { Game } from "../models/Game";
import { GameType } from "../models/GameType";
import { Player } from "../models/Player";
import { gameWithMoves } from "../testUtils";

describe("whose turn it is", () => {
    it("starts with player 1 and alternates", () => {
        const game = gameWithMoves([]);
        expect(game.turnUsername()).toBe("Player 1");

        game.moves.push({ player: game.player1, row: 0, column: 0 });
        expect(game.turnUsername()).toBe("Player 2");

        game.moves.push({ player: game.player2, row: 1, column: 0 });
        expect(game.turnUsername()).toBe("Player 1");
    });

    it("reports the player who is waiting", () => {
        const game = gameWithMoves([[0, 0]]);
        expect(game.playerTurn().username).toBe("Player 2");
        expect(game.playerWaiting().username).toBe("Player 1");
    });
});

describe("computer players", () => {
    const human = new Player("Player");

    it("treats level 0 as a computer, not as a human", () => {
        const beginner = new Player("Computer", 0, 0);
        const game = new Game(GameType.Computer, null, beginner, human);
        expect(game.isComputerTurn()).toBe(true);
        expect(game.computerPlayer()).toBe(beginner);
    });

    it("is only the computer's turn when the computer is to move", () => {
        const computer = new Player("Computer", 0, 30);
        const game = new Game(GameType.Computer, null, human, computer);
        expect(game.isComputerTurn()).toBe(false);

        game.moves.push({ player: human, row: 0, column: 0 });
        expect(game.isComputerTurn()).toBe(true);
        expect(game.computerPlayer()).toBe(computer);
    });

    it("has no computer player in a two-player game", () => {
        expect(gameWithMoves([]).computerPlayer()).toBeNull();
        expect(gameWithMoves([]).isComputerTurn()).toBe(false);
    });
});

describe("initializeGameArray", () => {
    it("is an empty 8x8 board with no moves", () => {
        const board = gameWithMoves([]).initializeGameArray();
        expect(board).toHaveLength(8);
        board.forEach(row => expect(row).toEqual(new Array(8).fill(0)));
    });

    it("places player 1 as 1 and player 2 as 2 at the right cells", () => {
        const board = gameWithMoves([[0, 0], [1, 0], [0, 3], [2, 4]]).initializeGameArray();
        expect(board[0][0]).toBe(1);
        expect(board[1][0]).toBe(2);
        expect(board[0][3]).toBe(1);
        expect(board[2][4]).toBe(2);
        expect(board.flat().filter(cell => cell !== 0)).toHaveLength(4);
    });

    it("works after the game has been serialised into route params and rebuilt", () => {
        const original = gameWithMoves([[0, 0], [1, 0], [0, 1]]);
        const params = JSON.parse(decodeURIComponent(encodeURIComponent(JSON.stringify(original))));
        const rebuilt = Game.fromParams(params);

        expect(rebuilt.initializeGameArray()).toEqual(original.initializeGameArray());
        expect(rebuilt.turnUsername()).toBe(original.turnUsername());
    });
});

describe("Game.fromData (server payload)", () => {
    const payload = () => ({
        id: 7,
        player1: "alice",
        player1_rating: 1016,
        player2: "bob",
        player2_rating: 984,
        winner: null,
        time_limit: "1 00:00:00",
        updated_at: "2026-01-02T03:04:05Z",
        moves: [
            { id: 1, player: { username: "alice" }, row: 0, column: 0 },
            { id: 2, player: { username: "bob" }, row: 1, column: 0 },
        ],
    });

    it("builds an online game with players, moves, time limit and no winner", () => {
        const game = Game.fromData(payload());

        expect(game.gameType).toBe(GameType.Online);
        expect(game.gameId).toBe(7);
        expect(game.player1.username).toBe("alice");
        expect(game.player2.rating).toBe(984);
        expect(game.moves).toHaveLength(2);
        expect(game.moveTime).toBe(24 * 60 * 60 * 1000);
        expect(game.winner).toBeNull();
        expect(game.turnUsername()).toBe("alice");
        expect(game.initializeGameArray()[1][0]).toBe(2);
    });

    it("keeps the winner text the server sends", () => {
        const game = Game.fromData({ ...payload(), winner: "alice wins!" });
        expect(game.winner).toBe("alice wins!");
    });

    it("accepts a game with no moves yet", () => {
        const game = Game.fromData({ ...payload(), moves: [] });
        expect(game.moves).toEqual([]);
        expect(game.turnUsername()).toBe("alice");
    });

    it.each(["id", "player1", "player2", "player1_rating", "player2_rating", "moves", "updated_at", "time_limit"])(
        "rejects a payload missing %s",
        field => {
            const data: any = payload();
            delete data[field];
            expect(() => Game.fromData(data)).toThrow(NetworkError);
        },
    );

    it("rejects a move without a player or without a cell", () => {
        const noPlayer = { ...payload(), moves: [{ id: 1, player: null, row: 0, column: 0 }] };
        const noCell = { ...payload(), moves: [{ id: 1, player: { username: "alice" }, row: null, column: 0 }] };
        expect(() => Game.fromData(noPlayer)).toThrow(NetworkError);
        expect(() => Game.fromData(noCell)).toThrow(NetworkError);
    });
});
