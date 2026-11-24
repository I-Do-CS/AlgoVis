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

## Milestone 1

Insertion sort with a default array of 50 elements, smooth adjacent swaps, play/pause, single stepping, reset, replay, live speed changes, shuffle, and array sizes from 8 to 96. Includes live counters, pseudocode highlighting, keyboard shortcuts, responsive layouts, reduced-motion support, and inspectable array values.

- Space: play or pause
- Right arrow: finish one operation and pause
- R: restore the exact starting array

Shortcuts defer to focused form controls. Shuffle and size changes cancel the current run and prepare a new array. Playback time measures animation time and is not a CPU benchmark. Select operations are included in the operation count. A swap counts as two array writes.

## Architecture

`src/sorting/insertion.ts` records select, compare, and swap operations without changing its input or storing array snapshots. `src/sorting/player.ts` is a pure model driven by elapsed time. `src/components/BarCanvas.tsx` supplies the browser animation clock and renders interpolated positions; React updates the controls and counters separately.

The trace is precomputed for bounded arrays. It can use O(n²) memory for insertion sort; the displayed O(1) algorithm space describes the sorting algorithm's working memory, excluding this visualization trace. Larger datasets should use buffered operation generation and checkpoints.

`tests/player.test.mjs` covers sorting correctness, duplicate stability, pause/resume, stepping, reset, replay, counters, invalid inputs, and independence from frame rate. `e2e/visualizer.spec.ts` covers real browser interactions and responsive rendering.

## Next milestones

See [MILESTONES.md](MILESTONES.md). Each milestone ends with verification, an allowance check using `~/codex/usage.py`, and a review handoff.
