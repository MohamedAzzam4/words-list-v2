# Execution Prompts for Small Context Models (Gemini Flash)

Small context window models (like Gemini Flash) often fail when given a massive task because they "lose" the context of the larger goal, skip steps, or hallucinate code without searching first.

To force a small model to execute the `TESTPLAN_WORD_COUNT.md` perfectly without forgetting details, you must **feed it the plan one phase at a time** and **force it to use "Chain of Thought" reasoning**.

Here is a sequence of copy-pasteable prompts you can feed to the model, one by one.

---

### Phase 1: Local Storage & Migration Tests
**Prompt to send the model:**
```text
You are executing Phase 1 of a Test Plan to find a word-counting bug in a vanilla JS app. 
CRITICAL RULES:
1. Do not assume how the code works. You must search for and read the actual code first.
2. Write your thoughts and planned steps before writing any code.
3. You must use a Node.js script or Playwright to test the logic.

TASK: Test the "numeric to string ID" migration logic and LocalStorage isolation.
1. Read `js/core/app.js`, specifically the `_initEngines()` function where migration happens (`migrationVersion`).
2. Create a test script named `test_phase1.js` that mimics the `_initEngines()` migration logic.
3. Assert what happens if the local `known` array contains `[0, 1, 2]` before migration. Does it duplicate? What if the migration runs twice?
4. Run the script and report your findings. Do not move on to Phase 2 until this is complete.
```

---

### Phase 2: Firebase Sync & Merge Logic
**Prompt to send the model:**
```text
Excellent. Now we move to Phase 2.
We need to test if the cloud synchronization is duplicating data instead of merging it.

TASK: Test `mergeProgress()` logic.
1. Read `js/core/auth-service.js`, specifically the `mergeProgress(local, remote)` function.
2. Read `js/core/firebase.js` to see how `loadProgress` works.
3. Create a test script named `test_phase2.js`. 
4. In your script, define a mock `localState` where `known = ["1-0"]`. Define a mock `remoteState` where `known = ["1-0", "1-1"]`.
5. Run the `mergeProgress()` logic on these two arrays.
6. Check the length of the resulting `known` array. Is it 2 (correct) or 3 (duplicate "1-0" bug)?
7. Print the results to the console and summarize the exact line of code causing the bug, if any.
```

---

### Phase 3: Dashboard & StatsService Math
**Prompt to send the model:**
```text
Moving to Phase 3. We need to check if the Dashboard UI is calculating the word count correctly.

TASK: Test `StatsService` math.
1. Read `js/core/stats-service.js`, specifically the `updateStats()` function.
2. Look at how it calculates `knownCount`. Does it use `engines.flashcard.knownIds.size` or `state.data.known.length`?
3. Create `test_phase3.js`.
4. Mock a state where `state.data.known` has 30 items, but `engines.flashcard.knownIds` is undefined. What happens?
5. Write an assertion to test if the percentage completion math `Math.round((knownCount / all.length) * 100)` throws a NaN error if `all.length` is 0.
6. Run the script and report if the math logic is safe or if it contributes to the 257-word glitch.
```

---

### Phase 4: Leaderboard Double-Counting (The Core Suspect)
**Prompt to send the model:**
```text
Moving to Phase 4. The user has 257 words on the Dashboard, but 266 on the Leaderboard. This indicates a double-counting bug in the leaderboard calculation.

TASK: Test `computeTotalWords()` logic.
1. Read `js/core/firebase.js` and locate the `computeTotalWords(data)` function.
2. Read `js/core/leaderboard-service.js` to see how it renders the total.
3. Create `test_phase4.js`.
4. Pass the following mock Firestore data into `computeTotalWords()`: 
   `const data = { a1Count: 9, levels: { a1: 257 } };`
5. Assert the output. Does it return 257 (correct), or 266 (buggy double-count)?
6. If it returns 266, rewrite the `computeTotalWords()` function to correctly ignore `a1Count` if the `levels` map exists. Show me the fixed function.
```

---

### Phase 5: Trophy Gamification Impact
**Prompt to send the model:**
```text
Phase 5. We must ensure the inflated word count didn't permanently corrupt the trophy system.

TASK: Test `trophies.js` evaluation logic.
1. Read `js/core/trophies.js`. Look at the `vocab_vault` (100 words) and `a1_conqueror` requirements.
2. Read `js/core/app.js` or wherever `evaluate()` is called.
3. Create `test_phase5.js`.
4. Simulate a user whose `known` array artificially spikes to 257 words, triggering the `vocab_vault` trophy. 
5. Then, simulate the bug being fixed, dropping their array back to 30 words.
6. Run `evaluate()` again. Does the trophy shelf crash? Do they lose the trophy? (Expected: Trophies cannot be lost once earned).
7. Report the behavior.
```

---

### Phase 6: E2E Reproduction & Final Report
**Prompt to send the model:**
```text
Final Phase. We need to write an automated script to try and break the app in real-time.

TASK: Write an End-to-End stress test.
1. Using Playwright (or basic JS fetch calls if testing APIs), write a script `test_phase6.js` that opens the app (or mocks it).
2. Write a loop that calls `markCard(true)` 100 times in 1 second.
3. Write a loop that switches between `Unit 1` and `Unit 2` 50 times very rapidly.
4. Check if `state.data.known.length` artificially inflates due to race conditions.
5. Provide a final summary of all bugs found across all 6 phases, and output a patch/diff to fix them.
```
