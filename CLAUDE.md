# CLAUDE.md — claude-pair-sudoku

Guía de referencia para el desarrollo asistido por IA de este proyecto.

---

## Proyecto

Juego de Sudoku 6×6. Sin dependencias de terceros — solo HTML, CSS y JS vanilla.
Iniciado el 20 de marzo de 2026 como experimento de pair programming con IA.

**Live:** https://alejandropu.github.io/claude-pair-sudoku/
**Repo:** https://github.com/AlejandroPu/claude-pair-sudoku
**Versión actual:** v1.2.3

---

## Estructura de archivos

```
index.html        — markup exclusivamente (sin lógica inline)
css/styles.css    — todos los estilos
js/app.js         — toda la lógica (~720 líneas)
CHANGELOG.md      — Keep a Changelog + semver
DEVLOG.md         — narrativa del pair programming (v1.0.0–1.0.1)
_old/             — versiones previas de desarrollo (no tocar)
```

**Regla:** no crear archivos nuevos salvo que sea estrictamente necesario. No agregar dependencias.

---

## Arquitectura de `js/app.js`

El archivo está organizado en secciones claramente delimitadas con comentarios `// ══`:

| Sección | Líneas aprox. | Responsabilidad |
|---|---|---|
| Utilities | 1–27 | `shuffle`, `getCands`, `isValid`, `isSolved`, `copy` |
| Generator | 33–73 | `fillGrid` (backtracking), `countSols`, `generatePuzzle` |
| Logic Solver | 80–126 | `logicStep` (naked + hidden singles), `solveDepth` (branching hasta depth 4) |
| Metrics | 132–176 | `calcMetrics` — 5 dimensiones: P, S, D, C, M |
| Scoring | 193–222 | `calcContribs`, `calcScore`, bandas de dificultad |
| Game State | 228–316 | `newGame()` — orquesta generación, modo `max` async |
| Metrics Panel | 322–365 | `resetBars`, `updateMP`, `setStatus` |
| Board | 371–445 | `renderGrid`, `highlight`, `enter`, listeners de teclado |
| Check / Hint | 451–475 | `check`, `hint` |
| Modal | 481–528 | Selector de dificultad, panel expandible modo Máxima |
| Messages | 534–538 | `showMsg`, `clearMsg` |
| Confetti | 544–565 | Animación canvas al completar el puzzle |
| Encode / Decode | 573–717 | Z85 11 chars, `encodePuzzle`, `decodePuzzle`, `updateCodeInput` |
| Init | 722 | `newGame('medium')` |

---

## Estado global

```js
curDiff        // string: 'easy' | 'medium' | 'hard' | 'max' | 'load'
SOLUTION       // number[6][6] — solución completa
PUZZLE         // number[6][6] — pistas (0 = vacío)
state          // number[6][6] — copia mutable con entradas del usuario
selected       // { row, col } | null
searching      // boolean — true mientras corre modo Máxima
stopRequested  // boolean — flag de cancelación para modo Máxima
```

---

## Flujo principal

```
newGame(diff)
  → generatePuzzle()      // backtracking + garantía de unicidad
  → renderGrid()          // reconstruye el DOM desde PUZZLE
  → calcMetrics(PUZZLE)   // lógica + branching depth
  → calcScore(metrics)    // fórmula ponderada 0–1000
  → updateMP()            // barras animadas en el panel
```

---

## Dificultad y scoring

### Clues por nivel
| Nivel | Pistas dadas |
|---|---|
| easy | 24 |
| medium | 18 |
| hard | 13 |
| max | 0 (se eliminan todas; búsqueda iterativa) |

### Métricas (5 dimensiones)
| Clave | Nombre | Descripción |
|---|---|---|
| P | Pistas dadas | Celdas con valor inicial |
| S | Mov. directos | Celdas resolubles con naked/hidden singles al inicio |
| D | Profundidad | Niveles de bifurcación necesarios para resolver |
| C | Cand. promedio | Promedio de candidatos por celda vacía |
| M | Cand. mínimo | Mínimo de candidatos entre celdas vacías |

### Fórmula de score
```
score = P*0.8 + S*1.2 + D*1.5 + C*0.8 + M*0.7   (máx. 1000)
```

### Bandas
| Rango | Etiqueta |
|---|---|
| 0–150 | Principiante |
| 151–350 | Intermedio |
| 351–550 | Avanzado |
| 551–750 | Experto |
| 751–1000 | Extremo |

---

## Codificación de puzzles (Z85, 11 chars)

70 bits totales divididos en dos payloads, codificados en base-85:

- **Payload 1 (36 bits):** máscara de vacantes — bit `i = r*6+c`, 1 = pista, 0 = vacío.
- **Payload 2 (~34 bits):** acumulador factorial de base dinámica — recorre celdas con pista en orden row-major, codifica cada valor según sus candidatos legales en ese momento.
- **Assembly:** `bigNum = (acc << 36n) | vacancyMask` → 11 chars Z85.

Alfabeto Z85: `0–9 a–z A–Z . - : + = ^ ! / * ? & < > ( ) [ ] { } @ % $ #`

---

## Grid HTML

- CSS Grid 6×6: `grid-template-columns: repeat(6,1fr)` + `grid-template-rows: repeat(6,1fr)`.
- Bordes gruesos en `[data-col="2"]`, `[data-row="1"]` y `[data-row="3"]` marcan los 4 bloques 2×3.
- **Celdas dadas:** `<div class="cell given"><span>N</span></div>` — no editables por diseño.
- **Celdas vacías:** `<div class="cell"><input type="text" inputMode="numeric"></div>`.
- El `<input>` usa `position:absolute;inset:0` — no aporta altura al row del grid, por eso `grid-template-rows` es obligatorio.

---

## CSS

Todas las variables de diseño en `:root`:

```css
--bg, --paper, --ink, --line, --box, --user, --error, --ok, --hi, --shadow, --accent
```

Tipografías: `Playfair Display` (serif, títulos) + `DM Mono` (monospace, todo lo demás).

---

## Modo Máxima (async)

- Corre en un loop `for` con `await setTimeout(8)` por iteración para no bloquear el hilo.
- Mantiene dos mejores separados: `best` (mejor score absoluto) y `bestWithin` (mejor score ≤ `maxDiff`).
- Muestra en tiempo real el puzzle `bestWithin` si existe, sino `best`.
- Si al terminar no hay ningún `bestWithin`, genera un puzzle Hard como fallback.
- `stopRequested = true` interrumpe el loop al final de la iteración actual.

---

## Convenciones de código

- Sin TypeScript, sin bundler, sin linter.
- Código minimalista: variables de una letra en utilidades son aceptables (`g`, `r`, `c`, `v`).
- Los comentarios en inglés (migrados en v1.2.0).
- No agregar `console.log` en producción.

---

## Workflow Git

- Branch `release/x.x.x` por versión.
- Un commit por concern (refactor / fix / docs / changelog).
- PR con summary + test checklist antes de mergear a `main`.
- Después del merge: pull main local + borrar rama.
- Las preguntas de planificación se hacen de una en una.

---

## Historial de versiones relevante

| Versión | Fecha | Cambio clave |
|---|---|---|
| v1.0.0 | 2026-03-20 | Juego base completo |
| v1.0.2 | 2026-03-24 | Extracción HTML/CSS/JS a archivos separados |
| v1.1.0 | 2026-04-04 | Codificación Z85 11 chars, botón Update, métricas en todos los niveles |
| v1.2.0 | 2026-04-06 | Modo Máxima con dos inputs + botón Stop |
| v1.2.2 | 2026-04-06 | Celdas dadas como `<span>`, mejoras UI |
| v1.2.3 | 2026-04-07 | Fix: `grid-template-rows` faltante causaba colapso de filas |
