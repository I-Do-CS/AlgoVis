# Sort Studio

A browser-based sorting visualizer built with React, TypeScript, Vite, and Canvas.

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

Five algorithms: insertion sort, bubble sort, selection sort, merge sort, and quicksort. All use the same playback controls: play/pause, single stepping, reset, replay, and live speed changes. Arrays default to 50 elements and can be resized from 8 to 96.

Five dataset presets: random, sorted, reversed, nearly sorted, and many duplicates. Switching algorithms always restores the exact original array. Changing dataset or size cancels playback and creates a fresh input. Shuffle permutes the original values, preserving their multiset even while merge sort has temporarily overwritten some main-array values. Shuffle changes ordered presets to Random; duplicate-heavy inputs keep their preset.

The Canvas shows smooth swaps and writes, active ranges, quicksort pivots, selection-sort minima, and merge sort's auxiliary buffer. The sidebar follows the selected algorithm with pseudocode, operation explanations, stability, and best/average/worst time and space complexity. Includes keyboard controls, responsive layouts, reduced-motion support, live metrics, and inspectable array values.

- Space: play or pause
- Right arrow: finish one operation and pause
- R: restore the exact starting array

Shortcuts defer to focused form controls. Playback time measures animation time and is not a CPU benchmark. The operation count includes visualized selections and range splits as well as comparisons, swaps, and writes. A swap counts as two main-array writes. Merge sort counts each placement back into the main array as one write; preparing its auxiliary buffer is excluded.

## Architecture

- `src/sorting/types.ts`: shared operation types, element identities, and algorithm metadata.
- `src/sorting/algorithms.ts` and `insertion.ts`: record operations without mutating input. Quicksort uses a last-element pivot, recurses only on the smaller partition, and iterates over the larger partition to bound call-stack space by O(log n).
- `src/sorting/datasets.ts`: reproducible presets and multiset-preserving shuffles.
- `src/sorting/player.ts`: pure playback model driven by elapsed time, supporting swaps and buffer writes.
- `src/components/BarCanvas.tsx`: browser animation clock and interpolated Canvas rendering. React updates controls and counters separately.

Traces are precomputed for bounded arrays. Quadratic algorithms can record O(n²) events. Merge events retain shared immutable run buffers for their source reads. The displayed algorithm-space complexity excludes the visualization trace and playback state. Larger datasets should use buffered operation generation and checkpoints.

Merge sort can temporarily duplicate or omit a value in the main array while copying from its buffer; the original input and buffered values remain intact. Buffer comparisons highlight the auxiliary row, rather than implying reads from overwritten main-array positions. Stable algorithms preserve equal-valued elements' original identities. Selection sort and quicksort are marked unstable.

`tests/player.test.mjs` and `tests/algorithms.test.mjs` cover all algorithms and presets, duplicate stability, known counts, pause/resume, stepping, reset, replay, interrupted merge writes, original-input preservation, and independence from frame rate. The Playwright suites cover real browser interactions and responsive rendering.

## Next milestones

See [MILESTONES.md](MILESTONES.md). Each milestone ends with verification, an allowance check using `~/codex/usage.py`, and a review handoff.
