// Loads the real, unmodified js/app.js into a node:vm context with an inert DOM stub
// and returns the functions the tests need. Not a test file (no .test.mjs suffix).
import fs from 'node:fs';
import vm from 'node:vm';

const APP = new URL('../js/app.js', import.meta.url);

// Recursive stub: any property -> stub, any call -> stub. `then` is undefined so an
// `await` on it does not hang.
const stub = () => new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : stub()),
  set: () => true,
  apply: () => stub(),
  construct: () => stub(),
});

export function loadApp() {
  const ctx = vm.createContext({
    document: stub(),
    navigator: stub(),
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: () => 0,
  });
  new vm.Script(fs.readFileSync(APP, 'utf8'), { filename: 'js/app.js' }).runInContext(ctx);
  return vm.runInContext('({encodePuzzle, decodePuzzle, hasWrongEntries, generatePuzzle, B64URL})', ctx);
}
