const { generate, verifyPuzzle } = require('../../scripts/puzzles/generate');
const bank = require('../../data/puzzles.json');

describe('the shipped puzzle bank', () => {
  it('starts on a Monday and follows the weekly difficulty pattern', () => {
    expect(new Date(`${bank.epoch}T00:00:00Z`).getUTCDay()).toBe(1);
    expect(bank.pattern).toEqual([1, 1, 2, 2, 2, 3, 3]);
    expect(bank.puzzles.length).toBeGreaterThanOrEqual(364);
    bank.puzzles.forEach((p: any, i: number) => {
      expect(p.id).toBe(i + 1);
      expect(p.depth).toBe(bank.pattern[i % bank.pattern.length]);
    });
  });

  it('holds only sound puzzles: legal moves, nobody has won, one proven winning first move, as recorded', () => {
    const problems: string[] = [];
    for (const p of bank.puzzles) {
      for (const problem of verifyPuzzle(p)) problems.push(`puzzle ${p.id}: ${problem}`);
    }
    expect(problems).toEqual([]);
  }, 120000);

  it('has no repeated position', () => {
    const seen = new Set(bank.puzzles.map((p: any) => JSON.stringify(p.moves)));
    expect(seen.size).toBe(bank.puzzles.length);
  });

  it('mixes red-to-move and yellow-to-move puzzles', () => {
    const red = bank.puzzles.filter((p: any) => p.toMove === 1).length;
    expect(red).toBeGreaterThan(bank.puzzles.length * 0.3);
    expect(red).toBeLessThan(bank.puzzles.length * 0.7);
  });
});

describe('the generator', () => {
  it('is deterministic: the same seed gives the same puzzles', () => {
    const options = { seed: 42, perDepth: { 1: 3, 2: 3, 3: 3 }, maxSamples: 100000 };
    expect(generate(options).found).toEqual(generate(options).found);
  });

  it('rejects a corrupted puzzle', () => {
    const p = bank.puzzles[3];
    expect(verifyPuzzle({ ...p, answer: [p.answer[0], (p.answer[1] + 1) % 8] })).not.toEqual([]);
    expect(verifyPuzzle({ ...p, depth: p.depth === 3 ? 2 : p.depth + 1 })).not.toEqual([]);
    expect(verifyPuzzle({ ...p, moves: [[5, 5], ...p.moves] })).not.toEqual([]); // an illegal first move
  });
});
