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

Status: complete; reviewed and approved by the user.

- Timeline scrubbing with replay checkpoints.
- Side-by-side comparison using the same original dataset.
- Explain differences using operation counts; separate animation speed from benchmarks.

The timeline restores snapshots from checkpoints every 64 operations and replays at most 63 operations to reach the selected step. Seeking pauses playback, clears partial transitions, restores operation counters and element identities, and resets the animation timer. Previous-step navigation is available through a button and the Left arrow key.

Explore uses one active player. Compare uses one clock for both players and advances them at the same operations-per-second rate. A finished player holds its final array while its partner continues. Changing an algorithm, input, or mode resets both players to the shared original input. Both views support timeline seeking, stepping, pause/resume, reset, shuffle, and speed changes. Results compare counts after both algorithms finish and distinguish visual steps and animation time from CPU benchmarks.

Project corrections: renamed the app and package to AlgoVis (Algorithm Visualizer); moved the application, dependencies, and Git history directly into `/home/idocs/projects/algovis`; credited Ali Ghelichkhani in the visible footer, README, package author, and HTML author metadata. The existing Site identity and access settings are preserved.

Verification: 30 model tests and 18 Firefox browser tests passed. New coverage includes checkpoint boundaries, reverse seeking, interrupted merge writes, shared inputs and step rates, completed-player hold, comparison results, branding/credit, and mobile/desktop comparison layouts. Explore and Compare screenshots were reviewed. The final TypeScript/Vite production build is part of packaging.

## Milestone 4 — English/Persian and RTL

Status: implemented and verified locally; publication blocked by repeated source-upload connection resets.

- Header language toggle with persistent preference and smooth, cancelable transitions.
- Persian labels, algorithm metadata, live narration, dataset names, comparison results, tooltips, accessibility labels, and number formatting.
- Document language/direction updates, logical layout spacing, mirrored controls, and RTL keyboard/range behavior.
- Explicit LTR scopes for code, math, array coordinates, and inspected values; isolated brand and creator credit.
- State-preserving switching in Explore and Compare, including paused merge writes and active playback.
- Locally hosted Vazirmatn, DM Sans, and Manrope, with their font licenses.

Verification: all 33 model/localization tests and 25 Firefox browser tests passed. Browser coverage includes locale persistence, rapid switch requests, reduced-motion and legacy-browser fallbacks, RTL shortcuts, state preservation, comparison results, LTR islands, header alignment, and layouts from 320 to 1440 pixels. Persian desktop/mobile screenshots were reviewed. An observed fallback-animation cancellation issue was fixed, and external English-font requests that intermittently blocked page load were replaced with local assets. The final production build is part of packaging.

Publication recovery: the final production build passed, and the feature was committed locally as `a1514caa6b813df2a746f913e85bbfd683b3681f`. Three source pushes ended with `RPC failed; curl 56 Recv failure: Connection reset by peer`. Recovery included reconciling the existing remote, fresh credentials, HTTP/1.1, and a larger upload buffer; Git transport changes were temporary process settings. No new Site version was saved or deployed, so the live Site remains on milestone 3. Preserve the existing project ID, reconcile remote state again, and retry the Sites source/package/deploy workflow after upload connectivity recovers. The application source and build remain available locally; this status note was added after the feature commit.

## Milestone 5 — Public GitHub repository

The public repository is [I-Do-CS/AlgoVis](https://github.com/I-Do-CS/AlgoVis). The footer includes a GitHub link in English and Persian, and the README includes clone and development instructions. The application remains credited to Ali Ghelichkhani.

Verification: all 33 model/localization tests and the production build pass. Targeted Firefox checks cover branding and Persian layouts across phone, tablet, and desktop sizes.

## Milestone 6 — Counting and radix sorting

Added stable Counting Sort and decimal LSD Radix Sort with immutable bucket states, frequency counting, cumulative positions, stable output placement, and animated main-array writes. Both integrate with Explore, Compare, checkpoint seeking, speed controls, reset/replay, and English/Persian narration. Counting sort bounds the integer value range to 1024; radix sort validates safe integer keys and supports negative values through an offset.

Verification at this checkpoint: 40 model/localization tests and the production build passed, including every generated preset, signed integers, duplicate stability, per-pass radix ordering, write counts, input validation, and checkpoint restoration.

## Milestone 7 — Linear and binary searching

Added the Sorting/Searching family switch, shared search targets, value picker, probe operations, candidate ranges, terminal results, and search-aware statuses, metrics, legends, and explanations. Search playback reuses the existing clock, timeline, stepping, and comparison controls. Linear search returns the first match; binary search may return any matching duplicate. Search result positions start at 1.

The session retains the source dataset while preparing an explicitly labeled ascending copy for binary search. If either active comparison is binary, both searches use the same sorted copy and target. Returning to linear Explore or sorting restores source order. Preparing that copy is excluded from the search operation counts and complexity. Invalid target input disables playback; target changes clear previous results.

Verification at this checkpoint: all 47 model/localization tests and the production build passed, including empty arrays, hits/misses, duplicates, negative/fractional targets, probe bounds, comparison limits, result visibility, checkpoint seeking, pause/replay, target reset, source-order restoration, and sorted-input validation.

## Milestone 8 — Release 0.5.0 verification

All 32 Firefox browser checks passed, including Counting/Radix playback, search hits/misses and target validation, shared search inputs/results, reverse seeking, existing sorting behavior, and English/Persian layouts from 320 to 1440 pixels. A Persian search-setup grid overflow at tablet width was fixed. Persian desktop and mobile screenshots were reviewed. The README documents the new algorithm families, domains, preparation, and metric semantics; the existing GitHub footer and creator credit are retained.

## Allowance workflow

Run `python3 ~/codex/usage.py` before implementation, after each implementation step, and at each milestone handoff. Inspect both the five-hour and weekly windows before starting more work. If the script fails or the remaining allowance is too low for the next step, preserve progress and stop rather than assume capacity. Review checkpoints are separate from allowance checks.
