# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
