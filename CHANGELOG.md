# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-04-06

### Added
- **Maximum mode: two numeric inputs** replace the former attempt slider:
  - *Intentos* (1–6000): number of puzzles to generate and evaluate.
  - *Max dificultad* (300–1000): upper bound on the accepted difficulty score.
- Both inputs clamp to their valid range on blur.
- **Stop button** appears inline next to the attempt counter while a search is running; clicking it ends the loop after the current attempt and keeps the best valid result found so far.
- **Max-difficulty enforcement**: the search tracks the best puzzle whose score ≤ *max dificultad* separately from the overall best. At the end it restores that puzzle; if no attempt stayed within the limit, a Hard-level puzzle is generated as fallback.
- The grid and metrics panel update in real time during the search, always reflecting the current best within-range puzzle (out-of-range results are never shown).
- The *Nivel:* line updates on every iteration alongside the metrics panel.

### Changed
- Maximum mode search stops early only when the best within-range score reaches *max dificultad* exactly (previously stopped when the overall best reached the threshold).
- All Spanish comments in `js/app.js` translated to English.

## [1.1.0] - 2026-04-04

### Added
- **Update button** in the code row: encodes the current board state (including
  user-filled cells) into a shareable code, with conflict validation before encoding.
- Difficulty metrics panel now shown for all difficulty levels (Easy, Medium, Hard),
  not only in Maximum mode.
- Numeric difficulty score displayed in the NIVEL line alongside the band label
  (e.g. `Fácil — Avanzado · 423`).
- Metrics panel and score also calculated and shown when loading a puzzle from a code.

### Changed
- **Puzzle encoding rewritten**: replaced the naive base-7 → base-62 scheme (17 chars)
  with a 70-bit two-payload architecture encoded in base-85 (Z85), producing
  **11-character codes**.
  - Payload 1 (36 bits): vacancy mask indicating which cells are clues.
  - Payload 2 (~34 bits): clue values compressed via mixed-radix factoradic encoding
    that exploits Sudoku constraints (dynamic-base accumulator over legal options).
  - Z85 alphabet: `0–9 a–z A–Z . - : + = ^ ! / * ? & < > ( ) [ ] { } @ % $ #`
- Confetti animation duration extended from ~3.7 s to ~7 s.
- Removed the "6 × 6 — grupos de 2×3" subtitle from the page header.
- Error message for invalid codes updated to reflect the new format (11 chars base-85).

## [1.0.2] - 2026-03-24

### Added
- Project link in page footer pointing to the GitHub repository.

### Changed
- Extracted CSS into `css/styles.css` and JavaScript into `js/app.js`;
  `index.html` now contains only HTML markup.

### Docs
- Added GitHub Pages deployment link to README.

## [1.0.1] - 2026-03-20

### Fixed
- Virtual keyboard now appears on mobile devices when tapping a cell.
  Removed `readOnly` attribute from cell inputs and added a direct `input`
  event listener to handle touch-based entry alongside the existing keyboard handler.

## [1.0.0] - 2026-03-20

### Added
- 6×6 Sudoku board with 2×3 subgrids.
- Puzzle generator with backtracking and uniqueness guarantee via `countSolutions`.
- Four difficulty levels: Easy, Medium, Hard, and Maximum.
- Maximum mode with Pareto-dominance-based puzzle search and configurable attempt slider.
- Difficulty metrics panel: given clues (P), direct moves (S), branching depth (D),
  average candidates (C), and minimum candidates (M).
- Weighted scoring formula with a theoretical ceiling of 1000 points.
- Hint and Verify actions; automatic verification when the board is completed.
- Compact board encoding: base-7 → base-62, 17-character puzzle code.
- Copy and Load actions for sharing puzzles via code, with full validation
  (length, alphabet, Sudoku consistency, solvability, and uniqueness).
- Confetti animation on puzzle completion.
- GitHub Pages deployment.
