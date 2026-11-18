// Finds puzzle positions: plays seeded, semi-random games and looks for positions where the side to move has a proven
// forced win in 1, 2 or 3 of its own moves. Plain Node, no imports beyond the sibling files.
const { newBoard, other, validMoves, winsAt, immediateWins, boardFromMoves, key } = require('../../features/puzzles/engine/rules');
const { winDepth, winningFirstMoves } = require('../../features/puzzles/engine/solver');

/** A small, fast, seedable random generator (mulberry32): the same seed always gives the same numbers. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NEIGHBOURS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

/** How many of the cell's eight neighbours hold one of `player`'s pieces. */
function friendly(board, r, c, player) {
  let n = 0;
  for (const [dr, dc] of NEIGHBOURS) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && board[rr][cc] === player) n++;
  }
  return n;
}

/**
 * One move for `player` in a practice game: take a win, block the other side's win, otherwise prefer squares next to
 * its own pieces (so lines form) with some randomness. The point is interesting positions, not strong play.
 */
function playoutMove(board, player, random) {
  const moves = validMoves(board);
  if (moves.length === 0) return null;
  const wins = moves.filter(([r, c]) => winsAt(board, r, c, player));
  if (wins.length) return wins[Math.floor(random() * wins.length)];
  const blocks = moves.filter(([r, c]) => winsAt(board, r, c, other(player)));
  if (blocks.length) return blocks[Math.floor(random() * blocks.length)];
  const weights = moves.map(([r, c]) => 1 + 3 * friendly(board, r, c, player));
  let pick = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < moves.length; i++) {
    pick -= weights[i];
    if (pick <= 0) return moves[i];
  }
  return moves[moves.length - 1];
}

/** A practice game cut off at `plies` moves, or null if it ended (someone won or the board filled) first. */
function samplePosition(plies, random) {
  const board = newBoard();
  const moves = [];
  for (let i = 0; i < plies; i++) {
    const player = i % 2 === 0 ? 1 : 2;
    const move = playoutMove(board, player, random);
    if (!move) return null;
    if (winsAt(board, move[0], move[1], player)) return null; // the game is over; not a puzzle
    board[move[0]][move[1]] = player;
    moves.push(move);
  }
  return { board, moves };
}

/**
 * Turns a sampled position into a puzzle if it qualifies. The side to move must not already be able to win in one
 * (so the puzzle needs thought), must win by force within 2 or 3 moves, and must have exactly one winning first move
 * (so there is one answer to find). Depth 1 puzzles are the easy ones: exactly one winning square.
 */
function toPuzzle(position, maxDepth) {
  const player = position.moves.length % 2 === 0 ? 1 : 2;
  const depth = winDepth(position.board, player, maxDepth);
  if (depth === null) return null;
  const first = winningFirstMoves(position.board, player, depth);
  if (first.length !== 1) return null;
  // Not a puzzle if the other side is about to win and the "solution" is just to block: those are defence problems.
  if (depth > 1 && immediateWins(position.board, other(player)).length > 0) return null;
  return { depth, toMove: player, moves: position.moves, answer: first[0] };
}

/**
 * Keeps sampling until it has `perDepth[d]` puzzles of each depth d, or `maxSamples` positions have been tried.
 * Positions already seen (same board) are skipped. Deterministic for a given seed.
 */
function generate({ seed, perDepth, maxSamples, maxDepth = 3, pliesRange = [5, 22], onProgress = () => {} }) {
  const random = rng(seed);
  const seen = new Set();
  const found = { 1: [], 2: [], 3: [] };
  const want = (d) => (perDepth[d] || 0) > found[d].length;
  let tried = 0;
  while (tried < maxSamples && [1, 2, 3].some(want)) {
    tried++;
    const plies = pliesRange[0] + Math.floor(random() * (pliesRange[1] - pliesRange[0] + 1));
    const position = samplePosition(plies, random);
    if (!position) continue;
    const id = key(position.board) + position.moves.length % 2;
    if (seen.has(id)) continue;
    seen.add(id);
    // Cheap first: only search as deep as a depth we still want.
    const deepest = [1, 2, 3].filter((d) => want(d) && d <= maxDepth).pop();
    if (!deepest) break;
    const puzzle = toPuzzle(position, deepest);
    if (puzzle && want(puzzle.depth)) {
      found[puzzle.depth].push(puzzle);
      onProgress(tried, found);
    }
  }
  return { found, tried };
}

/**
 * Checks a stored puzzle from scratch: the moves are legal and nobody has won, the side to move is the one recorded,
 * its shortest forced win is exactly the recorded depth, and the recorded answer is the only first move that forces
 * it. Returns a list of problems (empty when the puzzle is sound).
 */
function verifyPuzzle(puzzle) {
  const problems = [];
  let board;
  try {
    board = boardFromMoves(puzzle.moves);
  } catch (e) {
    return [e.message];
  }
  puzzle.moves.forEach(([r, c], i) => {
    const player = i % 2 === 0 ? 1 : 2;
    board[r][c] = 0;
    if (winsAt(board, r, c, player)) problems.push(`move ${i + 1} already wins`);
    board[r][c] = player;
  });
  const toMove = puzzle.moves.length % 2 === 0 ? 1 : 2;
  if (puzzle.toMove !== toMove) problems.push(`toMove is ${puzzle.toMove}, expected ${toMove}`);
  const depth = winDepth(board, toMove, 3);
  if (depth !== puzzle.depth) problems.push(`depth is ${depth}, recorded ${puzzle.depth}`);
  if (depth !== null) {
    const first = winningFirstMoves(board, toMove, depth);
    if (first.length !== 1) problems.push(`${first.length} winning first moves`);
    else if (first[0][0] !== puzzle.answer[0] || first[0][1] !== puzzle.answer[1]) problems.push('recorded answer is not the winning move');
    if (depth > 1 && immediateWins(board, other(toMove)).length > 0) problems.push('the other side can win at once');
  }
  return problems;
}

module.exports = { rng, samplePosition, toPuzzle, generate, verifyPuzzle, boardFromMoves };
