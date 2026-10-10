// Loads a real, unmodified script from js/ into a node:vm context with an inert DOM stub
// and returns the top-level names the tests need. Not a test file (no .test.mjs suffix).
import fs from 'node:fs';
import vm from 'node:vm';

// Recursive stub: any property -> stub, any call -> stub. `then` is undefined so an
// `await` on it does not hang.
const stub = () => new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : stub()),
  set: () => true,
  apply: () => stub(),
  construct: () => stub(),
});

export function loadScript(file, names) {
  const ctx = vm.createContext({
    document: stub(),
    navigator: stub(),
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: () => 0,
    fetch: () => new Promise(() => {}), // never resolves: a page's boot does nothing
  });
  new vm.Script(fs.readFileSync(new URL('../js/' + file, import.meta.url), 'utf8'), { filename: 'js/' + file }).runInContext(ctx);
  return vm.runInContext('({' + names.join(', ') + '})', ctx);
}

export const loadApp = () => loadScript('app.js', ['encodePuzzle', 'decodePuzzle', 'hasWrongEntries', 'generatePuzzle', 'B64URL']);
