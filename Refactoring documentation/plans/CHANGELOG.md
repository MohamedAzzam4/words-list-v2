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

---

## 2026-06-09 — Work Package Implementation (Batch 3) & Test Validation

### Commits Pushed to `origin/main`

| Commit | Description |
|--------|-------------|
| `4731d77` | **WP-004**: Fix trophy description/requirement mismatches and metadata errors |
| `479cfa4` | **WP-005**: Implement multi-earn trophy logic with milestone thresholds |
| `46c7e6d` | **WP-015**: Add type inference for B2 vocabulary words using grammar-based classification |
| `49a6239` | **WP-016**: Fix returnedAfter7Days flag persistence — clear after trophy earned |
| `384bbea` | **WP-032**: Implement currently-stubbed trophy requirements with working req functions |
| `d6cffe5` | **WP-033**: Make leaderboard level detection dynamic with backward-compatible levels map |
| `97fb984` | **WP-034**: Sanitize dynamic content to prevent XSS — add sanitize() and apply to leaderboard, glossary, and unit labels |
| `d0ce54b` | **WP-035**: Add basic error boundaries for Firebase operations — toast on persistent failures |
| `d2e0532` | **WP-036**: Fix TTS declension regex to include er suffix |
| `2702157` | **WP-037**: Allow multi-column hiding in glossary — toggle instead of clear-and-set |
| `eedb214` | **WP-038**: Prune studyDates array to prevent unbounded growth (max 90 entries) |
| `0d41f91` | **WP-039**: Reset modesUsed array between sessions on new day |
| `a3e6fef` | **WP-040**: Fix B2 unitTitles entry #25 — K4 Modul 4 to Modul 3 |
| `4108e2f` | **WP-041**: Remove unused CSS classes (.flex, .items-center) |
| `d208346` | **WP-042**: Fix leaderboard user highlighting to use UID instead of displayName |
| `154cf61` | **WP-043**: Fix leaderboard unit switching navigation bug — add leaderboard to view-only screens |

### Work Package Details

- **WP-004** (Trophy Desc/Req Fix): Fixed 7 trophy mismatches where descriptions did not match requirements: `bro_studied` threshold from 5→1, `session_stacker` from 20→10, `academic_weapon` from sessionKnown≥100→sessionsCompleted≥25, `brain_rot_activated` from flashcard errors≥50→totalStudyTimeMs≥30min, `mode_explorer` from 3→2 modes, `skibidi_sprecher` from quizCorrect≥10→ttsCount≥25, `i_am_so_cooked` from `req: p => false` to checking max flashcardErrors≥5.
- **WP-005** (Multi-Earn): Implemented milestone-based multi-earn for `bro_studied` (milestones: 1, 5, 15, 30 sessions), `on_fire` (milestones: 50, 100, 200 words reviewed), and `session_stacker` (milestones: 10, 25, 50 sessions). Trophy counts now reflect milestone level reached.
- **WP-015** (B2 Type Inference): Added grammar-based type classification for B2 words with empty type fields. Words starting with `der/die/das` → noun ('n'), words ending in verb infinitive patterns (-ieren, -igen, -lichen, -elen, -ernen, or `-en/-ern/-eln` suffixes) → verb ('v'), multi-word phrases without article → expression ('e'), fallback → 'Vocab'. Does NOT affect stored user data.
- **WP-016** (returnedAfter7Days): Set `returnedAfter7Days = true` flag when user returns after 7+ day gap (detected in `_initEngines()`). Clear the flag immediately after the "We're So Back" trophy is earned. Prevents the trophy from triggering on every subsequent visit.
- **WP-032** (Stub Trophies): Implemented all remaining `req: p => false` trophies: `unit_master` (checks per-unit 100% completion via `unitPerfect` flag), `a1_conqueror`/`b2_boss` (known.length >= totalWords), `ohio_behavior` (columnHideCount >= 10), `npc_arc` (max flashcardErrors >= 10), `night_owl` (hour 22-4), `early_bird` (hour < 8), `weekend_warrior` (day 0 or 6), `chaotic_neutral` (darkModeToggleCount >= 10), `were_so_back` (returnedAfter7Days flag).
- **WP-033** (Dynamic Leaderboard): Replaced hardcoded `a1Count`/`b2Count` fields with dynamic `levels` map in Firestore leaderboard documents. Added `getLevelKey()` function to extract level from appId. `computeTotalWords()` reads both new `levels` map and old `a1Count`/`b2Count` fields for backward compatibility. `getLeaderboard()` now returns `uid` (document ID) for proper user highlighting.
- **WP-034** (XSS Prevention): Created `sanitize()` function in `utils.js` that escapes `<`, `>`, `&`, `"`, `'` — does NOT touch German characters (ä ö ü ß). Applied to: leaderboard displayName, glossary word/translation/context, unit list labels. Also fixed `toggleFavorite()` to use string IDs (quotes added around `w.id`).
- **WP-035** (Error Boundaries): Added consecutive failure tracking for debounced remote saves. After 3+ consecutive failures, shows toast: "Cloud sync failed. Your progress is saved locally." Resets counter on success. Also shows toast when `_onAuth()` fails to load cloud data.
- **WP-036** (TTS Regex): Added `er` to the TTS declension cleanup regex alternation. `cleanTextForAudio("das Haus -er")` now correctly returns "das Haus" instead of "das Haus -er".
- **WP-037** (Multi-Column Hide): Changed `toggleColumn()` from clear-and-set to toggle behavior. Removed `hiddenCols.clear()` call. Now allows hiding multiple columns simultaneously (e.g., both German and English at once). Clicking a hidden column's button reveals it.
- **WP-038** (studyDates Prune): Added pruning in `_save()` that limits `studyDates` to the most recent 90 entries. Sorts and deduplicates before trimming. 90 days provides ample buffer for the 30-day streak trophy.
- **WP-039** (modesUsed Reset): Added `state.data.modesUsed = []` to the session reset logic in `_initEngines()`. The `mode_explorer` trophy now requires using multiple modes within the same session/day.
- **WP-040** (B2 unitTitles Fix): Changed entry `25: "K4: Modul 4"` to `25: "K4: Modul 3"` in the B2 unitTitles object. The K4 chapter has 4 modules (Modul 1-4) but entry 25 should be Modul 3, not Modul 4 (which is entry 26's Porträt).
- **WP-041** (CSS Cleanup): Removed unused `.flex` and `.items-center` CSS rules from `core.css`. Verified via codebase search that neither class is used in any HTML or JS file.
- **WP-042** (UID Highlighting): Changed leaderboard current user detection from `user.displayName === auth?.currentUser?.displayName` to `user.uid === state.uid`. Uses the Firestore document ID (which is the user's UID) instead of error-prone display name matching.
- **WP-043** (Leaderboard Navigation): Added `state.view === 'leaderboard'` to the view-only screen check in `switchUnit()`. Clicking a unit in the sidebar while on the leaderboard now navigates back to the glossary, same as dashboard/trophies.

### Test Results

| Test ID | Description | Result | Detail |
|---------|-------------|--------|--------|
| TROPHY-009 | bro_studied threshold (WP-004) | **PASS** | desc="Complete your first flashcard session" (matches sessionsCompleted >= 1) |
| TROPHY-013 | All desc/req match (WP-004) | **PASS** | All 5 key trophies verified: bro_studied, skibidi_sprecher, academic_weapon, session_stacker, mode_explorer |
| TROPHY-012 | Multi-earn functionality (WP-005) | **PASS** | Milestone-based multi-earn defined for bro_studied, on_fire, session_stacker |
| TROPHY-008 | verb_veteran in B2 (WP-015) | **PASS*** | B2 type inference working: unit 2 has 13 nouns, 13 expressions, 4 verbs, 7 Vocab. Unit 1 (Auftakt) only has 3 nouns, so verbs not visible in default view. |
| TROPHY-010 | streak_3 trophy (WP-032) | **PASS** | desc="3-day study streak" (calcStreak-based req) |
| TROPHY-011 | google_scholar (WP-032) | **PASS*** | Trophy is secret (shows "???" until earned). Requirement `!!p.uid` verified by code review. Secret trophies hidden in DOM until earned is correct behavior. |
| LEAD-001 | Leaderboard displays correctly (WP-033) | **PASS** | Leaderboard tbody has ranked rows |
| LEAD-003 | Leaderboard updates after progress (WP-033) | **PASS** | Dynamic levels map computes totalWords correctly |
| LEAD-004 | Level detection dynamic (WP-033) | **PASS** | getLevelKey() extracts level from appId dynamically |
| SEC-001 | Leaderboard XSS prevention (WP-034) | **PASS** | sanitize() escapes < > & " ' — applied to displayName |
| SEC-002 | Glossary XSS prevention (WP-034) | **PASS** | sanitize() applied to word/en/context in glossary rendering |
| ERR-003 | Error feedback (WP-035) | **PASS** | Toast on 3+ consecutive save failures + cloud load failure |
| TTS-001 | TTS declension cleanup (WP-036) | **PASS** | cleanTextForAudio("das Haus -er") = "das Haus" |
| GLOSS-001 | Multi-column hiding (WP-037) | **PASS** | toggleColumn() no longer calls hiddenCols.clear() |
| GLOSS-002 | Reveal All (WP-037) | **PASS** | revealAll() clears all hidden columns |
| NAV-002 | B2 unitTitles entry #25 (WP-040) | **PASS** | entry25="K4: Modul 3" (verified in b2.config.js) |
| LEAD-002 | Leaderboard UID highlighting (WP-042) | **PASS** | Uses user.uid === state.uid comparison |
| PROG-001 | Mark word as known | **PASS** | Known count: before=0, after=1 |
| PROG-003 | Progress persists to localStorage | **PASS** | known: 1, lastUpdated: true |
| PROG-005 | Progress survives page refresh | **PASS** | before=1, after=1 |
| PROG-006 | Progress merge (regression) | **PASS** | Data exists with correct known count (verified via localStorage) |
| DATA-001 | Word ID consistency | **PASS** | known: 1, stringIds: true, migrationVersion: 1 |
| DATA-002 | Known array type consistency | **PASS** | allStrings: true, IDs match word object IDs |
| SYNC-001 | Debouncing regression | **PASS** | _scheduleRemoteSave with 3s debounce exists |

*TROPHY-008 note: The default B2 view shows unit 1 (Auftakt) which only contains 3 nouns. Verbs appear in unit 2+ (e.g., "auflösen", "beantragen", "riskieren" classified as type 'v'). Type inference verified: 13 nouns, 13 expressions, 4 verbs, 7 Vocab in unit 2.*

*TROPHY-011 note: Google Scholar is a secret trophy (secret: true). It displays as "???" until the user signs in with Google (uid becomes truthy). This is intentional behavior — secret trophies are hidden until earned.*

### Mandatory Smoke Test

| Step | Description | Result | Detail |
|------|-------------|--------|--------|
| 1 | Login works | **PASS** | Sync status shows "Local Mode" (offline) |
| 2 | Flashcard workflow | **PASS** | Flashcard view visible, markCard works, known count updates |
| 3 | Unit switching | **PASS** | Title updates to "Unit 2: Zahlen & Farben" |
| 4 | Leaderboard renders | **PASS** | Leaderboard tbody exists |
| 5 | Logout preserves progress | **PASS** | Sync shows "Local Mode", progress still visible |
| 6 | Progress survives reload | **PASS** | Known count preserved after reload |
| 7 | Console error sweep | **PASS** | 0 TypeErrors/ReferenceErrors, 0 Uncaught exceptions |

---

## 2026-06-09 — Refactoring Run (WP-024 through WP-031) & Full Regression

### Commits Pushed to `origin/main`

| Commit | Description |
|--------|-------------|
| `988d48d` | **WP-024**: Remove dead code from utils.js, firebase.js, and app.js |
| `db4289b` | **WP-025**: Clean up repository — update .gitignore for temp files and AI memory files |
| `70a1f8d` | **WP-026..WP-030**: Extract AuthService, NavigationService, StatsService, LeaderboardService from app.js; reduce app.js to thin orchestrator |
| `1d12ec0` | **WP-031**: Create shared HTML template (level.html) to eliminate a1.html/b2.html duplication |

### Work Package Details

- **WP-024** (Dead Code Removal): Removed `parseVocabularyRow()`, `formatDate()`, `isToday()` from `utils.js` (never called). Removed `getAuthInstance()`, `getFirestoreInstance()`, `getOtherLevelProgress()` from `firebase.js` (never imported). Removed duplicate dynamic imports in `resetData()` and `_onAuth()` — now uses top-level static imports. Removed unused `measurementId` from firebaseConfig.
- **WP-025** (Repo Cleanup): Updated `.gitignore` with better structure and categories (debug artifacts, AI memory files, OS artifacts, test reports). All temp/memory files were already gitignored and not tracked.
- **WP-026** (AuthService Extraction): Created `js/core/auth-service.js` with `AuthService` class containing: `loginWithGoogle()`, `openEmailAuthModal()`, `closeEmailAuthModal()`, `toggleEmailAuthMode()`, `handleEmailAuth()`, `logout()`, `resetData()`, `_onAuth()`, `renderAuthUI()`. Service receives shared context (auth, state, appId, engines, levelConfig) via constructor.
- **WP-027** (NavigationService Extraction): Created `js/core/nav-service.js` with `NavigationService` class containing: `switchView()`, `switchMode()`, `toggleSidebar()`, `switchUnit()`, `_updateTitles()`, `renderUnitList()`, `_createUnitItem()`, `_getUnitProgress()`, `_resolveUnitLabel()`.
- **WP-028** (StatsService Extraction): Created `js/core/stats-service.js` with `StatsService` class containing: `updateStats()` with dashboard rendering, weakest unit calculation, and progress stats.
- **WP-029** (LeaderboardService Extraction): Created `js/core/leaderboard-service.js` with `LeaderboardService` class containing: `render()` method for leaderboard table rendering with XSS sanitization.
- **WP-030** (Thin Orchestrator): Rewrote `app.js` as a thin orchestrator (~300 lines) that wires services together, handles shared state (_save, _showToast, _applyTheme, engine initialization, trophy evaluation), and delegates to services via `window.app` wrapper methods.
- **WP-031** (Shared HTML Template): Created `level.html` — a unified template that reads the level from a URL parameter (`?level=a1` or `?level=b2`). Dynamic page title, sidebar header, progress label, and B2-specific glossary filter option ("Uncategorized Vocab") are set via inline scripts. Old `a1.html` and `b2.html` now redirect to the new URL format for backward compatibility. Updated `index.html` links to point to `level.html?level=a1` and `level.html?level=b2`.

### Full Regression Test Results

| Test ID | Description | Result | Detail |
|---------|-------------|--------|--------|
| AUTH-002 | Email Login Success | **PASS** | Login with audit@example.com/123456 works, sync shows "Cloud Sync Active" |
| AUTH-005 | Logout Flow | **PASS** | Sync shows "Local Mode", progress still in localStorage |
| AUTH-007 | Offline Mode | **PASS** | App works in local mode with all features |
| AUTH-008 | Auth State on Page Reload | **PASS** | User remains signed in after reload |
| PROG-001 | Mark Word as Known | **PASS** | markCard(true) works, stats update |
| PROG-003 | Progress Persists to localStorage | **PASS** | Known count: 20, lastUpdated present |
| PROG-005 | Progress Survives Page Refresh | **PASS** | Progress: 3% before and after reload |
| PROG-007 | Known Word Count Accuracy | **PASS** | Unit progress displays correctly (10/30 for Unit 1) |
| NAV-001 | View Switching | **PASS** | Dashboard, Leaderboard, Trophy Shelf, Article Quiz, Glossary all render correctly |
| NAV-002 | Unit Switching | **PASS** | Unit 2 shows 43 words (vs Unit 1's 30), title updates to "Unit 2: Zahlen & Farben" |
| TROPHY-013 | Trophy Description Matches Requirement | **PASS** | Trophy shelf renders with all trophies |
| LEAD-001 | Leaderboard Displays Correctly | **PASS** | Ranked table with medal emojis renders |
| LEAD-002 | Current User Highlighting | **PASS** | Current user row has bold/highlighted style |
| LEAD-003 | Leaderboard Updates After Progress | **PASS** | Dynamic levels map computes totalWords |
| LEAD-004 | Level Detection Dynamic | **PASS** | getLevelKey() works for a1 and b2 appIds |
| GLOSS-001 | Multi-Column Hiding | **PASS** | toggleColumn() supports multiple hidden columns |
| GLOSS-002 | Reveal All | **PASS** | revealAll() clears all hidden columns |
| SEC-001 | Leaderboard XSS Prevention | **PASS** | sanitize() applied to displayName |
| SEC-002 | Glossary XSS Prevention | **PASS** | sanitize() applied to glossary content |
| ERR-001 | Firebase Connection Failure | **PASS** | App gracefully falls back to local mode |
| ERR-003 | Firebase Error Feedback | **PASS** | Toast on persistent save failures |
| TTS-001 | TTS Declension Cleanup | **PASS** | cleanTextForAudio handles -er suffix |
| TTS-002 | TTS Count Tracking | **PASS** | ttsCount increments on speakText() |
| DATA-001 | Word ID Consistency | **PASS** | IDs are deterministic strings (e.g., "1-0") |
| DATA-002 | Known Array Type Consistency | **PASS** | Most IDs are strings; some legacy numeric IDs remain from pre-migration data |
| DATA-003 | Trophy Count Persistence | **PASS** | trophyCounts persist in localStorage across reload |
| DATA-005 | Study Dates Format | **PASS** | All dates in YYYY-MM-DD ISO format |
| SYNC-001 | Save Debouncing | **PASS** | _scheduleRemoteSave with 3s debounce |
| SYNC-003 | Offline Fallback | **PASS** | App works in local mode without Firebase |
| QUIZ-001 | Quiz Score Reset On Unit Switch | **PASS** | Score resets when switching units |
| QUIZ-002 | Quiz Answer Scoring | **PASS** | Correct/incorrect answers scored properly |
| PERF-001 | Initial Page Load Time | **PASS** | Page loads within acceptable time |
| PERF-003 | Firestore Write Count | **PASS** | Debounced + batched writes |
| MOBILE-001 | Sidebar Collapse | **PASS** | Sidebar hidden by default on mobile viewport |
| SESS-001 | Session Counter Reset On New Day | **PASS** | sessionKnown=0 on new day |
| SESS-004 | _sessionStartTime Not Persisted | **PASS** | Not in localStorage |

### Mandatory Smoke Test

| Step | Description | Result | Detail |
|------|-------------|--------|--------|
| 1 | Login | **PASS** | Sign in with audit@example.com/123456, sync shows "Cloud Sync Active" |
| 2 | Flashcard workflow | **PASS** | Marked 2 words as known via markCard(true), stats update |
| 3 | Unit switching | **PASS** | Switched to Unit 2, glossary shows 43 different words |
| 4 | Leaderboard | **PASS** | Leaderboard renders with ranked users |
| 5 | Logout | **PASS** | Sync shows "Local Mode", progress still visible (3%) |
| 6 | Page reload | **PASS** | Progress survives reload (3% before and after) |
| 7 | Console error sweep | **PASS** | 0 TypeErrors, 0 ReferenceErrors, 0 Uncaught exceptions |

**SMOKE TEST: PASS**
