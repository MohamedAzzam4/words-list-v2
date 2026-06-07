# TESTPLAN.md — Comprehensive Testing Plan

**Project:** German-Words-List2  
**Repository:** https://github.com/MohamedAzzam4/German-Words-List2  
**Date:** 2026-06-07  
**Author:** QA Lead / Test Architect  
**Purpose:** Provide an exhaustive, executable testing plan covering all functionality, regression scenarios, and release criteria. Aligned with REFSPEC.md work packages.

---

## Table of Contents

1. [Test Categories and Test Cases](#1-test-categories-and-test-cases)
2. [Regression Matrix](#2-regression-matrix)
3. [Release Checklist](#3-release-checklist)
4. [Final Section — Risk, Quick Wins, Delegation Guide](#4-final-section)

---

## 1. Test Categories and Test Cases

---

### 1.1 Authentication Tests (AUTH)

---

#### AUTH-001: Google Login Success
- **Objective:** Verify Google OAuth login works end-to-end.
- **Preconditions:** Firebase project configured. User has a Google account. Page loaded at a1.html or b2.html.
- **Steps:**
  1. Click "Sign in with Google" button.
  2. Complete Google OAuth popup flow.
  3. Observe the page.
- **Expected Results:**
  - Page reloads after successful auth.
  - Sync status shows "☁️ Cloud Sync Active".
  - User avatar and display name appear in the header.
  - Login button is hidden. User info is visible.
- **Failure Conditions:** Sync status stays "💾 Local Mode". Login button remains visible. Console shows auth errors.
- **Priority:** Critical

---

#### AUTH-002: Email Login Success
- **Objective:** Verify email/password sign-in works.
- **Preconditions:** A user account exists with email "test@example.com" and password "password123".
- **Steps:**
  1. Click "Sign in with Email" button.
  2. Verify modal opens with title "Sign In with Email".
  3. Enter email "test@example.com" and password "password123".
  4. Click "Sign In".
- **Expected Results:**
  - Modal closes.
  - Page reloads.
  - Sync status shows "☁️ Cloud Sync Active".
  - User name shows email or display name.
- **Failure Conditions:** Modal shows error message. Page does not reload. Auth state not updated.
- **Priority:** Critical

---

#### AUTH-003: Email Sign-Up
- **Objective:** Verify new user registration via email.
- **Preconditions:** No account exists for the test email.
- **Steps:**
  1. Click "Sign in with Email" button.
  2. Click "Sign Up" toggle link.
  3. Verify modal title changes to "Create Account" and name field appears.
  4. Enter name, email, password.
  5. Click "Sign Up".
- **Expected Results:**
  - Account created. Page reloads. User signed in.
- **Failure Conditions:** Error message shown. Account not created.
- **Priority:** High

---

#### AUTH-004: Email Login — Wrong Password
- **Objective:** Verify error handling for incorrect credentials.
- **Preconditions:** Account exists for "test@example.com".
- **Steps:**
  1. Open email auth modal.
  2. Enter correct email, wrong password.
  3. Click "Sign In".
- **Expected Results:**
  - Error message "Incorrect email or password." displayed in modal.
  - Modal remains open. Submit button re-enabled.
- **Failure Conditions:** No error shown. Generic error message. Page crashes.
- **Priority:** High

---

#### AUTH-005: Logout Flow
- **Objective:** Verify logout signs out and preserves local data (after WP-006 fix).
- **Preconditions:** User is signed in. Has some progress (e.g., 5 known words).
- **Steps:**
  1. Verify sync status is "☁️ Cloud Sync Active".
  2. Click "Logout".
  3. Observe page reload.
- **Expected Results:**
  - Sync status shows "💾 Local Mode".
  - Login button reappears. User info hidden.
  - Progress is still visible (known word counts unchanged) — **post WP-006**.
  - `localStorage` still contains progress data — **post WP-006**.
- **Failure Conditions:** Progress disappears. localStorage is empty (pre WP-006 this is expected; post WP-006 this is a failure).
- **Priority:** Critical

---

#### AUTH-006: Re-Login After Logout — Data Restoration
- **Objective:** Verify that logging back in restores cloud-synced data.
- **Preconditions:** User had progress, logged out, localStorage may be cleared (pre WP-006).
- **Steps:**
  1. Sign in with the same account.
  2. Observe page reload.
- **Expected Results:**
  - All previously saved progress is restored (known words, trophies, favorites).
  - Sync status shows "☁️ Cloud Sync Active".
  - localStorage is repopulated with merged data — **post WP-007**.
- **Failure Conditions:** Progress shows 0. Known words empty. localStorage empty after re-login.
- **Priority:** Critical

---

#### AUTH-007: Offline Mode Functionality
- **Objective:** Verify the app works without Firebase.
- **Preconditions:** Firebase is unreachable (simulated by blocking network or using invalid config).
- **Steps:**
  1. Load a1.html or b2.html.
  2. Verify sync status shows "💾 Local Mode".
  3. Navigate to different units. Use flashcards. Mark words as known.
- **Expected Results:**
  - All features work in offline mode.
  - Progress saved to localStorage.
  - No console errors blocking functionality.
- **Failure Conditions:** Features broken. Console errors prevent usage. Progress not saved locally.
- **Priority:** High

---

#### AUTH-008: Auth State On Page Reload
- **Objective:** Verify that refreshing the page preserves auth state.
- **Preconditions:** User is signed in.
- **Steps:**
  1. Verify user is signed in.
  2. Press F5 to reload the page.
  3. Observe auth state.
- **Expected Results:**
  - User remains signed in.
  - Sync status shows "☁️ Cloud Sync Active".
  - Progress is visible.
- **Failure Conditions:** User is signed out after reload. Progress lost.
- **Priority:** High

---

### 1.2 Progress Tracking Tests (PROG)

---

#### PROG-001: Mark Word as Known
- **Objective:** Verify marking a flashcard as "Known" updates all state correctly.
- **Preconditions:** A unit is loaded with flashcards. At least 1 flashcard is visible.
- **Steps:**
  1. Navigate to Flashcard view.
  2. Click "Known" (✓) button.
  3. Observe: flashcard advances, stats update, sidebar progress updates.
- **Expected Results:**
  - Flashcard advances to next card.
  - The word's ID is added to `state.data.known` array.
  - Stats bar increments known count.
  - Sidebar shows updated progress for the current unit (e.g., "1/30 (3%)").
  - `localStorage` is updated with the new known word.
- **Failure Conditions:** Card doesn't advance. Stats don't update. Known count incorrect.
- **Priority:** Critical

---

#### PROG-002: Mark Word as Learning
- **Objective:** Verify marking a flashcard as "Still Learning" re-queues the word.
- **Preconditions:** Flashcard view loaded with at least 1 card.
- **Steps:**
  1. Click "Still Learning" (✗) button.
  2. Continue through the queue.
- **Expected Results:**
  - The word remains in the flashcard queue for review.
  - The word is NOT added to `state.data.known`.
  - Flashcard error count for this word increments.
- **Failure Conditions:** Word disappears from queue. Word added to known. Error count not tracked.
- **Priority:** Critical

---

#### PROG-003: Progress Persists to localStorage
- **Objective:** Verify that progress is immediately saved to localStorage.
- **Preconditions:** User is in offline mode (or any mode).
- **Steps:**
  1. Mark 3 words as known.
  2. Open browser DevTools → Application → Local Storage.
  3. Check the key `german_app_progress_german-a1-app`.
- **Expected Results:**
  - The `known` array in localStorage contains the 3 word IDs.
  - `lastUpdated` timestamp is recent.
- **Failure Conditions:** localStorage key missing. Known array empty or wrong length.
- **Priority:** Critical

---

#### PROG-004: Progress Persists to Firestore
- **Objective:** Verify that progress is saved to Firestore when authenticated.
- **Preconditions:** User is signed in.
- **Steps:**
  1. Mark 3 words as known.
  2. Wait for debounce interval (post WP-011) or observe immediate write (pre WP-011).
  3. Check Firestore console at `artifacts/german-a1-app/users/{uid}/progress/main`.
- **Expected Results:**
  - Firestore document contains the 3 word IDs in the `known` array.
  - `lastUpdated` is recent.
- **Failure Conditions:** Firestore document not updated. Known array empty.
- **Priority:** Critical

---

#### PROG-005: Progress Survives Page Refresh
- **Objective:** Verify progress persists across page reloads.
- **Preconditions:** User has marked some words as known.
- **Steps:**
  1. Mark 5 words as known. Note the count.
  2. Press F5 to reload.
  3. Check stats and sidebar.
- **Expected Results:**
  - Known word count matches pre-reload count.
  - Sidebar progress percentages unchanged.
- **Failure Conditions:** Known count resets to 0. Progress lost.
- **Priority:** Critical

---

#### PROG-006: Progress Merge (Local + Remote)
- **Objective:** Verify that local and remote progress merge correctly.
- **Preconditions:** User has local progress (e.g., known IDs [1,2,3]) and different Firestore progress (e.g., known IDs [2,3,4,5]).
- **Steps:**
  1. Sign in.
  2. Observe merged state.
- **Expected Results:**
  - `state.data.known` contains the union: [1,2,3,4,5].
  - Numeric counters take the maximum value.
  - Favorites are unioned.
  - Trophy counts take the maximum.
- **Failure Conditions:** Only local or only remote data shown. Data overwritten instead of merged.
- **Priority:** Critical

---

#### PROG-007: Known Word Count Accuracy
- **Objective:** Verify stats display accurate counts.
- **Preconditions:** User has marked exactly N words as known across multiple units.
- **Steps:**
  1. Mark 5 words in Unit 1 as known.
  2. Switch to Unit 2. Mark 3 words as known.
  3. Navigate to Dashboard view.
- **Expected Results:**
  - Total known shows 8.
  - Unit 1 shows 5/total, Unit 2 shows 3/total.
  - Overall percentage calculated correctly.
- **Failure Conditions:** Count doesn't include cross-unit progress. Percentage wrong.
- **Priority:** High

---

### 1.3 Lesson Completion Tests (LESSON)

---

#### LESSON-001: Flashcard Session Complete Callback
- **Objective:** Verify that completing all flashcards in a unit triggers the session complete callback.
- **Preconditions:** A unit with exactly 3 words loaded in flashcard view.
- **Steps:**
  1. Mark all 3 words as "Known" (or mix of known/learning, then mark remaining as known).
  2. Observe when the queue is exhausted.
- **Expected Results:**
  - `sessionsCompleted` increments by 1.
  - Today's date is added to `studyDates` (if not already present).
  - Toast or visual feedback may appear.
- **Failure Conditions:** `sessionsCompleted` doesn't increment. Date not recorded.
- **Priority:** High

---

#### LESSON-002: Session Counter Increment
- **Objective:** Verify sessionsCompleted counter increases correctly.
- **Preconditions:** `sessionsCompleted` is at 0.
- **Steps:**
  1. Complete 1 full flashcard session (exhaust the queue for a unit).
  2. Check `state.data.sessionsCompleted`.
  3. Complete another session in a different unit.
  4. Check counter again.
- **Expected Results:**
  - After first session: `sessionsCompleted = 1`.
  - After second session: `sessionsCompleted = 2`.
- **Failure Conditions:** Counter doesn't increment. Counter increments by more than 1.
- **Priority:** High

---

#### LESSON-003: Study Date Recording On Partial Session (Post WP-022)
- **Objective:** Verify that marking even 1 flashcard records today's study date.
- **Preconditions:** `studyDates` array does not contain today's date.
- **Steps:**
  1. Mark 1 word as known in flashcard view.
  2. Check `state.data.studyDates`.
- **Expected Results:**
  - Today's date (ISO format, e.g., "2026-06-07") is in the array.
- **Failure Conditions:** Today's date not recorded until full session completion.
- **Priority:** High

---

### 1.4 Trophy System Tests (TROPHY)

---

#### TROPHY-001: evaluate() Called After markCard() (Post WP-001)
- **Objective:** Verify trophy evaluation runs when marking flashcards.
- **Preconditions:** User has 9 known words (1 away from "First Steps" trophy). Trophy not yet earned.
- **Steps:**
  1. Mark 1 more word as known in flashcard view.
  2. Observe the trophy shelf / toast.
- **Expected Results:**
  - "First Steps" trophy is earned immediately (without switching units).
  - Toast notification: "First Steps" appears.
  - Trophy shelf shows "First Steps" as earned.
- **Failure Conditions:** Trophy not earned until unit switch. No toast. Trophy not visible.
- **Priority:** Critical

---

#### TROPHY-002: evaluate() Uses ALL Vocabulary Words (Post WP-002)
- **Objective:** Verify trophies evaluate against the full level vocabulary, not just current unit.
- **Preconditions:** User has 5 known words in Unit 1 and 5 known words in Unit 2. Currently viewing Unit 2.
- **Steps:**
  1. Mark 1 more word in Unit 2 as known (total: 5+5+1 = 11 known globally).
  2. Check if "First Steps" (10 words) is earned.
- **Expected Results:**
  - "First Steps" trophy is earned based on 11 total known words across all units.
- **Failure Conditions:** Trophy only evaluates against Unit 2's words (6 known), doesn't trigger.
- **Priority:** Critical

---

#### TROPHY-003: evaluate() Triggers _save() (Post WP-003)
- **Objective:** Verify earned trophies persist across page reloads.
- **Preconditions:** User meets the "First Steps" requirement (10+ known words).
- **Steps:**
  1. Earn the "First Steps" trophy.
  2. Verify toast appears.
  3. Reload the page (F5).
  4. Navigate to Trophy Shelf view.
- **Expected Results:**
  - "First Steps" trophy is still shown as earned after reload.
  - `localStorage` contains `trophyCounts: { first_steps: 1 }`.
- **Failure Conditions:** Trophy disappears after reload. trophyCounts empty in localStorage.
- **Priority:** Critical

---

#### TROPHY-004: Tier 1 — first_steps (10 words)
- **Objective:** Verify "First Steps" trophy earnable.
- **Preconditions:** 0 known words. Trophy not earned.
- **Steps:**
  1. Mark 10 words as known.
- **Expected Results:** Trophy earned. Toast shown.
- **Failure Conditions:** Trophy not earned at 10 words.
- **Priority:** High

---

#### TROPHY-005: Tier 1 — slay_vocab (50 words)
- **Objective:** Verify "Slay Vocabulary" trophy earnable.
- **Preconditions:** 49 known words.
- **Steps:** Mark 1 more word as known.
- **Expected Results:** Trophy earned.
- **Failure Conditions:** Trophy not earned.
- **Priority:** High

---

#### TROPHY-006: Tier 1 — bronze (25% of all words)
- **Objective:** Verify percentage-based trophy.
- **Preconditions:** A1 has ~711 words. 25% = ~178 words. User has 177 known.
- **Steps:** Mark 1 more word.
- **Expected Results:** "Bronze Learner" trophy earned.
- **Failure Conditions:** Percentage calculated incorrectly. Trophy not earned.
- **Priority:** High

---

#### TROPHY-007: Tier 1 — verb_veteran (30 verbs) in A1
- **Objective:** Verify type-based trophy works in A1 where types are properly classified.
- **Preconditions:** User on A1. Has 29 verbs (type "v") known.
- **Steps:** Mark 1 more verb as known.
- **Expected Results:** "Verb Master" trophy earned.
- **Failure Conditions:** Type filtering doesn't work. Trophy not earned.
- **Priority:** High

---

#### TROPHY-008: Tier 1 — verb_veteran in B2 (Post WP-015)
- **Objective:** Verify type-based trophy works in B2 after type inference is added.
- **Preconditions:** User on B2. Has 29 B2 words that are classified as verbs (type "v") known.
- **Steps:** Mark 1 more B2 verb as known.
- **Expected Results:** "Verb Master" trophy earned. B2 words have proper type classifications.
- **Failure Conditions:** All B2 words still type "Vocab". Trophy unearnable.
- **Priority:** High

---

#### TROPHY-009: Tier 2 — bro_studied (Post WP-004)
- **Objective:** Verify description/requirement match after fix.
- **Preconditions:** `sessionsCompleted = 0`.
- **Steps:** Complete 1 flashcard session.
- **Expected Results:** "Bro Actually Studied" trophy earned (matches desc "first flashcard session").
- **Failure Conditions:** Trophy requires 5 sessions (old threshold).
- **Priority:** High

---

#### TROPHY-010: Tier 3 — streak_3 (Post WP-032)
- **Objective:** Verify 3-day streak trophy works.
- **Preconditions:** `studyDates` contains 3 consecutive dates: ["2026-06-05", "2026-06-06", "2026-06-07"].
- **Steps:** Trigger trophy evaluation.
- **Expected Results:** "Locked TF In" (3-day streak) trophy earned.
- **Failure Conditions:** `calcStreak()` returns wrong value. Trophy has `req: p => false`.
- **Priority:** Medium

---

#### TROPHY-011: Tier 4 — google_scholar
- **Objective:** Verify "Google Scholar" trophy (sign in with Google).
- **Preconditions:** User signs in with Google.
- **Steps:** Complete Google sign-in. Trigger trophy evaluation.
- **Expected Results:** Trophy earned (checks `p.uid` is truthy).
- **Failure Conditions:** Trophy not earned despite being signed in.
- **Priority:** Medium

---

#### TROPHY-012: Multi-Earn Functionality (Post WP-005)
- **Objective:** Verify trophies with `multi: true` can be earned multiple times.
- **Preconditions:** `bro_studied` has been earned once (trophyCounts = 1).
- **Steps:** Meet the requirement again (complete another session).
- **Expected Results:** `trophyCounts.bro_studied` increments to 2. Badge shows "x2".
- **Failure Conditions:** Trophy count stays at 1. No re-earn possible.
- **Priority:** Medium

---

#### TROPHY-013: Trophy Description Matches Requirement
- **Objective:** Verify all 34 trophy descriptions accurately describe their requirements.
- **Preconditions:** Source code available.
- **Steps:** For each trophy in TROPHIES array:
  1. Read the `desc` string.
  2. Read the `req` function.
  3. Verify they describe the same condition.
- **Expected Results:** All descriptions match requirements. No misleading text.
- **Failure Conditions:** Any trophy has desc/req mismatch.
- **Priority:** High

---

#### TROPHY-014: calcStreak with Duplicate Dates (Post WP-021)
- **Objective:** Verify streak calculation handles duplicate dates.
- **Preconditions:** `studyDates = ["2026-06-07", "2026-06-07", "2026-06-06", "2026-06-05"]`.
- **Steps:** Call `calcStreak(studyDates)`.
- **Expected Results:** Returns 3 (three consecutive days, duplicate ignored).
- **Failure Conditions:** Returns 1 (duplicate breaks streak).
- **Priority:** Medium

---

### 1.5 Leaderboard Tests (LEAD)

---

#### LEAD-001: Leaderboard Displays Correctly
- **Objective:** Verify leaderboard view shows ranked users.
- **Preconditions:** User is signed in. Leaderboard collection has data.
- **Steps:**
  1. Click "Leaderboard" in navigation.
  2. Observe the leaderboard table.
- **Expected Results:**
  - Users ranked by `totalWords` descending.
  - Top 3 show medal emojis (🥇🥈🥉).
  - Display name and word count shown for each user.
- **Failure Conditions:** Empty table. Wrong ranking order. Missing data.
- **Priority:** High

---

#### LEAD-002: Current User Highlighting (Post WP-042)
- **Objective:** Verify current user's row is highlighted.
- **Preconditions:** User is signed in and appears on the leaderboard.
- **Steps:** View leaderboard.
- **Expected Results:** Current user's row has bold text and highlighted background.
- **Failure Conditions:** No highlighting. Wrong user highlighted.
- **Priority:** Medium

---

#### LEAD-003: Leaderboard Updates After Progress
- **Objective:** Verify leaderboard reflects latest word count.
- **Preconditions:** User is signed in with 10 known words on leaderboard.
- **Steps:**
  1. Mark 5 more words as known.
  2. Navigate to Leaderboard view.
- **Expected Results:** User's word count shows 15 (or updated count after debounce).
- **Failure Conditions:** Count still shows 10. Leaderboard not updated.
- **Priority:** Medium

---

#### LEAD-004: Level Detection Dynamic (Post WP-033)
- **Objective:** Verify leaderboard supports levels beyond A1/B2.
- **Preconditions:** Leaderboard schema uses dynamic `levels` map.
- **Steps:** Simulate progress with appId `german-a2-app`.
- **Expected Results:** A2 count appears in leaderboard document. `totalWords` sums all levels.
- **Failure Conditions:** Only `a1Count`/`b2Count` fields recognized. A2 count ignored.
- **Priority:** Medium

---

### 1.6 Firebase Synchronization Tests (SYNC)

---

#### SYNC-001: Save Debouncing (Post WP-011)
- **Objective:** Verify rapid saves are batched.
- **Preconditions:** User is signed in. Network tab open in DevTools.
- **Steps:**
  1. Mark 10 flashcards as known rapidly (within 5 seconds).
  2. Observe Firestore write count in Network tab.
- **Expected Results:**
  - At most 1-3 Firestore writes (not 20+).
  - localStorage updated on every action (immediately).
- **Failure Conditions:** 20 separate Firestore writes observed. No debouncing.
- **Priority:** Critical

---

#### SYNC-002: beforeunload Save (Post WP-008)
- **Objective:** Verify pending data is saved when the page closes.
- **Preconditions:** User has unsaved progress (within debounce window).
- **Steps:**
  1. Mark 5 words as known rapidly.
  2. Immediately close the tab.
  3. Reopen the page.
- **Expected Results:**
  - All 5 words still known (saved to localStorage via beforeunload).
- **Failure Conditions:** Some or all words lost.
- **Priority:** High

---

#### SYNC-003: Offline Fallback
- **Objective:** Verify graceful handling of Firebase connection failure.
- **Preconditions:** Firebase is unreachable.
- **Steps:**
  1. Disconnect internet / block Firebase domains.
  2. Load the app.
  3. Make progress.
- **Expected Results:**
  - App works in "💾 Local Mode".
  - Progress saved to localStorage.
  - No blocking errors. Console shows warning but app is functional.
- **Failure Conditions:** App crashes. Progress not saved. Blocking error dialog.
- **Priority:** High

---

### 1.7 Session Persistence Tests (SESS)

---

#### SESS-001: Session Counter Reset On New Day (Post WP-014)
- **Objective:** Verify session counters reset when a new day begins.
- **Preconditions:** `sessionKnown = 25` from yesterday's session.
- **Steps:**
  1. Load the page on a new day (or simulate by changing `lastSessionDate`).
  2. Check `state.data.sessionKnown`.
- **Expected Results:** `sessionKnown = 0`. Dashboard shows "Words Studied Today: 0".
- **Failure Conditions:** `sessionKnown` still 25. Dashboard shows yesterday's cumulative count.
- **Priority:** Critical

---

#### SESS-002: Dark Mode Study Minutes Accuracy (Post WP-017)
- **Objective:** Verify darkModeStudyMinutes tracks real time.
- **Preconditions:** Dark mode enabled. `darkModeStudyMinutes = 0`.
- **Steps:**
  1. Wait 2 real minutes.
  2. Trigger a save (mark a word).
  3. Check `state.data.darkModeStudyMinutes`.
- **Expected Results:** Value ≈ 2.0 (±0.5 minutes).
- **Failure Conditions:** Value is significantly different (e.g., 5+ from multiple saves).
- **Priority:** High

---

#### SESS-003: Total Study Time Accuracy (Post WP-018)
- **Objective:** Verify totalStudyTimeMs tracks real elapsed time.
- **Preconditions:** `totalStudyTimeMs = 0`.
- **Steps:**
  1. Use the app for approximately 5 minutes.
  2. Check `state.data.totalStudyTimeMs`.
- **Expected Results:** Value ≈ 300,000 ms (5 minutes ± 30 seconds).
- **Failure Conditions:** Value significantly inflated or deflated.
- **Priority:** High

---

#### SESS-004: _sessionStartTime Not Persisted (Post WP-019)
- **Objective:** Verify _sessionStartTime is excluded from localStorage/Firestore.
- **Preconditions:** App is running.
- **Steps:**
  1. Make some progress (trigger saves).
  2. Inspect localStorage data.
  3. Inspect Firestore document.
- **Expected Results:** Neither contains a `_sessionStartTime` field.
- **Failure Conditions:** `_sessionStartTime` found in persisted data.
- **Priority:** High

---

### 1.8 Navigation Tests (NAV)

---

#### NAV-001: View Switching
- **Objective:** Verify all views can be switched to and display correctly.
- **Preconditions:** Page loaded. Unit selected.
- **Steps:**
  1. Click "Unit Glossary" → verify glossary table visible.
  2. Click "Flashcards" → verify flashcard view visible.
  3. Click "Dashboard" → verify stats visible.
  4. Click "Trophy Shelf" → verify trophies visible.
  5. Click "Leaderboard" → verify leaderboard table visible.
  6. Click "Article Quiz" → verify quiz visible.
- **Expected Results:** Each view displays correctly. Previous view is hidden. Only one view visible at a time.
- **Failure Conditions:** Multiple views visible. View not found. JavaScript error.
- **Priority:** High

---

#### NAV-002: Unit Switching
- **Objective:** Verify switching units loads correct vocabulary.
- **Preconditions:** A1 page loaded.
- **Steps:**
  1. Click "Unit 1" in sidebar.
  2. Verify glossary shows Unit 1 words.
  3. Click "Unit 3" in sidebar.
  4. Verify glossary shows Unit 3 words (different from Unit 1).
- **Expected Results:** Each unit displays its own vocabulary. Word count matches unit size. Title updates.
- **Failure Conditions:** Same words shown in both units. Word count wrong. Title doesn't update.
- **Priority:** High

---

#### NAV-003: A2/B1 Links (Post WP-023)
- **Objective:** Verify A2 and B1 links do not navigate to 404.
- **Preconditions:** index.html loaded.
- **Steps:**
  1. Click the A2 level card.
  2. Click the B1 level card.
- **Expected Results:** A "Coming Soon" message is shown (alert or styled message). No 404 page.
- **Failure Conditions:** Browser navigates to 404.
- **Priority:** High

---

#### NAV-004: Sidebar Behavior (Mobile)
- **Objective:** Verify sidebar opens/closes correctly on mobile.
- **Preconditions:** Viewport width ≤ 768px.
- **Steps:**
  1. Click hamburger menu icon.
  2. Verify sidebar slides open with overlay.
  3. Click a unit.
  4. Verify sidebar closes automatically.
- **Expected Results:** Sidebar opens with overlay. Closes on unit selection. Overlay disappears.
- **Failure Conditions:** Sidebar doesn't open. Overlay stays visible. Sidebar doesn't close on selection.
- **Priority:** Medium

---

### 1.9 Mobile Responsiveness Tests (MOBILE)

---

#### MOBILE-001: Sidebar Collapse
- **Objective:** Verify sidebar is hidden by default on mobile.
- **Preconditions:** Viewport ≤ 768px.
- **Steps:** Load a level page.
- **Expected Results:** Sidebar is hidden. Hamburger menu icon visible. Content area takes full width.
- **Failure Conditions:** Sidebar visible on mobile. Content overlaps with sidebar.
- **Priority:** Medium

---

#### MOBILE-002: Flashcard Layout
- **Objective:** Verify flashcards render correctly on mobile.
- **Preconditions:** Viewport ≤ 768px. Flashcard view active.
- **Steps:** Flip through flashcards. Tap Known/Learning buttons.
- **Expected Results:** Card fills available width. Text is readable. Buttons are tappable (≥44px touch targets).
- **Failure Conditions:** Card overflows screen. Text truncated. Buttons too small.
- **Priority:** Medium

---

#### MOBILE-003: Auth Modal
- **Objective:** Verify email auth modal renders correctly on mobile.
- **Preconditions:** Viewport ≤ 768px.
- **Steps:** Open email auth modal.
- **Expected Results:** Modal fills most of the screen. Input fields are usable. Close button is tappable.
- **Failure Conditions:** Modal overflows. Inputs hidden. Can't close.
- **Priority:** Medium

---

### 1.10 Performance Tests (PERF)

---

#### PERF-001: Initial Page Load Time
- **Objective:** Verify the page loads within acceptable time.
- **Preconditions:** Clear browser cache. Stable internet connection.
- **Steps:**
  1. Navigate to a1.html.
  2. Measure time to First Contentful Paint (FCP) and Time to Interactive (TTI) using DevTools Performance tab.
- **Expected Results:** FCP < 2 seconds. TTI < 4 seconds.
- **Failure Conditions:** FCP > 3 seconds. TTI > 6 seconds.
- **Priority:** Medium

---

#### PERF-002: B2 Config Parse Time
- **Objective:** Verify B2 vocabulary (3031 words) parses within acceptable time.
- **Preconditions:** Load b2.html.
- **Steps:**
  1. Add `console.time('config-parse')` before and `console.timeEnd('config-parse')` after config import.
  2. Load the page.
- **Expected Results:** Parse time < 500ms.
- **Failure Conditions:** Parse time > 1 second.
- **Priority:** Medium

---

#### PERF-003: Firestore Write Count Per Session (Post WP-011)
- **Objective:** Measure Firestore write efficiency.
- **Preconditions:** User is signed in. Network tab open.
- **Steps:**
  1. Mark 20 flashcards as known over 2 minutes.
  2. Count Firestore write requests in Network tab.
- **Expected Results:** ≤ 5 Firestore write requests (debounced).
- **Failure Conditions:** > 15 write requests (no debouncing).
- **Priority:** High

---

### 1.11 Error Handling Tests (ERR)

---

#### ERR-001: Firebase Connection Failure
- **Objective:** Verify app handles Firebase being unavailable.
- **Preconditions:** Block Firebase domains in browser or use invalid config.
- **Steps:** Load the page.
- **Expected Results:**
  - Console warning: "Firebase init failed (using offline mode)".
  - App loads in Local Mode. All features functional.
- **Failure Conditions:** Page blank. JavaScript error. App non-functional.
- **Priority:** High

---

#### ERR-002: Corrupt localStorage Data
- **Objective:** Verify app handles corrupt localStorage gracefully.
- **Preconditions:** Manually set `localStorage.setItem('german_app_progress_german-a1-app', '{INVALID JSON}')`.
- **Steps:** Load the page.
- **Expected Results:** App initializes with default progress data. No crash.
- **Failure Conditions:** Uncaught exception. App doesn't load.
- **Priority:** Medium

---

#### ERR-003: Firebase Error Feedback (Post WP-035)
- **Objective:** Verify users see error messages when Firebase fails.
- **Preconditions:** User is signed in. Firebase becomes unavailable mid-session.
- **Steps:**
  1. Block Firebase network requests.
  2. Make progress (mark words).
  3. Wait for save attempt.
- **Expected Results:** Toast notification: "⚠️ Cloud sync failed. Your progress is saved locally."
- **Failure Conditions:** No user feedback. Silent failure.
- **Priority:** Medium

---

### 1.12 Data Integrity Tests (DATA)

---

#### DATA-001: Word ID Consistency (Post WP-009)
- **Objective:** Verify word IDs are deterministic strings.
- **Preconditions:** WP-009 applied.
- **Steps:**
  1. Load a1.html. Inspect `levelConfig.vocabulary[0][0].id`.
  2. Reload the page. Inspect the same word's ID.
- **Expected Results:** IDs are identical across page loads. IDs are strings (e.g., "1-0").
- **Failure Conditions:** IDs change between loads. IDs are numbers.
- **Priority:** Critical

---

#### DATA-002: Known Array Type Consistency
- **Objective:** Verify `state.data.known` array contains IDs matching word object IDs.
- **Preconditions:** User has some known words.
- **Steps:**
  1. Mark a word as known.
  2. Check `state.data.known` — the newly added ID should match the word's `.id` property exactly.
- **Expected Results:** Types match (both strings or both numbers, depending on WP-009 status).
- **Failure Conditions:** Type mismatch (string vs number). ID not found in known array.
- **Priority:** Critical

---

#### DATA-003: Trophy Count Persistence
- **Objective:** Verify trophyCounts survive localStorage → Firestore → localStorage round-trip.
- **Preconditions:** User earns a trophy. Logs out. Logs back in.
- **Steps:**
  1. Earn "First Steps" trophy.
  2. Log out.
  3. Log back in.
- **Expected Results:** `trophyCounts.first_steps === 1` after re-login.
- **Failure Conditions:** trophyCounts missing or zeroed.
- **Priority:** High

---

#### DATA-004: Merge Conflict Resolution
- **Objective:** Verify mergeProgress handles conflicting data correctly.
- **Preconditions:**
  - Local: `{ known: [1,2,3], sessionsCompleted: 5, trophyCounts: { first_steps: 1 } }`
  - Remote: `{ known: [3,4,5], sessionsCompleted: 3, trophyCounts: { slay_vocab: 1 } }`
- **Steps:** Sign in (triggers merge).
- **Expected Results:**
  - `known = [1,2,3,4,5]` (union)
  - `sessionsCompleted = 5` (max)
  - `trophyCounts = { first_steps: 1, slay_vocab: 1 }` (union with max per key)
- **Failure Conditions:** Data overwritten. Counts not maxed. Arrays not unioned.
- **Priority:** High

---

#### DATA-005: Study Dates Format
- **Objective:** Verify study dates are ISO-format strings.
- **Preconditions:** User completes a study action.
- **Steps:** Check `state.data.studyDates`.
- **Expected Results:** Each entry matches format `YYYY-MM-DD` (e.g., "2026-06-07").
- **Failure Conditions:** Full ISO timestamp. Unix timestamp. Non-standard format.
- **Priority:** Medium

---

### 1.13 Quiz Tests (QUIZ)

---

#### QUIZ-001: Quiz Score Reset On Unit Switch (Post WP-020)
- **Objective:** Verify quiz score resets when switching units.
- **Preconditions:** User answered 5 questions in Unit 1 quiz (score: 4/5).
- **Steps:**
  1. Switch to Unit 2.
  2. Observe quiz score display.
- **Expected Results:** Score shows "0 / 0".
- **Failure Conditions:** Score shows "4 / 5" (carry-over from Unit 1).
- **Priority:** High

---

#### QUIZ-002: Quiz Answer Scoring
- **Objective:** Verify correct and incorrect answers are scored properly.
- **Preconditions:** Quiz loaded with nouns.
- **Steps:**
  1. Answer a question correctly (e.g., select "der" for a masculine noun).
  2. Answer a question incorrectly.
- **Expected Results:**
  - Correct: Score increments. Button turns green.
  - Incorrect: Score doesn't increment for correct, total increments. Correct answer highlighted.
- **Failure Conditions:** Scoring wrong. Visual feedback missing.
- **Priority:** High

---

### 1.14 Glossary Tests (GLOSS)

---

#### GLOSS-001: Multi-Column Hiding (Post WP-037)
- **Objective:** Verify multiple columns can be hidden simultaneously.
- **Preconditions:** Glossary view active.
- **Steps:**
  1. Click "Hide German" button.
  2. Verify German column hidden.
  3. Click "Hide English" button.
  4. Verify BOTH German AND English columns are hidden.
- **Expected Results:** Both columns hidden simultaneously. User sees only remaining columns.
- **Failure Conditions:** Hiding English reveals German (old behavior with `hiddenCols.clear()`).
- **Priority:** Medium

---

#### GLOSS-002: Reveal All
- **Objective:** Verify "Reveal All" button shows all hidden columns.
- **Preconditions:** One or more columns hidden.
- **Steps:** Click "Reveal All".
- **Expected Results:** All columns visible.
- **Failure Conditions:** Some columns still hidden.
- **Priority:** Medium

---

### 1.15 TTS Tests (TTS)

---

#### TTS-001: TTS Declension Cleanup — "er" Suffix (Post WP-036)
- **Objective:** Verify "das Haus -er" is cleaned to "das Haus".
- **Preconditions:** N/A (unit test of cleanTextForAudio).
- **Steps:** Call `cleanTextForAudio("das Haus -er")`.
- **Expected Results:** Returns "das Haus".
- **Failure Conditions:** Returns "das Haus -er" (uncleaned).
- **Priority:** Medium

---

#### TTS-002: TTS Count Tracking
- **Objective:** Verify TTS usage count increments correctly.
- **Preconditions:** `ttsCount = 0`.
- **Steps:**
  1. Click a TTS button on a glossary row.
  2. Check `state.data.ttsCount`.
- **Expected Results:** `ttsCount = 1`.
- **Failure Conditions:** Count doesn't increment. Count increments by 2 (double-counting).
- **Priority:** Medium

---

### 1.16 XSS Security Tests (SEC)

---

#### SEC-001: Leaderboard XSS Prevention (Post WP-034)
- **Objective:** Verify HTML in displayName is escaped.
- **Preconditions:** A leaderboard entry with `displayName = '<script>alert("xss")</script>'`.
- **Steps:** View the leaderboard.
- **Expected Results:** The display name shows as literal text: `<script>alert("xss")</script>`. No alert popup.
- **Failure Conditions:** JavaScript alert fires. HTML rendered as markup.
- **Priority:** High

---

#### SEC-002: Glossary XSS Prevention (Post WP-034)
- **Objective:** Verify HTML in vocabulary data is escaped.
- **Preconditions:** A vocabulary entry with `de = '<img onerror=alert(1) src=x>'`.
- **Steps:** View the glossary.
- **Expected Results:** Text rendered as literal string, not as an image tag.
- **Failure Conditions:** HTML rendered. JavaScript executes.
- **Priority:** High

---

## 2. Regression Matrix

This matrix shows which test IDs must be re-run when each Work Package is implemented.

| Work Package | Test IDs to Re-Run |
|---|---|
| **WP-001** (evaluate after markCard) | TROPHY-001, TROPHY-002, TROPHY-003, TROPHY-004, TROPHY-005, TROPHY-006, TROPHY-007, PROG-001 |
| **WP-002** (all vocab to evaluate) | TROPHY-002, TROPHY-004, TROPHY-005, TROPHY-006, TROPHY-007 |
| **WP-003** (save after evaluate) | TROPHY-003, DATA-003, PROG-003, PROG-004 |
| **WP-004** (trophy desc/req fix) | TROPHY-009, TROPHY-013 |
| **WP-005** (multi-earn) | TROPHY-012 |
| **WP-006** (logout localStorage) | AUTH-005, AUTH-006, PROG-003, PROG-005 |
| **WP-007** (save after merge) | AUTH-006, PROG-006, DATA-004 |
| **WP-008** (beforeunload) | SYNC-002, PROG-005 |
| **WP-009** (word IDs) | DATA-001, DATA-002, PROG-001, PROG-003, PROG-005, PROG-006, TROPHY-001, TROPHY-002 |
| **WP-010** (ID migration) | DATA-001, DATA-002, PROG-005, PROG-006 |
| **WP-011** (debouncing) | SYNC-001, PERF-003, PROG-004 |
| **WP-012** (batch writes) | SYNC-001, PERF-003, PROG-004 |
| **WP-013** (remove leaderboard read) | LEAD-001, LEAD-003 |
| **WP-014** (session counter reset) | SESS-001, TROPHY-009 |
| **WP-015** (B2 type inference) | TROPHY-008, TROPHY-007 |
| **WP-016** (returnedAfter7Days) | TROPHY-010 (related streak logic) |
| **WP-017** (dark mode time) | SESS-002 |
| **WP-018** (total study time) | SESS-003 |
| **WP-019** (sessionStartTime) | SESS-004 |
| **WP-020** (quiz score reset) | QUIZ-001, QUIZ-002 |
| **WP-021** (calcStreak duplicates) | TROPHY-014, TROPHY-010 |
| **WP-022** (partial session tracking) | LESSON-003, DATA-005 |
| **WP-023** (A2/B1 links) | NAV-003 |
| **WP-024** (dead code removal) | PROG-001, PROG-005, AUTH-005 (verify no broken imports) |
| **WP-025** (repo cleanup) | None (no runtime impact) |
| **WP-026** (extract AuthService) | AUTH-001, AUTH-002, AUTH-003, AUTH-004, AUTH-005, AUTH-006, AUTH-007, AUTH-008 |
| **WP-027** (extract NavService) | NAV-001, NAV-002, NAV-004 |
| **WP-028** (extract StatsService) | PROG-007 |
| **WP-029** (extract LeaderboardService) | LEAD-001, LEAD-002, LEAD-003 |
| **WP-030** (reduce app.js) | All AUTH, NAV, PROG, LEAD, TROPHY tests (full regression) |
| **WP-031** (HTML template) | All tests (full regression — structural change) |
| **WP-032** (stub trophy impl) | TROPHY-010, TROPHY-011, TROPHY-013 |
| **WP-033** (leaderboard dynamic) | LEAD-001, LEAD-003, LEAD-004 |
| **WP-034** (XSS sanitization) | SEC-001, SEC-002, LEAD-001, GLOSS-001 |
| **WP-035** (error boundaries) | ERR-001, ERR-003 |
| **WP-036** (TTS regex) | TTS-001 |
| **WP-037** (multi-column hide) | GLOSS-001, GLOSS-002 |
| **WP-038** (prune studyDates) | DATA-005, TROPHY-010, TROPHY-014 |
| **WP-039** (reset modesUsed) | SESS-001 |
| **WP-040** (B2 title fix) | NAV-002 (B2 sidebar labels) |
| **WP-041** (CSS cleanup) | MOBILE-001, MOBILE-002 (visual regression) |
| **WP-042** (leaderboard UID) | LEAD-002 |

---

## 3. Release Checklist

### Pre-Release Verification

#### Critical Gate (Must Pass — Blocks Release)

- [ ] **AUTH-001**: Google login works end-to-end
- [ ] **AUTH-002**: Email login works end-to-end
- [ ] **AUTH-005**: Logout preserves local data (post WP-006)
- [ ] **AUTH-006**: Re-login restores data from Firebase
- [ ] **PROG-001**: Mark word as known updates all state
- [ ] **PROG-003**: Progress persists to localStorage
- [ ] **PROG-004**: Progress persists to Firestore
- [ ] **PROG-005**: Progress survives page refresh
- [ ] **PROG-006**: Local/remote merge works correctly
- [ ] **TROPHY-001**: Trophy evaluate runs after markCard (post WP-001)
- [ ] **TROPHY-002**: Trophies evaluate against all words (post WP-002)
- [ ] **TROPHY-003**: Earned trophies persist across reload (post WP-003)
- [ ] **DATA-001**: Word IDs are deterministic (post WP-009)
- [ ] **DATA-002**: Known array IDs match word IDs
- [ ] **SESS-001**: Session counters reset on new day (post WP-014)
- [ ] **SYNC-001**: Save debouncing works (post WP-011)

#### High Priority (Should Pass — Document Known Issues If Not)

- [ ] **TROPHY-004 to TROPHY-011**: All major trophies earnable
- [ ] **TROPHY-013**: All descriptions match requirements
- [ ] **QUIZ-001**: Quiz score resets on unit switch
- [ ] **NAV-003**: A2/B1 links show "Coming Soon"
- [ ] **SESS-002**: Dark mode study time accurate
- [ ] **SESS-003**: Total study time accurate
- [ ] **SEC-001**: Leaderboard XSS prevented
- [ ] **ERR-001**: Firebase offline fallback works

#### Performance Gates

- [ ] **PERF-001**: Page load FCP < 2 seconds
- [ ] **PERF-003**: ≤ 5 Firestore writes per 20 flashcard marks (post WP-011)

#### Platform Verification

- [ ] **Chrome (latest)**: All critical tests pass
- [ ] **Firefox (latest)**: All critical tests pass
- [ ] **Safari (latest)**: All critical tests pass
- [ ] **Mobile Chrome (Android)**: MOBILE-001, MOBILE-002, MOBILE-003 pass
- [ ] **Mobile Safari (iOS)**: MOBILE-001, MOBILE-002, MOBILE-003 pass

#### Data Integrity Verification

- [ ] **DATA-003**: Trophy counts survive round-trip
- [ ] **DATA-004**: Merge conflict resolution works
- [ ] **DATA-005**: Study dates in correct format
- [ ] No `_sessionStartTime` in localStorage (**SESS-004**)
- [ ] Existing user data loads correctly after migration (if WP-009/010 applied)

#### Console & Error Checks

- [ ] No uncaught exceptions in console during normal usage
- [ ] No unhandled promise rejections
- [ ] No `TypeError` or `ReferenceError` messages
- [ ] Firebase console shows clean write patterns (no excessive writes)

#### Visual Regression

- [ ] Level portal page renders correctly (both themes)
- [ ] A1 glossary view renders correctly
- [ ] B2 glossary view renders correctly (70 modules in sidebar)
- [ ] Flashcard 3D flip animation works
- [ ] Dashboard stats render correctly
- [ ] Trophy shelf renders all 34 trophies
- [ ] Leaderboard renders with medals
- [ ] Dark mode toggle works in all views
- [ ] Mobile layouts are not broken

---

## 4. Final Section

### Top 10 Highest-Risk Areas

1. **Word ID Migration (WP-009/010)** — Could corrupt all existing user progress if mapping is wrong.
2. **Trophy evaluate() wiring (WP-001/002/003)** — Adding calls in multiple locations risks infinite loops (evaluate → save → evaluate).
3. **Save Debouncing (WP-011)** — Could cause data loss if debounce timer doesn't flush on page close.
4. **Logout Flow (WP-006)** — Changing localStorage behavior affects multi-user shared browser scenarios.
5. **HTML Deduplication (WP-031)** — Structural change that could break all level pages.
6. **app.js Decomposition (WP-026-030)** — Extracting from a monolith risks breaking shared state.
7. **B2 Type Inference (WP-015)** — Incorrect classification misleads users and affects trophies.
8. **Leaderboard Schema (WP-033)** — Schema migration affects all users.
9. **XSS Sanitization (WP-034)** — Must not break German special characters (ä, ö, ü, ß).
10. **Stub Trophy Implementation (WP-032)** — 15+ new requirement functions must all be correct.

### Top 10 Quick Wins (< 30 minutes each)

1. **WP-020**: Add `this.score = 0; this.total = 0;` to quiz.js `loadUnit()`.
2. **WP-023**: Change A2/B1 links to `javascript:void(0)` with alert.
3. **WP-025**: Delete `temp_debug.js`.
4. **WP-041**: Remove 2 unused CSS rules.
5. **WP-036**: Add "er" to TTS regex alternation.
6. **WP-006**: Delete 2 lines from `logout()`.
7. **WP-007**: Add `saveLocalProgress(appId, state.data)` after merge in `_onAuth()`.
8. **WP-040**: Fix 1 string in B2 unitTitles.
9. **WP-042**: Change displayName comparison to UID comparison.
10. **WP-014**: Add session counter reset at boot.

### Top 10 Tasks Suitable For Small Coding Models

1. **WP-020** — 2 lines, 1 file, zero dependencies, clear acceptance criteria.
2. **WP-023** — HTML-only, 2 links to modify.
3. **WP-036** — Single regex change, 1 file.
4. **WP-041** — Delete 2 CSS rules.
5. **WP-025** — File deletion + .gitignore update.
6. **WP-040** — Single string change.
7. **WP-006** — Remove 2 lines from logout().
8. **WP-007** — Add 1 function call after merge.
9. **WP-037** — Remove 1 line, add toggle logic (3 lines).
10. **WP-042** — Change 1 comparison in leaderboard rendering.

### Tasks Requiring Human Review

- **WP-009/010** — Review word ID migration strategy. Verify against real user data.
- **WP-004** — Product decision: fix descriptions or fix thresholds?
- **WP-015** — Review German word type classification rules.
- **WP-031** — Approve HTML deduplication architecture.
- **WP-033** — Approve leaderboard schema migration plan.

### Tasks Requiring Senior Engineering Review

- **WP-011** — Debouncing strategy and data loss implications.
- **WP-012** — Firestore batch operation semantics.
- **WP-026–030** — Module boundary decisions for app.js decomposition.
- **WP-034** — Security review of XSS sanitization completeness.
- **WP-031** — Long-term architecture for HTML template system.

### Recommended Order of Test Execution

```
1. Run baseline tests (AUTH, PROG, NAV) before ANY changes
2. After Phase 1 (Bug Fixes): Re-run TROPHY, PROG, QUIZ, SESS, AUTH
3. After Phase 2 (Data Integrity): Re-run DATA, TROPHY, SESS
4. After Phase 3 (Firebase): Re-run SYNC, PERF, PROG
5. After Phase 4 (Cleanup): Re-run TROPHY, SEC, NAV, ERR
6. After Phase 5 (Code Org): FULL REGRESSION (all tests)
7. After Phase 6 (Performance): Re-run TTS, GLOSS, PERF
8. After Phase 7 (Scalability): FULL REGRESSION (all tests)
```

### Expected Impact Per Test Phase

| Phase | Tests to Run | Expected Outcome |
|-------|-------------|------------------|
| Baseline | All tests | Document current pass/fail state. Many TROPHY tests will fail. |
| After Phase 1 | AUTH, PROG, TROPHY, QUIZ, SESS | TROPHY-001/002/003 should now pass. QUIZ-001 pass. SESS-001 pass. |
| After Phase 2 | DATA, TROPHY, SESS | DATA-001/002 pass with new IDs. SESS-002/003/004 pass. |
| After Phase 3 | SYNC, PERF, PROG | SYNC-001/002 pass. PERF-003 shows reduced writes. |
| After Phase 4 | TROPHY, SEC, NAV, ERR | All TROPHY tests pass. SEC-001/002 pass. NAV-003 pass. |
| After Phase 5 | Full regression | All tests pass. No regressions from code reorganization. |
| After Phase 6 | TTS, GLOSS, PERF | TTS-001 pass. GLOSS-001 pass. |
| After Phase 7 | Full regression | All tests pass on new HTML template. |

---

*End of TESTPLAN.md*
