# Research: Logout Data Leak

## 1. Bug Description
- **Symptom:** Progress data remains visible after logout.
- **Symptom:** Progress data leaks into new accounts upon sign-in.
- **Context:** The leak persists despite previous attempts to clear `localStorage` during logout and tag data with UIDs.

## 2. Root Cause (The Race Condition)
The issue is a race condition between `AuthService.logout()` and the browser's `beforeunload` event.

1. **Logout Wipe:** User clicks "Sign Out". `clearLocalProgress()` correctly deletes `localStorage`.
2. **Reload Triggered:** The app calls `window.location.reload()`.
3. **Unload Save:** The `beforeunload` listener in `app.js` catches the reload and triggers `window.app._save()`.
4. **Data Resurrection:** `_save()` reads `state.data` from RAM (which still contains the user's progress) and writes it back to `localStorage`.
5. **Leak:** The next user signs in, and the abandoned `localStorage` data is merged into their account.

## 3. Previous Failed Fixes
- **Attempt 1 (Restore `clearLocalProgress`):** Failed because `beforeunload` runs *after* the wipe.
- **Attempt 2 (UID Tagging):** Failed because the `beforeunload` event fires during the post-login reload, stamping the stale RAM data with the *new user's UID* and bypassing the tagging safeguards.

## 4. Fix Plan

**Goal:** Prevent `beforeunload` from saving RAM data to disk during an explicit logout.

**Execution Steps:**
1. **Set Logout Flag** 
   - Modify `AuthService.logout()` to set a flag (e.g., `window._isLoggingOut = true`).
   - verify: Flag is `true` exactly when "Sign Out" is clicked.
2. **Abort Unload Save**
   - Modify `beforeunload` listener in `app.js` to abort if `window._isLoggingOut` is true.
   - verify: Data is not saved back to `localStorage` during the logout reload.
3. **Verify Data Cleared**
   - Execute the steps in `TESTPLAN_LOGOUT_DATA_LEAK.md`.
   - verify: `localStorage` remains empty after logout reload.
