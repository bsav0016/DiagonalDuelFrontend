// An exact search for forced wins: can `player` (to move) force four in a row within `n` of their own moves, whatever
// the other side does? Exhaustive, not heuristic, so a puzzle it accepts is proven. Plain Node, no imports.
const { other, validMoves, winsAt, immediateWins, key } = require('./rules');

/**
 * `player` is to move and wins within `n` of their own moves, against every defence. `memo` caches results for one
 * search (the same position is reached by many move orders).
 */
function canWin(board, player, n, memo = new Map()) {
  if (n < 1) return false;
  const id = `${key(board)}|${player}|${n}`;
  const known = memo.get(id);
  if (known !== undefined) return known;
  let result = false;
  const moves = validMoves(board);
  if (moves.some(([r, c]) => winsAt(board, r, c, player))) {
    result = true; // a win right now is a win within n
  } else if (n > 1) {
    for (const [r, c] of moves) {
      board[r][c] = player;
      const works = defenceFails(board, player, n - 1, memo);
      board[r][c] = 0;
      if (works) { result = true; break; }
    }
  }
  memo.set(id, result);
  return result;
}

/**
 * `player` has just moved and the other side is to reply. True when every reply still leaves `player` a win within
 * `remaining` more moves of their own. A board with no reply left is a draw, which is not a win.
 */
function defenceFails(board, player, remaining, memo) {
  const opponent = other(player);
  const replies = validMoves(board);
  if (replies.length === 0) return false;
  // If the defender can win outright, the defence works.
  if (replies.some(([r, c]) => winsAt(board, r, c, opponent))) return false;

  // Squares where `player` would win at once. Two of them cannot both be blocked, and a reply never makes a square
  // playable that was not, so with two or more the win is forced.
  const threats = immediateWins(board, player);
  if (threats.length >= 2) return true;
  if (threats.length === 1) {
    // The only reply that does not lose at once is to occupy that square; every other reply loses to the win.
    const [tr, tc] = threats[0];
    board[tr][tc] = opponent;
    const holds = canWin(board, player, remaining, memo);
    board[tr][tc] = 0;
    return holds;
  }
  for (const [r, c] of replies) {
    board[r][c] = opponent;
    const holds = canWin(board, player, remaining, memo);
    board[r][c] = 0;
    if (!holds) return false;
  }
  return true;
}

/** The fewest own moves in which `player` can force a win, up to `maxDepth`, or null. */
function winDepth(board, player, maxDepth = 3) {
  const memo = new Map();
  for (let n = 1; n <= maxDepth; n++) if (canWin(board, player, n, memo)) return n;
  return null;
}

/** The first moves that force a win within `n`: each a cell that either wins now or leaves every reply losing. */
function winningFirstMoves(board, player, n) {
  const memo = new Map();
  const out = [];
  for (const [r, c] of validMoves(board)) {
    if (winsAt(board, r, c, player)) { out.push([r, c]); continue; }
    if (n < 2) continue;
    board[r][c] = player;
    const works = defenceFails(board, player, n - 1, memo);
    board[r][c] = 0;
    if (works) out.push([r, c]);
  }
  return out;
}

module.exports = { canWin, winDepth, winningFirstMoves };
