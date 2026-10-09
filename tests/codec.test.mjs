import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './load-app.mjs';

const { encodePuzzle, decodePuzzle, hasWrongEntries, generatePuzzle, B64URL } = loadApp();

const grid = s => s.split(' ').map(row => [...row].map(Number));
// Grids come from another realm: compare through JSON, not deepStrictEqual.
const same = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

const SOL_B = grid('135426 426351 651234 243615 314562 562143');
const GOLDEN = [
  {
    name: 'A (Easy puzzle the old encoder broke)',
    sol: grid('126534 354126 241365 635412 563241 412653'),
    puz: grid('106504 004106 241365 605410 500041 010653'),
    code: 'beZTi6xd_st',
  },
  { name: 'B (digit-5 grid, all clues)', sol: SOL_B, puz: SOL_B, code: 'PpjOG______' },
  { name: 'C (digit-5 grid, no clues)', sol: SOL_B, puz: grid('000000 000000 000000 000000 000000 000000'), code: 'PpjOGAAAAAA' },
];

test('golden codes pin the format', () => {
  for (const g of GOLDEN) {
    assert.equal(encodePuzzle(g.sol, g.puz), g.code, g.name);
    const dec = decodePuzzle(g.code);
    same(dec.solution, g.sol);
    same(dec.puzzle, g.puz);
  }
});

test('round-trip over the generator', () => {
  const alphabet = new Set(B64URL);
  for (const [mode, n] of [['easy', 200], ['medium', 200], ['hard', 200], ['max', 20]]) {
    for (let i = 0; i < n; i++) {
      const { solution, puzzle } = generatePuzzle(mode);
      const code = encodePuzzle(solution, puzzle);
      assert.equal(code.length, 11);
      assert.ok([...code].every(ch => alphabet.has(ch)), code);
      const dec = decodePuzzle(code);
      assert.ok(dec, `${mode}: ${code} did not decode`);
      same(dec.solution, solution);
      same(dec.puzzle, puzzle);
    }
  }
});

test('progress round-trip (clues + correct entries)', () => {
  for (let i = 0; i < 100; i++) {
    const { solution, puzzle } = generatePuzzle('easy');
    const state = puzzle.map(r => [...r]);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      if (!state[r][c] && Math.random() < 0.5) state[r][c] = solution[r][c];
    }
    const dec = decodePuzzle(encodePuzzle(solution, state));
    same(dec.solution, solution);
    same(dec.puzzle, state);
  }
});

test('decoder is total', () => {
  for (const bad of ['', 'beZTi6xd_s', 'beZTi6xd_stA', 42, null, undefined, {}, 'beZTi6xd_s.', '9Pt4v-w$zuk']) {
    assert.equal(decodePuzzle(bad), null, String(bad));
  }
  const valid = g => {
    for (let i = 0; i < 6; i++) {
      const row = new Set(g[i]), col = new Set(g.map(r => r[i]));
      const r0 = Math.floor(i / 2) * 2, c0 = (i % 2) * 3, box = new Set();
      for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 3; dc++) box.add(g[r0 + dr][c0 + dc]);
      for (const s of [row, col, box]) if (s.size !== 6 || ![1, 2, 3, 4, 5, 6].every(v => s.has(v))) return false;
    }
    return true;
  };
  for (let i = 0; i < 20000; i++) {
    let code = '';
    for (let k = 0; k < 11; k++) code += B64URL[Math.floor(Math.random() * 64)];
    const dec = decodePuzzle(code);
    if (!dec) continue;
    assert.ok(valid(dec.solution), code);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      assert.ok(dec.puzzle[r][c] === 0 || dec.puzzle[r][c] === dec.solution[r][c], code);
    }
  }
});

test('hasWrongEntries', () => {
  const { solution, puzzle } = generatePuzzle('easy');
  assert.equal(hasWrongEntries(puzzle, solution), false);
  const state = puzzle.map(r => [...r]);
  const [r, c] = (() => { for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (!state[r][c]) return [r, c]; })();
  state[r][c] = solution[r][c];
  assert.equal(hasWrongEntries(state, solution), false);
  state[r][c] = (solution[r][c] % 6) + 1;
  assert.equal(hasWrongEntries(state, solution), true);
});
