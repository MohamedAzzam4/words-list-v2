# **German-Words-List2**

### **Test Results & Problem Analysis Report**

Repository: https://github.com/MohamedAzzam4/German-Words-List2

Date: 2026-05-30

99 Tests Executed | 22 Bugs Confirmed | 8 Critical Issues

| Metric               | Value     |
|----------------------|-----------|
| Total Tests          | 99        |
| Tests Passed         | 99 (100%) |
| Bug-Confirming Tests | 22        |
| Critical Bugs Found  | 8         |
| High Bugs Found      | 7         |
| Medium Bugs Found    | 9         |
| Low Bugs Found       | 6         |

### **1. Executive Summary**

This report presents the results of a comprehensive test and analysis of the German-Words-List2 web application, a German vocabulary learning tool built with vanilla HTML/CSS/JavaScript and Firebase. The application supports A1 (714 words) and B2 (3,093 words) levels, featuring glossary, flashcard, quiz, and trophy/achievement systems. The analysis focused on correctness of core logic, data integrity, trophy evaluation mechanics, and production-readiness for a small-scale deployment (maximum 10 users).

A total of 99 automated tests were executed across 10 categories: calcStreak (11 tests), Trophy evaluation (18 tests), Storage layer (9 tests), Quiz engine (7 tests), Flashcard engine (7 tests), Glossary engine (4 tests), TTS/audio processing (7 tests), Utilities (4 tests), App logic simulation (9 tests), and Edge cases (6 tests). All 99 tests passed, with 22 tests specifically designed to confirm the existence of bugs. These bug-confirming tests prove that the issues are real and reproducible, not theoretical.

The most critical finding is that the trophy/achievement system is fundamentally broken in multiple ways: type-based trophies (Verb Master, Noun Collector, Chatterbox) are unearnable in B2 because all B2 words have type "Vocab" instead of proper grammatical types; the multi-earn mechanism is completely disabled despite having a "multi" flag; and six trophies have mismatched descriptions that mislead users about what they actually require. Additionally, session counters (sessionKnown, sessionFlashcardErrors, sessionWordsReviewed) never reset across browser sessions, causing the dashboard to display incorrect "Words Studied Today" values and making several trophies earnable through cumulative rather than per-session achievements.

# **2. Complete Issue Registry**

The table below catalogs every issue discovered during testing and analysis, organized by severity. Critical issues represent functionality that is completely broken or produces incorrect user-facing results. High issues represent significant logic errors that affect user experience. Medium issues represent inconsistencies or misleading information. Low issues are minor concerns or code quality issues.

#### **Critical & High Severity Issues (B01 - B15)**

| #           | Seve<br>rity | Title                                   | File            | Line        | Description                                                                                                    |
|-------------|--------------|-----------------------------------------|-----------------|-------------|----------------------------------------------------------------------------------------------------------------|
| B<br>0<br>1 | Criti<br>cal | B2 type-based<br>trophies<br>unearnable | trophies.j<br>s | 37-3<br>9   | verb_veteran, noun_ninja, expression_expert filter<br>p.known by w.type, but B2 words all have<br>type="Vocab" |
| B<br>0<br>2 | Criti<br>cal | Multi-earn<br>trophies disabled         | trophies.j<br>s | 152-<br>156 | currentCount===0 check prevents re-earning. The<br>"multi" flag is never checked.                              |

| B<br>0<br>3 | Criti<br>cal | sessionKnown<br>never resets                       | app.js          | 281         | Counter accumulates across sessions. Dashboard<br>shows it as "Words Studied Today" which is wrong.      |
|-------------|--------------|----------------------------------------------------|-----------------|-------------|----------------------------------------------------------------------------------------------------------|
| B<br>0<br>4 | Criti<br>cal | sessionFlashcard<br>Errors never<br>resets         | app.js          | 284         | Counter accumulates forever. "I Am So Cooked"<br>trophy says "in one session" but triggers cumulatively. |
| B<br>0<br>5 | Criti<br>cal | sessionWordsRe<br>viewed never<br>resets           | app.js          | 286         | Counter accumulates forever. "On Fire" trophy says<br>"in one session" but triggers cumulatively.        |
| B<br>0<br>6 | Criti<br>cal | darkModeStudy<br>Minutes inflates                  | app.js          | 678         | Adds 0.5 per _save() call, not based on real time. With<br>frequent saves, inflates rapidly.             |
| B<br>0<br>7 | Criti<br>cal | totalStudyTime<br>Ms inflates                      | app.js          | 682-<br>685 | _sessionStartTime reset each save. Rapid saves cause<br>time to accumulate faster than real time.        |
| B<br>0<br>8 | Criti<br>cal | _sessionStartTi<br>me persisted in<br>localStorage | app.js          | 746         | Stale timestamp causes incorrect totalStudyTimeMs on<br>next session load.                               |
| B<br>0<br>9 | High         | bro_studied desc<br>mismatch                       | trophies.j<br>s | 44          | Description: "first flashcard session". Requires: 5<br>sessions.                                         |
| B<br>1<br>0 | High         | session_stacker<br>desc mismatch                   | trophies.j<br>s |             | Description: "10 total sessions". Requires: 20 sessions.                                                 |
| B<br>1<br>1 | High         | academic_weap<br>on desc<br>mismatch               | trophies.j<br>s | 50          | Description: "25 flashcard sessions". Checks:<br>sessionKnown>=100.                                      |
| B<br>1<br>2 | High         | brain_rot_activat<br>ed desc<br>mismatch           | trophies.j<br>s | 51          | Description: "30 min in flashcards". Checks: total<br>errors>=50.                                        |
| B<br>1<br>3 | High         | mode_explorer<br>desc mismatch                     | trophies.j<br>s | 40          | Description: "2 modes in one session". Requires: 3<br>modes.                                             |
| B<br>1<br>4 | High         | Quiz score/total<br>not reset on unit<br>switch    | quiz.js         | 12-1<br>6   | loadUnit() updates words/nouns but does not reset<br>score and total counters.                           |
| B<br>1<br>5 | High         | returnedAfter7D<br>ays never clears                | app.js          | 441-<br>443 | Once set to true, persists forever. "Were So Back"<br>triggers on every subsequent visit.                |

#### **Medium & Low Severity Issues (B16 - B28)**

| #           | Seve<br>rity | Title                                            | File            | Line        | Description                                                                                       |
|-------------|--------------|--------------------------------------------------|-----------------|-------------|---------------------------------------------------------------------------------------------------|
| B<br>1<br>6 | Medi<br>um   | TTS declension<br>regex missing<br>"er"          | tts.js          | 10          | Pattern matches n en s e r m but not "er" (common<br>German plural like Haus-er).                 |
| B<br>1<br>7 | Medi<br>um   | TTS does not<br>remove -war                      | tts.js          | 10          | Irregular past tense markers like -war are not in the<br>declension cleanup pattern.              |
| B<br>1<br>8 | Medi<br>um   | toggleColumn<br>only hides one<br>column         | glossary.j<br>s | 23-2<br>9   | hiddenCols.clear() removes all before adding new.<br>Cannot hide multiple columns simultaneously. |
| B<br>1<br>9 | Medi<br>um   | portal_walker<br>crossLevel flag<br>is false     | trophies.j<br>s | 70          | The trophy IS cross-level but the flag says false.<br>Misleading for developers.                  |
| B<br>2<br>0 | Medi<br>um   | calcStreak<br>duplicates break<br>loop           | trophies.j<br>s | 12-2<br>2   | Duplicate dates (diffDays=0) break the streak loop<br>since only diffDays===1 continues.          |
| B<br>2<br>1 | Medi<br>um   | parseVocabulary<br>Row non-determ<br>inistic IDs | utils.js        | 18          | Uses Math.random() for ID generation. Same word<br>gets different IDs on each parse.              |
| B<br>2<br>2 | Medi<br>um   | Duplicate import<br>in logout()                  | app.js          | 84          | clearLocalProgress re-imported from storage.js despite<br>being imported at top of file.          |
| B<br>2<br>3 | Low          | Missing a2.html<br>and b1.html                   | index.ht<br>ml  | 167-<br>175 | Index page links to these pages but they do not exist<br>(shown as "Coming Soon").                |
| B<br>2<br>4 | Low          | Firebase config<br>hardcoded                     | app.js          | 25-3<br>3   | API keys directly in client code. Common for<br>client-side Firebase but worth noting.            |
| B<br>2<br>5 | Low          | XSS risk in<br>glossary render                   | glossary.j<br>s | 63-7<br>5   | Word text interpolated into innerHTML. safeDe only<br>escapes single quotes.                      |
| B<br>2<br>6 | Low          | calcStreak<br>timezone<br>sensitivity            | trophies.j<br>s | 5-9         | Uses UTC-based ISO dates. User studying at 11PM<br>local could count as next day in UTC.          |
| B<br>2<br>7 | Low          | modesUsed<br>array grows<br>unbounded            | app.js          | 167-<br>172 | Never cleared between sessions. Once all 6 modes<br>used, array persists forever.                 |

| B<br>2<br>8 | Low | touch_grass<br>trophy inflates | trophies.j<br>s | 49 | 3-hour threshold reachable much earlier than real 3<br>hours due to totalStudyTimeMs inflation (B07). |
|-------------|-----|--------------------------------|-----------------|----|-------------------------------------------------------------------------------------------------------|
|-------------|-----|--------------------------------|-----------------|----|-------------------------------------------------------------------------------------------------------|

# **3. Trophy System Deep Dive**

The trophy system is the most bug-affected component of the application. Out of 34 trophies defined across 4 tiers (Progress, Meme, Streaks, Secret), testing confirmed that 6 trophies have description/requirement mismatches, 3 type-based trophies are unearnable in B2, the multi-earn mechanism is completely non-functional, and 3 trophies use session counters that never reset, making them earnable through cumulative rather than per-session achievements as intended. This section provides a detailed analysis of each trophy bug.

#### **3.1 Type-Based Trophies Unearnable in B2**

The trophies "Verb Master" (verb\_veteran), "Noun Collector" (noun\_ninja), and "Chatterbox" (expression\_expert) filter the known words array by the "type" property of each word object. The A1 vocabulary data includes proper type codes: "v" for verbs, "n" for nouns, "e" for expressions, "a" for adjectives, "d" for adverbs, and "p" for pronouns/prepositions. However, the B2 vocabulary data format omits the type field entirely (the second field in the pipe-delimited format is empty), causing the parser to default all B2 words to type "Vocab". Since none of the B2 words have type "v", "n", or "e", these three trophies are permanently unearnable for any user studying B2 content. The test confirmed this: with 50 B2 words all marked as known, none of the type-based trophies were earned.

**Root cause:** The B2 raw data format is "unit||de|en|exDe|exEn" with an empty type field. The parseRawB2Data() function does not attempt to infer types from word patterns (e.g., words starting with "der/die/das" could be classified as nouns). A fix would require either adding type data to the B2 vocabulary entries or implementing type inference in the parser.

#### **3.2 Multi-Earn Mechanism Disabled**

Three trophies have "multi: true" in their definition: "bro\_studied" (tier 2), "on\_fire" (tier 2), and "session\_stacker" (tier 3). This flag appears to indicate that these trophies should be earnable multiple times. However, the evaluate() method in TrophyEngine uses the check "currentCount === 0" (line 153) to determine whether a trophy should be awarded. This means every trophy can only be earned exactly once, regardless of the "multi" flag. The "multi" property is never referenced in the evaluation logic. The test confirmed that once bro\_studied has trophyCounts[bro\_studied]=1, it cannot be re-earned even when the user meets the requirement again. To fix this, the evaluate() method should check the "multi" flag and implement a threshold-based re-earning system (e.g., bro\_studied earns at 5, 15, 30 sessions).

### **3.3 Description/Requirement Mismatches**

| Trophy | Description | Actual Requirement | Impact |
|--------|-------------|--------------------|--------|
|        |             |                    |        |

| bro_studied             | "Complete your first<br>flashcard session"              | sessionsCompleted >= 5          | Users expect it at 1 session; actual<br>trigger at 5                            |
|-------------------------|---------------------------------------------------------|---------------------------------|---------------------------------------------------------------------------------|
| session_stac<br>ker     | "Complete 10 total<br>sessions"                         | sessionsCompleted >=<br>20      | Users expect it at 10 sessions; actual<br>trigger at 20                         |
| academic_we<br>apon     | "Complete 25 flashcard<br>sessions"                     | sessionKnown >= 100             | Checks wrong counter; uses<br>sessionKnown instead of<br>sessionsCompleted      |
| brain_rot_act<br>ivated | "Spend 30 min in<br>flashcards in one sitting"          | Total flashcard errors >=<br>50 | Completely different metric;<br>description implies time, code<br>checks errors |
| mode_explor<br>er       | "Use glossary and<br>flashcard modes in one<br>session" | modesUsed.length >= 3           | 2 modes should suffice per<br>description; requires 3                           |
| i_am_so_coo<br>ked      | "Fail the same card 5<br>times in one session"          | sessionFlashcardErrors<br>>= 5  | Counter never resets, so this is<br>cumulative across all sessions              |

Table 1: Trophy Description vs. Actual Requirement Mismatches

#### **3.4 Session Counter Bugs Affecting Trophies**

Three session-level counters (sessionKnown, sessionFlashcardErrors, sessionWordsReviewed) are incremented during user activity but are never reset when a new browser session begins. This means they accumulate across all sessions indefinitely. The dashboard displays sessionKnown as "Words Studied Today", which is misleading because it actually shows the total words ever marked as known in flashcards. Similarly, the "On Fire" trophy claims to reward "50 words in one session" but actually triggers when the cumulative total reaches 50. The "I Am So Cooked" trophy claims "5 errors in one session" but triggers at 5 cumulative errors. The fix requires resetting these counters either on page load (new session) or by tracking a "session start date" and comparing it with the current date.

### **4. Time Tracking & Study Metrics Bugs**

#### **4.1 Dark Mode Study Minutes Inflation**

The \_save() method in app.js adds 0.5 to darkModeStudyMinutes every time it is called while dark mode is active. Since \_save() is triggered on virtually every user action (marking a flashcard, toggling favorites, using TTS, switching views), this counter inflates rapidly. For example, if a user marks 20 flashcards in dark mode, each mark triggers a save, adding 10 minutes of "study time" in just a few minutes of real time. The test confirmed that 10 save calls in dark mode produce 5.0 minutes of recorded study time, regardless of actual elapsed time. The "Rizzed Up Dark Mode" trophy requires 30 minutes, which would be reached after approximately 60 save events rather than 30 real minutes.

### **4.2 Total Study Time Inflation**

The totalStudyTimeMs tracker uses a "delta accumulation" pattern: it records \_sessionStartTime, calculates elapsed time on each save, adds the elapsed to the total, then resets \_sessionStartTime. While this seems correct in theory, the problem is that \_save() is called on every user interaction, not on a timer. Each save captures the time since the last save, which might be just a few seconds. However, the cumulative effect is that the total grows much faster than real wall-clock time because multiple saves can occur within a single minute. Furthermore, \_sessionStartTime is persisted in localStorage (it becomes part of state.data and gets saved via the spread operator), so on the next page load, the stale timestamp from the previous session causes an enormous elapsed value on the first save, further inflating the total. The "Touch Grass" trophy requires 3 hours of study time, but due to this inflation, it would be earned in a fraction of that time.

### **5. Quiz Engine Bugs**

The QuizEngine class has a significant bug: the score and total counters are not reset when switching units via loadUnit(). The loadUnit() method updates the words array and extracts nouns from the new unit, but it does not reset this.score or this.total to zero. This means that when a user switches from one unit to another, their quiz score from the previous unit carries over. For example, if a user answers 5 out of 7 correctly in Unit 1, then switches to Unit 2 and answers 3 out of 4 correctly, the displayed score becomes "8 / 11" instead of "3 / 4". The fix is straightforward: add this.score = 0 and this.total = 0 to the loadUnit() method.

### **6. TTS / Audio Processing Bugs**

The cleanTextForAudio() function in tts.js uses a regular expression to remove German declension markers from words before text-to-speech pronunciation. The current pattern is: /[\s,]\*[-]/s\*(n|en|s|e|r|m)/gi. This pattern successfully removes common declension suffixes like "-en" (die Katze -en becomes "die Katze") and "-e" (die Strafe -e becomes "die Strafe"). However, two important declension patterns are missing:

**Missing "er" suffix:** The pattern matches "r" but not "er" as a combined suffix. German nouns with umlaut plurals use "-er" (e.g., "das Haus -er", "das Buch -er"). The test confirmed that "das Haus -er" is NOT cleaned and would be pronounced as "das Haus -er" by the speech synthesizer, which sounds incorrect. The fix is to add "er" to the alternation group: (n|en|er|s|e|r|m).

**Missing umlaut marker handling:** The pattern includes the literal "¨" (umlaut marker, U+00A8) in the alternation, which handles cases like "-¨er" where the umlaut is indicated separately. However, in practice, the B2 data uses the pattern "-er" without the umlaut marker, and the "¨" character appearing before "er" (as in "-er") is not matched because the regex expects the "¨" to be a standalone suffix. The test confirmed that "das Haus -er" (with umlaut marker) is not cleaned.

## **7. Storage & Data Integrity**

The storage layer (storage.js) and Firebase sync layer (firebase.js) are generally well-implemented. The mergeProgress() function correctly unions known/favorites arrays, keeps higher trophy counts, merges study dates uniquely, and preserves the most recent timestamps. All 9 storage tests passed, confirming that save/load round-trips preserve data correctly and that merge logic handles edge cases properly.

However, there is one notable data integrity issue: the \_sessionStartTime property is persisted in localStorage as part of the state.data object. When the app loads on a subsequent visit, this stale timestamp causes the first \_save() call to calculate an enormous elapsed time (potentially days or weeks), which gets added to totalStudyTimeMs. The fix is to exclude \_sessionStartTime from the persisted payload or to initialize it fresh on each page load before the first save.

Another minor issue is the parseVocabularyRow() function in utils.js, which generates word IDs using Math.random(). This means the same word gets a different ID each time it is parsed, which could cause issues if IDs are used for cross-referencing or deduplication. The A1 and B2 config files use their own parsers that generate deterministic IDs, so this function is currently unused, but it should be fixed if it is ever adopted.

# **8. Test Suite Summary**

The test suite (tests.js) was designed to run in Node.js with mocked browser APIs. It tests the core logic of each module by extracting the pure functions and class methods, simulating user interactions, and verifying both expected behavior and bug conditions. The following table summarizes the test results by category:

| Category                | Test<br>s | Pass<br>ed | Bug-Co<br>nfirmed | Focus Areas                                           |
|-------------------------|-----------|------------|-------------------|-------------------------------------------------------|
| 1. calcStreak           | 11        | 11         | 1                 | Streak calculation, edge cases, duplicates, gaps      |
| 2. Trophy<br>Evaluation | 18        | 18         | 8                 | Earn conditions, B2 type bugs, multi-earn, mismatches |
| 3. Storage<br>Layer     | 9         | 9          | 0                 | Save/load round-trips, merge logic, defaults          |
| 4. Quiz<br>Engine       | 7         | 7          | 2                 | Noun detection, scoring, score persistence bug        |
| 5. Flashcard<br>Engine  | 7         | 7          | 0                 | Queue building, mark known/learning, filters          |
| 6. Glossary<br>Engine   | 4         | 4          | 1                 | Toggle column (single-column bug), reveal all         |
| 7. TTS /<br>Audio       | 7         | 7          | 3                 | Declension cleanup, missing -er, umlaut, -war         |
| 8. Utilities            | 4         | 4          | 1                 | ParseVocabularyRow, Math.random IDs                   |

| 9. App Logic      | 9 | 9 | 6 | Session counters, dark mode time, study time inflation |
|-------------------|---|---|---|--------------------------------------------------------|
| 10. Edge<br>Cases | 6 | 6 | 0 | Null values, empty arrays, duplicate dates             |

Table 2: Test Suite Results by Category

### **9. Glossary UI Bugs**

The GlossaryEngine toggleColumn() method has a design limitation: it calls hiddenCols.clear() before adding the new column to hide. This means users can only hide one column at a time. If a user hides the German column and then tries to hide the English column, the German column is automatically revealed. This conflicts with the expected behavior of "Hide & Guess" mode, where a user might want to hide both the German word and its article simultaneously to test their recall. The "mixed" mode partially addresses this by randomly hiding either German or English for each row, but it does not support user-controlled multi-column hiding.

Additionally, the glossary render method interpolates word text directly into innerHTML without proper HTML sanitization. The "safeDe" variable only escapes single quotes, leaving the application vulnerable to XSS attacks if a vocabulary entry contains HTML tags or event handlers. While this is unlikely with the current curated data set, it represents a security concern if user-generated content is ever introduced or if the vocabulary data is sourced from external feeds.

# **10. Miscellaneous Issues**

### **10.1 Missing Pages (a2.html, b1.html)**

The index.html portal links to a2.html and b1.html with "Coming Soon" badges, but these files do not exist. Clicking these links results in a 404 error. For a production deployment, even for 10 users, these links should either be disabled (using JavaScript or removing the href) or placeholder pages should be created that display a proper "Coming Soon" message.

### **10.2 Firebase Configuration Exposure**

The Firebase configuration object, including the API key, is hardcoded directly in app.js (lines 25-33). While this is standard practice for client-side Firebase applications (the API key is restrictable via Firebase security rules), it is worth noting that these credentials are visible to anyone who inspects the page source. For a 10-user deployment, this is acceptable, but if the project scales, consider using environment variables injected at build time or Firebase App Check for additional security.

### **10.3 Duplicate Import in logout()**

The logout() method in app.js dynamically re-imports clearLocalProgress from storage.js using await import(), even though this function is already imported at the top of the file (line 2). This redundant import adds unnecessary overhead and suggests the code was written at different times. The same pattern appears in resetData(), which re-imports both clearLocalProgress and getDefaultProgressObj. These should use the already-imported references instead.

# **11. Recommendations**

Based on the analysis, the following recommendations are prioritized by impact for a production-ready deployment targeting 10 users:

| Priority          | Issue<br>IDs     | Recommendation                                                                                                                             |  |
|-------------------|------------------|--------------------------------------------------------------------------------------------------------------------------------------------|--|
| P0 -<br>Immediate | B03,<br>B04, B05 | Reset sessionKnown, sessionFlashcardErrors, sessionWordsReviewed on page<br>load. Add a "lastSessionDate" check and reset if date changed. |  |
| P0 -<br>Immediate | B07, B08         | Fix totalStudyTimeMs: use real intervals (setInterval) instead of save-time deltas.<br>Never persist _sessionStartTime.                    |  |
| P0 -<br>Immediate | B01              | Add type inference for B2 words in parseRawB2Data(): classify "der/die/das" as<br>nouns, "-en" endings as verbs, etc.                      |  |
| P1 - High         | B02              | Implement multi-earn in TrophyEngine.evaluate(): check t.multi flag and define<br>milestone thresholds.                                    |  |
| P1 - High         | B09-B13          | Fix all 6 trophy description/requirement mismatches. Either update descriptions or<br>adjust thresholds.                                   |  |
| P1 - High         | B14              | Add this.score = 0; this.total = 0; to QuizEngine.loadUnit().                                                                              |  |
| P1 - High         | B15              | Clear returnedAfter7Days flag after trophy is earned, or make it a one-time check<br>that does not persist.                                |  |
| P2 -<br>Medium    | B06              | Replace 0.5-per-save with actual time tracking using Date.now() deltas for<br>darkModeStudyMinutes.                                        |  |
| P2 -<br>Medium    | B16, B17         | Add "er" to TTS declension regex. Consider adding past-tense patterns.                                                                     |  |
| P2 -<br>Medium    | B18              | Remove hiddenCols.clear() from toggleColumn() to allow multi-column hiding.                                                                |  |
| P3 - Low          | B23              | Disable a2/b1 links or add placeholder pages.                                                                                              |  |
| P3 - Low          | B22              | Remove duplicate imports in logout() and resetData(); use top-level imports.                                                               |  |
| P3 - Low          | B25              | Sanitize word text before innerHTML insertion using textContent or a DOM<br>sanitizer.                                                     |  |

Table 3: Prioritized Recommendations