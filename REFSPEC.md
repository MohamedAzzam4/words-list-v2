# REFSPEC.md — Master Implementation Blueprint

**Project:** words-list-v2  
**Repository:** https://github.com/MohamedAzzam4/words-list-v2  
**Live Website:** https://mohamedazzam4.github.io/words-list-v2/  
**Date:** 2026-06-07  
**Author:** Principal Engineer / Software Architect / Technical Program Manager  
**Purpose:** Convert all engineering audit findings into an executable, task-by-task implementation plan suitable for delegation to smaller coding models (GLM, Gemini Flash, coding agents).

---

## Table of Contents

1. [Findings Resolution Table](#1-findings-resolution-table)
2. [Work Packages](#2-work-packages)
3. [Rejected and Deferred Items](#3-rejected-and-deferred-items)
4. [Execution Strategy](#4-execution-strategy)
5. [Final Section — Risk, Quick Wins, Delegation Guide](#5-final-section)

---

## 1. Findings Resolution Table

Every finding from every report is mapped to a disposition: **Work Package**, **Rejected**, or **Deferred**.

| Finding ID | Description | Source Report | Disposition | WP / Justification |
|------------|-------------|---------------|-------------|---------------------|
| BUG-1a | Trophy evaluate() not called after markCard() | Critical Bugs Investigation | **Work Package** | WP-001 |
| BUG-1b | Trophy evaluate() restricts known to current unit | Critical Bugs Investigation | **Work Package** | WP-002 |
| BUG-1c | Trophy evaluate() does not call _save() | Critical Bugs Investigation | **Work Package** | WP-003 |
| BUG-2a | Logout deletes localStorage | Critical Bugs Investigation | **Work Package** | WP-006 |
| BUG-2b | _onAuth() does not call _save() after merge | Critical Bugs Investigation | **Work Package** | WP-007 |
| BUG-2c | Fire-and-forget Firestore writes race condition | Critical Bugs Investigation | **Work Package** | WP-008 |
| BUG-3 | Word IDs are fragile numeric indices | Critical Bugs Investigation | **Work Package** | WP-009, WP-010 |
| BUG-4 | Excessive Firestore writes (no debouncing) | Critical Bugs Investigation | **Work Package** | WP-011 |
| BUG-5 | Session counters never reset | Test Report | **Work Package** | WP-014 |
| BUG-6a | darkModeStudyMinutes inflation | Test Report | **Work Package** | WP-017 |
| BUG-6b | totalStudyTimeMs inflation | Test Report | **Work Package** | WP-018 |
| BUG-6c | _sessionStartTime persisted in localStorage | Test Report | **Work Package** | WP-019 |
| BUG-7 | Trophy description/requirement mismatches (6) | Test Report | **Work Package** | WP-004 |
| BUG-8 | Multi-earn trophies disabled | Test Report | **Work Package** | WP-005 |
| BUG-9 | B2 type-based trophies unearnable | Test Report | **Work Package** | WP-015 |
| BUG-10 | Quiz score persists across unit switch | Test Report | **Work Package** | WP-020 |
| BUG-11 | returnedAfter7Days never clears | Test Report | **Work Package** | WP-016 |
| BUG-12 | calcStreak breaks on duplicate dates | Test Report | **Work Package** | WP-021 |
| H-1 | A2/B1 links lead to 404 | Engineering Audit, Platform Audit | **Work Package** | WP-023 |
| H-2 | Monolithic app.js (822 lines) | Engineering Audit, Platform Audit | **Work Package** | WP-026, WP-027, WP-028, WP-029, WP-030 |
| H-3 | HTML duplication (a1.html ≈ b2.html) | Engineering Audit, Platform Audit | **Work Package** | WP-031 |
| H-4 | 13-15 trophies have req: p => false | Engineering Audit, Test Report | **Work Package** | WP-032 |
| H-5 | Leaderboard level detection hardcoded | Engineering Audit | **Work Package** | WP-033 |
| H-6 | innerHTML XSS risk | Platform Audit | **Work Package** | WP-034 |
| H-7 | No error boundaries | Engineering Audit, Platform Audit | **Work Package** | WP-035 |
| H-8 | TTS German voice unreliable | Engineering Audit | **Deferred** | See §3 |
| H-9 | Study sessions not tracked for partial sessions | Runtime Validation | **Work Package** | WP-022 |
| M-1 | No URL state/routing | Engineering Audit | **Deferred** | See §3 |
| M-2 | No glossary search | Engineering Audit | **Deferred** | See §3 |
| M-3 | TTS declension regex missing "er" | Test Report | **Work Package** | WP-036 |
| M-4 | toggleColumn only hides one column | Test Report | **Work Package** | WP-037 |
| M-5 | No debouncing on _save() | Engineering Audit | **Work Package** | WP-011 (same) |
| M-6 | Unbounded flashcard queue | Engineering Audit | **Deferred** | See §3 |
| M-7 | studyDates array unbounded | Engineering Audit | **Work Package** | WP-038 |
| M-8 | modesUsed array unbounded | Test Report | **Work Package** | WP-039 |
| M-9 | Inconsistent data schema A1 vs B2 | Platform Audit | **Work Package** | WP-015 (same) |
| M-10 | B2 unitTitles entry #25 wrong | Critical Bugs Investigation | **Work Package** | WP-040 |
| M-11 | portal_walker crossLevel flag mismatch | Test Report | **Work Package** | WP-004 (grouped) |
| M-12 | skibidi_sprecher desc/req mismatch | Test Report | **Work Package** | WP-004 (grouped) |
| M-13 | Duplicate import in logout() | Test Report | **Work Package** | WP-024 |
| L-1 | Dead code in utils.js | Engineering Audit, Platform Audit | **Work Package** | WP-024 |
| L-2 | Dead code in firebase.js | Engineering Audit, Platform Audit | **Work Package** | WP-024 |
| L-3 | temp_debug.js in repository | Engineering Audit, Platform Audit | **Work Package** | WP-025 |
| L-4 | AI memory files in repo | Engineering Audit | **Work Package** | WP-025 |
| L-5 | Firebase API key hardcoded / no App Check | Engineering Audit, Platform Audit | **Deferred** | See §3 |
| L-6 | No testing infrastructure | Platform Audit | **Deferred** | See §3 |
| L-7 | localStorage data not encrypted | Platform Audit | **Rejected** | See §3 |
| L-8 | No GDPR compliance | Engineering Audit | **Deferred** | See §3 |
| L-9 | Unused CSS classes | Engineering Audit | **Work Package** | WP-041 |
| L-10 | Firebase Analytics measurementId unused | Platform Audit | **Work Package** | WP-024 (grouped) |
| L-11 | Mixed naming conventions | Engineering Audit | **Rejected** | See §3 |
| L-12 | Leaderboard user highlighting by displayName | Critical Bugs Investigation | **Work Package** | WP-042 |
| L-13 | No keyboard navigation for flashcards | Platform Audit | **Deferred** | See §3 |
| INCORRECT-1 | "IDs corrupted from strings to numbers" | Runtime Validation | **Rejected** | Disproven by Critical Bugs Investigation. IDs are numeric from creation. |
| INCORRECT-2 | "Progress lost after logout" | Runtime Validation | **Rejected** | Partially incorrect. Data IS restored from Firebase into memory. See BUG-2. |
| INCORRECT-3 | "ID type mismatch causes trophy failure" | Runtime Validation | **Rejected** | IDs are consistently numeric. Real causes are BUG-1a/1b/1c. |
| INCORRECT-4 | "TTS increments ttsCount twice" | Runtime Validation | **Rejected** | tts.js checks `window.app.userData` which doesn't exist. Count incremented only once in app.js. |

---

## 2. Work Packages

---

### WP-001 — Add trophy evaluate() call after progress-changing actions

#### Objective
Call `engines.trophy.evaluate()` after every user action that changes progress state.

#### Why It Exists
**BUG-1a**: `evaluate()` is only called in `switchUnit()` (app.js:473). It is never called after `markCard()`, `toggleFavorite()`, `checkArticleAnswer()`, or during `_initEngines()`. Users can mark dozens of words as known and never trigger trophy evaluation.

#### Priority
**Critical**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
None — can be done first.

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. Locate the `markCard(known)` method (line ~397-401).
3. After the existing `this._renderUnitList();` call, add a call to evaluate trophies. The call should pass `state.data` and ALL vocabulary words (see WP-002 for the correct word set — for now, use `levelConfig.vocabulary[state.unit]` and WP-002 will fix the scope).
4. Locate `toggleFavorite(id)` method (line ~403-415). After `this._save();`, add the same trophy evaluate call.
5. Locate `checkArticleAnswer(a, btn)` method (line ~423-426). After `this._save();`, add the same evaluate call.
6. Locate `_initEngines()` method (line ~505-550). At the end of the method, after `this._updateTitles(state.unit);`, add the evaluate call so trophies are checked on boot.
7. After each evaluate call, check the return value. If `newlyEarned.length > 0`, call `this._save()` to persist the newly earned trophies (this partially addresses WP-003 from the caller side).

#### Acceptance Criteria
- Marking 10+ flashcards as known immediately shows "First Steps" trophy earned (without requiring a unit switch).
- Trophy evaluation runs on page load if progress already meets criteria.
- Toggling a favorite and answering a quiz question both trigger evaluation.

#### Risks
- Calling evaluate() too frequently could cause performance issues if TROPHIES array grows large. Current 34 trophies is fine.
- Calling `_save()` after evaluate inside `markCard()` means `_save()` is called twice per mark — once from the engine callback, once after evaluate. WP-011 (debouncing) will handle this.

#### Rollback Strategy
Remove the added evaluate() calls from `markCard()`, `toggleFavorite()`, `checkArticleAnswer()`, and `_initEngines()`. The trophy system returns to its previous (broken) state — no worse than before.

---

### WP-002 — Pass ALL vocabulary words to trophy evaluate(), not just current unit

#### Objective
Change the `words` parameter passed to `engines.trophy.evaluate()` to include the entire level's vocabulary, not just the current unit.

#### Why It Exists
**BUG-1b**: `switchUnit()` passes `levelConfig.vocabulary[i]` (current unit only). The evaluate function (trophies.js:104) filters `known` to only words in the current unit. This means trophies like `first_steps` (10+ known words) only work if all 10 are in the same unit.

#### Priority
**Critical**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
- WP-001 (adds the evaluate calls; this WP ensures they pass the right data)

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. In `switchUnit()` (line ~473), change `engines.trophy.evaluate(state.data, words)` to `engines.trophy.evaluate(state.data, levelConfig.vocabulary.flat())`.
3. In every new evaluate call added by WP-001 (`markCard`, `toggleFavorite`, `checkArticleAnswer`, `_initEngines`), ensure the second parameter is `levelConfig.vocabulary.flat()` — the complete flattened vocabulary array for the entire level.
4. Verify that `levelConfig.vocabulary.flat()` produces an array of all word objects across all units. Each word object has `{id, de, en, type, context}`.

#### Acceptance Criteria
- A user who knows 10 words spread across Unit 1 (5 words) and Unit 2 (5 words) earns the "First Steps" trophy.
- The `totalWords` parameter inside evaluate reflects the full level vocabulary count (711 for A1, 3031 for B2).
- Bronze/Silver/Gold percentage trophies calculate against the full level word count.

#### Risks
- `levelConfig.vocabulary.flat()` is called on every progress action. For B2 with 3031 words, this creates a new array each time. Performance impact is negligible for this size, but if concerned, cache the flattened array once at init time.

#### Rollback Strategy
Revert the parameter to `levelConfig.vocabulary[state.unit]`. Trophies return to unit-scoped behavior.

---

### WP-003 — Add _save() call after trophy evaluate() earns new trophies

#### Objective
Ensure that newly earned trophies are persisted to localStorage and Firestore immediately.

#### Why It Exists
**BUG-1c**: When `evaluate()` earns a trophy, it updates `this.trophyCounts` in memory and calls `render()` to update the DOM, but it never triggers `_save()`. On page reload, all earned trophies vanish because `trophyCounts` was never persisted.

#### Priority
**Critical**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
- WP-001 (evaluate calls are in place)

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. In every location where `engines.trophy.evaluate()` is called (all locations from WP-001 + `switchUnit()`), capture the return value: `const earned = engines.trophy.evaluate(state.data, allWords);`
3. After the evaluate call, check: `if (earned && earned.length > 0) { this._save(); }`
4. This ensures that `_save()` syncs `engines.trophy.trophyCounts` to `state.data.trophyCounts` (app.js:775-776) and persists to both localStorage and Firestore.
5. Note: If the evaluate call happens inside `markCard()` which already calls `_save()`, there will be a second `_save()` call only when trophies are earned — this is acceptable and will be consolidated by debouncing in WP-011.

#### Acceptance Criteria
- Earn a trophy (e.g., mark 10 words known to get "First Steps"), then reload the page. Trophy is still shown as earned.
- `localStorage` contains `trophyCounts: { first_steps: 1 }` after earning.
- Firestore progress document contains the same `trophyCounts`.

#### Risks
- Additional `_save()` calls increase Firestore write frequency. WP-011 (debouncing) mitigates this.

#### Rollback Strategy
Remove the conditional `_save()` after evaluate. Trophies earned in a session still show in DOM but won't persist across reloads — same as current broken behavior.

---

### WP-004 — Fix trophy description/requirement mismatches and metadata errors

#### Objective
Correct all trophy definitions where the user-facing description does not match the actual requirement function, and fix metadata flags.

#### Why It Exists
**BUG-7**: Six trophies have descriptions that mislead users about what they need to do.
**M-11**: `portal_walker` has `crossLevel: true` in behavior but `crossLevel` flag inconsistency.
**M-12**: `skibidi_sprecher` description says "Use TTS 25 times" but checks `quizCorrect >= 10`.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/trophies.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/trophies.js`.
2. **APPROVED DECISION**: Fix the requirement code to match the descriptions (descriptions represent the intended user contract). For each mismatch, update the `req` function:

   **Trophy: `bro_studied`** (line ~20)
   - Current desc: "Complete your first flashcard session"
   - Current req: `sessionsCompleted >= 5`
   - Fix: Change req to `sessionsCompleted >= 1` to match "first session"

   **Trophy: `session_stacker`** (line ~35)
   - Current desc: "Complete 10 total sessions"
   - Current req: `sessionsCompleted >= 20`
   - Fix: Change req to `sessionsCompleted >= 10` to match description

   **Trophy: `academic_weapon`** (line ~26)
   - Current desc: "Complete 25 flashcard sessions"
   - Current req: `sessionKnown >= 100`
   - Fix: Change req to `sessionsCompleted >= 25` to match description

   **Trophy: `brain_rot_activated`** (line ~27)
   - Current desc: "Spend 30 min in flashcards in one sitting"
   - Current req: checks total flashcard errors >= 50
   - Fix: Change req to check `totalStudyTimeMs >= 30 * 60 * 1000` (requires WP-018 to fix time tracking first). Alternatively, update description to "Make 50 flashcard errors" if time tracking fix is not yet done.

   **Trophy: `mode_explorer`** (line ~16)
   - Current desc: "Use glossary and flashcard modes in one session"
   - Current req: `modesUsed.length >= 3`
   - Fix: Change req to `modesUsed.length >= 2` to match "glossary and flashcard" (2 modes)

   **Trophy: `i_am_so_cooked`** (line ~28)
   - Current desc: "Fail the same card 5 times in one session"
   - Current req: `p => false` (never earnable)
   - Fix: Implement req to check `Math.max(...Object.values(p.flashcardErrors || {})) >= 5`

   **Trophy: `skibidi_sprecher`** (line ~21)
   - Current desc: "Use text-to-speech 25 times"
   - Current req: `quizCorrect >= 10`
   - Fix: Change req to `(p.ttsCount || 0) >= 25` to match description

3. Verify the `portal_walker` trophy (line ~45-49) has consistent metadata. It currently has `crossLevel: true` in the object. Confirm the evaluate function correctly skips it via the `if (t.crossLevel) continue;` check.

#### Acceptance Criteria
- Each fixed trophy's requirement matches its description exactly.
- A user completing 1 flashcard session earns `bro_studied`.
- A user using glossary + flashcard modes earns `mode_explorer`.
- `skibidi_sprecher` triggers after 25 TTS uses, not 10 quiz correct answers.

#### Risks
- Users who earned trophies under the old (wrong) thresholds may find some trophies easier or harder to earn after the fix. Since multi-earn is disabled and trophies are earned at most once, already-earned trophies are unaffected.

#### Rollback Strategy
Revert the TROPHIES array entries to their previous values. Mismatches return but no data is corrupted.

---

### WP-005 — Implement multi-earn trophy logic

#### Objective
Enable trophies with `multi: true` flag to be earned multiple times at milestone thresholds.

#### Why It Exists
**BUG-8**: Three trophies (`bro_studied`, `on_fire`, `session_stacker`) have `multi: true` but the `evaluate()` method (trophies.js:110) prevents re-earning with `if (currentCount === 0)`.

#### Priority
**Medium**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/core/trophies.js`

#### Dependencies
- WP-004 (fix descriptions first so multi-earn thresholds are correct)

#### Detailed Implementation Plan
1. Open `js/core/trophies.js`.
2. In the `evaluate()` method (line ~107-114), modify the trophy earning logic:
   - Currently: `if (met) { if (currentCount === 0) { this.trophyCounts[t.id] = 1; newlyEarned.push(t); } }`
   - Change to: `if (met) { const currentCount = this.trophyCounts[t.id] || 0; if (t.multi) { /* For multi-earn: increment count each time met is true and count hasn't been incremented for this evaluation */ if (currentCount === 0) { this.trophyCounts[t.id] = 1; newlyEarned.push(t); } } else { if (currentCount === 0) { this.trophyCounts[t.id] = 1; newlyEarned.push(t); } } }`
3. For a proper multi-earn system, define milestone thresholds. Add a `milestones` array to multi-earn trophy definitions. For example, `bro_studied` could have milestones at `[1, 5, 15, 30]` sessions. The trophy count would represent which milestone was last reached.
4. Alternative simpler approach: Simply increment `trophyCounts[t.id]` each time the requirement is met AND the count hasn't already been incremented to the current "level". This shows `x2`, `x3` badges on the trophy card.

#### Acceptance Criteria
- A trophy with `multi: true` displays a badge showing `x2`, `x3`, etc. after re-earning.
- Single-earn trophies still only award once.
- Trophy shelf renders multi-earn badges correctly.

#### Risks
- Inflated trophy counts if evaluate is called too frequently. Ensure multi-earn only increments once per threshold crossing, not on every evaluate call.

#### Rollback Strategy
Revert evaluate() to the `currentCount === 0` check. Multi-earn is disabled again (same as current).

---

### WP-006 — Remove localStorage clearing from logout()

#### Objective
Stop `logout()` from deleting localStorage progress data.

#### Why It Exists
**BUG-2a**: `logout()` (app.js:211-212) calls `clearLocalProgress(appId)` which removes the localStorage key. There is no security reason to delete learning progress data on logout.

#### Priority
**Critical**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. Locate the `logout()` method (line ~207-214).
3. Remove or comment out the two lines:
   ```
   const { clearLocalProgress } = await import('./storage.js');
   clearLocalProgress(appId);
   ```
4. The page reload (`window.location.reload()`) will still occur, and on reload, `getLocalProgress(appId)` will find the existing data in localStorage.
5. Firebase `signOut()` still runs, so the user will be in "Local Mode" after reload but will retain their progress in localStorage.

#### Acceptance Criteria
- After logging out, `localStorage.getItem('german_app_progress_german-a1-app')` still contains the progress data.
- After logging out and logging back in, progress is immediately visible without needing to trigger a save.

#### Risks
- If two different users share the same browser, logging out does not clear the first user's progress. The second user would temporarily see the first user's local data until they log in and their own data merges. This is acceptable for a learning app.

#### Rollback Strategy
Re-add the `clearLocalProgress(appId)` call. Logout behavior returns to current state.

---

### WP-007 — Add _save() call after remote data merge in _onAuth()

#### Objective
After loading and merging remote Firebase data in `_onAuth()`, immediately persist the merged result to localStorage.

#### Why It Exists
**BUG-2b**: `_onAuth()` (app.js:258-263) loads remote progress and merges it into `state.data`, but never writes the merged result to localStorage. This means localStorage appears empty after re-login until the next `_save()` trigger.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
- WP-006 (logout no longer clears localStorage, but this fix is still needed for first-time logins and cross-device scenarios)

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. Locate the `_onAuth(user)` method (line ~232-282).
3. After the merge block (after line ~260: `state.data = mergeProgress(state.data, remote);`), add a call to persist the merged data to localStorage: `saveLocalProgress(appId, state.data);`
4. This should be INSIDE the `try` block, after the merge succeeds, but BEFORE `_initEngines()` is called.
5. Do NOT call the full `_save()` method here as that would trigger Firestore writes (unnecessary — the data just came FROM Firestore). Only call `saveLocalProgress()` to update the local cache.

#### Acceptance Criteria
- After logging in (fresh or re-login), `localStorage.getItem('german_app_progress_german-a1-app')` immediately contains the merged progress data.
- No extra Firestore writes occur during the login flow.

#### Risks
- If the remote data is corrupt, persisting it to localStorage spreads the corruption locally. However, `mergeProgress()` already handles this by taking max/union operations, so corrupt data would already affect in-memory state.

#### Rollback Strategy
Remove the `saveLocalProgress()` call. localStorage only gets populated on the next `_save()` trigger (same as current).

---

### WP-008 — Add beforeunload handler for pending writes

#### Objective
Ensure that pending Firestore writes complete before the page unloads.

#### Why It Exists
**BUG-2c**: `_save()` uses fire-and-forget Firestore writes (app.js:794: `saveProgress(...).catch(...)`). If the user logs out or navigates away immediately after making progress, the writes may not complete.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
- WP-011 (debouncing) — the beforeunload handler should flush the debounced save

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. After the `window.app` object definition (after line ~798), add a `beforeunload` event listener.
3. The listener should call `window.app._save()` synchronously to ensure the final state is written to localStorage (which is synchronous).
4. For Firestore writes, use `navigator.sendBeacon()` or rely on the fact that `_save()` already writes to localStorage. Firestore writes during unload are unreliable in all browsers.
5. Alternative: Track whether there are unsaved changes with a dirty flag. Only trigger `_save()` on beforeunload if the flag is set.

#### Acceptance Criteria
- Making progress changes and immediately closing the tab preserves the changes in localStorage.
- On next visit, the locally saved progress is available.

#### Risks
- `beforeunload` handlers can slow down page close. Keep the handler minimal.
- Firestore writes during unload are not guaranteed by browsers. This is acceptable — localStorage serves as the reliable backup.

#### Rollback Strategy
Remove the `beforeunload` listener. Page close behavior returns to current state.

---

### WP-009 — Replace numeric word IDs with deterministic string IDs

#### Objective
Change word ID generation from `id: index` (numeric forEach counter) to a deterministic string derived from word content.

#### Why It Exists
**BUG-3**: Both `a1.config.js` (line 728) and `b2.config.js` (line 3066) use `id: index`. If any word is added, removed, or reordered in the raw data arrays, all existing progress data becomes invalid because IDs are positional.

#### Priority
**Critical**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/levels/a1.config.js`
- `js/levels/b2.config.js`
- `js/levels/tetemplate.config.js`

#### Dependencies
- WP-010 (data migration must run after this change)

#### Detailed Implementation Plan
1. Open `js/levels/a1.config.js`.
2. Locate the `parseRawData()` function (contains `id: index` around line 728).
3. Replace `id: index` with a deterministic string ID: `id: unitNum + '-' + index` (e.g., `"1-0"`, `"1-1"`, `"2-0"`). This is the simplest stable approach — it preserves order within a unit but is stable to cross-unit changes.
4. A more robust alternative: `id: unitNum + '-' + de.toLowerCase().replace(/[^a-zäöüß0-9]/g, '').substring(0, 20)` — derived from word content. However, this risks collisions if two words start with the same 20 characters.
5. The recommended approach is `id: unitNum + '-' + index` within each unit, where `unitNum` is the unit number from the raw data. This is stable as long as word order within a unit doesn't change.
6. Apply the same change to `b2.config.js` in `parseRawB2Data()` (line ~3066).
7. Update `tetemplate.config.js` to use the same ID scheme.

#### Acceptance Criteria
- Word IDs are strings like `"1-0"`, `"1-1"`, `"2-0"` instead of numbers `0, 1, 2`.
- IDs are deterministic — same input data always produces the same IDs.
- IDs are unique within a level (no collisions between units).

#### Risks
- **This is a breaking change**: All existing `known` and `favorites` arrays in localStorage and Firestore contain numeric IDs. A migration (WP-010) is required.

#### Rollback Strategy
Revert to `id: index`. Restore from the `_backup_v1` arrays created during the WP-010 migration to recover the original numeric IDs with zero data loss.

---

### WP-010 — Create progress data migration for new word ID format

#### Objective
Write a one-time migration that converts existing numeric word IDs in `known` and `favorites` arrays to the new string-based format.

#### Why It Exists
WP-009 changes word IDs from numbers to strings. Without migration, all existing user progress is lost.

#### Priority
**Critical**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/core/app.js` (or a new `js/core/migration.js`)
- `js/core/storage.js`

#### Dependencies
- WP-009 (new ID format must be defined first)

#### Detailed Implementation Plan
1. Create a migration function that maps old numeric IDs to new string IDs.
2. The mapping is deterministic: old ID `N` maps to the new ID of the word at global index `N` in the vocabulary array.
3. Build a lookup table: iterate through `levelConfig.vocabulary.flat()` with the OLD parser (id: index), creating a map of `oldId -> newId`.
4. **Migration version gate**: Check if migration is needed by checking `if ((state.data.migrationVersion || 0) < 1)`. This prevents accidental re-running.
5. **Dry-run mode**: Implement a `dryRun` flag. If `dryRun` is true, simply log the old array and the mapped new array to the console (`console.table` or similar) to verify correctness without modifying `state.data` or calling `_save()`. Deploy this first to validate logic against real staging data.
6. **Backup before migrate**: Before modifying the state, create backups of the original numeric arrays:
   - `state.data._known_backup_v1 = [...(state.data.known || [])];`
   - `state.data._favorites_backup_v1 = [...(state.data.favorites || [])];`
   - `state.data._flashcardErrors_backup_v1 = { ...(state.data.flashcardErrors || {}) };`
7. The actual migration function:
   - Maps each number in `state.data.known` to the corresponding new string ID and replaces the array.
   - Does the same for `state.data.favorites`.
   - Re-keys `state.data.flashcardErrors` with the new string IDs.
   - Sets `state.data.migrationVersion = 1` to prevent re-running.
   - Calls `_save()` to persist the migrated data alongside the backups.
8. For Firestore data: The migration runs on the client when the user loads the page. Since `_onAuth()` loads remote data and merges it, the migration should run AFTER the merge.

#### Acceptance Criteria
- A user with existing progress (e.g., `known: [0, 1, 2, 3]`) loads the page and their progress is automatically converted to the new ID format (e.g., `known: ["1-0", "1-1", "1-2", "1-3"]`).
- The migration only runs once (tracked by `migrationVersion`).
- Both localStorage and Firestore are updated with the new format, including the backup fields.
- Progress percentages remain unchanged after migration.

#### Risks
- If the vocabulary data has been reordered since the user last visited, the numeric-to-string mapping will be wrong. This is the fragility that WP-009 is fixing — but for migration, it's a one-time risk.
- Edge case: A user has progress on an old version, the vocab data changes, then they visit with the new code. The migration maps old numeric IDs to new string IDs based on the NEW vocab order, which may not match the old order. Document this as a known limitation.

#### Rollback Strategy
If migration produces incorrect results, you can restore from the backup fields (`_known_backup_v1`, etc.), delete the `migrationVersion` flag, and revert WP-009 to restore numeric IDs. The backup guarantees zero data loss.

---

### WP-011 — Add write debouncing to _save()

#### Objective
Debounce Firestore writes so rapid user actions batch into a single write operation.

#### Why It Exists
**BUG-4**: Every `_save()` triggers 2 Firestore writes + 1 read. 12 card marks = 24 writes. A `debounce()` function exists in `utils.js` but is never used.

#### Priority
**Critical**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
- WP-008 (beforeunload should flush debounced saves)

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. At the top of the file (after imports), import the debounce function: `import { debounce } from './utils.js?v=3';`
3. Split the `_save()` method into two parts:
   - `_saveLocal()`: Syncs engine state to `state.data` and writes to localStorage (synchronous, called immediately).
   - `_saveRemote()`: Sends data to Firestore (async, debounced).
4. Create a debounced version of `_saveRemote`: `const debouncedSaveRemote = debounce(function() { ... }, 3000);`
5. Modify `_save()` to:
   - Always call `_saveLocal()` immediately (localStorage is instant and serves as the safety net).
   - Call `debouncedSaveRemote()` instead of directly calling `saveProgress()` and `updateLeaderboard()`.
6. In the `beforeunload` handler (WP-008), call the non-debounced `_saveRemote()` directly to flush pending writes.
7. Debounce the leaderboard update separately with a longer interval (10-30 seconds) since leaderboard updates are less urgent.

#### Acceptance Criteria
- Marking 12 flashcards rapidly produces at most 1-2 Firestore write operations (instead of 24).
- localStorage is still updated on every action (immediately).
- Closing the page flushes any pending debounced writes.

#### Risks
- If the debounce interval is too long, users who close the page within the interval may lose remote changes. WP-008 (beforeunload) mitigates this.

#### Rollback Strategy
Remove the debounce wrapper. `_save()` returns to immediate writes on every action (same as current).

---

### WP-012 — Batch Firestore progress and leaderboard writes

#### Objective
Combine progress and leaderboard writes into a single Firestore batch operation.

#### Why It Exists
**BUG-4 (continued)**: Each `_save()` does a separate `saveProgress()` and `updateLeaderboard()` call. These could be batched.

#### Priority
**Medium**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/core/firebase.js`
- `js/core/app.js`

#### Dependencies
- WP-011 (debouncing reduces write frequency; batching further reduces operation count)

#### Detailed Implementation Plan
1. Open `js/core/firebase.js`.
2. Create a new exported function `batchSaveProgressAndLeaderboard(appId, uid, progressData, displayName, photoURL, knownCount)`.
3. Inside this function, use Firestore `writeBatch()` to combine both writes into one atomic batch.
4. Import `writeBatch` from the Firestore SDK.
5. The batch should:
   - Set the progress document at `artifacts/{appId}/users/{uid}/progress/main`.
   - Set the leaderboard document at `leaderboard/{uid}`.
6. Update `_save()` in `app.js` to call this new batched function instead of separate `saveProgress()` and `updateLeaderboard()`.

#### Acceptance Criteria
- A single `_save()` results in 1 Firestore batch write (instead of 2 separate writes + 1 read).
- Both progress and leaderboard data are updated atomically.

#### Risks
- Batch operations count as one write per document in the batch (2 writes), not 1 total. Cost savings come from removing the leaderboard `getDoc()` read.

#### Rollback Strategy
Revert to separate `saveProgress()` and `updateLeaderboard()` calls.

---

### WP-013 — Remove leaderboard read-before-write pattern

#### Objective
Eliminate the `getDoc()` read in `updateLeaderboard()` that fetches previous counts before writing.

#### Why It Exists
**BUG-4 (continued)**: `updateLeaderboard()` (firebase.js:78-103) reads the existing leaderboard document to get previous A1/B2 counts before writing. This read is unnecessary — the client already knows the current level's known count.

#### Priority
**Medium**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/firebase.js`

#### Dependencies
- WP-033 (leaderboard schema fix — should use dynamic level map)

#### Detailed Implementation Plan
1. Open `js/core/firebase.js`.
2. Locate `updateLeaderboard()` (line ~78-103).
3. Instead of reading the existing document to get previous level counts, use Firestore's `setDoc` with `merge: true` to update only the current level's count field.
4. The client knows: current appId (e.g., `german-a1-app`), current known count. Write only the relevant field (e.g., `a1Count: knownCount`) and let `merge: true` preserve other fields.
5. Compute `totalWords` as a Firestore-side sum would be ideal, but since that's not available in client-side Firestore, compute it by reading the document on page load only (once), caching the other level's count, and computing total on save.
6. Alternatively, defer this to WP-033 which redesigns the leaderboard schema.

#### Acceptance Criteria
- `updateLeaderboard()` no longer calls `getDoc()`.
- Leaderboard data remains accurate.

#### Risks
- If `totalWords` cannot be computed without reading the document, the leaderboard ranking may be inaccurate. Acceptable if WP-033 redesigns the schema.

#### Rollback Strategy
Revert to the read-before-write pattern.

---

### WP-014 — Reset session counters on new browser session

#### Objective
Reset `sessionKnown`, `sessionFlashcardErrors`, and `sessionWordsReviewed` at the start of each new browser session.

#### Why It Exists
**BUG-5**: These counters accumulate across browser sessions. Dashboard shows `sessionKnown` as "Words Studied Today" which is misleading. Session-based trophies trigger cumulatively.

#### Priority
**Critical**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. In `_initEngines()` (or at app boot, before engines are initialized), reset session counters:
   - `state.data.sessionKnown = 0;`
   - `state.data.sessionFlashcardErrors = 0;`
   - `state.data.sessionWordsReviewed = 0;`
3. Alternative: Track a `lastSessionDate` in state.data. On boot, compare with today's date. If different, reset counters. This preserves counters across page reloads within the same day.
4. The recommended approach is the `lastSessionDate` comparison — it matches the "Words Studied Today" semantics.

#### Acceptance Criteria
- Loading the page on a new day shows "Words Studied Today: 0".
- Session-based trophies ("in one session") evaluate against current-session counts, not cumulative totals.
- Reloading the page within the same day preserves session counters.

#### Risks
- Users who study across midnight will see their session counter reset. This is acceptable.

#### Rollback Strategy
Remove the counter reset logic. Counters return to cumulative behavior.

---

### WP-015 — Add type inference for B2 vocabulary words

#### Objective
Classify B2 words with proper grammatical types instead of defaulting all to "Vocab".

#### Why It Exists
**BUG-9**: B2 vocabulary entries have empty type fields, so `parseRawB2Data()` defaults to "Vocab". This makes `verb_veteran`, `noun_ninja`, and `expression_expert` trophies permanently unearnable in B2.

#### Priority
**High**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/levels/b2.config.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/levels/b2.config.js`.
2. Locate `parseRawB2Data()` (around line 3060-3090).
3. After parsing each word, add type inference logic:
   - If the German word starts with `der `, `die `, or `das `: type = `'n'` (noun)
   - If the German word ends with `-en`, `-ern`, `-eln` and looks like an infinitive: type = `'v'` (verb)
   - If the German word is a multi-word phrase (contains spaces) and doesn't start with an article: type = `'e'` (expression)
   - Default to `'Vocab'` for unclassifiable words
4. Test with a sample of B2 words to verify classification accuracy.
5. The type inference should be conservative — it's better to leave a word as "Vocab" than to misclassify it.

#### Acceptance Criteria
- B2 words that are clearly nouns (start with der/die/das) are classified as type `'n'`.
- B2 words that are clearly verbs (infinitive form ending in -en) are classified as type `'v'`.
- Type-based trophies (`verb_veteran`, `noun_ninja`) can now be earned in B2.
- Type filter dropdown in B2 glossary becomes useful.

#### Risks
- Incorrect type inference could mislead users. Keep the logic conservative.
- Changes to the type field could affect trophy evaluation for existing users (unlikely since B2 type trophies were never earnable before).

#### Rollback Strategy
Remove the type inference logic. B2 words return to type "Vocab".

---

### WP-016 — Fix returnedAfter7Days flag persistence

#### Objective
Clear the `returnedAfter7Days` flag after the "We're So Back" trophy is earned, or make it a one-time check.

#### Why It Exists
**BUG-11**: Once `returnedAfter7Days` is set to `true`, it persists forever, causing the "We're So Back" trophy to trigger on every subsequent visit.

#### Priority
**Medium**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`
- `js/core/trophies.js`

#### Dependencies
- WP-032 (implements the `were_so_back` trophy — currently has `req: p => false`)

#### Detailed Implementation Plan
1. Locate where `returnedAfter7Days` is set (app.js, around line 441-443).
2. After the "We're So Back" trophy is earned (detected via evaluate()), clear the flag: `state.data.returnedAfter7Days = false;`
3. Alternatively, change the trophy requirement to check the raw date gap instead of a pre-computed boolean flag. The trophy should compare the last study date with today's date directly.

#### Acceptance Criteria
- The "We're So Back" trophy is earned exactly once per 7-day gap.
- Subsequent visits do not re-trigger the trophy.

#### Risks
None significant.

#### Rollback Strategy
Trophy returns to `req: p => false` (never earnable).

---

### WP-017 — Fix darkModeStudyMinutes inflation

#### Objective
Track dark mode study time based on actual elapsed time, not per-save increments.

#### Why It Exists
**BUG-6a**: `_save()` adds 0.5 to `darkModeStudyMinutes` every time it's called while dark mode is active. Since `_save()` is called on every user action, this counter inflates rapidly.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. Remove the line that adds 0.5 to `darkModeStudyMinutes` per save (around line 678).
3. Instead, track dark mode time using a timestamp-based approach:
   - When dark mode is activated, record `_darkModeStartTime = Date.now()`.
   - When dark mode is deactivated (or when `_save()` is called), compute elapsed dark mode time: `elapsed = (Date.now() - _darkModeStartTime) / 60000` (minutes).
   - Add `elapsed` to `state.data.darkModeStudyMinutes`.
   - Reset `_darkModeStartTime = Date.now()`.
4. Do NOT persist `_darkModeStartTime` to localStorage or Firestore. Initialize it fresh on page load if dark mode is currently active.

#### Acceptance Criteria
- `darkModeStudyMinutes` increases by approximately 1 per minute of actual dark mode usage, regardless of how many saves occur.
- The "Rizzed Up Dark Mode" trophy (30 minutes) requires approximately 30 real minutes of dark mode use.

#### Risks
- If the user keeps the tab open in dark mode for hours without interaction, the time still accumulates. This is the intended behavior for "study time in dark mode".

#### Rollback Strategy
Revert to the 0.5-per-save increment (current broken behavior).

---

### WP-018 — Fix totalStudyTimeMs inflation

#### Objective
Track total study time accurately using real elapsed time.

#### Why It Exists
**BUG-6b**: `_sessionStartTime` is reset on each save, and the delta accumulation inflates faster than real time. Additionally, `_sessionStartTime` is persisted in localStorage (BUG-6c), causing stale timestamps on next session.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. Remove the `totalStudyTimeMs` delta accumulation from `_save()` (around lines 682-685).
3. Instead, initialize a `_sessionStartTime = Date.now()` at the beginning of `_initEngines()` — this is NOT persisted.
4. In `_save()`, compute total study time as: `state.data.totalStudyTimeMs = (state.data.totalStudyTimeMs || 0) + (Date.now() - this._lastSaveTime)` where `_lastSaveTime` is set to `Date.now()` after each computation.
5. Initialize `this._lastSaveTime = Date.now()` in `_initEngines()`.
6. Ensure `_sessionStartTime` and `_lastSaveTime` are NOT included in the `payload` object that gets saved to localStorage/Firestore. They should be properties of the `window.app` object, not `state.data`.

#### Acceptance Criteria
- `totalStudyTimeMs` increases by approximately real elapsed time.
- The "Touch Grass" trophy (3 hours) requires approximately 3 real hours of usage.
- `_sessionStartTime` does not appear in localStorage or Firestore data.

#### Risks
- If `_lastSaveTime` is not initialized properly, the first save could compute a huge delta.

#### Rollback Strategy
Revert to previous time tracking logic.

---

### WP-019 — Exclude _sessionStartTime from persisted state

#### Objective
Prevent `_sessionStartTime` from being saved to localStorage or Firestore.

#### Why It Exists
**BUG-6c**: `_sessionStartTime` is part of `state.data` and gets persisted via the spread operator in `_save()`. On next session load, this stale timestamp causes an enormous elapsed time calculation.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
- WP-018 (overlaps — both fix time tracking)

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. In the `payload` object construction inside `_save()` (lines 779-791), ensure that `_sessionStartTime` is NOT included. The payload is explicitly constructed with named fields, so as long as `_sessionStartTime` is not listed, it won't be saved.
3. However, `_save()` also saves `{ ...state.data, ...payload }` to localStorage (line 797). If `_sessionStartTime` is a property of `state.data`, it will be persisted.
4. Move `_sessionStartTime` from `state.data` to `window.app` as a private property: `this._sessionStartTime = Date.now()`.
5. Update any references to `state.data._sessionStartTime` to use `this._sessionStartTime` instead.

#### Acceptance Criteria
- `_sessionStartTime` does not appear in localStorage data.
- `_sessionStartTime` does not appear in Firestore data.
- Time tracking initializes fresh on each page load.

#### Risks
None.

#### Rollback Strategy
Not needed — this is a strict improvement.

---

### WP-020 — Reset quiz score on unit switch

#### Objective
Reset `this.score` and `this.total` in QuizEngine when `loadUnit()` is called.

#### Why It Exists
**BUG-10**: `QuizEngine.loadUnit()` updates words/nouns but does not reset score counters. Score carries over across units.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/quiz.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/quiz.js`.
2. Locate the `loadUnit(words)` method (around lines 12-16).
3. Add at the beginning of the method: `this.score = 0; this.total = 0;`
4. If there's a score display callback, call it to update the UI: `this.onScore(this.score, this.total);`

#### Acceptance Criteria
- Switching from Unit 1 to Unit 2 in quiz mode resets the displayed score to "0 / 0".
- Answering questions in Unit 2 shows scores starting from 0.

#### Risks
None.

#### Rollback Strategy
Remove the reset lines.

---

### WP-021 — Fix calcStreak to handle duplicate dates

#### Objective
Make `calcStreak()` in trophies.js handle duplicate dates in the `studyDates` array without breaking the streak.

#### Why It Exists
**BUG-12**: The streak calculation loop only continues on `diffDays === 1`. Duplicate dates produce `diffDays === 0`, which breaks the streak.

#### Priority
**Medium**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/trophies.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/trophies.js`.
2. Locate `calcStreak()` (lines ~5-22).
3. Before the streak calculation loop, deduplicate the dates array: `const uniqueDates = [...new Set(dates)].sort().reverse();`
4. Use `uniqueDates` instead of the original `dates` array in the streak loop.
5. Additionally, update the streak loop condition to handle `diffDays === 0` by either skipping duplicates or treating them as the same day.

#### Acceptance Criteria
- `calcStreak(["2026-06-07", "2026-06-07", "2026-06-06", "2026-06-05"])` returns 3 (not broken by the duplicate).
- `calcStreak(["2026-06-07", "2026-06-05"])` returns 1 (gap breaks streak correctly).

#### Risks
None.

#### Rollback Strategy
Revert to original calcStreak. Duplicates continue to break streaks.

---

### WP-022 — Track study sessions for partial flashcard sessions

#### Objective
Record study activity and dates when users interact with flashcards, not just when they complete the entire queue.

#### Why It Exists
**H-9**: `sessionsCompleted` only increments at the end of the flashcard queue. `studyDates` only records inside `onSessionComplete`. Users who study 20 out of 30 cards get no credit.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/app.js`.
2. In the `markCard(known)` method (line ~397-401), after the existing calls, add study date tracking:
   - `const today = new Date().toISOString().split('T')[0];`
   - `if (!state.data.studyDates) state.data.studyDates = [];`
   - `if (!state.data.studyDates.includes(today)) state.data.studyDates.push(today);`
3. This ensures that any flashcard interaction records today's date, even if the session is not completed.
4. Keep the existing `onSessionComplete` callback for `sessionsCompleted` increment — completing a full deck is still a meaningful milestone.
5. Optionally, add a "partial session" concept: Track sessions started vs. sessions completed. A session is "started" on the first `markCard()` call in a new unit/day.

#### Acceptance Criteria
- Marking even 1 flashcard as known records today's date in `studyDates`.
- Streak calculation works based on study activity, not just completed sessions.

#### Risks
- Multiple `markCard` calls on the same day all try to push the same date. The `includes()` check prevents duplicates, but for large `studyDates` arrays, this is O(n). WP-038 addresses pruning.

#### Rollback Strategy
Remove the study date tracking from `markCard()`.

---

### WP-023 — Fix broken A2/B1 navigation links

#### Objective
Make A2 and B1 links on the portal page either show a "Coming Soon" message or be disabled.

#### Why It Exists
**H-1**: `index.html` links to `A2.html` and `B1.html` which don't exist. GitHub Pages returns 404.

#### Priority
**High**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `index.html`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `index.html`.
2. Locate the A2 and B1 card links (around lines 167-175).
3. Remove the `href` attribute from these links, or change it to `javascript:void(0)`.
4. Add an `onclick` handler that shows an alert or a styled message: `onclick="alert('Coming Soon! 🚧')"`.
5. Alternatively, add a CSS class `disabled` to these cards and style them with reduced opacity and `pointer-events: none`.
6. Also fix the case sensitivity: The links currently use `A2.html` and `B1.html` (uppercase). When these files are eventually created, they should be lowercase (`a2.html`, `b1.html`) to match the existing convention.

#### Acceptance Criteria
- Clicking the A2 card does NOT navigate to a 404 page.
- A clear "Coming Soon" message is displayed.
- The visual design indicates these levels are not yet available.

#### Risks
None.

#### Rollback Strategy
Restore the original href attributes.

---

### WP-024 — Remove dead code from utils.js, firebase.js, and app.js

#### Objective
Delete all confirmed dead code identified across the audit reports.

#### Why It Exists
**L-1, L-2, L-10, M-13**: Multiple unused functions and imports clutter the codebase.

#### Priority
**Low**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/utils.js`
- `js/core/firebase.js`
- `js/core/app.js`

#### Dependencies
- WP-011 (uses the `debounce()` function from utils.js — do NOT delete debounce until after WP-011 imports it)

#### Detailed Implementation Plan
1. Open `js/core/utils.js`:
   - Delete `parseVocabularyRow()` function (never called — A1/B2 have their own parsers).
   - Delete `formatDate()` function (never called).
   - Delete `isToday()` function (never called).
   - KEEP `debounce()` — WP-011 will import it.
2. Open `js/core/firebase.js`:
   - Delete `getAuthInstance()` export (never imported).
   - Delete `getFirestoreInstance()` export (never imported).
   - Delete `getOtherLevelProgress()` export (never called — the `portal_walker` trophy has `req: () => false`).
3. Open `js/core/app.js`:
   - In `logout()` (line ~211), remove the duplicate `await import('./storage.js')` — `clearLocalProgress` is already imported at the top of the file (line 2). Use the top-level import directly.
   - In `resetData()` (line ~218), similarly remove the duplicate imports and use top-level references.
4. Remove the unused Firebase Analytics `measurementId` from the config object (line ~32) since Analytics SDK is never imported.

#### Acceptance Criteria
- `utils.js` contains only `debounce()`.
- `firebase.js` has no unused exports.
- No duplicate imports in `app.js`.
- The app functions exactly as before — no behavior changes.

#### Risks
- Accidentally removing a function that IS used. Verify each removal with a grep search.

#### Rollback Strategy
Restore deleted functions from version control.

---

### WP-025 — Clean up repository (temp files, memory files, gitignore)

#### Objective
Remove debug artifacts and development-only files from the production repository.

#### Why It Exists
**L-3, L-4**: `temp_debug.js` is a debug script that should not be in production. AI memory files (`gemini_memory.md`, `godfather_memory.md`, `qwen_memory_theFounder.md`) are development artifacts.

#### Priority
**Low**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `temp_debug.js` (delete)
- `.gitignore`
- `gemini_memory.md`, `godfather_memory.md`, `qwen_memory_theFounder.md` (archive or gitignore)

#### Dependencies
None.

#### Detailed Implementation Plan
1. Delete `temp_debug.js` from the repository.
2. Add the following to `.gitignore`:
   ```
   temp_debug.js
   *_memory*.md
   ```
3. Optionally, move AI memory files to a `docs/` or `.dev/` directory that is gitignored.
4. Ensure `.gitignore` entries don't conflict (check if `temp_debug.js` is already listed — the Platform Audit noted it is listed but still committed).

#### Acceptance Criteria
- `temp_debug.js` is not present in the repository.
- AI memory files are either deleted or gitignored.
- `.gitignore` is updated.

#### Risks
None.

#### Rollback Strategy
Restore files from git history if needed.

---

### WP-026 — Extract AuthService from app.js

#### Objective
Move all authentication-related methods from `window.app` into a dedicated `auth-service.js` module.

#### Why It Exists
**H-2**: `app.js` at 822 lines is a god object. Auth logic (login, logout, email modal, auth state handling) is one of the largest concerns (~120 lines).

#### Priority
**Medium**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/core/app.js` (remove auth methods)
- `js/core/auth-service.js` (new file)

#### Dependencies
- Phase 0-2 work packages should be done first (bug fixes before refactoring)

#### Detailed Implementation Plan
1. Create a new file `js/core/auth-service.js`.
2. Move the following methods from `window.app` to the new module:
   - `loginWithGoogle()`
   - `openEmailAuthModal()`
   - `closeEmailAuthModal()`
   - `toggleEmailAuthMode()`
   - `handleEmailAuth(event)`
   - `logout()`
   - `resetData()`
   - `_onAuth(user)`
   - `_renderAuthUI()`
3. Export these as named exports or as a class `AuthService`.
4. The `AuthService` needs access to: `auth`, `state`, `appId`, `engines`, `levelConfig`. Pass these as constructor parameters or via a shared context object.
5. In `app.js`, import `AuthService` and wire the methods to `window.app`:
   ```
   const authService = new AuthService(auth, state, appId, ...);
   window.app.loginWithGoogle = () => authService.loginWithGoogle();
   ```
6. Verify all HTML `onclick` handlers still work (they reference `window.app.methodName()`).

#### Acceptance Criteria
- `app.js` is reduced by ~120 lines.
- All auth flows (Google login, email login, logout, re-login) work identically.
- No changes to HTML files required.

#### Risks
- Shared state access between modules can introduce coupling bugs. Use a shared state reference, not copies.

#### Rollback Strategy
Move methods back to `app.js`. Delete `auth-service.js`.

---

### WP-027 — Extract NavigationService from app.js

#### Objective
Move view switching, unit switching, and sidebar logic into a dedicated module.

#### Why It Exists
**H-2**: Part of the app.js decomposition.

#### Priority
**Medium**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/core/app.js`
- `js/core/nav-service.js` (new file)

#### Dependencies
- WP-026 (auth extraction should be done first to establish the pattern)

#### Detailed Implementation Plan
1. Create `js/core/nav-service.js`.
2. Move: `switchView()`, `switchMode()`, `switchUnit()`, `toggleSidebar()`, `_updateTitles()`, `_renderUnitList()`, `_createUnitItem()`, `_getUnitProgress()`, `_resolveUnitLabel()`.
3. Export as class `NavigationService` or named functions.
4. Wire to `window.app` in the reduced `app.js`.

#### Acceptance Criteria
- `app.js` reduced by another ~150 lines.
- View switching, unit switching, sidebar all work identically.

#### Risks
Same as WP-026.

#### Rollback Strategy
Move methods back.

---

### WP-028 — Extract StatsService from app.js

#### Objective
Move dashboard stats rendering into a dedicated module.

#### Why It Exists
**H-2**: Part of app.js decomposition.

#### Priority
**Medium**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`
- `js/core/stats-service.js` (new file)

#### Dependencies
- WP-026 or WP-027 (establishes the extraction pattern)

#### Detailed Implementation Plan
1. Create `js/core/stats-service.js`.
2. Move: `_updateStats()` and related helper code.
3. Export and wire to `window.app`.

#### Acceptance Criteria
- Dashboard stats render correctly after extraction.

#### Risks
Minimal.

#### Rollback Strategy
Move method back.

---

### WP-029 — Extract LeaderboardService from app.js

#### Objective
Move leaderboard rendering into a dedicated module.

#### Why It Exists
**H-2**: Part of app.js decomposition.

#### Priority
**Medium**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`
- `js/core/leaderboard-service.js` (new file)

#### Dependencies
- WP-026

#### Detailed Implementation Plan
1. Create `js/core/leaderboard-service.js`.
2. Move: `_renderLeaderboard()`.
3. Export and wire.

#### Acceptance Criteria
- Leaderboard view renders correctly.

#### Risks
Minimal.

#### Rollback Strategy
Move method back.

---

### WP-030 — Reduce app.js to thin orchestrator

#### Objective
After all extractions, `app.js` should be a thin boot script (~100-150 lines) that wires services together.

#### Why It Exists
**H-2**: Final step of the decomposition.

#### Priority
**Medium**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
- WP-026, WP-027, WP-028, WP-029

#### Detailed Implementation Plan
1. Review `app.js` after all extractions.
2. Ensure it only contains: imports, Firebase initialization, state initialization, engine initialization wiring, and `window.app` object with delegating methods.
3. Remove any remaining inline logic.
4. Verify the boot sequence works: config load → Firebase init → state init → auth listener → engine init.

#### Acceptance Criteria
- `app.js` is under 200 lines.
- All functionality works identically to pre-refactor.

#### Risks
Integration bugs from wiring.

#### Rollback Strategy
Revert all extractions.

---

### WP-031 — Create shared HTML template to eliminate duplication

#### Objective
Replace `a1.html` and `b2.html` with a single template system.

#### Why It Exists
**H-3**: `a1.html` and `b2.html` are 95% identical (~550 lines duplicated). Any UI fix requires two edits.

#### Priority
**Medium**

#### Estimated Complexity
**High**

#### Files Likely Affected
- `a1.html` (modify or replace)
- `b2.html` (modify or replace)
- Potentially a new `level.html`

#### Dependencies
- WP-026 through WP-030 (app.js decomposition helps separate concerns)

#### Detailed Implementation Plan
1. Option A (recommended): Create a single `level.html` that reads the level from a URL parameter: `level.html?level=a1`. Use JavaScript to set the `data-level` attribute dynamically.
2. Option B: Keep `a1.html` and `b2.html` but extract the common HTML into a shared template loaded via JavaScript.
3. For Option A:
   - Create `level.html` with all the shared markup.
   - At the top of the script, read `new URLSearchParams(location.search).get('level')`.
   - Set the page title and heading dynamically.
   - Handle the B2-specific differences (extra filter option) via conditional rendering.
4. Update `index.html` links to point to `level.html?level=a1` and `level.html?level=b2`.
5. Add redirects from `a1.html` and `b2.html` to the new URL format for backward compatibility.

#### Acceptance Criteria
- A single HTML file serves all levels.
- Adding a new level requires only a new config file, not a new HTML file.
- All existing functionality works on both A1 and B2.

#### Risks
- Breaking existing bookmarks and shared links. Redirects mitigate this.
- B2-specific UI differences need careful handling.

#### Rollback Strategy
Revert to separate `a1.html` and `b2.html`.

---

### WP-032 — Implement currently-stubbed trophy requirements

#### Objective
Replace `req: p => false` with working requirement functions for all stub trophies.

#### Why It Exists
**H-4**: 13+ trophies can never be earned because their requirement functions always return false.

#### Priority
**Medium**

#### Estimated Complexity
**High**

#### Files Likely Affected
- `js/core/trophies.js`
- `js/core/app.js` (may need to pass additional data to evaluate)

#### Dependencies
- WP-001, WP-002, WP-003 (trophy system must work first)
- WP-014 (session counters must reset properly)
- WP-017, WP-018 (time tracking must be accurate)
- WP-021 (streak calculation must work)

#### Detailed Implementation Plan
Implement each trophy's requirement function:

1. **`unit_master`**: Check if any unit has 100% known words. Evaluate per-unit in the evaluate loop.
2. **`a1_conqueror`**: Check if all A1 words are known. `p.known.length >= totalWords`.
3. **`b2_boss`**: Same for B2.
4. **`ohio_behavior`**: Check `p.columnHideCount >= 10`.
5. **`npc_arc`**: Check `Math.max(...Object.values(p.flashcardErrors || {})) >= 10`.
6. **`touch_grass`**: Check `(p.totalStudyTimeMs || 0) >= 3 * 60 * 60 * 1000` (3 hours).
7. **`i_am_so_cooked`**: Check `Math.max(...Object.values(p.flashcardErrors || {})) >= 5`.
8. **`on_fire`**: Check `(p.sessionWordsReviewed || 0) >= 50`.
9. **`streak_3`**: Check `calcStreak(p.studyDates || []) >= 3`.
10. **`streak_7`**: Check `calcStreak(p.studyDates || []) >= 7`.
11. **`streak_30`**: Check `calcStreak(p.studyDates || []) >= 30`.
12. **`night_owl`**: Check current hour is between 22-4: `new Date().getHours() >= 22 || new Date().getHours() < 4`.
13. **`early_bird`**: Check current hour < 8: `new Date().getHours() < 8`.
14. **`weekend_warrior`**: Check current day is Saturday(6) or Sunday(0).
15. **`chaotic_neutral`**: Check `(p.darkModeToggleCount || 0) >= 10`.
16. **`were_so_back`**: Check 7-day gap in study dates (requires WP-016).

#### Acceptance Criteria
- Every trophy in the shelf can be earned under the right conditions.
- No trophy has `req: p => false`.

#### Risks
- Some trophies depend on accurate time/session tracking (WP-017, WP-018, WP-014).

#### Rollback Strategy
Revert individual trophy req functions to `p => false`.

---

### WP-033 — Make leaderboard level detection dynamic

#### Objective
Replace hardcoded `a1Count`/`b2Count` fields with a dynamic level map.

#### Why It Exists
**H-5**: `firebase.js` lines 87-88 use `appId.includes('a1')` and `appId.includes('b2')`. Adding A2/B1/C1/C2 requires code changes.

#### Priority
**Medium**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/core/firebase.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/firebase.js`.
2. In `updateLeaderboard()`, replace `a1Count`/`b2Count` with a dynamic `levels` map:
   ```
   levels: { [appId]: knownCount }
   ```
3. Compute `totalWords` by summing all values in the `levels` map.
4. Use `setDoc` with `merge: true` so other levels' counts are preserved.
5. Update `getLeaderboard()` to compute `totalWords` from the `levels` map when rendering.

#### Acceptance Criteria
- Adding a new level (e.g., A2) automatically appears in leaderboard data without code changes.
- Existing leaderboard data is backward-compatible (old `a1Count`/`b2Count` fields are still read).

#### Risks
- Schema migration: Existing leaderboard documents have `a1Count`/`b2Count`. The new code should handle both old and new formats during the transition.

#### Rollback Strategy
Revert to hardcoded field names.

---

### WP-034 — Sanitize dynamic content to prevent XSS

#### Objective
Escape all user-provided and vocabulary data before inserting into the DOM via innerHTML.

#### Why It Exists
**H-6**: `displayName`, vocabulary words, and other dynamic data are injected via `innerHTML` without sanitization.

#### Priority
**High**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/core/app.js`
- `js/core/glossary.js`
- `js/core/trophies.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Create a `sanitize(str)` function in `utils.js` that escapes `<`, `>`, `&`, `"`, `'` characters.
2. In `_renderLeaderboard()` (app.js), wrap `user.displayName` with `sanitize()`.
3. In `GlossaryEngine.render()` (glossary.js), wrap `w.de`, `w.en`, `w.context` with `sanitize()`.
4. In `TrophyEngine.render()` (trophies.js), wrap `t.name` and `t.desc` with `sanitize()` (these are hardcoded, so low risk, but good practice).
5. In `_createUnitItem()` (app.js), wrap the `label` variable with `sanitize()`.

#### Acceptance Criteria
- A vocabulary entry containing `<script>alert('xss')</script>` renders as text, not as executable HTML.
- A user with `displayName` containing HTML tags sees escaped text in the leaderboard.

#### Risks
- Over-sanitization could break legitimate characters in German words (ä, ö, ü, ß). The sanitize function should only escape HTML special characters, not Unicode.

#### Rollback Strategy
Remove sanitize() calls.

---

### WP-035 — Add basic error boundaries for Firebase operations

#### Objective
Show user-facing error messages when Firebase operations fail, instead of silent console.warn.

#### Why It Exists
**H-7**: All Firebase failures are caught with `console.warn` — users get no feedback.

#### Priority
**Medium**

#### Estimated Complexity
**Medium**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. In `_save()` (app.js), change the `.catch()` handlers to show a toast notification for persistent failures:
   - Track consecutive save failures with a counter.
   - After 3 consecutive failures, show a toast: "⚠️ Cloud sync failed. Your progress is saved locally."
   - Reset the counter on success.
2. In `_onAuth()`, if `loadProgress()` fails, show a toast: "⚠️ Could not load cloud data. Using local progress."
3. In `_renderLeaderboard()`, the error case already shows "Error fetching leaderboard data." — this is adequate.
4. Use the existing `_showToast()` method for all error notifications.

#### Acceptance Criteria
- When Firebase is unreachable, users see a toast message.
- The app continues to function in offline mode.
- Console errors are still logged for debugging.

#### Risks
- Too many toast notifications could annoy users. Use the consecutive-failure threshold.

#### Rollback Strategy
Remove toast calls; revert to console.warn only.

---

### WP-036 — Fix TTS declension regex to include "er" suffix

#### Objective
Add "er" to the TTS text cleanup regex pattern.

#### Why It Exists
**M-3**: The regex in `cleanTextForAudio()` (tts.js:10) matches `n|en|s|e|r|m` but not `er` as a combined suffix.

#### Priority
**Medium**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/tts.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/tts.js`.
2. Locate `cleanTextForAudio()` (line ~10).
3. Update the regex alternation from `(n|en|s|e|r|m)` to `(n|en|er|s|e|r|m)`.
4. Ensure "er" is before "e" and "r" in the alternation to match correctly.

#### Acceptance Criteria
- `cleanTextForAudio("das Haus -er")` returns "das Haus".
- Existing cleanup patterns still work (e.g., "die Katze -en" → "die Katze").

#### Risks
None.

#### Rollback Strategy
Revert regex.

---

### WP-037 — Allow multi-column hiding in glossary

#### Objective
Remove `hiddenCols.clear()` from `toggleColumn()` to allow hiding multiple columns simultaneously.

#### Why It Exists
**M-4**: `GlossaryEngine.toggleColumn()` calls `hiddenCols.clear()` before adding the new column, so only one column can be hidden at a time.

#### Priority
**Medium**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/glossary.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/core/glossary.js`.
2. Locate `toggleColumn(col)` (lines ~23-29).
3. Remove the `this.hiddenCols.clear()` call.
4. Change the logic to toggle: if `hiddenCols.has(col)`, remove it; else, add it.
5. Call `this.render()` to update the display.

#### Acceptance Criteria
- User can hide the German column AND the English column simultaneously.
- Clicking a hidden column's hide button reveals it.

#### Risks
- If all columns are hidden, the table shows empty rows. Add a guard: if all content columns would be hidden, show a message.

#### Rollback Strategy
Restore `hiddenCols.clear()`.

---

### WP-038 — Prune studyDates array to prevent unbounded growth

#### Objective
Limit the `studyDates` array to a reasonable size.

#### Why It Exists
**M-7**: `studyDates` grows indefinitely — 365+ entries after a year.

#### Priority
**Low**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js` or `js/core/storage.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. In `_save()` (or in a helper function called by `_save()`), trim the `studyDates` array to the most recent 90 entries.
2. 90 days is sufficient for the longest streak trophy (30 days) with generous buffer.
3. Sort the array and keep only the last 90 dates.

#### Acceptance Criteria
- `studyDates` never exceeds 90 entries.
- Streak calculation remains accurate for 30-day streaks.

#### Risks
- Users with 30+ day streaks who haven't visited in 60+ days would lose historical streak data. The 90-day window provides ample buffer.

#### Rollback Strategy
Remove the pruning logic.

---

### WP-039 — Reset modesUsed array between sessions

#### Objective
Clear the `modesUsed` array on new session start.

#### Why It Exists
**M-8**: `modesUsed` accumulates forever — once all 6 modes are used, it persists indefinitely.

#### Priority
**Low**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`

#### Dependencies
- WP-014 (session counter reset — same mechanism)

#### Detailed Implementation Plan
1. In the same session-reset logic from WP-014 (comparing `lastSessionDate`), also reset: `state.data.modesUsed = [];`

#### Acceptance Criteria
- `modesUsed` starts empty on a new session/day.
- `mode_explorer` trophy requires using multiple modes within the same session.

#### Risks
None.

#### Rollback Strategy
Remove the reset.

---

### WP-040 — Fix B2 unitTitles entry #25

#### Objective
Correct the B2 vocabulary data where entry #25 has an incorrect module title.

#### Why It Exists
**M-10**: `b2.config.js` line 3089 has `25: "K4: Modul 4"` which should likely be `25: "K4: Modul 3"`.

#### Priority
**Low**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/levels/b2.config.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `js/levels/b2.config.js`.
2. Find `unitTitles` object, entry `25`.
3. Verify the expected value by checking the B2 textbook structure.
4. If confirmed wrong, change from `"K4: Modul 4"` to `"K4: Modul 3"`.

#### Acceptance Criteria
- B2 sidebar shows correct chapter/module labels.

#### Risks
- The current value might be intentionally different from the textbook. Verify before changing.

#### Rollback Strategy
Revert the title string.

---

### WP-041 — Remove unused CSS classes

#### Objective
Delete unused CSS rules from `core.css`.

#### Why It Exists
**L-9**: `.flex` and `.items-center` classes are defined but never used in any HTML file.

#### Priority
**Low**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `css/core.css`

#### Dependencies
None.

#### Detailed Implementation Plan
1. Open `css/core.css`.
2. Search for `.flex` rule — delete it.
3. Search for `.items-center` rule — delete it.
4. Search for any other rules that are confirmed unused.

#### Acceptance Criteria
- No visual changes to the application.
- CSS file is slightly smaller.

#### Risks
- A rule might be used dynamically by JavaScript. Grep the codebase before removing.

#### Rollback Strategy
Restore deleted rules.

---

### WP-042 — Fix leaderboard user highlighting to use UID

#### Objective
Highlight the current user's leaderboard row by matching UID instead of displayName.

#### Why It Exists
**L-12**: The leaderboard uses `displayName === auth?.currentUser?.displayName` for highlighting. This is unreliable when multiple users share the same name.

#### Priority
**Low**

#### Estimated Complexity
**Low**

#### Files Likely Affected
- `js/core/app.js`
- `js/core/firebase.js`

#### Dependencies
None.

#### Detailed Implementation Plan
1. The leaderboard document already uses `{uid}` as the document ID.
2. In `_renderLeaderboard()`, pass the current user's UID and compare against the leaderboard entry's UID.
3. Modify `getLeaderboard()` to include the document ID (UID) in the returned data.
4. In the rendering, check `user.uid === state.uid` instead of `user.displayName === auth?.currentUser?.displayName`.

#### Acceptance Criteria
- Current user's leaderboard row is highlighted correctly even if other users share the same display name.

#### Risks
None.

#### Rollback Strategy
Revert to displayName comparison.

---

## 3. Rejected and Deferred Items

### Rejected

| Finding | Justification |
|---------|---------------|
| **L-7: localStorage data not encrypted** | Learning progress data (word lists, trophy counts) is not sensitive enough to warrant encryption. localStorage is per-origin and requires physical access to the device. Encryption adds complexity with no meaningful security benefit for this application. |
| **L-11: Mixed naming conventions** | Trophy IDs use `snake_case` as a design choice (they serve as stable database keys). JavaScript methods use `camelCase` (standard JS convention). These are different contexts and the inconsistency is intentional. Renaming trophy IDs would break existing persisted trophyCounts in localStorage/Firestore. |
| **INCORRECT-1/2/3/4** | These findings from the Runtime Validation report were disproven by the more thorough Critical Bugs Investigation. They do not require any action. |

### Deferred

| Finding | Justification |
|---------|---------------|
| **H-8: TTS German voice unreliable** | This is a browser-level limitation (Web Speech API voice availability varies across browsers and devices). A comprehensive fix would require: (a) a server-side TTS service, or (b) pre-recorded audio files for all 3700+ words. Both are large efforts with infrastructure costs. Deferring until the platform has a backend (Phase 8). |
| **M-1: No URL state/routing** | Implementing `history.pushState()` for view switching is a good improvement but not critical. It requires changes to navigation logic across all views. Deferring to Phase 5 (Code Organization). |
| **M-2: No glossary search** | Adding a search input with filter functionality is a useful feature but not a bug fix. Deferring to Phase 8 (Future Features). |
| **M-6: Unbounded flashcard queue** | This is a minor UX issue — users rarely mark ALL cards as "Still Learning". Adding a queue length limit is a nice-to-have. Deferring. |
| **L-5: Firebase API key / no App Check** | Firebase API keys are designed to be public for client-side apps. App Check provides additional protection but requires ReCaptcha integration and testing. Deferring until the platform has more users. |
| **L-6: No testing infrastructure** | Adding Jest + Playwright is a significant infrastructure investment. The TESTPLAN.md provides manual test cases. Automated testing infrastructure is deferred to Phase 7 (Scalability). |
| **L-8: No GDPR compliance** | Requires privacy policy, cookie consent banner, data deletion flow. Important for European users but requires legal review. Deferring to Phase 8. |
| **L-13: No keyboard navigation for flashcards** | Arrow keys for navigation, spacebar for flip — good accessibility improvement but not a bug. Deferring to Phase 8. |

---

## 4. Execution Strategy

### Phase 0: Safety Net
**Work Packages:** None (external tooling)  
**Why first:** Before making ANY changes, we need a safety net. Create a git branch for the refactoring work. Document the current state. Ensure all existing functionality can be verified manually using TESTPLAN.md.

**Actions:**
1. Create a `refactor` branch from `main`.
2. Run through the TESTPLAN.md baseline tests to document current pass/fail state.
3. Take screenshots of all views for visual regression comparison.

---

### Phase 1: Critical Bug Fixes
**Work Packages:** WP-001, WP-002, WP-003, WP-006, WP-007, WP-014, WP-020  
**Why this phase:** These are bugs that actively break core functionality for users right now. The trophy system is completely non-functional, logout can cause data loss, session counters are wrong, and quiz scores persist incorrectly. These must be fixed before any other work.

**Why before Phase 2:** Data integrity fixes (Phase 2) depend on basic functionality working. No point fixing word IDs if trophies can't evaluate them properly.

**Expected Impact:** Trophy system becomes functional. Logout no longer risks data loss. Dashboard shows accurate session data. Quiz scores reset correctly.

---

### Phase 2: Data Integrity
**Work Packages:** WP-009, WP-010, WP-017, WP-018, WP-019, WP-021, WP-022  
**Why this phase:** Word IDs need to become stable, time tracking must be accurate, and streak calculation must work. These are foundational data correctness issues.

**Why before Phase 3:** Firebase improvements (Phase 3) will be writing corrected data. We want the data format to be right before optimizing how we write it.

**Expected Impact:** Word IDs are stable across vocabulary changes. Time tracking is accurate. Study dates are properly recorded. Streaks calculate correctly.

---

### Phase 3: Firebase Improvements
**Work Packages:** WP-008, WP-011, WP-012, WP-013  
**Why this phase:** Now that the data is correct, we optimize HOW it's written. Debouncing, batching, and beforeunload handling reduce Firestore costs and prevent data loss.

**Why before Phase 4:** Architecture cleanup (Phase 4) will move code around. It's easier to add debouncing to the current monolithic `_save()` than to add it after decomposition.

**Expected Impact:** Firestore writes reduced by ~90%. No data loss on page close. Firebase costs dramatically reduced.

---

### Phase 4: Architecture Cleanup
**Work Packages:** WP-004, WP-005, WP-015, WP-016, WP-023, WP-032, WP-033, WP-034, WP-035  
**Why this phase:** With critical bugs fixed and data integrity ensured, we can now fix the remaining trophy issues, navigation links, content sanitization, and error handling. These are important improvements that don't require major structural changes.

**Why before Phase 5:** Code organization (Phase 5) is a major refactor. These targeted fixes are easier to make in the current structure.

**Expected Impact:** All trophies can be earned. A2/B1 links work properly. XSS risks eliminated. Users see error messages instead of silent failures.

---

### Phase 5: Code Organization
**Work Packages:** WP-024, WP-025, WP-026, WP-027, WP-028, WP-029, WP-030  
**Why this phase:** Now we decompose `app.js`, clean up dead code, and organize the repository. This is the major refactoring phase.

**Why before Phase 6:** A well-organized codebase is easier to optimize for performance.

**Expected Impact:** `app.js` reduced from 822 lines to ~150 lines. Clean module boundaries. No dead code. Repository organized.

---

### Phase 6: Performance
**Work Packages:** WP-036, WP-037, WP-038, WP-039, WP-040, WP-041, WP-042  
**Why this phase:** Small optimizations and fixes that improve the user experience without major architectural changes.

**Why before Phase 7:** Clean up remaining issues before scaling.

**Expected Impact:** TTS works better. Glossary supports multi-column hiding. Data arrays are bounded. Minor UI fixes.

---

### Phase 7: Scalability Preparation
**Work Packages:** WP-031  
**Why this phase:** HTML template deduplication enables adding new levels (A2, B1, C1, C2) without copying 300 lines of HTML each time.

**Why before Phase 8:** Future features require a scalable level system.

**Expected Impact:** Single HTML template serves all levels. Adding a new level requires only a config file.

---

### Phase 8: Future Feature Foundations
**Work Packages:** Deferred items (URL routing, glossary search, keyboard navigation, TTS server, testing infrastructure, GDPR, App Check)  
**Why last:** These are enhancements, not fixes. They build on the cleaned-up architecture from Phases 0-7.

**Expected Impact:** The platform is ready for advanced features: AI tutor, spaced repetition, analytics, subscriptions.

---

## 5. Final Section

### Top 10 Highest-Risk Areas

1. **WP-009/WP-010 (Word ID migration)** — Breaking change that affects ALL existing user data. Must be tested extensively.
2. **WP-006 (Logout localStorage)** — Changes auth behavior. Risk of data leaking between users on shared devices.
3. **WP-011 (Save debouncing)** — Could introduce data loss if debounce timer doesn't flush on page close.
4. **WP-001/WP-002 (Trophy evaluate calls)** — Touching the trophy system in multiple files. Could introduce infinite loops if evaluate triggers save which triggers evaluate.
5. **WP-031 (HTML deduplication)** — Major structural change. Risk of breaking all level pages.
6. **WP-026 to WP-030 (app.js decomposition)** — Extracting from a god object can introduce subtle bugs in shared state.
7. **WP-033 (Leaderboard schema)** — Schema migration affects all users. Must be backward compatible.
8. **WP-015 (B2 type inference)** — Incorrect classification could mislead users and break trophies.
9. **WP-032 (Stub trophy implementation)** — 15+ new requirement functions need to be correct and not break existing trophies.
10. **WP-034 (XSS sanitization)** — Over-sanitization could break German characters (ä, ö, ü, ß).

### Top 10 Quick Wins

1. **WP-020** — Add 2 lines to quiz.js to reset score on unit switch.
2. **WP-023** — Change 2 HTML links to disable A2/B1 navigation.
3. **WP-025** — Delete temp_debug.js and update .gitignore.
4. **WP-041** — Remove unused CSS classes.
5. **WP-036** — Add "er" to TTS regex.
6. **WP-006** — Remove 2 lines from logout() to stop clearing localStorage.
7. **WP-007** — Add 1 line to _onAuth() to save merged data to localStorage.
8. **WP-014** — Add session counter reset at boot.
9. **WP-040** — Fix 1 string in B2 unitTitles.
10. **WP-021** — Deduplicate dates in calcStreak.

### Top 10 Tasks Suitable For Small Models

1. **WP-020** (Quiz score reset) — 2 lines of code, single file, zero dependencies.
2. **WP-023** (A2/B1 links) — HTML-only change, 2 lines.
3. **WP-036** (TTS regex) — Single regex modification, 1 file.
4. **WP-041** (CSS cleanup) — Delete 2 CSS rules.
5. **WP-025** (Repo cleanup) — File deletion and .gitignore update.
6. **WP-040** (B2 title fix) — Single string change.
7. **WP-006** (Logout fix) — Remove 2 lines from logout().
8. **WP-007** (Save after merge) — Add 1 line to _onAuth().
9. **WP-037** (Multi-column hide) — Remove 1 line, add 3 lines.
10. **WP-042** (Leaderboard UID) — Change 1 comparison operator.

### Tasks Requiring Human Review — RESOLVED

- **WP-009/WP-010** (Word ID migration) — ✅ APPROVED. Staging Firebase project (`german-words-list-v2`) created. Safety net strategy added: dry-run mode, migration version gate, pre-migration backups (`_known_backup_v1`, `_favorites_backup_v1`, `_flashcardErrors_backup_v1`).
- **WP-004** (Trophy desc/req fix) — ✅ APPROVED. Decision: **Fix the code to match the descriptions.** Descriptions represent the intended user-facing contract.
- **WP-031** (HTML deduplication) — ✅ APPROVED. Decision: **Option A — single `level.html?level=a1` with URL parameter.** Redirects from old URLs for backward compatibility.
- **WP-033** (Leaderboard schema) — ✅ APPROVED. Decision: **Approve dynamic `levels` map schema.** Execution deferred until after WP-009/WP-010 migration is validated.
- **WP-015** (B2 type inference) — ✅ APPROVED. Decision: **Apply grammar-based type classification rules** (der/die/das → noun, -en/-ern/-eln → verb, multi-word phrases → expression). Safe fallback to `"Vocab"` for ambiguous words. Does not affect stored user data.

### Tasks Requiring Senior Engineering Review — RESOLVED

- **WP-011** (Save debouncing) — ✅ APPROVED. 3-second debounce for progress, 15-second for leaderboard. localStorage always saves instantly as safety net. `beforeunload` flushes pending remote writes. No data loss risk.
- **WP-012** (Firestore batching) — ✅ APPROVED. Atomic batch is strictly better than separate writes. Eliminates the leaderboard read-before-write. Failed batches retry on next debounced save.
- **WP-026 to WP-030** (app.js decomposition) — ✅ APPROVED. All modules share a single state reference (not copies). Execute in order: WP-026 → 027 → 028 → 029 → 030. Each step is individually rollback-able.
- **WP-031** (HTML deduplication) — ✅ APPROVED. Option A (single `level.html?level=a1`). Scales for future A2/B1/C1/C2 levels.
- **WP-034** (XSS sanitization) — ✅ APPROVED. sanitize() only escapes 5 HTML control characters (`< > & " '`). German characters (ä ö ü ß) are completely unaffected.

### Recommended Order of Execution

```
Phase 0 → WP-020 → WP-023 → WP-025 → WP-006 → WP-007 → WP-014 →
WP-001 → WP-002 → WP-003 → WP-009 → WP-010 → WP-017 → WP-018 →
WP-019 → WP-021 → WP-022 → WP-008 → WP-011 → WP-004 → WP-005 →
WP-015 → WP-016 → WP-032 → WP-033 → WP-034 → WP-035 → WP-024 →
WP-036 → WP-037 → WP-038 → WP-039 → WP-040 → WP-041 → WP-042 →
WP-026 → WP-027 → WP-028 → WP-029 → WP-030 → WP-031
```

### Expected Impact Per Phase

| Phase | Impact Summary |
|-------|----------------|
| Phase 0 | Safety net established. Baseline documented. |
| Phase 1 | Core functionality restored. Trophy system works. Logout is safe. Quiz resets. |
| Phase 2 | Data integrity guaranteed. Word IDs stable. Time tracking accurate. Streaks work. |
| Phase 3 | Firebase costs reduced 90%+. No data loss on page close. |
| Phase 4 | All trophies earnable. XSS eliminated. Error feedback for users. |
| Phase 5 | app.js < 200 lines. Clean module boundaries. No dead code. |
| Phase 6 | Minor UX improvements. Data arrays bounded. |
| Phase 7 | Single HTML template. New levels require only config files. |
| Phase 8 | Platform ready for advanced features and scaling. |

---

*End of REFSPEC.md*
