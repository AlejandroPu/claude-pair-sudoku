# Sudoku 6×6

A clean, browser-based 6×6 Sudoku with 2×3 subgrids. No dependencies, no build step — just open the file. This entire project was built with Large Language Models; you can find more details about this AI-driven process in the Development section.

My main point of pride in this project is the board-encoding idea I proposed, which outperformed the alternatives suggested by Gemini and Claude. It was only implemented as designed in v1.3.0 (October 2026) — the story is told in [Puzzle codes](#puzzle-codes). It remains a small but meaningful example of human engineering judgment adding value even in a simple problem like this one, and of why that judgment has to include verifying the result.

**[▶ Play it live](https://alejandropu.github.io/claude-pair-sudoku/)**

---

## Features

- **Four difficulty levels** — Easy, Medium, Hard, and Maximum
- **Maximum mode** — actively searches for the hardest possible puzzle using a configurable number of attempts (1–6000) and a max difficulty score (300–1000).
- **Difficulty metrics panel** — scores each puzzle across five axes: given clues (P), direct moves (S), branching depth (D), average candidates (C), and minimum candidates (M), combined into a 0–1000 score
- **Hint and Verify** — reveal a random cell or check the whole board; auto-verifies when the last cell is filled
- **Puzzle codes** — every puzzle, or a game in progress, encodes to an 11-character code you can copy, share, and load back
- **Confetti** on completion

---

## Puzzle codes

Every puzzle — or a game in progress — can be shared as an **11-character code** such as `beZTi6xd_st`. Paste it into the **Código** field and press **Load** to restore it.

### How it works

A code stores the **solved board** plus a **mask** of which cells are shown: 66 bits in total, written in base64url (`A–Z a–z 0–9 - _`, safe inside a URL).

1. **The solved board (under 30 bits).** The board is walked digit by digit, from 1 to 6, and each digit box by box across the six 2×3 boxes. At each step the encoder lists the cells of the box that are still free and not blocked by the same digit in their row or column, and records which of them holds the digit. These choices are packed into a single integer whose base at each step is the **real number of options** at that step.
2. **The mask (36 bits).** One bit per cell: `1` = shown, `0` = empty.

An exhaustive check over all 28,200,960 valid 6×6 boards shows that the first part never exceeds 955,514,880 (≈ 2^29.83), so every board, with any mask, fits in 11 characters. The decoder replays the same walk and rejects any string that is not a valid code; loading also checks that the shown cells have a unique solution. **Update** encodes the game in progress — clues plus your entries — and asks you to fix any wrong number first.

### The story behind it

The number-by-box idea is mine. I proposed it in March 2026, in a design discussion with Gemini 3.1 Pro: encode the solved board one digit at a time across the boxes, using a table of worst-case options per box, and add the 36-bit mask — 70 bits, 11 characters in Z85.

That is not what v1.1.0 shipped. The implementation prompt Gemini drafted at the end of that discussion described a different scheme — encoding only the clue cells, row by row — and Claude Code implemented that prompt faithfully. That scheme has no fixed size limit: with many clues the value overflowed the 11 characters and was silently truncated, so roughly one in six Easy codes did not load back the same puzzle. Two reviews on April 4, 2026 — a Claude chat and Gemini 3.8 Flash — judged the implementation correct; the Claude review mistook it for my design, and the *Design note* added to this README in v1.2.0 repeated that both had the same 34-bit ceiling.

I made the mistake of not verifying, when it shipped in April, that the algorithm had been implemented as designed. In October 2026, while reusing the idea in LookThis.One Games — another project of mine, in a private repository, live at [cerebritos.cl/games](https://www.cerebritos.cl/games/) — a Claude Opus 5.5 session analyzed this repository and found the defect. Verifying it here also showed that my design needed one adjustment: my worst-case table underestimated the options for digit 5, so fixed multipliers would have failed on about 19% of boards. Counting the real options at each step solves it, and that is what v1.3.0 implements.

These errors were found and corrected thanks to today's stronger models and my greater experience using them. The full technical record is in [DEVLOG.md](DEVLOG.md), Part III.

---

## How to play

1. Click **Nuevo Sudoku** (New Sudoku) and choose a difficulty level
2. Click a cell and type a number (1–6), or use the arrow keys to navigate
3. Use **Pista** (Hint) for a free cell, **Verificar** (Check) to highlight errors
4. Share your puzzle by copying the **Código** (Code) field and sending it to someone — they can paste it in and click **Load**. Click **Update** first to include your progress.

---

## Run locally

No installation needed. Either:

**Option A — open directly**
```
index.html   ← double-click it in your file explorer
```

**Option B — local server** (avoids any browser file:// restrictions)
```bash
python -m http.server 5500
# then open http://localhost:5500
```

To run the tests (Node.js 22 or later, no dependencies to install):
```bash
npm test
```

---

## Tech stack

| Layer      | Details                              |
|------------|--------------------------------------|
| Markup     | HTML5                                |
| Styles     | CSS3 (custom properties, animations) |
| Logic      | Vanilla JavaScript (ES2020+)         |
| Fonts      | Google Fonts — Playfair Display, DM Mono |
| Tests      | Node.js built-in test runner         |
| Build tool | None                                 |

### File structure

```
claude-pair-sudoku/
├── index.html       # markup
├── css/
│   └── styles.css   # all styles
├── js/
│   └── app.js       # all logic
├── tests/           # encoding tests (npm test)
└── package.json     # test scripts only — no dependencies
```

---

## Development

This project was built through AI pair programming:

| Version | Tool | Role |
|---------|------|------|
| 1.0.0 – 1.0.1 | Claude Sonnet 4.6 extended | Pair programming |
| 1.0.0 – 1.1.0 | ChatGPT 5.4 extended thinking | Documentation |
| 1.0.2 | Claude Code v2.1.92 via Cursor 3.0.9 | Pair programming |
| 1.1.0 | Gemini 3.1 Pro | Encoding design discussion |
| 1.1.0 – 1.2.3 | Claude Code (Claude Sonnet 4.6) via Cursor | Pair programming |
| 1.3.0 | Claude Opus 5.5 | Encoding defect report (from the LookThis.One Games project) |
| 1.3.0 | Claude Code (Claude Opus 5.5) | Verification, planning and documentation |
| 1.3.0 | Claude Code (Claude Sonnet 5.5) | Implementation and tests |

[DEVLOG.md](DEVLOG.md) records the development story: Part I covers the initial build (v1.0.0–1.0.1), Part II the encoding design discussion behind v1.1.0, and Part III the audit and correction of the encoding in v1.3.0.

From v1.0.2 to v1.2.3, Claude Code via Cursor was the main development tool. Since v1.3.0, the project uses Claude Code in two separate sessions — one to plan, one to implement.

---

## License

[MIT](LICENSE)
