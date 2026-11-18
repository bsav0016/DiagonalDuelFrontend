import { checkWinner, validateMove } from '@/features/game/gameUtils';

const rules = require('../../features/puzzles/engine/rules');
const { canWin, winDepth, winningFirstMoves } = require('../../features/puzzles/engine/solver');
const { rng } = require('../../scripts/puzzles/generate');

const { newBoard, other, validMoves, winsAt, boardFromMoves } = rules;

/** A practice game of random legal moves, cut off when someone wins. */
function randomGame(random: () => number, maxMoves: number) {
  const board = newBoard();
  const moves: [number, number][] = [];
  for (let i = 0; i < maxMoves; i++) {
    const options = validMoves(board);
    if (options.length === 0) break;
    const [r, c] = options[Math.floor(random() * options.length)];
    const player = i % 2 === 0 ? 1 : 2;
    const wins = winsAt(board, r, c, player);
    board[r][c] = player;
    moves.push([r, c]);
    if (wins) break;
  }
  return { board, moves };
}

describe('the rules match the app', () => {
  it('agrees with validateMove on every square and with checkWinner after every move, over random games', () => {
    const random = rng(7);
    for (let g = 0; g < 200; g++) {
      const board = newBoard();
      const total = 4 + Math.floor(random() * 50);
      for (let i = 0; i < total; i++) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) expect(rules.validMove(board, r, c)).toBe(validateMove(board, r, c));
        }
        const options = validMoves(board);
        if (options.length === 0) break;
        const [r, c] = options[Math.floor(random() * options.length)];
        const player = i % 2 === 0 ? 1 : 2;
        board[r][c] = player;
        expect(rules.hasWinner(board)).toBe(checkWinner(board) !== null);
        if (checkWinner(board) !== null) break;
      }
    }
  });
});

/** The same question as canWin, asked the slow way: no shortcuts, every move and every reply. */
function canWinNaive(board: number[][], player: number, n: number): boolean {
  if (n < 1) return false;
  for (const [r, c] of validMoves(board)) {
    if (winsAt(board, r, c, player)) return true;
    if (n === 1) continue;
    board[r][c] = player;
    const replies: [number, number][] = validMoves(board);
    let all = replies.length > 0;
    for (const [rr, cc] of replies) {
      if (winsAt(board, rr, cc, other(player))) { all = false; break; }
      board[rr][cc] = other(player);
      const holds = canWinNaive(board, player, n - 1);
      board[rr][cc] = 0;
      if (!holds) { all = false; break; }
    }
    board[r][c] = 0;
    if (all) return true;
  }
  return false;
}

describe('the solver', () => {
  // Red holds two in the first row with room on both sides; yellow is out of the way.
  const openTwo = () => {
    const b = newBoard();
    b[0][2] = 1; b[0][3] = 1;
    b[5][0] = 2; b[6][0] = 2;
    return b;
  };

  it('finds a win in one, and no earlier win when there is none', () => {
    const b = newBoard();
    b[0][1] = 1; b[0][2] = 1; b[0][3] = 1;
    b[5][0] = 2; b[6][0] = 2; b[7][0] = 2;
    expect(canWin(b, 1, 1)).toBe(true);
    expect(winDepth(b, 1)).toBe(1);
    expect(winningFirstMoves(b, 1, 1)).toEqual([[0, 0], [0, 4]]);
    expect(canWin(openTwo(), 1, 1)).toBe(false);
  });

  it('finds a forced win in two from an open pair: both ways of making a double threat', () => {
    const b = openTwo();
    expect(winDepth(b, 1)).toBe(2);
    expect(winningFirstMoves(b, 1, 2).sort()).toEqual([[0, 1], [0, 4]].sort());
  });

  it('does not call a position won when the defender has an answer', () => {
    const b = openTwo();
    b[0][1] = 2; // yellow already blocks one side
    expect(canWin(b, 1, 2)).toBe(false);
  });

  it('does not call a position won when the defender can win first', () => {
    const b = openTwo();
    b[1][0] = 2; b[2][0] = 2; b[3][0] = 2; // yellow has three in the first column: (4,0) wins for yellow next
    b[4][0] = 0; b[5][0] = 0; b[6][0] = 0;
    expect(winDepth(b, 1, 3)).toBe(null);
  });

  it('gives the same answer as a brute-force search, over random positions', () => {
    const random = rng(99);
    let checked = 0;
    let wins = 0;
    for (let i = 0; i < 400; i++) {
      const { board, moves } = randomGame(random, 4 + Math.floor(random() * 12));
      const lastWon = moves.length > 0 && rules.hasWinner(board);
      if (lastWon) continue;
      const player = moves.length % 2 === 0 ? 1 : 2;
      for (const n of [1, 2]) {
        const fast = canWin(board, player, n);
        expect(fast).toBe(canWinNaive(board, player, n));
        if (fast) wins++;
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(400);
    expect(wins).toBeGreaterThan(0); // the comparison saw real wins, not only losses
  });

  it('agrees with brute force at depth three on a few sparse positions', () => {
    const random = rng(5);
    let compared = 0;
    for (let i = 0; compared < 3 && i < 200; i++) {
      const { board, moves } = randomGame(random, 5 + Math.floor(random() * 3));
      if (rules.hasWinner(board)) continue;
      const player = moves.length % 2 === 0 ? 1 : 2;
      expect(canWin(board, player, 3)).toBe(canWinNaive(board, player, 3));
      compared++;
    }
    expect(compared).toBe(3);
  }, 120000);

  it('replays moves into a board and refuses an illegal one', () => {
    const b = boardFromMoves([[0, 0], [0, 1]]);
    expect(b[0][0]).toBe(1);
    expect(b[0][1]).toBe(2);
    expect(() => boardFromMoves([[3, 3]])).toThrow('Illegal move 1');
  });
});
