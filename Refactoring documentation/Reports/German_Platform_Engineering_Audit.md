Comprehensive Engineering Audit
German Learning Platform
Repository: github.com/MohamedAzzam4/German-Words-List2
Website: mohamedazzam4.github.io/German-Words-List2
Prepared by: Staff Software Engineer Audit
Date: June 2026
This audit provides a source-code-driven evaluation of the platform, covering
architecture, code quality, Firebase integration, security, performance, and expansion
readiness. It is intended to serve as the blueprint for a production-grade refactor.

Table of Contents
Phase 1: Discovery 4
1.1 Route Map . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
1.2 Feature Map . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
1.3 Component Map . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
1.4 Data Flow Map . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
1.5 Firebase Map . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6
Phase 2: Architecture Review 7
2.1 Project Structure . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
2.2 Architectural Patterns . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
2.3 Future Scalability . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Phase 3: Code Quality Review 9
3.1 Component Quality . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
3.2 Reusability . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
3.3 Maintainability . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
3.4 Technical Debt . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Phase 4: Dead Code Audit 12
4.1 Unused Components . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
4.2 Unused Assets and Dependencies . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
4.3 Unused CSS . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
Phase 5: Firebase Audit 13
5.1 Authentication . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
5.2 User Progress Tracking . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
5.3 Firestore Usage . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
5.4 Cost Analysis . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15
5.5 Security . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15
Phase 6: Performance Audit 16
6.1 Frontend Performance . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 16
6.2 Firebase Performance . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 16
6.3 Optimization Opportunities . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 17
Phase 7: UX and Product Review 17
Phase 8: Security Review 18
Phase 9: Expansion Readiness 19
Phase 10: Final Assessment 20
10.1 Executive Summary . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 20
10.2 Strengths . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 20
10.3 Weaknesses . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 20
10.4 Risks . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 21

10.5 Quick Wins . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 21
10.6 Refactoring Priorities . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 22
10.7 Readiness Scores . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 22
Refactoring Roadmap 23
Phase 1: Critical (Weeks 1-2) . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 23
Phase 2: Architecture (Weeks 3-6) . . . . . . . . . . . . . . . . . . . . . . . . . . . . 24
Phase 3: Scalability (Weeks 7-10) . . . . . . . . . . . . . . . . . . . . . . . . . . . . 24
Phase 4: Performance (Weeks 11-13) . . . . . . . . . . . . . . . . . . . . . . . . . . . 25
Phase 5: Future Features Foundation (Weeks 14-17) . . . . . . . . . . . . . . . . . . . 25

Phase 1: Discovery
1.1 Route Map
The application uses a multi-page architecture with static HTML files. There is no client-side router;
navigation between levels is handled via standard anchor links, and in-page views are toggled via the
switchView() method that adds/removes the .hidden CSS class on div containers. This creates a
pseudo-SPA experience within each level page.
| Route | File       |                                       | Description |     | Auth Required |
| ----- | ---------- | ------------------------------------- | ----------- | --- | ------------- |
| /     | index.html | Level selection portal (landing page) |             |     | No            |
/a1.html a1.html A1 German level (Menschen A1) - 24 units No (offline mode)
/b2.html b2.html B2 German level (Aspekte B2) - 70 modules No (offline mode)
| /A2.html | (404) | Link exists but target file missing |     |     | N/A |
| -------- | ----- | ----------------------------------- | --- | --- | --- |
| /B1.html | (404) | Link exists but target file missing |     |     | N/A |
In-page views (available on both a1.html and b2.html):
| View ID | Navigation Label |     |     | Description |     |
| ------- | ---------------- | --- | --- | ----------- | --- |
view-glossary Unit Glossary Vocabulary table with filters, hide/reveal, TTS
view-flashcard Flashcards 3D flip card engine with queue/shuffle/face-swap
view-dashboard Dashboard Stats cards, unit breakdown, weakest unit indicator
view-leaderboard Leaderboard Global ranking by total words mastered across A1+B2
view-trophies Trophy Shelf 34 trophies in 4 tiers with earn detection
view-article-quiz Article Quiz der/die/das quiz for nouns in current unit
1.2 Feature Map
| Feature | Status | Implementation |     |     | Notes |
| ------- | ------ | -------------- | --- | --- | ----- |
Glossary Table View Complete glossary.js + core.css Column hiding, type filtering, TTS per row
3D flip, shuffle, DE/EN face, learning
| Flashcard Engine | Complete | flashcards.js |     |     |     |
| ---------------- | -------- | ------------- | --- | --- | --- |
queue
Article Quiz Complete quiz.js der/die/das, score tracking, unit-aware
Dashboard Stats Complete app.js (_updateStats) Known/total/pct/session/weakest unit
| Trophy/Achievement |         |             |     | 34 defined; ~60% have working req |     |
| ------------------ | ------- | ----------- | --- | --------------------------------- | --- |
|                    | Partial | trophies.js |     |                                   |     |
| System             |         |             |     | functions                         |     |
Leaderboard Complete firebase.js Cross-level A1+B2 combined, top 50

Google Auth Complete firebase.js Popup-based Google Sign-In
Email Auth Complete app.js (modal) Sign-in/sign-up with error handling
Dark Mode Complete core.css + app.js data-theme attribute toggle, persisted
TTS (Text-to-Speech) Partial tts.js de-DE enforcement; English fallback issues
Offline Mode Complete storage.js localStorage fallback, merge on login
Cloud Sync Complete firebase.js + storage.js Firestore {merge:true} strategy
4 cards (A1/B2 active, A2/B1 coming
Level Selection Portal Complete index.html
soon)
1.3 Component Map
The codebase follows a modular pattern where app.js acts as the orchestrator, exposing a global
window.app object that all HTML onclick handlers reference. The engine classes (GlossaryEngine,
FlashcardEngine, QuizEngine, TrophyEngine) are instantiated once and held in the engines object.
There is no component lifecycle system, no virtual DOM, and no reactive state management.
Module Lines Exports Responsibility
app.js 822 window.app (global) Orchestrator: auth, nav, state, save, UI binding
firebase.js 114 11 functions Auth (Google/Email), Firestore CRUD, leaderboard
glossary.js 96 GlossaryEngine class Table rendering, filters, hide/reveal, TTS binding
flashcards.js 152 FlashcardEngine class Queue management, flip, mark known/learning
quiz.js 83 QuizEngine class Noun extraction, der/die/das scoring, answer feedback
TROPHIES array +
trophies.js 125 34 trophy definitions, earn evaluation, rendering
TrophyEngine
speak,
tts.js 65 cleanTextForAudio, German voice enforcement, Web Audio chimes
playChime
storage.js 100 5 functions localStorage CRUD, merge logic, defaults
utils.js 43 4 functions parseVocabularyRow, debounce, formatDate, isToday
a1.config.js 769 levelConfig 24-unit A1 vocabulary (~450 words) with parser
b2.config.js 3124 levelConfig 70-module B2 vocabulary (~3031 words) with parser
All styling: sidebar, flashcards, tables, dark mode, quiz,
core.css 855 N/A
modal
1.4 Data Flow Map
1.4.1 Authentication Flow

When a user visits a level page (a1.html or b2.html), the boot sequence initializes Firebase via
initFirebase(). If Firebase initialization succeeds, listenAuth() registers an onAuthStateChanged callback
that triggers window.app._onAuth(user). On first load with no user, the app falls into offline/local mode.
When the user clicks "Sign in with Google" or uses the email auth modal, Firebase Auth processes the
sign-in, the auth state listener fires, and _onAuth() merges remote progress from Firestore with local
progress from localStorage via mergeProgress(). A full page reload occurs on successful sign-in via
window.location.reload(), which is a heavy-handed but reliable approach to ensuring consistent state.
1.4.2 User Progress Flow
Progress is tracked in two parallel stores: localStorage (always available) and Firestore (when
authenticated). The in-memory state object (state.data) is initialized from localStorage. When a user
marks a word as known or learning, the FlashcardEngine updates its internal knownIds Set, then calls
onSave() which triggers window.app._save(). This method serializes the live engine Sets back to
state.data as arrays, writes to both localStorage and Firestore concurrently. Firestore writes use
{merge:true} to prevent accidental data loss. The merge strategy in mergeProgress() unions the
known/favorites arrays and takes the higher value for numeric counters.
1.4.3 Lesson Flow
Each level page loads its vocabulary configuration dynamically via
import("../levels/${level}.config.js"). The data-level attribute on the script tag determines which config
to load. Vocabulary is structured as an array of unit arrays. When the user selects a unit in the sidebar,
switchUnit(i) loads that unit's words into the active engine (glossary, flashcard, or quiz depending on
current view). The unit list in the sidebar is rendered by _renderUnitList(), which supports three
different grouping strategies: unitTitles (B2), chapterGroups (unused), and modulesPerChapter (A1).
1.4.4 Firebase Interactions
All Firebase interactions go through firebase.js. The primary data path is: user action triggers _save(),
which calls saveProgress(appId, uid, payload) writing to artifacts/{appId}/users/{uid}/progress/main.
Simultaneously, updateLeaderboard() writes to leaderboard/{uid}. On page load, loadProgress() reads
the progress document. The leaderboard is fetched via getLeaderboard() which queries the leaderboard
collection ordered by totalWords descending, limited to 50 results. There is no real-time listener for
progress documents; data is read once on auth state change.
1.5 Firebase Map
Documen
Collection/Path Key Fields Purpose
t ID

known[], favorites[], trophyCounts{},
artifacts/{appId}/users/{uid}/ sessionsCompleted, darkMode, ttsCount, Per-level user
main
progress/ columnHideCount, darkModeToggleCount, progress data
studyDates[], flashcardErrors{}, lastUpdated
displayName, photoURL, a1Count, b2Count, Global cross-level
leaderboard/ {uid}
totalWords, lastActive ranking
AppId Isolation: A1 uses german-a1-app, B2 uses german-b2-app. Each level stores progress in a
separate Firestore document path, preventing cross-contamination. The leaderboard collection is shared
across levels, with a1Count and b2Count fields summing to totalWords.
Data Size Concern: The known array stores word ID strings. For B2 with 3031 words, this array could
contain up to 3031 entries. Each ID is approximately 30-40 characters, resulting in a document of
~120-150KB at maximum completion. Firestore has a 1MB document limit, so this is safe for now but
could become problematic if the platform scales to C1/C2 with thousands more words.
Phase 2: Architecture Review
2.1 Project Structure
The project uses a flat, multi-page HTML architecture with vanilla JavaScript ES modules. There is no
build tool, no bundler, no package.json, and no dependency management beyond CDN-loaded Firebase
SDK. The folder structure is minimal:
Root: 3 HTML files + 1 CSS file + favicon
js/core/: 8 JavaScript modules (app logic)
js/levels/: 3 JavaScript modules (data configs)
css/: 1 file (core.css, 855 lines)
Criterion Rating Assessment
Flat structure with no separation between concerns. All core logic in one
Folder Organization Weak
directory. No assets/, tests/, or docs/ directories.
Adding a new level requires duplicating an entire HTML file (261-306
Scalability Poor lines), adjusting data-level attribute, and creating a config file. No shared
level template.
HTML files contain near-identical markup (a1.html vs b2.html are ~95%
Maintainability Poor duplicated). Any UI change must be manually replicated across all level
files.
JavaScript is well-modularized into engine classes, but HTML mixes
Separation of Concerns Moderate
structure, event binding (onclick), and display logic. CSS is monolithic.
2.2 Architectural Patterns

2.2.1 Patterns Used
Config-Driven Level Loading: The data-level attribute on the script tag determines which
vocabulary config to dynamically import. This is a good pattern that enables code reuse across
levels without duplicating core logic.
Engine Pattern: GlossaryEngine, FlashcardEngine, QuizEngine, and TrophyEngine are instantiated
classes that encapsulate their own state and rendering logic. This provides decent separation.
Offline-First with Cloud Sync: The localStorage-first approach with Firestore merge-on-login is a
sound pattern for a learning app that must work without connectivity.
Global Facade (window.app): All HTML onclick handlers reference window.app methods, creating
a single entry point for user interactions. This simplifies the HTML but creates a monolithic
controller.
2.2.2 Patterns Missing
No Component System: Views are hand-built HTML strings in the page files. There is no template
engine, no component abstraction, and no way to compose reusable UI elements.
No State Management: State is a plain object (state.data) with manual serialization/deserialization.
There is no reactive binding, no observer pattern, and no centralized state store. UI updates are
triggered by explicit render calls scattered throughout app.js.
No Event Bus: Communication between engines happens via direct method calls on the
window.app facade. There is no decoupled event system, making it difficult to add new features
that react to existing events.
No Routing System: View switching is done by toggling CSS classes. There is no URL state
management, no browser history integration, and no deep linking capability.
No Error Boundary: Firebase failures are caught and logged but the user receives no meaningful
feedback. There is no retry mechanism, no error UI, and no graceful degradation beyond falling
back to offline mode.
2.2.3 Anti-Patterns
God Object: window.app has 30+ methods spanning authentication, navigation, glossary, flashcard,
quiz, theme, toast, stats, saving, and leaderboard rendering. At 822 lines, app.js is a de facto god
object.
HTML Duplication: a1.html and b2.html are nearly identical (95%+ overlap). The only differences
are: (1) the data-level attribute, (2) heading text, (3) one filter option in B2. This violates DRY at
the highest level.
InnerHTML Rendering: GlossaryEngine.render(), TrophyEngine.render(), and multiple app.js
methods build HTML via string concatenation and inject via innerHTML. This is a XSS risk if any
vocabulary data contains malicious content, and it destroys/recreates DOM nodes unnecessarily.

Full Page Reload on Auth: Every successful login or logout triggers window.location.reload(),
discarding all in-memory state and forcing a complete re-initialization. This is jarring for the user
and expensive.
Callback-Based Global Binding: All user interactions flow through
onclick="window.app.method()" attributes in HTML. This tightly couples the HTML to the
JavaScript implementation and prevents any form of automated testing.
2.3 Future Scalability
The current architecture cannot comfortably support the planned expansion to 6 levels and hundreds of
lessons. The following table evaluates specific growth vectors:
| Growth Vector | Ready? |     |     | Reason |     |
| ------------- | ------ | --- | --- | ------ | --- |
Each new level requires a full HTML file duplicate (300+ lines). 6 levels = 6
| 6 Language Levels | No  |     |     |     |     |
| ----------------- | --- | --- | --- | --- | --- |
nearly-identical files to maintain.
The config-driven vocabulary loading scales, but the sidebar rendering via
| Hundreds of Lessons | Marginal |     |     |     |     |
| ------------------- | -------- | --- | --- | --- | --- |
innerHTML will become slow with 100+ units.
Only 3 engines exist (glossary/flashcard/quiz). Adding fill-in-the-blank,
Multiple Lesson Types No conjugation drills, or listening exercises requires significant app.js
modifications.
No API layer, no server-side logic, no rate limiting, no backend. AI features
| AI-Powered Features | No  |     |     |     |     |
| ------------------- | --- | --- | --- | --- | --- |
would require a complete backend addition.
No event tracking, no telemetry, no session recording. The only metrics are
| Analytics | No  |     |     |     |     |
| --------- | --- | --- | --- | --- | --- |
word counts and session completions.
No payment integration, no user roles, no feature gating, no backend to
| Subscriptions | No  |     |     |     |     |
| ------------- | --- | --- | --- | --- | --- |
validate subscription status.
No admin role, no content management system, no ability to edit vocabulary
| Admin Dashboard | No  |     |     |     |     |
| --------------- | --- | --- | --- | --- | --- |
without code deployment.
Phase 3: Code Quality Review
3.1 Component Quality
| Component | Lines | Issue | Severity |     | Explanation |
| --------- | ----- | ----- | -------- | --- | ----------- |
30+ methods spanning auth, nav,
rendering, state, saving. Should be split
| app.js | 822 God Object / oversized |     | High |     |     |
| ------ | -------------------------- | --- | ---- | --- | --- |
into AuthService, NavService,
StatsService, etc.

3,031 vocabulary entries embedded as
code. Should be external JSON loaded at
b2.config.js 3124 Massive data file Medium
runtime to reduce initial bundle and
enable CMS.
Same issue as b2.config.js but smaller.
a1.config.js 769 Data embedded in code Medium Vocabulary data should be separated from
application logic.
Single file handles all views, themes,
core.css 855 Monolithic stylesheet Medium responsive, and components. Should be
split into base/layout/components/themes.
Supports unitTitles, chapterGroups, and
app.js _renderUn
~70 3-branch rendering logic Medium modulesPerChapter with fallback. Fragile
itList()
and hard to extend.
3.2 Reusability
Missed Reuse Opportunities
HTML Level Pages: a1.html and b2.html share ~95% identical markup. A single template with
dynamic configuration would eliminate ~550 lines of duplication. The only differences are: the
data-level attribute on the script tag, heading text ("A1 German" vs "B2 German"), and one extra
filter option in B2.
Auth Modal: The email auth modal is created dynamically in app.js via innerHTML string building.
This could be a reusable component with proper validation, accessibility, and error display.
Stats Rendering: The _updateStats() method builds dashboard HTML inline. This is view logic that
should be in a dedicated DashboardEngine class, similar to how glossary/flashcard/quiz have their
own engines.
Leaderboard Rendering: The _renderLeaderboard() method builds complex table HTML with
avatar images and rank badges. This is another candidate for a dedicated LeaderboardEngine.
3.3 Maintainability
Metric Assessment
Mixed: camelCase for JS (good), but inconsistency between snake_case in trophy IDs
Naming Conventions (first_steps) and camelCase in JS methods (switchView). HTML IDs use kebab-case
(view-glossary) which is good.
Poor: A1 uses sectionLabels + sectionLabel + exactLabels while B2 uses unitTitles. The
Consistency _renderUnitList() method has 3 branching strategies. Trophy req functions use inconsistent
parameter signatures.
Moderate: Code is generally readable with emoji comments for section headers. However,
Readability the 3-branch rendering logic in _renderUnitList() and the complex _onAuth() state machine
reduce clarity.

High in app.js: The _onAuth() method has subtle state management with _hasBootedAuth,
Complexity prevUid comparison, and reload triggers. The _save() method synchronizes 3 different state
sources (engines, state.data, payload).
3.4 Technical Debt
| Item               | Severity | File(s)  | Explanation            | Suggested Direction       |
| ------------------ | -------- | -------- | ---------------------- | ------------------------- |
| HTML               |          |          | 95%+ duplicate markup. |                           |
|                    |          | a1.html, |                        | Template system or shared |
| duplication across | Critical |          | Any UI bug fix must be |                           |
|                    |          | b2.html  |                        | component injection.      |
| levels             |          |          | applied twice.         |                           |
Decompose into
| window.app god |      |        | 822 lines, 30+ methods, no    |                         |
| -------------- | ---- | ------ | ----------------------------- | ----------------------- |
|                | High | app.js |                               | domain-specific service |
| object         |      |        | clear separation of concerns. |                         |
modules.
User-visible data (word
glossary.js,
innerHTML XSS names, display names) Use textContent or DOM APIs;
|         | High | trophies.js, |                        |                               |
| ------- | ---- | ------------ | ---------------------- | ----------------------------- |
| surface |      |              | injected via innerHTML | sanitize all dynamic content. |
app.js
without sanitization.
window.location.reload() on
| Full page reload |        |        |                             | Re-render auth-dependent UI |
| ---------------- | ------ | ------ | --------------------------- | --------------------------- |
|                  | Medium | app.js | every login/logout destroys |                             |
| on auth          |        |        |                             | without full reload.        |
all state.
3,124 lines of
Move to JSON/external data,
| B2 data as code | Medium | b2.config.js | pipe-delimited strings |     |
| --------------- | ------ | ------------ | ---------------------- | --- |
lazy-load per unit.
parsed at module load time.
13 of 34 trophies have req: p
Implement date-based
| Broken trophy |        |             | => false (never earnable). |                               |
| ------------- | ------ | ----------- | -------------------------- | ----------------------------- |
|               | Medium | trophies.js |                            | evaluation or remove unearned |
| logic         |        |             | Streak/date/time trophies  |                               |
trophies.
are unimplemented.
A1 uses structured objects;
B2 uses raw pipe strings
| Inconsistent data |        | a1.config.js vs |                            | Unify word object schema |
| ----------------- | ------ | --------------- | -------------------------- | ------------------------ |
|                   | Medium |                 | with a parser. Word object |                          |
| schema            |        | b2.config.js    |                            | across all levels.       |
schemas differ (deContext
only in B2).
Firebase errors are caught
No error and logged but users see no Add error UI, retry logic, and
|            | Medium | firebase.js |                    |                       |
| ---------- | ------ | ----------- | ------------------ | --------------------- |
| boundaries |        |             | feedback. No retry | user-facing messages. |
mechanism.
TTS count is incremented in
|                   |     |                 | both tts.js speak() AND | Track TTS usage in one location |
| ----------------- | --- | --------------- | ----------------------- | ------------------------------- |
| TTS dual-tracking | Low | tts.js + app.js |                         |                                 |
|                   |     |                 | app.js speakText().     | only.                           |
Double-counting occurs.
Debug script committed to
| temp_debug.js |     |               |                            | Remove from repository |
| ------------- | --- | ------------- | -------------------------- | ---------------------- |
|               | Low | temp_debug.js | repository. Also listed in |                        |
| committed     |     |               |                            | entirely.              |
.gitignore (contradictory).

Phase 4: Dead Code Audit
4.1 Unused Components
There are no unused component files per se, as all JS modules in js/core/ are imported by app.js.
However, several components contain significant dead code within their implementations:
Confidenc
| Item | File |     |     | Reason | Safe to Remove? |
| ---- | ---- | --- | --- | ------ | --------------- |
e
| parseVocabularyRow |          |      | Never called from any module. A1 and B2   |     |     |
| ------------------ | -------- | ---- | ----------------------------------------- | --- | --- |
|                    | utils.js | High |                                           |     | Yes |
| ()                 |          |      | configs have their own parsing functions. |     |     |
Never called from any module. No search
| debounce() | utils.js | High |     |     | Yes |
| ---------- | -------- | ---- | --- | --- | --- |
input or resize handler uses it.
Never called. Study dates are stored as ISO
| formatDate() | utils.js | High |     |     | Yes |
| ------------ | -------- | ---- | --- | --- | --- |
strings and never formatted for display.
Never called. Date comparison logic that
isToday() utils.js High was planned for streak features but never Yes
integrated.
Exported but never imported or called.
| getOtherLevelProgre |             |      |                                          |     | Yes (or implement |
| ------------------- | ----------- | ---- | ---------------------------------------- | --- | ----------------- |
|                     | firebase.js | High | Intended for "Portal Walker" cross-level |     |                   |
| ss()                |             |      |                                          |     | Portal Walker)    |
trophy but the trophy has req: () => false.
Exported but never imported. Auth is
getAuthInstance() firebase.js High accessed via the return value of Yes
initFirebase().
getFirestoreInstance( Exported but never imported. Same pattern
|     | firebase.js | High |                       |     | Yes |
| --- | ----------- | ---- | --------------------- | --- | --- |
| )   |             |      | as getAuthInstance(). |     |     |
Replace with
| 13 Trophy req |             |      | 13 trophies have req: p => false, meaning  |     |                 |
| ------------- | ----------- | ---- | ------------------------------------------ | --- | --------------- |
|               | trophies.js | High |                                            |     | implementations |
| functions     |             |      | their evaluation logic is completely dead. |     |                 |
or remove trophies
4.2 Unused Assets and Dependencies
Confidenc
| Item | Type |     |     | Reason | Safe to Remove? |
| ---- | ---- | --- | --- | ------ | --------------- |
e
Debug script listed in .gitignore but still
temp_debug.js File High committed. Node.js script that reads Yes
b2.config.js.
AI agent handover document. Contains
Yes (after
gemini_memory.md File Medium historical debugging context. Not used by
archiving)
the application.
godfather_memory. AI agent context document with CSS/parsing Yes (after
|     | File | Medium |                                     |     |            |
| --- | ---- | ------ | ----------------------------------- | --- | ---------- |
| md  |      |        | rules. Not used by the application. |     | archiving) |

qwen_memory_theF AI agent project memory document. Not Yes (after
File Medium
ounder.md used by the application. archiving)
Template for future levels. Not imported by
Keep for A2/B1
tetemplate.config.js File Low any current module but serves as
development
documentation.
measurementId "G-PW8LJZWW5T" is
Yes (or implement
Firebase Analytics Dependency High configured but Analytics SDK is never
Analytics)
imported or initialized.
4.3 Unused CSS
The CSS file (core.css) at 855 lines is largely utilized. However, a few rules appear unused or redundant:
.flex / .items-center: Utility classes defined but never used in any HTML file. The project uses
inline styles instead.
.trophy-badge: Display:none by default, shown only on .earned cards. But the badge is never
rendered with content because multi-earn was disabled (trophyCounts always 1).
stat-session tracking: The "Words Studied Today" stat card exists in the HTML but the session
counter (stat-session) is never meaningfully updated during a session. It always shows 0.
Phase 5: Firebase Audit
5.1 Authentication
The authentication implementation provides two sign-in methods: Google OAuth via popup and
Email/Password via a dynamically-created modal. The implementation is functional but has several
quality concerns:
Hardcoded Firebase Config: The entire Firebase configuration object (API key, auth domain,
project ID, etc.) is hardcoded directly in app.js at lines 25-33. This is a significant security concern
as it exposes the API key in client-side code. While Firebase API keys are technically
public-facing, the configuration should be environment-specific and managed through a build
process.
Password Policy: Email sign-up only enforces Firebase's default minimum of 6 characters. There is
no complexity requirement, no password confirmation field, and no password strength indicator.
No Session Persistence Control: The app relies on Firebase's default session persistence (browser
session in most cases). There is no "Remember Me" option or explicit persistence configuration.
Full Reload on Auth Change: Every auth state change triggers window.location.reload(), which
creates a poor user experience and causes a visible flash. The auth flow should update the UI
reactively without a full page reload.

No Account Management: Users cannot change their password, update their email, or delete their
account. There is no forgot-password flow.
5.2 User Progress Tracking
The progress tracking system is well-designed in principle but has implementation gaps that affect
scalability and reliability:
Concern Severity Details
The known[] array grows with every word mastered. At full B2
completion (3031 words), the document would be ~120-150KB. This is
Document size growth Medium
within Firestore limits (1MB) but will increase read/write costs and
latency.
Every _save() call writes the entire progress document. With frequent
No incremental updates Medium saves (every flashcard answer), this creates excessive write operations.
Should use FieldUpdate for atomic incremental changes.
mergeProgress() unions known arrays and takes max for counters, but
Merge strategy limitations Low this can lead to data inconsistencies if two devices are used
simultaneously with conflicting edits.
There is no optimistic concurrency control. The {merge:true} strategy
No conflict resolution Medium prevents data loss but can create inconsistent state when users are
active on multiple devices.
studyDates[] grows indefinitely. After a year of daily use, this array
Study dates unbounded Low
could contain 365+ date strings. Should be pruned or aggregated.
5.3 Firestore Usage
Collection Design: The progress documents use a nested path pattern:
artifacts/{appId}/users/{uid}/progress/main. This is a reasonable design for multi-app isolation but
deviates from Firebase best practices, which recommend shallow collection structures with composite
indexes for querying. The current design cannot be queried across all users or all apps without
administrative SDK access.
Leaderboard Design: The leaderboard collection uses uid as document ID, with denormalized
a1Count/b2Count/totalWords fields. This is a good pattern for read-heavy leaderboard queries.
However, the leaderboard is updated on every _save() call, which means every flashcard answer triggers
a leaderboard write. This is excessive and should be debounced or batched.
Query Patterns: The only complex query is getLeaderboard(), which uses orderBy("totalWords",
"desc").limit(50). This requires a Firestore index (auto-created by Firebase). All other operations are
direct document reads/writes by path. There are no collection group queries, no range queries, and no
aggregations.

5.4 Cost Analysis
Frequenc
| Operation | Trigger |     | Monthly Estimate |     | Risk |
| --------- | ------- | --- | ---------------- | --- | ---- |
y
~5,000-50,000
Every flashcard answer,
| Progress save (write) |     | High | writes/month for 100 | Medium |     |
| --------------------- | --- | ---- | -------------------- | ------ | --- |
every auth change
DAU
~5,000-50,000
| Leaderboard update |                    |      |                      | High - should be |     |
| ------------------ | ------------------ | ---- | -------------------- | ---------------- | --- |
|                    | Every _save() call | High | writes/month for 100 |                  |     |
| (write)            |                    |      |                      | debounced        |     |
DAU
~3,000-30,000
Every page load, every
| Progress load (read) |     | Medium | reads/month for 100 | Low |     |
| -------------------- | --- | ------ | ------------------- | --- | --- |
auth state change
DAU
~1,000-10,000
Leaderboard fetch
|     | Every leaderboard view | Low | reads/month for 100 | Low |     |
| --- | ---------------------- | --- | ------------------- | --- | --- |
(read)
DAU
~500-5,000/month for
| Auth operations | Login, sign-up, logout | Low |     | Low |     |
| --------------- | ---------------------- | --- | --- | --- | --- |
100 DAU
5.5 Security
| Issue | Severity | File(s) |     | Details |     |
| ----- | -------- | ------- | --- | ------- | --- |
No evidence of deployed security rules. Without rules,
No Firestore security rules Firestore defaults to deny-all (secure) but the app
|     | Critical | firebase.js |     |     |     |
| --- | -------- | ----------- | --- | --- | --- |
deployed expects read/write access. If rules were set to allow all
for testing, all user data is publicly accessible.
API key, project ID, and other credentials are
hardcoded in client-side JavaScript. While Firebase
Client-side Firebase config
|     | High | app.js:25-33 | API keys are designed to be public, the config should |     |     |
| --- | ---- | ------------ | ----------------------------------------------------- | --- | --- |
exposed
not include service account credentials or be
committed to public repos.
displayName is written directly from
auth.currentUser.displayName to the leaderboard
No input sanitization on
|     | Medium | firebase.js:93 | without sanitization. Malicious names could contain |     |     |
| --- | ------ | -------------- | --------------------------------------------------- | --- | --- |
displayName
scripts if rendered via innerHTML (which they are in
_renderLeaderboard()).
Every flashcard answer triggers a Firestore write.
There is no debouncing, throttling, or batching. A
| No rate limiting on writes | Medium | app.js _save() |     |     |     |
| -------------------------- | ------ | -------------- | --- | --- | --- |
malicious client could spam writes to inflate Firestore
costs.
The leaderboard collection appears to be readable
Leaderboard data publicly firebase.js getL without authentication (needed for anonymous users to
Medium
readable eaderboard() view rankings). This exposes display names and photo
URLs of all users.

No evidence of Firebase App Check or domain
No CORS configuration
Low N/A restriction configuration. The API could be called
visible
from any origin.
Phase 6: Performance Audit
6.1 Frontend Performance
Issue Category Impact Details
b2.config.js is 3,124 lines (~100KB+). It is imported at
module load time via dynamic import, but the entire file is
B2 config loads 3,031 Bundle
High parsed and all 3,031 word objects are created before any
words synchronously Size
rendering begins. For a unit with 30 words, 3,001 words are
unnecessarily processed.
All 8 core JS modules are loaded on every page, regardless
Bundle
No code splitting Medium of which view the user interacts with. The quiz engine,
Size
trophy engine, and TTS module could be lazily loaded.
GlossaryEngine.render() rebuilds the entire table HTML on
innerHTML re-renders
Rendering High every filter change or hide/reveal action. For a unit with
entire lists
100+ words, this is expensive and causes visible flickering.
The glossary table renders all visible words as DOM nodes.
No virtual scrolling Rendering Medium For B2 units with 100+ words, this creates 100+ table rows
with multiple child elements each.
Firebase SDK (auth + firestore) is loaded from gstatic.com
Firebase SDK loaded from
Network Medium on every page visit. No caching headers can be controlled.
CDN on every page
For offline use, this requires the browser cache.
There is no service worker for offline caching. While the
No service worker Offline Medium app works in "local mode" without Firebase, the
HTML/JS/CSS files themselves are not cached offline.
6.2 Firebase Performance
Excessive Writes: The _save() method is called on every flashcard answer (markCard), every dark
mode toggle, every TTS usage, every column hide, and every favorite toggle. Each call writes the
entire progress document plus a leaderboard update. A typical study session of 50 flashcard reviews
generates 100+ Firestore writes (50 progress + 50 leaderboard). This should be debounced to batch
writes every 10-30 seconds.
No Read Optimization: Progress is loaded once on auth state change. This is efficient. However, the
leaderboard fetch queries the entire collection with ordering. As the user base grows, this query will
become slower and more expensive.
No Offline Persistence: Firestore offline persistence is not enabled. The app relies on localStorage
as the offline fallback, which means Firestore writes during connectivity loss will fail silently.

6.3 Optimization Opportunities
|                                       | Optimization | Classification                | Expected Benefit |        | Effort |
| ------------------------------------- | ------------ | ----------------------------- | ---------------- | ------ | ------ |
| Lazy-load vocabulary per unit instead |              | 70-90% reduction in initial   |                  |        |        |
|                                       |              | Quick Win                     |                  | Medium |        |
| of all units                          |              | parse time for B2             |                  |        |        |
| Debounce Firestore writes (30s        |              | 80-95% reduction in Firestore |                  |        |        |
|                                       |              | Quick Win                     |                  | Low    |        |
| interval)                             |              | write operations              |                  |        |        |
| Debounce leaderboard updates          |              | 80-95% reduction in           |                  |        |        |
|                                       |              | Quick Win                     |                  | Low    |        |
| (separate from progress)              |              | leaderboard writes            |                  |        |        |
| Use Document.update() for             |              | 50% reduction in document     |                  |        |        |
|                                       |              | Medium Impact                 |                  | Medium |        |
| incremental field changes             |              | write size                    |                  |        |        |
| Implement virtual scrolling for       |              | 60-80% reduction in DOM       |                  |        |        |
|                                       |              | Medium Impact                 |                  | High   |        |
| glossary tables                       |              | nodes for large units         |                  |        |        |
Add service worker for offline asset Full offline capability for return
|         |     | Medium Impact |     | Medium |     |
| ------- | --- | ------------- | --- | ------ | --- |
| caching |     | visits        |     |        |     |
Split core.css into component-scoped Faster initial CSS parse, better
|       |     | Medium Impact   |     | Low |     |
| ----- | --- | --------------- | --- | --- | --- |
| files |     | maintainability |     |     |     |
Migrate to a modern SPA framework Addresses all rendering, state,
|                    |     | High Impact             |     | Very High |     |
| ------------------ | --- | ----------------------- | --- | --------- | --- |
| (React/Vue/Svelte) |     | and architecture issues |     |           |     |
Phase 7: UX and Product Review
| Area | Issue | Severity |     | Details |     |
| ---- | ----- | -------- | --- | ------- | --- |
New users land on the level portal with no guidance. No
tutorial, no sample data, no progressive disclosure. The
| Onboarding | No first-run experience | Medium |     |     |     |
| ---------- | ----------------------- | ------ | --- | --- | --- |
app assumes the user knows what A1/B2 means and how
to use the features.
The portal page has links to A2.html and B1.html which do
not exist. Clicking them results in a 404 error. These
| Navigation | Broken links for A2/B1 | High |     |     |     |
| ---------- | ---------------------- | ---- | --- | --- | --- |
should be disabled or show a proper "coming soon"
interstitial.
Once inside a level, there is no breadcrumb showing the
No breadcrumb or
Navigation Low current location. Users must rely on the sidebar which is
context
hidden on mobile.
Flashcards use a simple known/learning binary. There is
Lesson
No spaced repetition Medium no SRS algorithm (like Anki's SM-2) to optimize review
Experience
timing based on retention curves.
The flashcard counter shows position in queue but not
| Lesson     | No progress indication   |                                                                |     |     |     |
| ---------- | ------------------------ | -------------------------------------------------------------- | --- | --- | --- |
|            |                          | Medium percentage completion. Users cannot gauge how much of a |     |     |     |
| Experience | during flashcard session |                                                                |     |     |     |
session remains.

On mobile, the sidebar is hidden and requires a hamburger
Sidebar hidden by
Mobile Low menu tap. This is standard but the close button (X) is small
default
and hard to tap.
The terminology differs between levels. A1 labels sections
A1 uses "Unit" while
Consistency Low as "Unit 1, Unit 2..." while B2 uses "Module 1, Module
B2 uses "Module"
2...". This could confuse users switching between levels.
The dashboard always shows stats but has no personalized
| Missing No empty state for |     |        |                                                            |     |     |
| -------------------------- | --- | ------ | ---------------------------------------------------------- | --- | --- |
|                            |     | Medium | guidance when progress is low (e.g., "Start with Unit 1 to |     |     |
| States dashboard           |     |        |                                                            |     |     |
begin your journey").
Firebase operations have no loading indicators. The
Missing
No loading states Low leaderboard shows "Loading ranks..." text but other
States
operations are silent.
Flashcards cannot be flipped or navigated with keyboard.
Accessibility No keyboard navigation Medium All interactions require mouse/touch clicks. No ARIA
labels on interactive elements.
Dynamic content rendered via innerHTML is not
No screen reader
Accessibility Medium announced to screen readers. No aria-live regions for toast
support
notifications or progress updates.
Phase 8: Security Review
| Finding | Severity | Category | File(s) |     | Remediation |
| ------- | -------- | -------- | ------- | --- | ----------- |
Deploy rules requiring request.auth != null
No deployed
|                    |          | Authorizatio |     | and request.auth.uid == userId for user-scoped |     |
| ------------------ | -------- | ------------ | --- | ---------------------------------------------- | --- |
| Firestore security | Critical |              | N/A |                                                |     |
|                    |          | n            |     | documents. Leaderboard reads may allow         |     |
rules
unauthenticated access.
| innerHTML |     |     |     | Sanitize all user-provided data before |     |
| --------- | --- | --- | --- | -------------------------------------- | --- |
app.js:317-33
injection via High XSS inserting into HTML. Use textContent for
5
| displayName |     |     |     | display names, or escape HTML entities. |     |
| ----------- | --- | --- | --- | --------------------------------------- | --- |
Vocabulary de/en/context fields are inserted
innerHTML
|               |      |     | glossary.js:58- | into HTML without escaping. If vocabulary |     |
| ------------- | ---- | --- | --------------- | ----------------------------------------- | --- |
| injection via | High | XSS |                 |                                           |     |
|               |      |     | 95              | data is ever user-contributable, this is  |     |
vocabulary data
exploitable.
The Firebase config is committed to a public
GitHub repository. While API keys are
| Firebase config in |     | Data |     |     |     |
| ------------------ | --- | ---- | --- | --- | --- |
Medium app.js:25-33 public-facing, the projectId and appId should
| public repo |     | Exposure |     |     |     |
| ----------- | --- | -------- | --- | --- | --- |
be managed through environment variables or
a build process.
Without App Check, any client can make
No Firebase App Abuse requests to the Firebase backend. Add App
|       | Medium |            | N/A |                                             |     |
| ----- | ------ | ---------- | --- | ------------------------------------------- | --- |
| Check |        | Prevention |     | Check to verify that requests come from the |     |
legitimate web app.

Implement client-side debouncing (30s
No rate limiting on
|     | Medium DoS/Cost | app.js _save() | intervals) and consider server-side rate |     |
| --- | --------------- | -------------- | ---------------------------------------- | --- |
Firestore writes
limiting via Cloud Functions.
No CSP headers are set. The app loads
| No Content      |                  |     | Firebase SDK from gstatic.com and uses      |     |
| --------------- | ---------------- | --- | ------------------------------------------- | --- |
|                 | Medium Injection | N/A |                                             |     |
| Security Policy |                  |     | inline event handlers, making CSP difficult |     |
but still recommended.
Progress data in localStorage is stored as plain
localStorage data
Low Data at Rest storage.js JSON. While not highly sensitive, the known
not encrypted
words list could reveal learning patterns.
Not applicable for a static site with no
No CSRF Web
|     | Low | N/A | server-side sessions, but worth noting for any |     |
| --- | --- | --- | ---------------------------------------------- | --- |
protection Security
future server-side additions.
Phase 9: Expansion Readiness
Assuming the platform triples in size over the next year (adding A2, B1, C1, C2 levels, plus AI features,
analytics, and admin tools), the following bottlenecks must be resolved before future development
continues:
| Bottleneck | Impact | Why It Must Be Solved First |     | Effort to Fix |
| ---------- | ------ | --------------------------- | --- | ------------- |
HTML page With 6 levels, any UI change requires 6 identical Medium - Create shared
Critical
duplication edits. This guarantees inconsistency and bugs. template system
Adding new lesson types, AI features, or analytics
High - Decompose into
| God object app.js | Critical into the current monolithic controller will make it |     |     |     |
| ----------------- | ------------------------------------------------------------ | --- | --- | --- |
service modules
unmaintainable.
AI features, subscriptions, admin dashboards, and
Very High - Build
| No backend | Critical content management all require server-side logic. |     |     |     |
| ---------- | ---------------------------------------------------------- | --- | --- | --- |
backend with API layer
The current architecture is purely client-side.
Adding vocabulary requires editing JavaScript files
| No content |                                                      |     | High - Build CMS or |     |
| ---------- | ---------------------------------------------------- | --- | ------------------- | --- |
|            | High and redeploying. Non-technical content creators |     |                     |     |
| management |                                                      |     | use headless CMS    |     |
cannot contribute.
Each additional level adds 1,000-3,000+ lines of
| Vocabulary data as |                                                        |     | Medium - Externalize to |     |
| ------------------ | ------------------------------------------------------ | --- | ----------------------- | --- |
|                    | High data to the JavaScript bundle. C2 alone could add |     |                         |     |
| code               |                                                        |     | JSON/database           |     |
5,000+ words.
|     | No bundling, no tree-shaking, no code splitting, no |     | Medium - Add |     |
| --- | --------------------------------------------------- | --- | ------------ | --- |
No build system Medium environment management. All code ships as-is to Vite/Webpack build
|            | the browser.                                     |     | pipeline            |     |
| ---------- | ------------------------------------------------ | --- | ------------------- | --- |
|            | Zero tests exist. Any refactoring or new feature |     | Medium - Add Jest + |     |
| No testing | Medium                                           |     |                     |     |
|            | development has no safety net.                   |     | integration tests   |     |

Phase 10: Final Assessment
10.1 Executive Summary
The German Learning Platform is a functional, lightweight vocabulary study tool built with vanilla
HTML/CSS/JavaScript and Firebase. It successfully delivers its core value proposition: helping users
learn German vocabulary through glossary views, flashcards, and article quizzes, with cloud-synced
progress tracking. The codebase demonstrates good intent in its modular engine pattern
(GlossaryEngine, FlashcardEngine, QuizEngine, TrophyEngine) and its offline-first with cloud-sync
approach.
However, the platform is architecturally fragile and not ready for significant expansion. The most
critical issues are: (1) near-complete HTML duplication across level pages, making any UI change a
multi-file manual process; (2) a monolithic app.js controller that has grown into a god object; (3) the
absence of a backend, build system, or testing infrastructure; and (4) significant security gaps including
potentially missing Firestore security rules and XSS-vulnerable innerHTML rendering. These issues are
not blocking for the current two-level deployment, but they will become critical blockers the moment a
third level is added or any feature beyond vocabulary study is attempted.
10.2 Strengths
Offline-First Design: The app works fully without authentication, using localStorage as the primary
data store. This is excellent for a learning app where users may study in environments with poor
connectivity.
Config-Driven Level System: The dynamic import pattern for level configs enables vocabulary data
to be added without modifying core application logic. This is a solid foundation for multi-level
support.
Engine Pattern: The separation of GlossaryEngine, FlashcardEngine, QuizEngine, and
TrophyEngine into dedicated classes with clear interfaces is well-designed and provides a good
foundation for extension.
Progress Merge Strategy: The mergeProgress() function handles the complexity of merging local
and remote progress with union and max semantics. This is a thoughtful approach to offline/online
synchronization.
Dark Mode Support: The CSS variable-based theming system with data-theme attribute is clean and
well-implemented. It persists across sessions and syncs via Firebase.
Zero Dependencies: Beyond Firebase (loaded from CDN), there are no npm packages, no build
step, and no framework overhead. This makes the project extremely lightweight and fast to load.
10.3 Weaknesses

HTML Duplication: a1.html and b2.html are 95%+ identical. This is the single biggest
maintainability problem.
God Object Controller: app.js at 822 lines with 30+ methods is the central bottleneck for any
feature development.
No Build System: No bundler, no transpiler, no environment management, no tree-shaking. The
project cannot benefit from the npm ecosystem or modern development tooling.
InnerHTML Rendering: All dynamic UI is built via string concatenation and innerHTML injection.
This is both a performance issue (rebuilding DOM) and a security issue (XSS surface).
Broken Trophy System: 13 of 34 trophies have req: p => false, meaning they can never be earned.
This includes all streak-based, time-based, and cross-level trophies.
B2 Data Quality: 99.97% of B2 vocabulary entries have no word type classification (all default to
"Vocab"), making the type filter essentially useless for B2.
No Testing: Zero test files exist. No unit tests, no integration tests, no E2E tests. Any change carries
unknown regression risk.
10.4 Risks
Risk Likelihood Impact Mitigation
Firestore cost explosion with Debounce writes, batch updates, implement
High High
user growth client-side rate limiting
Security breach via missing
High Critical Deploy and test security rules immediately
Firestore rules
XSS attack via unsanitized
Medium High Sanitize all dynamic content; switch to DOM APIs
innerHTML
Maintainability collapse with
High High Refactor to template system before adding A2
6+ levels
Data loss from merge Implement optimistic concurrency with Firestore
Medium Medium
conflicts on multi-device transactions
TTS remains broken on Add fallback audio files or a third-party TTS
High Low
certain browsers service
10.5 Quick Wins
These are changes that can be implemented in less than a day each and provide immediate value:
1. Debounce Firestore writes: Add a 30-second debounce to _save() so that rapid flashcard answers
batch into a single write. This immediately reduces Firestore costs by 80-95%.
2. Deploy Firestore security rules: Create and deploy rules that require authentication for writes and
restrict reads to user-owned documents. This is a critical security fix.

3. Fix broken navigation links: Change A2 and B1 links on index.html to use javascript:void(0) or
show a modal instead of linking to non-existent pages.
4. Remove dead code: Delete the 4 unused utility functions in utils.js (parseVocabularyRow,
debounce, formatDate, isToday) and the 3 unused Firebase exports.
5. Fix TTS double-counting: Remove the ttsCount increment from tts.js speak() function since
app.js speakText() already tracks this.
6. Delete temp_debug.js: Remove the debug script from the repository entirely.
7. Add keyboard navigation to flashcards: Bind arrow keys for prev/next, spacebar for flip, and K/L
for known/learning. This improves accessibility and power-user experience.
10.6 Refactoring Priorities
Priorit
Item Rationale
y
Eliminate HTML duplication with shared Any UI change currently requires editing 2+ files. This
1
template becomes 6+ files with additional levels.
The god object makes it impossible to add features without
2 Decompose app.js into service modules
risking regressions in unrelated functionality.
Moving 3,124 lines of B2 data out of JavaScript reduces
3 Externalize vocabulary data to JSON
bundle size and enables CMS-driven content management.
The current ad-hoc state synchronization between engines,
4 Implement proper state management
state.data, and the payload object is fragile and error-prone.
Enable code splitting, tree-shaking, environment variables,
5 Add build system (Vite)
and modern development workflow.
Eliminate XSS surface and improve rendering performance
6 Replace innerHTML with safe rendering
by using DOM APIs or a lightweight template library.
Complete the 13 unimplemented trophies (streaks,
7 Implement missing trophy logic time-based, cross-level) to deliver the full gamification
experience.
Jest for unit tests, Playwright or Cypress for E2E. Without
8 Add testing infrastructure
tests, any refactoring is high-risk.
10.7 Readiness Scores
Score
Dimension Justification
(0-10)
Multi-page duplication, god object, no build system. The config-driven engine
Architecture 3
pattern saves it from a 1.
Engine classes are well-structured, but app.js is monolithic. Inconsistent naming,
Code Quality 4
dead code, innerHTML rendering.

HTML duplication is the primary blocker. Any change requires multi-file manual
Maintainability 3
edits. No tests, no CI/CD.
Cannot add levels without duplicating HTML. Cannot add features without
Scalability 2
modifying the god object. No backend for server-side features.
Missing Firestore rules is critical. innerHTML XSS is high. Firebase config in
Security 3
public repo is medium.
Good offline-first pattern, sensible document structure, functional merge strategy.
Firebase Design 5
Excessive writes and missing rules drag it down.
Lightweight with no framework overhead, but 3,000+ line B2 config is loaded
Performance 4
synchronously. No code splitting, no lazy loading.
Functional and clean for its scope. Good dark mode, responsive sidebar. Missing
UX 5
onboarding, keyboard nav, and broken links.
Developer No build system, no tests, no linting, no type checking. AI memory files suggest
3
Experience previous developers struggled with this codebase.
Refactoring Roadmap
If I were the lead engineer taking ownership of this project today, the following is my exact refactoring
roadmap before building new features. This roadmap is prioritized by engineering impact: each phase
unlocks subsequent phases and reduces risk for future development.
Phase 1: Critical (Weeks 1-2)
Goal: Eliminate the most dangerous risks and prepare the codebase for safe modification.
1.1 Deploy Firestore Security Rules: Write and deploy rules that require authentication for writes
and restrict reads to user-owned documents. This is the single most important security action. Rules
should follow the pattern documented in the godfather_memory.md file: match
/artifacts/{appId}/users/{userId}/{document=**} with auth.uid == userId check.
1.2 Fix Broken Navigation: Update index.html to disable A2/B1 links or add click handlers that
show a "Coming Soon" message instead of navigating to 404 pages.
1.3 Debounce Firestore Writes: Implement a 30-second debounce on _save() so that rapid user
actions (flashcard answers, favorites) batch into single writes. Separate the leaderboard update from
the progress save and debounce it independently (60-second interval).
1.4 Sanitize Dynamic Content: Create a sanitize() utility function that escapes HTML entities (<, >,
&, ", ') and apply it to all user-provided data (displayName in leaderboard) and all vocabulary fields
before innerHTML insertion.
1.5 Remove Dead Code: Delete parseVocabularyRow, debounce, formatDate, isToday from utils.js.
Delete getOtherLevelProgress, getAuthInstance, getFirestoreInstance from firebase.js. Delete

temp_debug.js. Fix TTS double-counting.
Phase 2: Architecture (Weeks 3-6)
Goal: Resolve the structural issues that make the codebase unsafe to extend.
2.1 Create Shared Level Template: Replace a1.html and b2.html with a single level.html that reads
the level identifier from the URL (query param or path segment) and dynamically loads the
appropriate config. This eliminates 550+ lines of HTML duplication and ensures that all levels
share the same UI.
2.2 Decompose app.js: Split the god object into domain-specific modules: AuthService (login,
logout, email auth modal), ProgressService (save, load, merge), NavService (switchView,
switchUnit, sidebar), StatsService (_updateStats, dashboard rendering), LeaderboardService
(render, fetch), and ThemeService (dark mode). The remaining app.js should be a thin orchestrator
that wires these services together.
2.3 Externalize Vocabulary Data: Move vocabulary data from JavaScript config files to JSON files
that can be loaded via fetch(). This reduces the initial JavaScript bundle size dramatically and
enables future CMS integration. The config files should only contain metadata (appId, labels,
grouping rules), not the vocabulary data itself.
2.4 Unify Word Object Schema: Define a canonical word object type: { id, de, deContext?, en,
type, context }. Both A1 and B2 parsers should produce objects conforming to this schema.
Remove the format-specific parsing from config files and create a shared vocabulary parser utility.
Phase 3: Scalability (Weeks 7-10)
Goal: Make it safe and efficient to add new levels and content.
3.1 Add Build System (Vite): Introduce Vite as the build tool. This enables: ES module bundling,
code splitting, tree-shaking, environment variables (for Firebase config), development server with
HMR, and production builds with minification. The migration from raw ES modules to Vite is
straightforward and can be done incrementally.
3.2 Implement Lazy Loading: Load vocabulary data per-unit instead of loading all units at once.
When the user navigates to Unit 5, only fetch Unit 5's data. This reduces initial load from ~100KB
(B2) to ~5KB per unit.
3.3 Add Testing Infrastructure: Set up Jest for unit tests of engine classes (GlossaryEngine,
FlashcardEngine, QuizEngine, TrophyEngine) and service modules. Add Playwright or Cypress for
E2E tests covering auth flows, progress saving, and view navigation. Target: 70%+ code coverage
on core modules.
3.4 Implement Proper State Management: Replace the ad-hoc state.data object with a reactive state
store (Zustand, Pinia, or a custom event-emitter pattern). This ensures that UI updates are automatic
when state changes, eliminating the scattered manual render() calls.

Phase 4: Performance (Weeks 11-13)
Goal: Optimize the runtime experience for current and future users.
4.1 Replace innerHTML with DOM APIs: Refactor GlossaryEngine, TrophyEngine, and
LeaderboardService to use document.createElement() and textContent instead of innerHTML string
concatenation. This eliminates the XSS surface entirely and improves rendering performance by
enabling incremental DOM updates.
4.2 Implement Virtual Scrolling: For glossary tables with 100+ words, implement virtual scrolling
so that only visible rows are rendered in the DOM. Libraries like react-window or custom
intersection-observer-based solutions can reduce DOM node count from 500+ to ~30.
4.3 Add Service Worker: Implement a service worker that caches the application shell (HTML,
CSS, JS) and vocabulary data for full offline support. This enables repeat visits to load instantly and
allows studying without any network connectivity.
4.4 Optimize Firestore Usage: Switch from full-document writes to FieldUpdate for incremental
changes. Instead of rewriting the entire known[] array on every save, use FieldUpdate with
arrayUnion() for adding new known words. Batch leaderboard updates separately from progress
saves.
Phase 5: Future Features Foundation (Weeks 14-17)
Goal: Lay the groundwork for the planned feature expansion.
5.1 Build Backend API Layer: Set up a lightweight backend (Cloud Functions, or a Node.js/Express
server) to handle: AI-powered features (chat, explanations, conjugation drills), subscription
validation, content management, analytics aggregation, and admin operations. This is prerequisite
for any server-side feature.
5.2 Implement Content Management System: Create a simple admin interface (or use a headless
CMS like Strapi) that allows non-technical content creators to add and edit vocabulary without
modifying code files. This is essential for scaling to 6 levels with thousands of words.
5.3 Complete the Trophy System: Implement the 13 currently-unimplemented trophies (streak
detection, time-based awards, cross-level Portal Walker). This delivers the full gamification
experience that is currently half-built.
5.4 Add Analytics Event Tracking: Instrument the application with event tracking for: session
start/end, words studied per session, quiz scores, feature usage (flashcard vs glossary vs quiz), and
feature discovery (first time using a feature). This data is essential for product decisions.
5.5 Design Subscription/Feature Gating: Define the freemium model: which features are free,
which require a subscription. Implement a feature gating system that can check subscription status
from the backend and enable/disable UI elements accordingly. Even if subscriptions are not
launched immediately, the architecture should support them.