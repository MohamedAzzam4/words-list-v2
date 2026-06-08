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
