# AlgoVis (Algorithm Visualizer)

Created by **Ali Ghelichkhani**. A browser-based sorting visualizer built with React, TypeScript, Vite, and Canvas.

The application lives directly in the repository root (`/home/idocs/projects/algovis`).

## Develop

Use Node.js 22.12+ and a native npm installation for your operating system.

```sh
npm ci
npm run dev
```

If WSL is picking up Windows npm, use a Linux npm installation. With dependencies already installed, the development server can also be started directly:

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1
```

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser tests run against their own local Vite server. Playwright browser installation is a one-time setup.

Firefox is also supported when Chromium downloads are unavailable:

```sh
npx playwright install firefox
PLAYWRIGHT_BROWSER=firefox npm run test:e2e
```

## Features

Five algorithms: insertion sort, bubble sort, selection sort, merge sort, and quicksort. All use the same playback controls: play/pause, stepping forward and backward, timeline scrubbing, reset, replay, and live speed changes. Arrays default to 50 elements and can be resized from 8 to 96.

Five dataset presets: random, sorted, reversed, nearly sorted, and many duplicates. Switching algorithms always restores the exact original array. Changing dataset or size cancels playback and creates a fresh input. Shuffle permutes the original values, preserving their multiset even while merge sort has temporarily overwritten some main-array values. Shuffle changes ordered presets to Random; duplicate-heavy inputs keep their preset.

The Canvas shows smooth swaps and writes, active ranges, quicksort pivots, selection-sort minima, and merge sort's auxiliary buffer. The sidebar follows the selected algorithm with pseudocode, operation explanations, stability, and best/average/worst time and space complexity. Includes keyboard controls, responsive layouts, reduced-motion support, live metrics, and inspectable array values.

**Explore** follows one algorithm with pseudocode. **Compare** runs two algorithms on exactly the same original input, with a shared timeline and step rate. A finished side holds its final state while the other continues. The panels appear side by side on desktop and stack on smaller screens. Once both finish, results identify fewer comparisons, main-array writes, and visual steps, including ties. Selecting the same algorithm twice is supported.

The timeline uses completed operation counts. Scrubbing pauses playback and restores the requested state, counters, highlights, and identities. A shared timeline extends to the longer trace; shorter traces remain at their endpoint. Seeking resets the animation timer, which then measures playback since the most recent seek or reset. Changing view mode or either comparison algorithm restarts both players from their shared original input.

- Space: play or pause
- Right arrow: finish one operation and pause
- Left arrow: return to the previous operation boundary and pause
- R: restore the exact starting array

Shortcuts defer to focused form controls. Playback time measures animation time and is not a CPU benchmark. The operation count includes visualized selections and range splits as well as comparisons, swaps, and writes. A swap counts as two main-array writes. Merge sort counts each placement back into the main array as one write; preparing its auxiliary buffer is excluded.

## Architecture

- `src/sorting/types.ts`: shared operation types, element identities, and algorithm metadata.
- `src/sorting/algorithms.ts` and `insertion.ts`: record operations without mutating input. Quicksort uses a last-element pivot, recurses only on the smaller partition, and iterates over the larger partition to bound call-stack space by O(log n).
- `src/sorting/datasets.ts`: reproducible presets and multiset-preserving shuffles.
- `src/sorting/player.ts`: pure playback model driven by elapsed time, supporting swaps, buffer writes, and checkpoint-based seeking. A checkpoint stores the item references and counters every 64 operations; seeking replays at most 63 operations after restoring one.
- `src/sorting/session.ts`: shared input and playback controller for one or two players, including comparison seek, reset, completed-player hold, and algorithm/mode changes.
- `src/hooks/usePlaybackClock.ts`: one browser animation clock advances the session. React updates controls and counters separately.
- `src/components/BarCanvas.tsx`: Canvas rendering and interpolated swaps/writes; canvases do not advance their own players.
- `src/components/PlaybackControls.tsx`, `ArrayPlot.tsx`, and `ComparisonView.tsx`: shared playback UI, chart presentation, and comparison panels/results.

Traces are precomputed for bounded arrays. Quadratic algorithms can record O(n²) events. Merge events retain shared immutable run buffers for their source reads. Checkpoint arrays share immutable items while preserving each operation boundary's ordering. The displayed algorithm-space complexity excludes the visualization trace and playback state. Larger datasets would benefit from buffered operation generation and a configurable checkpoint interval.

Merge sort can temporarily duplicate or omit a value in the main array while copying from its buffer; the original input and buffered values remain intact. Buffer comparisons highlight the auxiliary row, rather than implying reads from overwritten main-array positions. Stable algorithms preserve equal-valued elements' original identities. Selection sort and quicksort are marked unstable.

The model suites cover all algorithms and presets, duplicate stability, known counts, pause/resume, stepping, reset, replay, interrupted merge writes, original-input preservation, frame rates, checkpoint boundaries, seeking, and comparison synchronization. The Playwright suites cover real browser interactions, comparison results, responsive rendering, reduced motion, AlgoVis branding, and creator credit.

## Milestones

See [MILESTONES.md](MILESTONES.md). Each milestone ends with verification, an allowance check using `~/codex/usage.py`, and a review handoff.
