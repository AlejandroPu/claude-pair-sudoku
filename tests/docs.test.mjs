import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadScript } from './load-app.mjs';

const { RULES, buildPages, assemble, ruleMatches, render, resolveHash, releaseOf } =
  loadScript('docs.js', ['RULES', 'buildPages', 'assemble', 'ruleMatches', 'render', 'resolveHash', 'releaseOf']);

const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const { pages, owner } = buildPages(read('README.md'), read('DEVLOG.md'));
const count = (html, s) => html.split(s).length - 1;

test('the DEVLOG splits into the three parts', () => {
  const first = p => pages[p].blocks[0].text;
  assert.equal(first('readme'), 'Sudoku 6×6');
  assert.equal(first('part-1'), 'Sudoku 6×6'); // the DEVLOG title and intro, then Part I
  assert.ok(pages['part-1'].blocks.some(b => b.type === 'h' && /^Part I\b/.test(b.text)));
  assert.match(first('part-2'), /^Part II\b/);
  assert.match(first('part-3'), /^Part III\b/);
});

test('every RULES entry still matches something', () => {
  for (const r of RULES) {
    assert.ok(ruleMatches(r, pages[r.page].blocks), 'rule matched nothing: ' + r.page + ' ' + (r.section || r.match || 'lead'));
  }
});

test('colour counts per page', () => {
  const want = {
    readme: [3, 5, 1, 2, 0],
    'part-1': [2, 9, 2, 0, 1],
    'part-2': [4, 12, 2, 0, 0],
    'part-3': [2, 5, 2, 0, 0],
  };
  for (const [p, w] of Object.entries(want)) {
    const html = assemble(p, pages[p].blocks);
    const got = [count(html, 'class="blk amber"'), count(html, 'class="blk blue"'), count(html, 'class="inset"'),
      count(html, 'class="amber-head"'), count(html, 'class="blue-head"')];
    assert.deepEqual(got, w, p + ' [amber, blue, inset, amber-head, blue-head]');
  }
});

test('HTML in the Markdown is escaped', () => {
  const html = render('a <script>x</script> b', new Set()).map(b => b.html).join('');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;x&lt;/script&gt;'));
});

test('links resolve to the page that owns the heading', () => {
  const id = 'part-iii--encoding-audit-and-correction-v130';
  assert.equal(resolveHash('#' + id, owner).route, 'part-3');
  assert.equal(resolveHash('#part-2', owner).route, 'part-2');
  assert.equal(resolveHash('', owner).route, 'readme');
  const h = render('## Same\n\n## Same', new Set()).map(b => b.id);
  assert.equal(h.join(), 'same,same-1');
  const a = render('[x](DEVLOG.md#foo) [y](DEVLOG.md) [z](LICENSE)', new Set())[0].html;
  assert.match(a, /href="#foo"/);
  assert.match(a, /href="#part-1"/);
  assert.match(a, /href="https:\/\/github\.com\/[^"]+\/LICENSE"/);
});

test('the release label is read from the CHANGELOG', () => {
  assert.equal(releaseOf('# Changelog\n\n## [Unreleased]\n\n## [1.4.0] - 2026-10-10\n\n## [1.3.0] - x'), '1.4.0');
  assert.equal(releaseOf('nothing'), null);
});
