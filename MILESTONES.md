# Implementation milestones

## Milestone 1 — Playback foundation

Status: complete; reviewed and approved by the user.

- Insertion sort with smooth Canvas animation and a reproducible default array.
- Play, pause, step, reset, replay, speed, size, and shuffle.
- Pseudocode, operation explanations, metrics, keyboard controls, and reduced motion.
- Pure-model tests and desktop/mobile browser checks.
- Review handoff before expanding algorithm scope.

Verification: all 8 model tests and all 4 Playwright browser tests passed. Browser QA used Firefox because the Chromium download server rejected the environment's location. Layout checks covered 320, 390, 768, 1024, and 1440 pixels, followed by desktop/mobile screenshot review. The production TypeScript/Vite build passed; the final release build is part of packaging.

## Milestone 2 — Algorithms and datasets

Status: implemented and verified; awaiting user review before milestone 3.

- Extend the operation model for writes and algorithm-specific highlights.
- Add bubble sort, selection sort, merge sort, and quicksort.
- Add sorted, reversed, nearly sorted, and duplicate-heavy datasets.
- Verify each algorithm, common playback behavior, and dataset preservation.

Algorithm changes restore the exact original input. Shuffle preserves the original input's multiset, including during merge writes. Merge comparisons read an explicit auxiliary buffer; its placements into the main array count as one write each. Pivot and minimum highlights follow element identities through swaps. The sidebar presents each algorithm's pseudocode, stability, and best/average/worst time and space complexity.

Verification: all 19 model tests and 12 Firefox browser tests passed. Model tests cover every preset at multiple sizes and seeds, stable duplicate ordering where promised, known operation counts, interrupted merge writes, and common playback behavior. Browser tests cover every algorithm, dataset changes, original-input preservation, keyboard controls, reduced motion, and responsive layouts. Desktop/mobile screenshots were reviewed; the final release build is part of packaging.

## Milestone 3 — Exploration tools

Pending review of milestone 2.

- Timeline scrubbing with replay checkpoints.
- Side-by-side comparison using the same original dataset.
- Explain differences using operation counts; separate animation speed from benchmarks.

## Allowance workflow

Run `python3 ~/codex/usage.py` before implementation, after each implementation step, and at each milestone handoff. Inspect both the five-hour and weekly windows before starting more work. If the script fails or the remaining allowance is too low for the next step, preserve progress and stop rather than assume capacity. Review checkpoints are separate from allowance checks.
