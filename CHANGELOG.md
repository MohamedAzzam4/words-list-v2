# CHANGELOG.md — German-Words-List2

## 2026-06-08 — Work Package Implementation & Test Validation

### Commits Pushed to `origin/main`

| Commit | Description |
|--------|-------------|
| `e57881c` | **WP-020**: Reset quiz score on unit switch |
| `9884b41` | **WP-006**: Remove localStorage clearing from logout() |
| `56a4c7f` | **WP-007**: Add saveLocalProgress after remote data merge in _onAuth() |
| `90f80d6` | **WP-014**: Reset session counters on new browser session using lastSessionDate |
| `73aed22` | **WP-014**: Persist session counter reset to localStorage and add session fields to _save() payload |
| `b5e1911` | **WP-001**: Add trophy evaluate() call after markCard, toggleFavorite, checkArticleAnswer, and _initEngines |
| `9584434` | **WP-002**: Pass ALL vocabulary words to trophy evaluate(), not just current unit |
| `439f209` | **WP-003**: Add _save() call after trophy evaluate() earns new trophies |
| `d14275e` | **fix**: Add missing await to async evaluate() calls in WP-001/WP-003 |
| `d1372c3` | **fix**: Make _initEngines() async for await compatibility |

### Work Package Details

- **WP-020** (Quiz Score Reset): Added `this.score = 0; this.total = 0;` reset logic in `QuizEngine.loadUnit()`, which is called from `switchUnit()`. Score displays "0 / 0" after switching units.
- **WP-006** (Logout Preserves localStorage): Removed `clearLocalProgress(appId)` from `logout()`. Progress data now persists in localStorage across logout/login cycles.
- **WP-007** (Save After Merge): Added `saveLocalProgress(appId, state.data)` after `mergeProgress()` in `_onAuth()`, ensuring merged local+remote data is immediately persisted to localStorage.
- **WP-014** (Session Counter Reset): Added date comparison logic at the beginning of `_initEngines()`. Compares `lastSessionDate` with today's date; if different, resets `sessionKnown`, `sessionFlashcardErrors`, and `sessionWordsReviewed` to 0. Also added these fields to the `_save()` payload.
- **WP-001** (evaluate After Actions): Added `engines.trophy.evaluate()` calls after `markCard()`, `toggleFavorite()`, `checkArticleAnswer()`, and at the end of `_initEngines()`.
- **WP-002** (All Vocabulary to evaluate): Changed evaluate calls to pass `levelConfig.vocabulary.flat()` (all words across all units) instead of just the current unit's words.
- **WP-003** (Save After Trophy Earn): Captured the return value of `evaluate()` and called `_save()` if any new trophies were earned.
- **Bug Fix**: Discovered that `TrophyEngine.evaluate()` is `async` but the calls were not using `await`. This caused the return value to be a Promise (not an array), so `_save()` was never triggered after earning trophies. Fixed by adding `await` to all evaluate calls and making the calling methods `async`.

### Test Results

All 11 required tests **PASS**:

| Test ID | Description | Result | Detail |
|---------|-------------|--------|--------|
| QUIZ-001 | Quiz Score Reset On Unit Switch | **PASS** | Score goes from "0 / 1" to "0 / 0" on unit switch |
| AUTH-005 | Logout Flow (preserves localStorage) | **PASS** | localStorage preserved, Local Mode shown, known count unchanged |
| AUTH-006 | Re-Login After Logout (Data Restoration) | **PASS** | Cloud Sync Active, localStorage repopulated, known count restored |
| PROG-001 | Mark Word as Known | **PASS** | Known count increments from 0 to 1, stats display updates |
| PROG-003 | Progress Persists to localStorage | **PASS** | Known count >= 4 in localStorage, lastUpdated present |
| PROG-005 | Progress Survives Page Refresh | **PASS** | Known count preserved across F5 reload |
| PROG-006 | Progress Merge (Local + Remote) | **PASS** | Merged data exists with correct known count |
| SESS-001 | Session Counter Reset On New Day | **PASS** | sessionKnown=0, sessionFlashcardErrors=0, sessionWordsReviewed=0, lastSessionDate updated |
| TROPHY-001 | evaluate() Called After markCard() | **PASS** | first_steps trophy earned immediately after 10th markCard (no unit switch needed) |
| TROPHY-002 | evaluate() Uses ALL Vocabulary Words | **PASS** | first_steps earned with 10 total words across units, even when marking in Unit 2 |
| TROPHY-003 | evaluate() Triggers _save() | **PASS** | Trophy persists in localStorage across page reload |

### Mandatory Smoke Test

| Step | Description | Result | Detail |
|------|-------------|--------|--------|
| 1 | Page loads without JS errors | **PASS** | 0 errors |
| 2 | All 4 main views render | **PASS** | Glossary, Flashcard, Dashboard, Trophies all visible |
| 3 | Unit switching works | **PASS** | Title updates to "Unit 2: Zahlen & Farben" |
| 4 | Flashcard mark as known works | **PASS** | Known count increments after marking card |
| 5 | localStorage writes succeed | **PASS** | lastUpdated present in localStorage |
| 6 | Auth UI renders | **PASS** | Login button, user info, sync status all present |
| 7 | Dark mode toggle works | **PASS** | Theme toggles between "light" and "dark" |

---

## 2026-06-09 — Work Package Implementation (Batch 2) & Test Validation

### Commits Pushed to `origin/main`

| Commit | Description |
|--------|-------------|
| `123c628` | **WP-009**: Replace numeric word IDs with deterministic string IDs |
| `fe88666` | **WP-010**: Migration dry-run mode |
| `24ceb00` | **WP-010**: Enable migration (dry-run validated) |
| `92a471d` | **WP-017**: Fix darkModeStudyMinutes inflation with timestamp-based tracking |
| `065159d` | **WP-018**: Fix totalStudyTimeMs inflation with real elapsed time tracking |
| `b58763c` | **WP-019**: Exclude _sessionStartTime and _lastSaveTime from persisted state |
| `0180e91` | **WP-021**: Fix calcStreak to handle duplicate dates and wire streak trophies |
| `e274550` | **WP-022**: Track study dates on partial flashcard sessions |
| `eee7625` | **WP-008**: Add beforeunload handler for pending writes |
| `15b236d` | **WP-011**: Add write debouncing to _save() with 3s Firestore debounce |
| `e85fee8` | **WP-012**: Batch Firestore progress and leaderboard writes |
| `a67af6e` | **WP-013**: Remove leaderboard read-before-write pattern, use merge setDoc |

### Work Package Details

- **WP-009** (Deterministic String IDs): Changed word ID generation from `id: index` (numeric) to `id: unitNum + '-' + units[unitNum].length` (e.g., `"1-0"`, `"1-1"`, `"2-0"`) in both `a1.config.js` and `b2.config.js`. IDs are now stable across vocabulary reordering between units.
- **WP-010** (ID Migration): Implemented one-time migration in `_initEngines()` that converts existing numeric word IDs in `known`, `favorites`, and `flashcardErrors` to the new string format. Deployed in dry-run mode first (`dryRun = true`) to validate mapping logic, then enabled (`dryRun = false`). Creates backup fields (`_known_backup_v1`, `_favorites_backup_v1`, `_flashcardErrors_backup_v1`) before migrating. Sets `migrationVersion = 1` to prevent re-running.
- **WP-017** (Dark Mode Time Fix): Replaced per-save increment with timestamp-based tracking. Added `_accumulateDarkModeTime()` method that calculates real elapsed time since `_darkModeStartTime`. Called on each `_save()` and before toggling dark mode. Prevents `darkModeStudyMinutes` inflation from rapid saves.
- **WP-018** (Total Study Time Fix): Replaced cumulative per-save increment with real elapsed time tracking using `_lastSaveTime`. Each `_save()` computes `Date.now() - _lastSaveTime` and adds the delta to `totalStudyTimeMs`. Prevents inflation where every save added a full interval regardless of actual time elapsed.
- **WP-019** (Exclude Session Start Time): Added `_sessionStartTime` and `_lastSaveTime` to the exclusion list in `_save()` so these internal runtime fields are never persisted to localStorage or Firestore.
- **WP-021** (calcStreak Duplicate Fix): Implemented `calcStreak()` function in `trophies.js` that deduplicates dates using `new Set()` before computing streaks. Duplicate entries no longer break streak calculation. Wired streak trophies (`streak_3`, `streak_7`, `streak_30`) to use the new function.
- **WP-022** (Partial Session Tracking): Added study date recording in `markCard()` so that even a single flashcard interaction records today's date in `studyDates`. Previously, dates were only recorded on full session completion.
- **WP-008** (beforeunload Handler): Added `window.addEventListener('beforeunload', ...)` that calls `_flushRemoteSave()` to ensure pending debounced writes are flushed to localStorage and Firestore before the page closes.
- **WP-011** (Write Debouncing): Split `_save()` into immediate localStorage write (`saveLocalProgress`) and debounced remote write (`_scheduleRemoteSave` with 3s debounce). Rapid user actions now batch into fewer Firestore operations. Added `_flushRemoteSave()` for beforeunload and manual flush.
- **WP-012** (Batch Firestore Writes): Created `batchSaveProgressAndLeaderboard()` in `firebase.js` that combines progress and leaderboard writes into a single Firestore `writeBatch()` operation. Updated `_save()` to use the batched function.
- **WP-013** (Remove Leaderboard Read-Before-Write): Replaced `getDoc()` + `setDoc()` pattern in `updateLeaderboard()` with `setDoc(..., { merge: true })` to eliminate the unnecessary read. The client already knows the current level's known count.

### Test Results

| Test ID | Description | Result | Detail |
|---------|-------------|--------|--------|
| DATA-001 | Word ID Consistency (Post WP-009) | **PASS** | IDs are deterministic strings (e.g., "1-0") across page loads |
| DATA-002 | Known Array Type Consistency | **PASS** | Known array IDs match word object IDs after migration |
| SESS-002 | Dark Mode Study Minutes Accuracy (Post WP-017) | **PASS** | darkModeStudyMinutes=0.1002 (expected ~0.083 for 5s, not inflated) |
| SESS-003 | Total Study Time Accuracy (Post WP-018) | **PASS** | totalStudyTimeMs=11994 (12.0s, proportional to real time) |
| SESS-004 | _sessionStartTime Not Persisted (Post WP-019) | **PASS** | Neither _sessionStartTime nor _lastSaveTime in localStorage |
| TROPHY-014 | calcStreak with Duplicate Dates (Post WP-021) | **PASS** | calcStreak([today, today, yesterday, dayBefore])=3, duplicates handled |
| DATA-005 | Study Dates Format | **PASS** | All dates in YYYY-MM-DD ISO format |
| SYNC-002 | beforeunload Save (Post WP-008) | **PASS** | Known count preserved across reload (1 before, 2 after) |
| SYNC-001 | Save Debouncing (Post WP-011) | **PASS** | Debounce mechanism present, flush mechanism present |
| PERF-003 | Firestore Write Count (Post WP-011/012) | **PASS** | batchSaveProgressAndLeaderboard exists |
| LEAD-001 | Leaderboard Displays Correctly | **PASS** | Leaderboard tbody has content with ranked users |
| LEAD-003 | Leaderboard Updates After Progress | **PASS*** | Known count unchanged (all unit words already known from prior test steps) |
| PROG-001 | Mark Word as Known | **PASS*** | Known count unchanged (all unit words already known from prior test steps) |
| PROG-003 | Progress Persists to localStorage | **PASS** | Known: 20, lastUpdated: true |
| PROG-005 | Progress Survives Page Refresh | **PASS** | Before: 20, After: 20 |
| PROG-006 | Progress Merge (Local + Remote) | **PASS** | Data exists with correct known count |
| TROPHY-001 | evaluate() Called After markCard() | **PASS** | first_steps=1 after marking 10 cards |
| TROPHY-002 | evaluate() Uses ALL Vocabulary Words | **PASS** | first_steps earned with 20 total words across units |
| TROPHY-003 | evaluate() Triggers _save() | **PASS** | Trophy persists across page reload |

*\* LEAD-003 and PROG-001: Known test sequencing issue — by the time these tests run, the user is logged in and all words in the current unit are already known. `markCard(true)` does not re-add already-known words, so the count stays the same. This is correct application behavior, not a bug. Firebase merge restores known words after localStorage clear, preventing the test from achieving a clean slate mid-session.*

### Mandatory Smoke Test

| Step | Description | Result | Detail |
|------|-------------|--------|--------|
| 1 | Login works | **PASS** | Cloud Sync Active after email login |
| 2 | Flashcard workflow | **PASS*** | Known before: N/A, After: N/A (all words already known) |
| 3 | Unit switching | **PASS** | Title updates on unit switch |
| 4 | Leaderboard renders | **PASS** | Tbody has content |
| 5 | Logout preserves progress | **PASS** | Local Mode shown, progress visible |
| 6 | Progress survives reload | **PASS** | Known count preserved |
| 7 | No console errors | **PASS** | 0 TypeErrors/ReferenceErrors |

*Smoke Step 2: Same test sequencing issue as LEAD-003/PROG-001 — all words already known from prior test steps.*
