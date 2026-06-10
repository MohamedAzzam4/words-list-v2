# Comprehensive Test Plan: Word Counting, Leaderboard Sync, and Trophy Evaluation

**Objective:** Investigate and definitively isolate the bug causing massive inflation in "Known Words" (e.g., jumping from 30 to 257 known words), ensuring accuracy across the local Dashboard, cloud Leaderboard, and Trophy systems.

This plan contains **40+ rigorous, specific test cases** broken down into 6 distinct phases. 

---

## Phase 1: Local Storage & Data Migration Isolation (DATA)
*Focus: Investigate if the local `known` array is being artificially inflated during boot, migration, or due to cross-level contamination.*

| Test ID | Task / Scenario | What is Checks Specifically | Expected Output |
|---------|-----------------|-----------------------------|-----------------|
| DATA-001 | Empty state initialization | Checks if `known` array defaults to `[]` on fresh install. | `localStorage` shows `known: []`. |
| DATA-002 | Single word mark | Checks if `markCard(true)` pushes exactly 1 valid string ID (e.g., "1-0"). | `known.length === 1`. No duplicates. |
| DATA-003 | Duplicate click prevention | Simulates clicking "Known" 10 times on the same card. | `known.length === 1`. `Set` deduplication works. |
| DATA-004 | Numeric ID Migration - A1 | Injects `[1, 2, 3]` numeric IDs on boot. | `known` converts to `["1-1", "1-2", "1-3"]` exactly. length = 3. |
| DATA-005 | Numeric ID Migration - B2 | Injects `[0, 1]` numeric IDs in B2 level. | `known` converts to `["1-0", "1-1"]`. length = 2. |
| DATA-006 | Double Migration Prevention | Reloads page after DATA-004 completes. | `known` array remains length 3. Array does not double to 6. |
| DATA-007 | Cross-App Namespace Isolation | Mark 5 words in A1. Switch to B2. Mark 2 words. | A1 localStorage has 5 words. B2 localStorage has 2. They do not merge. |
| DATA-008 | Stale Array Contamination | Switch from A1 to B2 without hard refresh. | `knownIds` Set clears completely before loading B2 progress. |

## Phase 2: Firebase Sync & Data Merge Logic (SYNC)
*Focus: Investigate if `mergeProgress()` is appending cloud arrays to local arrays without deduplicating, causing exponential inflation every sync.*

| Test ID | Task / Scenario | What is Checks Specifically | Expected Output |
|---------|-----------------|-----------------------------|-----------------|
| SYNC-001 | Identical Merge | Local has `["1-0"]`. Cloud has `["1-0"]`. | Merged array is `["1-0"]`. Length 1. |
| SYNC-002 | Disjoint Merge | Local has `["1-0"]`. Cloud has `["2-0"]`. | Merged array is `["1-0", "2-0"]`. Length 2. |
| SYNC-003 | Overlapping Merge | Local has `["1-0", "1-1"]`. Cloud has `["1-1", "1-2"]`. | Merged array is `["1-0", "1-1", "1-2"]`. Length 3. (No duplicate "1-1"). |
| SYNC-004 | Massive Cloud Payload | Cloud pushes 500 words. Local has 0. | Local updates to exactly 500 words. |
| SYNC-005 | Legacy Sync Fallback | Cloud pushes legacy numeric IDs. | App migrates them locally and pushes strings back. Length stays accurate. |
| SYNC-006 | Rapid Sync Collision | Trigger save twice before first Firestore response. | Firestore `merge:true` handles race condition. Known count stable. |
| SYNC-007 | Logout / Login Cycle | Login, mark 5 words, logout, login. | Known array equals exactly 5. No duplication upon re-authenticating. |

## Phase 3: Dashboard & StatsService Math (STAT)
*Focus: Investigate if the UI is miscalculating the array length or summing across the wrong parameters.*

| Test ID | Task / Scenario | What is Checks Specifically | Expected Output |
|---------|-----------------|-----------------------------|-----------------|
| STAT-001 | Total Known Count Match | `known` array has 30 items. | Dashboard large blue number displays exactly "30". |
| STAT-002 | Total Words Reference | App is A1 (711 words). | Dashboard "Out of X" displays exactly "711". |
| STAT-003 | Percentage Math (Low) | `known.length = 7`. Total = 711. | Math.round(7/711*100) = 1. Dashboard displays "1%". |
| STAT-004 | Percentage Math (High) | `known.length = 700`. Total = 711. | Math.round(700/711*100) = 98. Dashboard displays "98%". |
| STAT-005 | Per-Unit Math | Unit 1 has 30 words. 15 are known. | Unit 1 progress bar is exactly 50%. Text is "15/30". |
| STAT-006 | Weakest Unit Calculation | Unit 1 is 100%, Unit 2 is 0%. | "Weakest Unit" displays "Unit 2". |
| STAT-007 | Weakest Unit (Tiebreaker) | Unit 1 is 5%, Unit 2 is 5%. | Displays either Unit 1 or 2 consistently without crashing. |
| STAT-008 | Stale `knownSet` Fallback | Simulate `knownSet` not being initialized. | `StatsService` correctly falls back to `state.data.known.length`. |

## Phase 4: Leaderboard Calculation & Multi-Level Aggregation (LEAD)
*Focus: Investigate why the Leaderboard showed 266 words when Dashboard showed 257. Identify if the new dynamic `levels` map is double-counting legacy fields.*

| Test ID | Task / Scenario | What is Checks Specifically | Expected Output |
|---------|-----------------|-----------------------------|-----------------|
| LEAD-001 | Firestore Batch Payload | User has 30 words in A1, 0 in B2. | `batchSaveProgressAndLeaderboard` pushes `levels: { a1: 30 }`. |
| LEAD-002 | Dual Level Aggregation | User has 30 in A1, 20 in B2. | Firestore `levels: { a1: 30, b2: 20 }`. `computeTotalWords()` = 50. |
| LEAD-003 | Legacy Double-Count Prevention | Firestore has `levels: {a1:30}`, but ALSO has legacy `a1Count: 30`. | `computeTotalWords()` = 30. (Ignores legacy fields if `levels` exists). |
| LEAD-004 | Legacy Only Fallback | Firestore ONLY has `a1Count: 30` (no `levels` map). | `computeTotalWords()` = 30. |
| LEAD-005 | Invalid Data Type Handling | Firestore has `levels: { a1: "thirty" }`. | `computeTotalWords()` ignores string, returns 0 (prevents NaN/crashes). |
| LEAD-006 | Leaderboard Rendering | `totalWords` is 50. | Leaderboard table correctly prints `50` in the blue font column. |
| LEAD-007 | Rank calculation | User A=50, B=30, C=60. | User C is #1, A is #2, B is #3. |
| LEAD-008 | Leaderboard Realtime Update | User gets 5 new words and triggers sync. | Leaderboard re-fetches and shows +5 total words for that user. |

## Phase 5: Trophy System Re-Evaluation (TROPHY)
*Focus: Ensure the inflated word count bug didn't permanently unlock incorrect trophies, and test how trophies react to word arrays.*

| Test ID | Task / Scenario | What is Checks Specifically | Expected Output |
|---------|-----------------|-----------------------------|-----------------|
| TROPHY-001 | `slay_vocab` (50 words) | Array goes from 49 to 50 items. | `slay_vocab` trophy unlocks immediately. |
| TROPHY-002 | `vocab_vault` (100 words) | Array goes from 99 to 100 items. | `vocab_vault` unlocks immediately. |
| TROPHY-003 | `a1_conqueror` (100% completion) | `known.length === 711` in A1. | Trophy unlocks. |
| TROPHY-004 | Reverse Completion Prevention | User has 50 words, unlocks trophy, then array drops to 40 (due to bug/clear). | Trophy remains unlocked. (Trophies cannot be lost once earned). |
| TROPHY-005 | Level Specificity | User gets 100 words in A1. | `vocab_vault` unlocks in A1 localStorage. Does NOT show in B2 unless B2 > 100. |
| TROPHY-006 | On_Fire Milestone 1 | 50 words reviewed. | `on_fire` unlocks at Tier 1. |
| TROPHY-007 | Trophy Shelf Sync | Earn trophy locally, refresh page. | Trophy is retrieved from `localStorage` correctly. |

## Phase 6: E2E Bug Reproduction Scripts (REPRO)
*Focus: Automated stress tests attempting to force the 257-word glitch.*

| Test ID | Task / Scenario | What is Checks Specifically | Expected Output |
|---------|-----------------|-----------------------------|-----------------|
| REPRO-001 | Spam Click Mark | Click "Mark Known" 100 times in 2 seconds on 3 cards. | known.length = 3. Firestore quota respected. Count does not inflate. |
| REPRO-002 | Network Toggle Merge | Go offline -> mark 5 words -> go online -> mark 5 words -> trigger sync. | Merged array is exactly 10 words. |
| REPRO-003 | Unit Thrashing | Switch units 50 times while rapidly marking cards. | `StatsService` correctly maintains accurate counts without memory leaks or stale variable accumulation. |
| REPRO-004 | Auth Thrashing | Login, close tab mid-sync, reopen, login again. | State initialization prevents corrupt array duplication. |

---

## Conclusion
If the dashboard shows 257 words but the leaderboard shows 266, it is highly likely that either:
1. `computeTotalWords()` in `firebase.js` is double-counting legacy fields (`a1Count` + `levels.a1`).
2. `mergeProgress()` in `auth-service.js` is duplicating items during cloud-to-local sync because of string/numeric ID mismatch.

This test plan will definitively expose the flaw.
