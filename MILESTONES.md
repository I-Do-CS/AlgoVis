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

Status: complete; reviewed and approved by the user.

- Extend the operation model for writes and algorithm-specific highlights.
- Add bubble sort, selection sort, merge sort, and quicksort.
- Add sorted, reversed, nearly sorted, and duplicate-heavy datasets.
- Verify each algorithm, common playback behavior, and dataset preservation.

Algorithm changes restore the exact original input. Shuffle preserves the original input's multiset, including during merge writes. Merge comparisons read an explicit auxiliary buffer; its placements into the main array count as one write each. Pivot and minimum highlights follow element identities through swaps. The sidebar presents each algorithm's pseudocode, stability, and best/average/worst time and space complexity.

Verification: all 19 model tests and 12 Firefox browser tests passed. Model tests cover every preset at multiple sizes and seeds, stable duplicate ordering where promised, known operation counts, interrupted merge writes, and common playback behavior. Browser tests cover every algorithm, dataset changes, original-input preservation, keyboard controls, reduced motion, and responsive layouts. Desktop/mobile screenshots were reviewed; the final release build is part of packaging.

## Milestone 3 — Exploration tools

Status: implemented and verified; ready for user review.

- Timeline scrubbing with replay checkpoints.
- Side-by-side comparison using the same original dataset.
- Explain differences using operation counts; separate animation speed from benchmarks.

The timeline restores snapshots from checkpoints every 64 operations and replays at most 63 operations to reach the selected step. Seeking pauses playback, clears partial transitions, restores operation counters and element identities, and resets the animation timer. Previous-step navigation is available through a button and the Left arrow key.

Explore uses one active player. Compare uses one clock for both players and advances them at the same operations-per-second rate. A finished player holds its final array while its partner continues. Changing an algorithm, input, or mode resets both players to the shared original input. Both views support timeline seeking, stepping, pause/resume, reset, shuffle, and speed changes. Results compare counts after both algorithms finish and distinguish visual steps and animation time from CPU benchmarks.

Project corrections: renamed the app and package to AlgoVis (Algorithm Visualizer); moved the application, dependencies, and Git history directly into `/home/idocs/projects/algovis`; credited Ali Ghelichkhani in the visible footer, README, package author, and HTML author metadata. The existing Site identity and access settings are preserved.

Verification: 30 model tests and 18 Firefox browser tests passed. New coverage includes checkpoint boundaries, reverse seeking, interrupted merge writes, shared inputs and step rates, completed-player hold, comparison results, branding/credit, and mobile/desktop comparison layouts. Explore and Compare screenshots were reviewed. The final TypeScript/Vite production build is part of packaging.

## Allowance workflow

Run `python3 ~/codex/usage.py` before implementation, after each implementation step, and at each milestone handoff. Inspect both the five-hour and weekly windows before starting more work. If the script fails or the remaining allowance is too low for the next step, preserve progress and stop rather than assume capacity. Review checkpoints are separate from allowance checks.
