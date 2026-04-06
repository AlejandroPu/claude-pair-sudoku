# Sudoku 6×6

A clean, browser-based 6×6 Sudoku with 2×3 subgrids. No dependencies, no build step — just open the file. This entire project was built mainly using Large Language Models; you can find more details about this AI-driven process in the Development section.

My main point of pride in this project is having proposed the board-encoding idea that was ultimately implemented, surpassing the alternatives suggested by Gemini and Claude. As of April 4, 2026, it stands as a small but meaningful example of human engineering judgment adding value even in a simple problem like this one.

**[▶ Play it live](https://alejandropu.github.io/claude-pair-sudoku/)**

---

## Features

- **Four difficulty levels** — Easy, Medium, Hard, and Maximum
- **Maximum mode** — actively searches for the hardest possible puzzle using a configurable number of attempts (1–6000) and a max difficulty score (300–1000).
- **Difficulty metrics panel** — scores each puzzle across five axes: given clues (P), direct moves (S), branching depth (D), average candidates (C), and minimum candidates (M), combined into a 0–1000 score
- **Hint and Verify** — reveal a random cell or check the whole board; auto-verifies when the last cell is filled
- **Puzzle codes** — every puzzle encodes to an ultra-compact ~11 to 12-character Base64/Z85 string you can copy, share, and load back
- **Confetti** on completion

---

## The Compression Algorithm (v1.1.0)

In version 1.1.0, the puzzle encoding system was completely redesigned following an architectural discussion with **Gemini 3.1 Pro** on how to optimize data compression.

Instead of relying on standard text compression or processor-heavy recursive
backtracking, the game uses a custom **dynamic-base factoradic** algorithm. It packs
any valid Sudoku state into a precise 70-bit payload, resulting in a string of just
11 characters, achieving near-theoretical maximum compression while maintaining
instantaneous runtime performance.

### How it works
The 70-bit payload is divided into two layers:

1. **The Clue Mask (36 bits):** A bitmask of the 36 cells in row-major order, where `1` represents a starting clue and `0` represents an empty cell.

2. **The Clue Values (≤ 34 bits):** The clue cells are visited in row-major order. For each one, the encoder builds the list of values still legal at that position — given the row, column, and 2×3 block constraints already consumed — and records the **index** of the actual value within that list. These indices are packed into a single integer using a mixed-radix (factoradic) scheme: each digit's base equals the number of legal candidates at that cell, which varies dynamically from cell to cell. The decoder reconstructs the board by reversing the same traversal.

### Design note

The original design idea — proposed during the Gemini session and internally dubbed **O(1) Static Multiplier** — was to encode the **completed board** by placing each digit 1–6 across the six 2×3 blocks in turn, using a static worst-case multiplier array `[6, 3, 4, 2, 2, 1]` per block. The name reflects its key property: since the multipliers are fixed at compile time, encoding and decoding run in true O(1) time with no dynamic candidate counting. That model yields a ceiling of `288 × 240 × 192 × 108 × 8 × 1 = 11,466,178,560` combinations, which fits in 34 bits and informed the bit-budget estimate.

The implementation by **Claude Code** instead applies the same mixed-radix principle directly over the **clue cells** in row-major order, using real per-cell candidate counts as the dynamic base. This approach handles partial boards natively — no separate full-solution step required — and reaches the same 34-bit ceiling in practice, since the product of actual candidate counts never exceeds the static worst-case bound.

---
## How to play

1. Click **Reiniciar** (Restart) and choose a difficulty level
2. Click a cell and type a number (1–6), or use the arrow keys to navigate
3. Use **Pista** (Hint) for a free cell, **Verificar** (Check) to highlight errors
4. Share your puzzle by copying the **Código** (Code) field and sending it to someone — they can paste it in and click **Load**

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

---

## Tech stack

| Layer      | Details                              |
|------------|--------------------------------------|
| Markup     | HTML5                                |
| Styles     | CSS3 (custom properties, animations) |
| Logic      | Vanilla JavaScript (ES2020+)         |
| Fonts      | Google Fonts — Playfair Display, DM Mono |
| Build tool | None                                 |

### File structure

```
claude-pair-sudoku/
├── index.html       # markup
├── css/
│   └── styles.css   # all styles
└── js/
    └── app.js       # all logic
```

---

## Development

This project was built entirely through AI pair programming:

| Version | Tool | Role |
|---------|------|------|
| 1.0.0 – 1.0.1 | Claude Sonnet 4.6 extended | Pair programming |
| 1.0.0 – 1.0.1 | ChatGPT 5.4 extended thinking | Documentation |
| 1.0.2 | Claude Code v2.1.92 via Cursor 3.0.9 | Pair programming |
| 1.1.0 | Gemini 3.1 Pro | Algorithm optimization |

The full development story for v1.0.0–1.0.1 — every prompt, design decision, and technical discussion — is documented in [DEVLOG.md](DEVLOG.md).

From v1.0.2 onwards, Claude Code via Cursor became the main tool used for development.

---

## License

[MIT](LICENSE)
