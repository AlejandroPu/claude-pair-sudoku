# Sudoku 6×6

This project is an initial starting point for a Sudoku 6×6 application.

The application was developed almost entirely by **"Claude Sonnet 4.6 extended"**, with only minimal intervention from the author, limited essentially to a couple of adjustments made during development, including a change to the maximum value of one slider at a certain point in the process.

Development took place during the afternoon of **March 20, 2026**.

The present document has been written by **"ChatGPT 5.4 extended thinking"**.

A live version of the project can be tested at: https://alejandropu.github.io/claude-pair-sudoku/

What follows is the account of how the entire project was developed.

# Technical record of the development of a 6 × 6 Sudoku

What follows is a third-person record of the development process of a 6 × 6 Sudoku game with 2 × 3 subgrids carried out by **Alejandro** in collaboration with **Claude Sonnet 4.6**. The interactions took place on **March 20, 2026**.

To review the full conversation, follow this link: https://claude.ai/share/5b4aa846-e87c-4fef-98d4-7d69d72c66dc

## 1. Initial request

The conversation began with a specific request:

> Can you make a simple sudoku with html, css, javascript, with 2×3 cells in 3×3 groups?

Claude responded with an initial functional version of the 6×6 board, including validation, hint, checking, and restart features.

## 2. Restart and difficulty levels

After the first version, Alejandro proposed extending the functionality:

> It's perfect. I want pressing "restart" to generate a new different sudoku. I also want the difficulty level to be selectable with more or fewer numbers when restarting.

In response, Claude added a modal with three predefined levels when pressing *Restart*:

- **Easy**: 24 visible clues (more given numbers).
- **Medium**: 18 clues (intermediate level).
- **Hard**: 13 clues (proposed minimum challenge).

Each selection generated a new puzzle with a unique solution and displayed the active level on screen. To achieve this, a backtracking generator was added together with a uniqueness check through `countSolutions`.

## 3. Uniqueness guarantee and search for maximum difficulty

Alejandro wanted to confirm solvability and explore a maximum-difficulty mode:

> Does the algorithm used in the code ensure that each sudoku can be solved and has only one solution? If so, would it be very complex to include an additional difficulty option for the highest possible difficulty? I do not want you to program it immediately. I want you to think about the logic required to achieve it.

Claude explained that `countSolutions` stops the search as soon as it detects two solutions, thereby preserving uniqueness. He also clarified that fewer clues do not automatically imply greater human difficulty; the actual difficulty depends on the techniques required to solve the board.

The final recommendation was to approximate maximum difficulty by minimizing clues and discarding boards whose initial configuration allowed any cell to be solved with basic techniques. In practice, the filter relied on *naked singles* and *hidden singles*.

## 4. Implementation of the **Maximum** mode and difficulty metric

Alejandro then asked for a detailed description of the plan to implement maximum difficulty:

> Go ahead. First, tell me about your plan to make 6×6 sudokus with the highest possible difficulty.

Claude structured the plan in two layers: first minimize the number of clues, then filter out boards that still offered trivial moves at the start. A limit on the number of attempts was also introduced to avoid unbounded searches.

Alejandro proposed controlling the “depth of difficulty” and creating a mathematical difficulty quantifier. From that point, Claude derived a formula based on several puzzle metrics.

### Difficulty metrics and formula

Five metrics were defined to quantify difficulty:

| Metric | Brief meaning |
| --- | --- |
| **P — Given clues** | Number of pre-filled cells; fewer clues imply greater difficulty |
| **S — Direct moves** | Cells immediately solvable through *naked singles* or *hidden singles*; a low S indicates the absence of trivial moves |
| **D — Branching depth** | Number of trial-and-error levels required to solve the puzzle; a higher D means more branching |
| **C — Average candidates** | Average number of possible values per empty cell; greater ambiguity implies greater difficulty |
| **M — Minimum candidates** | Minimum number of candidates in any cell; a higher value indicates the absence of easy entries |

Each metric was normalized, weighted, and integrated into a theoretical total score of 1000 points. The formula used an exponential component for S and assigned the greatest weight to D. It was also noted that, in practice, the real ceiling would be lower than 1000.

## 5. Pareto dominance and interface refinements

While testing the maximum-difficulty mode, Alejandro proposed that the algorithm should not only search for the highest score, but compare puzzles based on the simultaneous improvement of all metrics. In his words:

> I changed the slider up to 1000 and it works well... I would like it, instead of searching for the maximum score of our formula... to search for the best algorithm according to the increase of each metric... each new puzzle found must be the result of matching the value of all metrics and surpassing at least one.

Claude recognized that this idea corresponded to **Pareto dominance** and adjusted the search so that a new puzzle would only be accepted if it worsened none of the metrics and improved at least one. The slider was later extended to 2000, then to 4000, and improvement indicators were added.

Additional interface changes were then introduced: removal of the numeric buttons, relocation of the search-status messages, and automatic checking when the board was completed.

## 6. Compact board encoding

Alejandro opened the most technical part of the conversation with the following prompt:

> What is the shortest code of letters and numbers that could be used to reconstruct a random initial position for the sudoku? Do not program it, let us just think about this problem.

From that point, Claude estimated the raw state space of the board as 7^36 states, equivalent to about 101 bits, and compared several encoding schemes. The initial conclusion was that a direct base-62 representation could reduce the full board to 17 characters.

Alejandro then explicitly formulated his own compression idea, which should be preserved because it guided the rest of the analysis:

> Explain a bit more the optimization you mention.  
> Then consider this initial analysis:  
> Think about one row.  
> The first cell has 7 states, the second 6, and so on until the sixth cell, which has 2 possible states.  
> In the second row we start with 6 possible states: 6,5,4,3,2  
> Third row: 5,5,5,4,3,2  
> fourth: 4,4,4,4,3,2  
> Etc.

That approach shifted the analysis from a direct board encoding toward a combinatorial estimate of valid states. Claude responded by splitting the problem into two parts: the map of given positions and the values of the given cells, and then developed the row-by-row model while also incorporating the 2×3 box constraints.

The result was a progressive conceptual compression:

- 101 bits for the raw board.
- ~75 bits by separating mask and given values.
- ~45 bits after incorporating stronger structural constraints.
- 25 bits to index a complete solution among the 28,200,960 valid solutions.
- ~31 bits to combinatorially encode which cells are revealed.

With that decomposition, Claude proposed combining the solution index and the combinatorial rank of the mask into a single integer, leading to a practical puzzle code of **10 characters** for different difficulty levels.

## 7. Integration of the encoding system

After designing the encoding scheme, Alejandro asked for it to be integrated into the interface:

> Go ahead. The idea is to place an input field to enter the code so that the sudoku starts from there... next to the input there should be a button to copy the reference code and one to load the code into the board.

Claude implemented this functionality. Each puzzle was converted into a base-7 representation, then into base 62, and displayed in a text field. **Copy** and **Load** actions were added, together with validations for length, alphabet, consistency with sudoku rules, existence of a solution, and uniqueness. The code updated automatically whenever the board changed.

## Conclusion

The development progressed from a basic 6×6 sudoku to a version with random puzzle generation, difficulty control, maximum mode, an evaluation formula, Pareto-dominance-based search, interface refinements, and a compact encoding system for sharing boards.

---

*Document generated by ChatGPT 5.4 after reviewing the chat in agent mode. Date: March 20, 2026.*