# Test Plan & Fixing Directives: Logout Data Leak

## 🤖 AI SYSTEM PROMPT
**To the AI Agent reading this document:**
You have been assigned to permanently fix a Cross-Account Data Leak occurring during the `logout()` and `beforeunload` events in this repository. 
While this document outlines a foundational testing strategy, you must not limit yourself to only these tests. **Your first directive is to brainstorm and expand upon this testing plan.** Think of edge cases, race conditions, offline-to-online transitions, and potential failure paths that are not explicitly stated here. Write out a comprehensive, detailed testing plan for yourself before you begin coding. 

## 1. General Test Scenarios to Cover
When building your expanded test plan, ensure you cover at minimum:

- **Scenario A (The Core Bug):** User A logs in, marks 10 words, and clicks "Sign Out". Ensure `localStorage` is completely wiped and remains wiped *after* the page reloads.
- **Scenario B (New Account Contamination):** After User A logs out, User B logs in. Ensure User B's account is completely empty and does not inherit User A's 10 words.
- **Scenario C (Offline Functionality Check):** The user closes the tab (without clicking Sign Out), turns off internet, and reopens the tab. Ensure their data is still there and they can continue studying.
- **Scenario D (Rapid Reloads):** The user spam-refreshes the page. Ensure the `beforeunload` event does not accidentally inject empty or corrupted data into the storage.

## 2. Iteration and Constraint Directives
- **Constraint 1 (No Side Effects):** Your primary directive is that your fix MUST NOT break the offline-first capability. Users must still be able to study offline if they did not explicitly log out.
- **Constraint 2 (Iterative Fixing):** Do not expect your first fix to work perfectly. You must test your fix rigorously. If it fails, iterate, adjust your strategy, and try again. 

## 3. Mandatory Testing Log Structure
To ensure absolute transparency and to prevent lazy reporting (e.g., "I made the fix and it worked"), you are **REQUIRED** to maintain a structured log file in the `skills` directory named `TESTING_LOG.md`. 

Every single fix attempt and test run must be documented using the following exact structure:

```markdown
### Iteration [X]
- **Target File(s):** [What files did you edit?]
- **What the fix actually did:** [Explain the logic of your code change]
- **Tests Conducted:** [List the exact scripts or manual tests you ran to verify this iteration]
- **Findings / Results:** [What happened? Did the array duplicate? Did the local storage clear? Paste console outputs here.]
- **Next Steps:** [If failed, what is the new hypothesis? If passed, state that you are moving to Smoke Testing.]
```

## 4. Final Smoke Tests
After you have successfully fixed the bug and verified it using your detailed testing plan, you must perform a final suite of **Smoke Tests** to confirm that the entire platform is stable and that no unintended side-effects were introduced.

Smoke tests must verify:
- The app boots without console errors.
- A user can log in and log out successfully.
- The flashcard engine can be opened, and progress updates accurately.
- Cloud sync indicator correctly shows "Local Mode" when offline and "Cloud Sync Active" when online.
