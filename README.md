# Sudoku 6×6

A clean, browser-based 6×6 Sudoku with 2×3 subgrids. No dependencies, no build step — just open the file.

**[▶ Play it live](https://alejandropu.github.io/claude-pair-sudoku/)**

---

## Features

- **Four difficulty levels** — Easy, Medium, Hard, and Maximum
- **Maximum mode** — actively searches for the hardest possible puzzle using a configurable number of attempts
- **Difficulty metrics panel** — scores each puzzle across five axes: given clues (P), direct moves (S), branching depth (D), average candidates (C), and minimum candidates (M), combined into a 0–1000 score
- **Hint and Verify** — reveal a random cell or check the whole board; auto-verifies when the last cell is filled
- **Puzzle codes** — every puzzle encodes to a 17-character base-62 string you can copy, share, and load back
- **Confetti** on completion

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
| 1.0.2 | Claude Code via Cursor 2.6.21 | Pair programming |

The full development story for v1.0.0–1.0.1 — every prompt, design decision, and technical discussion — is documented in [DEVLOG.md](DEVLOG.md).

---

## License

[MIT](LICENSE)
