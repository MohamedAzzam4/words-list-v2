# Test Plan: Logout Data Leak

## Success Criteria
The fix is successful if:
1. Logging out completely clears the user's data from `localStorage` and RAM.
2. Logging in with a new account starts with zero progress.
3. Offline-first functionality remains unbroken for users who do not explicitly log out.

## Execution Steps

1. **Verify Core Bug Fix**
   - Action: Log in, mark 10 words, click "Sign Out".
   - Verify: `localStorage.getItem('german_app_progress_german-a1-app')` is null or default after page reload.

2. **Verify Cross-Account Isolation**
   - Action: Log out of Account A, log in with Account B.
   - Verify: Account B's dashboard shows 0 words.

3. **Verify Offline Capability**
   - Action: Turn off Wi-Fi, mark 5 words, close tab, reopen tab.
   - Verify: 5 words are still marked (app reads from localStorage without internet).

4. **Verify Reload Resilience**
   - Action: Rapidly refresh the page while logged in.
   - Verify: `beforeunload` event does not corrupt or erase existing data.

## Implementation Guidelines
- **Think before coding**: Document the exact logic of why the data leaks (e.g., `beforeunload` overriding `logout`).
- **Simplicity first**: Write the minimum code necessary to abort the save during logout (e.g., a simple flag).
- **Surgical changes**: Do not refactor the entire authentication or storage system.

Maintain a `TESTING_LOG.md` detailing the execution of the 4 steps above before marking the task complete.
