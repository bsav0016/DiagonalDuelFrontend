// The game rules for the puzzle tools, as plain Node code with no imports so the generator runs with just `node`.
// A test (__tests__/puzzles/rules.test.ts) checks these against the app's own validateMove and checkWinner on random
// games, so the two cannot drift apart.
//
// A board is 8 arrays of 8 numbers: 0 empty, 1 the first player (red), 2 the second player (yellow). Cells are [row,
// column]. The first player moves first.

const SIZE = 8;
const AXES = [[0, 1], [1, 0], [1, 1], [1, -1]];

const newBoard = () => Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
const other = (player) => (player === 1 ? 2 : 1);

/** A square is playable when it is empty and in the first row or column, or touches a piece above, left or up-left. */
function validMove(board, r, c) {
  if (board[r][c] !== 0) return false;
  if (r === 0 || c === 0) return true;
  return board[r - 1][c - 1] !== 0 || board[r - 1][c] !== 0 || board[r][c - 1] !== 0;
}

function validMoves(board) {
  const out = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) if (validMove(board, r, c)) out.push([r, c]);
  }
  return out;
}

/** Whether `player` placing a piece at (r, c) would make four in a row through that square. */
function winsAt(board, r, c, player) {
  for (const [dr, dc] of AXES) {
    let count = 1;
    for (let k = 1; k < 4; k++) {
      const rr = r + dr * k;
      const cc = c + dc * k;
      if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE || board[rr][cc] !== player) break;
      count++;
    }
    for (let k = 1; k < 4; k++) {
      const rr = r - dr * k;
      const cc = c - dc * k;
      if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE || board[rr][cc] !== player) break;
      count++;
    }
    if (count >= 4) return true;
  }
  return false;
}

/** Every playable square where `player` would win at once. */
function immediateWins(board, player) {
  return validMoves(board).filter(([r, c]) => winsAt(board, r, c, player));
}

/** Whether anyone already has four in a row. */
function hasWinner(board) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (p !== 0) {
        board[r][c] = 0; // winsAt counts the square itself, so lift it and ask whether putting it back wins
        const wins = winsAt(board, r, c, p);
        board[r][c] = p;
        if (wins) return true;
      }
    }
  }
  return false;
}

/** The board after playing a list of [row, column] moves, alternating from the first player. Throws on an illegal move. */
function boardFromMoves(moves) {
  const board = newBoard();
  moves.forEach(([r, c], i) => {
    if (!validMove(board, r, c)) throw new Error(`Illegal move ${i + 1}: [${r}, ${c}]`);
    board[r][c] = i % 2 === 0 ? 1 : 2;
  });
  return board;
}

const key = (board) => board.map((row) => row.join('')).join('/');

module.exports = { SIZE, newBoard, other, validMove, validMoves, winsAt, immediateWins, hasWinner, boardFromMoves, key };
