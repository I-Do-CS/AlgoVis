# AlgoVis (Algorithm Visualizer)

Created by **Ali Ghelichkhani**. A browser-based sorting and searching visualizer built with React, TypeScript, Vite, and Canvas.

[Source code on GitHub](https://github.com/I-Do-CS/AlgoVis). The application lives directly in the repository root.

## Develop

Use Node.js 22.12+ and a native npm installation for your operating system.

```sh
git clone https://github.com/I-Do-CS/AlgoVis.git
cd AlgoVis
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

Seven sorting algorithms: insertion sort, bubble sort, selection sort, merge sort, quicksort, counting sort, and radix sort. Two searching algorithms: linear search and binary search. All use the same playback controls: play/pause, stepping forward and backward, timeline scrubbing, reset, replay, and live speed changes. Arrays default to 50 elements and can be resized from 8 to 96.

Five dataset presets: random, sorted, reversed, nearly sorted, and many duplicates. Switching sorting algorithms restores the exact original array; binary search uses an explicitly labeled ascending copy. Changing dataset or size cancels playback and creates a fresh input. Shuffle permutes the original values, preserving their multiset even while merge sort has temporarily overwritten some main-array values. Shuffle changes ordered presets to Random; duplicate-heavy inputs keep their preset.

The Canvas shows smooth swaps and writes, active ranges, quicksort pivots, selection-sort minima, merge sort's auxiliary buffer, frequency buckets and cumulative positions for counting sort, decimal digit passes for radix sort, and search probes, targets, and remaining candidate ranges. The sidebar follows the selected algorithm with pseudocode, operation explanations, stability, and best/average/worst time and space complexity. Includes keyboard controls, responsive layouts, reduced-motion support, live metrics, and inspectable array values.

**Explore** follows one algorithm with pseudocode. **Compare** runs two algorithms on exactly the same original input, with a shared timeline and step rate. A finished side holds its final state while the other continues. The panels appear side by side on desktop and stack on smaller screens. Once both finish, sorting results identify fewer comparisons, main-array writes, and visual steps, including ties. Search results compare value-to-target probes and visual steps. Selecting the same algorithm twice is supported.

The timeline uses completed operation counts. Scrubbing pauses playback and restores the requested state, counters, highlights, and identities. A shared timeline extends to the longer trace; shorter traces remain at their endpoint. Seeking resets the animation timer, which then measures playback since the most recent seek or reset. Changing view mode or either comparison algorithm restarts both players from their shared original input.

- Space: play or pause
- Right arrow (English) / Left arrow (Persian): finish one operation and pause
- Left arrow (English) / Right arrow (Persian): return to the previous operation boundary and pause
- R: restore the exact starting array

Shortcuts defer to focused form controls. Playback time measures animation time and is not a CPU benchmark. The operation count includes visualized selections and range splits as well as comparisons, swaps, and writes. A swap counts as two main-array writes. Merge sort counts each placement back into the main array as one write; preparing its auxiliary buffer is excluded. Counting and radix sorts count only placements back into the main array as writes. Their bucket updates, prefix accumulation, stable output placements, and digit-pass setup are visual steps, and they perform no pairwise sorting comparisons.

## Searching

Use the **Sorting / Searching** switch to choose the algorithm family. Both families support Explore and Compare, shared playback controls, timeline scrubbing, keyboard navigation, live statistics, and English/Persian localization.

Enter a finite target number or choose **Pick an array value**. Target changes reset both searches and clear previous results. Empty or invalid target input disables playback until corrected. Linear search follows the selected dataset order and returns the first match. Binary search requires ascending input: the session preserves the source dataset and prepares a sorted copy before playback. A visible hint explains that displayed positions refer to this copy. If either active comparison algorithm is binary search, both searches receive the same ascending copy and target; two linear searches use the original dataset order. Switching back to linear Explore or to sorting restores the source order.

Searches leave values and identities unchanged. One comparison means one value-to-target probe. Results report a match at a position starting from 1, or explicitly report that the target is absent. Binary search may return any matching duplicate. Seeking backward clears results that have not yet occurred. The sorting preparation cost for binary search is excluded from search operation counts, playback time, and the displayed search complexity.

Counting sort supports safe integers with a value range of at most 1024. Radix sort uses stable decimal counting passes and accepts safe integers whose normalized key range is safe; negative inputs use a common offset. The app's generated integer values are within both domains. Bucket panels show frequencies, cumulative counts, next output positions starting from zero, and copy-back phases; these intermediate positions are separate from the result positions starting from 1.

## Languages and direction

The header's EN / فارسی toggle switches between English and Persian, remembers the choice in browser storage, and updates document language, direction, title, and description. Switching language preserves the active input, algorithms, timeline, speed, counters, and playback state. Supported browsers crossfade through a View Transition; other browsers use a brief fade. Reduced-motion preferences disable the effect, and rapid switches cancel earlier transitions.

Persian uses RTL page flow, logical CSS spacing, localized numerals and narration, mirrored playback icons, RTL range controls, and the Vazirmatn font. In Persian, Left advances and Right goes back; native focused controls retain their own keyboard behavior. Comparison panels are labeled first/second in Persian, following the mirrored reading order. Pseudocode, mathematical expressions, visual array order, and inspected value lists retain explicit LTR scopes. The AlgoVis brand and creator credit are directionally isolated. The credit displays **Ali Ghelichkhani** in English and **علی قلیچ خانی** in Persian; both link to [the creator's GitHub profile](https://github.com/I-Do-CS).

`src/i18n/catalog.ts` holds typed English/Persian message pairs, number formatting, dataset names, and localized algorithm metadata. Operations record structured narration keys and numeric parameters, allowing a paused or running trace to translate without rebuilding it. `LanguageProvider.tsx` owns locale preferences, document metadata, and transition lifecycle. Add new interface text to the paired catalog rather than hard-coding one language in a component.

Vazirmatn, DM Sans, and Manrope are hosted under `public/fonts` so font delivery does not depend on external requests. Their SIL Open Font License notices are included alongside the assets. Font sources: [Vazirmatn](https://github.com/rastikerdar/vazirmatn) and [Google Fonts](https://github.com/google/fonts).

## Architecture

- `src/sorting/types.ts`: shared operation types, element identities, and algorithm metadata.
- `src/sorting/algorithms.ts`, `insertion.ts`, and `distribution.ts`: record operations without mutating input. Quicksort uses a last-element pivot, recurses only on the smaller partition, and iterates over the larger partition to bound call-stack space by O(log n).
- `src/searching/algorithms.ts`: linear and binary search traces with target probes, shrinking ranges, and terminal found/not-found events. Binary traces reject unsorted input; the session handles the visible preparation.
- `src/sorting/datasets.ts`: reproducible presets and multiset-preserving shuffles.
- `src/sorting/player.ts`: pure playback model driven by elapsed time, supporting swaps, buffer writes, search probes/results, target changes, and checkpoint-based seeking. A checkpoint stores the item references and counters every 64 operations; seeking replays at most 63 operations after restoring one.
- `src/sorting/session.ts`: shared input and playback controller for one or two players, including comparison seek, reset, completed-player hold, algorithm/family changes, a shared search target, and sorted-copy preparation without losing the source order.
- `src/hooks/usePlaybackClock.ts`: one browser animation clock advances the session. React updates controls and counters separately.
- `src/components/BarCanvas.tsx`: Canvas rendering and interpolated swaps/writes; canvases do not advance their own players.
- `src/components/PlaybackControls.tsx`, `ArrayPlot.tsx`, `ComparisonView.tsx`, `BucketPanel.tsx`, and `SearchSetup.tsx`: shared playback UI, chart presentation, bucket phases, target input, and comparison panels/results.

Traces are precomputed for bounded arrays. Quadratic algorithms can record O(n²) events. Merge events retain shared immutable run buffers for their source reads. Checkpoint arrays share immutable items while preserving each operation boundary's ordering. The displayed algorithm-space complexity excludes the visualization trace and playback state. Larger datasets would benefit from buffered operation generation and a configurable checkpoint interval.

Merge sort can temporarily duplicate or omit a value in the main array while copying from its buffer; the original input and buffered values remain intact. Buffer comparisons highlight the auxiliary row, rather than implying reads from overwritten main-array positions. Stable algorithms preserve equal-valued elements' original identities. Selection sort and quicksort are marked unstable.

The model suites cover all algorithms and presets, duplicate stability, known counts, pause/resume, stepping, reset, replay, interrupted merge writes, original-input preservation, frame rates, checkpoint boundaries, seeking, and comparison synchronization. The Playwright suites cover real browser interactions, comparison results, responsive rendering, reduced motion, AlgoVis branding, and creator credit.

## Development milestones

The current release includes seven sorting algorithms, two searching algorithms, five dataset presets, timeline scrubbing, synchronized comparisons, bucket/pass displays, target selection, and English/Persian localization with RTL support. See [MILESTONES.md](MILESTONES.md) for implementation history.

## Hosting

`npm run build` creates the static application in `dist/`, which can be served by a static web host. The footer links to this public repository in both languages.
