# claude-pair-sudoku — AI Agent Guide

This file is loaded at the start of every Claude Code session. It is the single
source of truth for how to work in this repo: workflow, architecture, conventions.
(`README.md` carries the product pitch and the story of the project.)

---

## Session-start checklist

Do these at the top of every session — in order, before writing any code:

1. 🔴 **Read `.private/WORKFLOW.md` — first.** The rules in force: single source of
   truth, what counts as evidence, how a handoff closes, who prunes and when. Short
   on purpose, and pruned rather than appended, so it stays cheap to read.
2. **Read `.private/baton.md`** — handoff notes from the previous session:
   current state, next step, and Jr.'s feedback.
3. **Read `.private/operations/owner-queue.md`** — what is waiting on the human.
   It does not live in the baton, and it must never be reconstructed from
   Jr.'s list at closing time.
4. **Read your lane file** at `.claude/lanes/<your-role>.md`, role ∈
   {`max`, `jr`} — **the user declares which role this terminal is** when starting
   it. If unsure, ask before picking up work. The lane file defines what you may and
   may not do this session; read it every time, not from memory.
5. **Run `git status`** — confirm branch state and any uncommitted work.

---

## What the project is

6×6 Sudoku game (2×3 boxes) in vanilla HTML/CSS/JS, no dependencies — an AI
pair-programming experiment started on 2026-03-20.

**Live:** https://alejandropu.github.io/claude-pair-sudoku/ ·
**Repo:** https://github.com/AlejandroPu/claude-pair-sudoku ·
**Current version and history:** `CHANGELOG.md` (Keep a Changelog + semver).

---

## Language conventions

- **Code and docs (including `.private/`)**: English — variable/function names,
  comments, commit messages, branch names, PR titles and bodies.
- **Chat with the user**: Spanish.
- **User-facing copy**: Spanish (`<html lang="es">`). There is no i18n layer — the
  copy lives inline in `index.html` and `js/app.js`.

---

## Multi-terminal workflow — the Colossus

Two terminals split by role: **Max** (planning / architecture / process design) and
**Jr.** (implementation / full PR lifecycle). **Only one is active at a time.** The
role is **declared by the user when starting the terminal**, never inferred from the
model. Hand off via `.private/baton.md` (gitignored). Each terminal reads its lane
file (`.claude/lanes/<role>.md`) at session start.

Why split by role: it keeps planning and implementation in separate context
windows so each stays focused. The cost is re-syncing file/git state on each
pickup — which is exactly what the baton encodes.

### Task levels

Max tags every handoff with **what the task is**, in three levels. **The human
picks the model and the effort from that** when they open the Jr. terminal.

| Level       | The task is                                                                                                                                                       | Typical                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `easy`      | **Transcription.** The spec says what to type; no judgement calls, no branching.                                                                                 | copy strings, deleting dead config, renames          |
| `normal`    | **Real implementation — normal _through difficult_.** Multiple files, logic, edge cases, judgement inside the spec's frame. **The everyday default.**             | features, refactors, generator/solver/encoder changes |
| `sensitive` | **It cannot be fixed forward.**                                                                                                                                   | destructive data work above all                      |

**The test, and it is the only thing that moves a task up to `sensitive`:**
_"if this goes wrong, can I fix it forward?"_ Yes → `normal`. No → `sensitive`.

🔴 **`sensitive` is irreversibility, not difficulty.** Intricate logic, many
branches, a wide blast radius, even auth and security surfaces are all
**specifiable**, and once specified they are transcription. **The difficulty is
carried by the spec, not the level** — the answer to a hard task is a better
spec. However hard it is, it is still `normal`.

**And the test for the bottom of the scale:** _"can the spec be verified without
leaving the spec?"_ Yes → `easy`. No → `normal`.

🔴 **A spec that hands over finished text is not automatically transcription.**
Written-out ≠ verifiable in place. **When correctness depends on something
outside the spec, it is `normal` however finished the text looks.**

⚠️ **When in doubt about difficulty, write more spec — do not go up a level.**
The go-up reflex applies only to irreversibility.

🔴 **The mapping from level to model and effort is deliberately NOT recorded
here.** It is the human's call when they open the terminal, and keeping it out is
what stops this section churning: a task's nature is stable, the right model for
it is not. (In the origin project this section was rewritten three times in nine
days, and every time it was the model mapping that moved, never the tasks.)

The baton carries the level in one field (`level:`) and the stop line echoes it, so
the human knows what they are opening a terminal for. **One task = one level, start
→ finish** — scope each handoff as one coherent unit; if part is trivial and part is
irreversible, split it or size the whole thing at the higher level.

**Max carries no level tag** — planning is planning, and the human starts that
terminal wherever they want it.

### Lane summary

| Role    | Does                                                                                                                            | Never does                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Max** | architecture, hard debugging, process design, fine specs with `file:line`                                                       | mechanical implementation; merging (the PR lifecycle is the other lane)    |
| **Jr.** | implementation, full PR lifecycle, `pr-reviewer`, post-merge cleanup, and whatever merging the **current merge stage** grants it | merge anything the current merge stage does not grant it (see "Who merges") |

### The standard handoff cycle

```
Max  → designs the approach, writes the fine spec → hands off via baton
Jr.  → codes, opens PR, waits for CI green
     → runs pr-reviewer, fixes, loops to PASS
     → then, per the CURRENT MERGE STAGE (see "Who merges"):
         Stage 1 → ✅ hands EVERY PR to the owner for merge
         Stage 2 → non-visual: merges it directly → cleanup
                               → feedback in the baton → 🛑 to Max
                   visual:     ✅ hands off to the owner for merge
User → merges in the UI → back to Jr.
Jr.  → git checkout main && git pull && git branch -d <branch>
     → feedback in the baton → 🛑 to Max
Max  → pickup: reads the feedback, updates the docs, prunes the baton
       (`.private/WORKFLOW.md` §2.4–2.5)
```

Each STOP is a hard stop: update `baton.md` (`to:`, `next:`, `stop_reason:`) and
end the turn with one of these signals so the user sees which terminal to open
next — **never end a handoff turn with prose narration alone**:

- `🛑 PARADA — cambia a la terminal de <Max|Jr.>.` — work remains in another lane.
  **After Jr. merges and cleans up, this is the signal**: the next actor is Max.
- `✅ LISTO — <one-line summary>.` — **only when the user genuinely acts next** (a PR
  the current merge stage assigns to them). Never to close a cycle Jr. merged itself.

**Every turn ends with the timestamp line — handoff or not:**

```
🕐 260904, 15:54 hrs Chile
```

Read it from the machine — `date '+%y%m%d, %H:%M'` (POSIX shells) or
`Get-Date -Format 'yyMMdd, HH:mm'` (PowerShell); the machine is set to Chile — never
estimated. The user is the scheduler and that stamp is how they tell which
terminal they touched last, and how stale it is. It carries the date because these
terminals are left open overnight, and yesterday's `15:50` reads exactly like a
fresh one.

---

## Stack

| Layer   | What                                                                                   |
| ------- | -------------------------------------------------------------------------------------- |
| Runtime | Plain HTML + CSS + vanilla JS in the browser. No framework, no bundler, no build step. |
| Deps    | **None**, by design — not at runtime, not as dev tooling.                             |
| Hosting | GitHub Pages, served from `main` at the repo root → `.private/operations/infrastructure.md` |
| Checks  | Node 22, used only by `npm run verify` and CI — `package.json` holds scripts, no deps  |

---

## Architecture

### Files

```
index.html        — markup only (no inline logic)
css/styles.css    — all styles
js/app.js         — all logic
package.json      — check/test/verify scripts only; no dependencies
CHANGELOG.md      — Keep a Changelog + semver
DEVLOG.md         — pair-programming narrative (v1.0.0–1.0.1)
_old/             — earlier development versions (do not touch)
```

**Rule:** do not create new files unless strictly necessary. Do not add dependencies.

### `js/app.js`

Organised in sections delimited by `// ══` banner comments — find them with
`grep -n "══" js/app.js` (line numbers drift, the banners do not):

| Section                   | Responsibility                                                    |
| ------------------------- | ----------------------------------------------------------------- |
| UTILITIES                 | `shuffle`, `getCands`, `isValid`, `isSolved`, `copy`               |
| SOLUTION + PUZZLE GENERATOR | `fillGrid` (backtracking), `countSols`, `generatePuzzle`        |
| LOGIC SOLVER (for metrics) | `logicStep` (naked + hidden singles), `solveDepth` (branching up to depth 4) |
| METRICS CALCULATION       | `calcMetrics` — 5 dimensions: P, S, D, C, M                        |
| SCORING FORMULA           | `calcContribs`, `calcScore`, difficulty bands                      |
| GAME STATE                | `newGame()` — orchestrates generation, async `max` mode           |
| METRICS PANEL UPDATE      | `resetBars`, `updateMP`, `setStatus`                               |
| BOARD / INPUT             | `renderGrid`, `highlight`, `enter`, keyboard listeners            |
| CHECK / HINT              | `check`, `hint`                                                    |
| MODAL                     | difficulty picker, expandable Maximum-mode panel                  |
| MESSAGES                  | `showMsg`, `clearMsg`                                              |
| CONFETTI                  | canvas animation on completion                                    |
| ENCODE / DECODE           | base64url 11 chars, `encodePuzzle`, `decodePuzzle`, `hasWrongEntries`, `updateCodeInput` |
| INIT                      | `newGame('medium')`                                                |

### Global state

```js
curDiff        // string: 'easy' | 'medium' | 'hard' | 'max' | 'load'
SOLUTION       // number[6][6] — full solution
PUZZLE         // number[6][6] — clues (0 = empty)
state          // number[6][6] — mutable copy with the user's entries
selected       // { row, col } | null
searching      // boolean — true while Maximum mode runs
stopRequested  // boolean — cancellation flag for Maximum mode
```

### Main flow

```
newGame(diff)
  → generatePuzzle()      // backtracking + uniqueness guarantee
  → renderGrid()          // rebuilds the DOM from PUZZLE
  → calcMetrics(PUZZLE)   // logic + branching depth
  → calcScore(metrics)    // weighted formula 0–1000
  → updateMP()            // animated bars in the panel
```

### Difficulty and scoring

Clues per level: `easy` 24 · `medium` 18 · `hard` 13 · `max` 0 (all removed;
iterative search).

| Key | Name (UI)       | Meaning                                                   |
| --- | --------------- | --------------------------------------------------------- |
| P   | Pistas dadas    | Cells with an initial value                               |
| S   | Mov. directos   | Cells solvable by naked/hidden singles at the start       |
| D   | Profundidad     | Branching levels needed to solve                          |
| C   | Cand. promedio  | Average candidates per empty cell                         |
| M   | Cand. mínimo    | Minimum candidates among empty cells                      |

```
score = P*0.8 + S*1.2 + D*1.5 + C*0.8 + M*0.7   (max 1000)
```

Bands: 0–150 Principiante · 151–350 Intermedio · 351–550 Avanzado ·
551–750 Experto · 751–1000 Extremo.

### Puzzle encoding (base64url, 11 chars)

The **solved** board is encoded, plus which cells are shown. 66 bits in two payloads:

- **Payload 1 (36 bits):** clue mask — bit `i = r*6+c`, 1 = shown, 0 = hidden. For
  Update, shown = clues + the player's filled cells.
- **Payload 2 (< 2^30):** the solution walked digit by digit (1..6) across the six 2×3
  boxes (box `b` has top-left `(floor(b/2)*2, (b%2)*3)`, cells in row-major order).
  Each step records which of the box's still-legal cells holds the digit, in a
  mixed-radix accumulator whose base is that step's **real** candidate count (first
  step least significant). The worst case over all 28,200,960 grids is 955,514,880 ≈
  2^29.83, so it always fits; a static base table does not (it fails 19% of grids).
- **Assembly:** `bigNum = (acc << 36n) | mask` → 11 chars, most significant first.

Alphabet (base64url, URL-safe): `A–Z a–z 0–9 - _`

`decodePuzzle` never throws: it returns `null` for a wrong length, a character outside
the alphabet, a dead-end walk or leftover payload. Load still checks that the clues
have a unique solution. Update refuses to encode when a filled cell differs from the
solution.

⚠️ The format is pinned by the golden codes in `tests/codec.test.mjs`. Changing one is
a format change and must be deliberate (old codes stop decoding).

### HTML grid

- CSS Grid 6×6: `grid-template-columns: repeat(6,1fr)` + `grid-template-rows: repeat(6,1fr)`.
- Thick borders on `[data-col="2"]`, `[data-row="1"]` and `[data-row="3"]` mark the
  four 2×3 boxes.
- **Given cells:** `<div class="cell given"><span>N</span></div>` — not editable by design.
- **Empty cells:** `<div class="cell"><input type="text" inputMode="numeric"></div>`.
- The `<input>` is `position:absolute;inset:0` — it adds no height to its grid row,
  which is why `grid-template-rows` is mandatory.

### CSS

All design variables live in `:root`:
`--bg, --paper, --ink, --line, --box, --user, --error, --ok, --hi, --shadow, --accent`.
Fonts: `Playfair Display` (serif, titles) + `DM Mono` (monospace, everything else).

### Maximum mode (async)

- Runs a `for` loop with `await setTimeout(8)` per iteration so the main thread is
  never blocked.
- Keeps two bests: `best` (highest score overall) and `bestWithin` (highest score
  ≤ `maxDiff`).
- Shows `bestWithin` live if it exists, otherwise `best`.
- If no `bestWithin` exists when it ends, it falls back to generating a Hard puzzle.
- `stopRequested = true` stops the loop at the end of the current iteration.

---

## Development workflow

### `main` — the rules are a convention

**Nothing enforces these rules** — `main` has no branch protection, by the owner's
decision (`.private/operations/backlog.md` → *Closed decisions*). They hold because
every lane follows them:

- No direct pushes to `main` — every change arrives through a PR.
- CI must be green before merging.
- No force-push to `main`, and `main` is never deleted.

### Change cycle

```bash
git checkout main && git pull                 # sync
git checkout -b <type>/<kebab-name>           # branch
# ... edit, commit (one commit per concern) ...
npm run verify                                # local CI mirror — must be green
git push -u origin <branch>
gh pr create --title "..." --body "..."       # Summary + Test plan checklist
# wait for green CI, run pr-reviewer
# → then merge per the CURRENT MERGE STAGE (see "Who merges")
```

### Automated pre-merge review

After CI is green and before merging, invoke the **`pr-reviewer`** subagent
(`.claude/agents/pr-reviewer.md`). It reads the diff with fresh eyes and returns
`PASS` / `CHANGES REQUESTED` / `BLOCK` against a checklist beyond CI (leftover
`TODO`s, `console.log`, secrets, accessibility, scope creep, broken puzzle codes,
new dependencies).

- Only invoke it **after CI is green**. Skip only for trivial docs-only typo PRs.
- On `BLOCK` / `CHANGES REQUESTED`: fix as new commits, re-invoke. Loop to `PASS`.
- Only once `PASS`: the PR is mergeable (see "Who merges").

### Who merges

> ## ⚠️ CURRENT MERGE STAGE: **Stage 2 — the owner merges anything visual**
>
> This one line governs every merge decision in the repo. It is flipped
> deliberately by the owner, and the flip is recorded in `backlog.md` → *Closed
> decisions* with its date and reason.

Merging to `main` marks code entering production — GitHub Pages serves `main`
directly. The gate starts closed and opens as the project earns trust:

**Stage 1 — the owner merges everything.** Jr.'s job **ends at PR open + CI green +
`pr-reviewer` PASS** → hand off to the owner and stop. No exceptions, not even for a
one-line docs fix. Early on, every merge is the owner's chance to catch drift in
taste, architecture or scope that no checklist encodes — and PR volume is low enough
that it costs little.

**Stage 2 — the owner merges anything visual.**

- **The owner merges any PR with visual / UI changes** — anything the player sees or
  interacts with. **In this project: any diff to `index.html` or `css/`, and any
  change in `js/app.js` to rendered markup, user-facing copy, layout or input
  handling.** **When in doubt whether a PR is "visual", treat it as visual and hand
  it off.** A PR is **reclassified mid-flight** if a fix pulls a user-facing file into
  the diff.
- **Jr. may merge a non-visual PR itself** once CI is green and `pr-reviewer` is
  `PASS` — generator/solver/metrics/encoding logic covered by tests, tests, tooling/CI,
  docs. There is nothing for the owner to eyeball. Use
  `gh pr merge --merge --delete-branch`, then `git checkout main && git pull`.

**Merge commits, not squash.** Each PR keeps one commit per concern (refactor /
fix / docs / changelog), and the merge commit groups them — the history this repo
has always had.

**PRs no lane opened** (bots). Max triages them on pickup, like any other input.

- **Green** goes to whoever the current stage says merges it. In Stage 1 that is the
  owner. In Stage 2 it is Jr., handed over on the baton as an `easy` task:
  `pr-reviewer`, then merge.
- **Red** becomes a spec for Jr., like any other task.

⚠️ A human commit on a bot's branch stops the bot from rebasing it. When a fix has to
land on one, let the bot rebase first, then commit.

**In both stages, Max never merges** — merging is part of the PR lifecycle, which is
the other lane.

**The subagents are quality gates, not merge gates.** A `pr-reviewer` PASS never
authorizes a merge on its own; it only means the PR is *ready* for whoever the
current stage says merges it.

### Branch & commit conventions

Branches: `release/x.y.z` for a version release; otherwise `<prefix>/<kebab-name>`,
prefix ∈ `feat` `fix` `chore` `docs` `test`.
Commits: **Conventional Commits**, one commit per concern.
A release updates `CHANGELOG.md` (and `README.md` when features change) in its own
commit.

### CI

- **CI** (`.github/workflows/ci.yml`, job `Check & test`): all checks must pass
  before merge.
- **Before pushing a code PR, run `npm run verify` locally** — the deterministic CI
  mirror (`check` = syntax check, `test` = `node --test`); it gives the same verdict
  as CI on the checks they share.
- No pre-commit hook and no Dependabot — there are no dependencies to format, lint
  or update (`backlog.md` → *Closed decisions*).

---

## Code conventions

- No TypeScript, no bundler, no linter.
- Minimalist code: one-letter variables in utilities are fine (`g`, `r`, `c`, `v`).
- Comments in English (migrated in v1.2.0).
- No `console.log` in production code.

---

## What NOT to do

- ❌ **Do not read, open, or quote `.env*` secret files.** Use `.env.example`
  (placeholders, safe to read and edit) if one ever exists.
- ❌ **Do not commit secrets.** If one reaches history, rotate it immediately.
- ❌ **Do not push to `main`** — always branch + PR.
- ❌ **Do not merge with CI red.**
- ❌ **Do not add dependencies** — runtime or dev.
- ❌ **Do not leave a deferred item only in chat** → `.private/WORKFLOW.md` §2.6.
