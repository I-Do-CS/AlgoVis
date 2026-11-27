# AlgoVis

Step through a sort, rewind to see how it got there, or compare two algorithms on the same input. The interface and step-by-step narration are available in English and فارسی, including a right-to-left layout.

## What to try

- **Explore:** Follow an algorithm with highlighted operations, pseudocode and complexity notes.
- **Compare:** Pick two algorithms and use one timeline to compare their operations on the same data.
- **Search:** Pick a target and follow linear or binary search. Binary search uses a labeled, sorted copy of the input.

| Family | Algorithms |
| --- | --- |
| Comparison sorts | Insertion, bubble, selection, merge, quicksort |
| Distribution sorts | Counting, radix |
| Searches | Linear, binary |

## Run locally

Use Node.js 22.12 or newer. From the repository root:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. Try merge sort and quicksort on a nearly sorted dataset, then scrub backward to revisit the comparisons and writes.

## How playback works

The algorithm modules generate [sorting](src/sorting/) and [searching](src/searching/) traces. The [player](src/sorting/player.ts) uses checkpoints to replay from nearby states when you seek. The [session controller](src/sorting/session.ts) keeps both sides of Compare on the same timeline. For comparisons, use operation counts. Elapsed time measures playback.

## Checks

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Independent project developed with AI assistance.
