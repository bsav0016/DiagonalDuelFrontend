// Builds the shipped puzzle bank, data/puzzles.json, or checks the one that is there.
//
//   node scripts/puzzles/build-bank.js            write data/puzzles.json (same seed, same file)
//   node scripts/puzzles/build-bank.js --check    verify every puzzle in data/puzzles.json from scratch
//
// Day 0 is the epoch, a Monday. The bank follows a weekly pattern of difficulty: depth 1 on Monday and Tuesday (win in
// one move), depth 2 on Wednesday to Friday, depth 3 at the weekend. Puzzle i is for day i; the app wraps around when
// the bank runs out, and the bank can be made longer (more weeks) without changing the earlier days.
const fs = require('node:fs');
const path = require('node:path');
const { generate, verifyPuzzle } = require('./generate');

const OUT = path.join(__dirname, '..', '..', 'data', 'puzzles.json');
const SEED = 20261118;
const EPOCH = '2026-12-07'; // a Monday
const PATTERN = [1, 1, 2, 2, 2, 3, 3];
const WEEKS = 104; // two years

function build() {
  const perDepth = { 1: 0, 2: 0, 3: 0 };
  for (const d of PATTERN) perDepth[d] += WEEKS;
  const { found, tried } = generate({ seed: SEED, perDepth, maxSamples: 2000000 });
  for (const d of [1, 2, 3]) {
    if (found[d].length < perDepth[d]) throw new Error(`Only ${found[d].length} of ${perDepth[d]} depth-${d} puzzles found in ${tried} tries`);
  }
  const next = { 1: 0, 2: 0, 3: 0 };
  const puzzles = [];
  for (let i = 0; i < PATTERN.length * WEEKS; i++) {
    const depth = PATTERN[i % PATTERN.length];
    const p = found[depth][next[depth]++];
    puzzles.push({ id: i + 1, depth, toMove: p.toMove, moves: p.moves, answer: p.answer });
  }
  return { version: 1, epoch: EPOCH, seed: SEED, pattern: PATTERN, puzzles };
}

function write(bank) {
  const lines = bank.puzzles.map((p) => `    ${JSON.stringify(p)}`).join(',\n');
  const head = JSON.stringify({ version: bank.version, epoch: bank.epoch, seed: bank.seed, pattern: bank.pattern });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${head.slice(0, -1)},\n  "puzzles": [\n${lines}\n  ]\n}\n`);
}

function check() {
  const bank = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  let bad = 0;
  bank.puzzles.forEach((p, i) => {
    const problems = verifyPuzzle(p);
    if (problems.length || p.depth !== bank.pattern[i % bank.pattern.length]) {
      bad++;
      console.error(`puzzle ${p.id}: ${problems.join('; ') || 'depth does not match the weekly pattern'}`);
    }
  });
  console.log(`${bank.puzzles.length} puzzles checked, ${bad} problems`);
  process.exit(bad ? 1 : 0);
}

if (require.main === module) {
  if (process.argv.includes('--check')) check();
  else {
    const bank = build();
    write(bank);
    console.log(`Wrote ${bank.puzzles.length} puzzles to data/puzzles.json`);
  }
}

module.exports = { build, EPOCH, PATTERN };
