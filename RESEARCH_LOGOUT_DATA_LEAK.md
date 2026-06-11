# Research Report: Cross-Account Data Leak Analysis

## 1. Description of the Error
The user reported that after explicitly signing out of an account, their progress data (e.g., 257 known words) remains visible in the UI when they are signed out (in offline mode). Furthermore, if they sign in with a completely new Google account, the left-over offline data is merged into the new account's cloud profile, effectively leaking the first user's data into the second user's account.

## 2. Investigation of the Codebase
To find the root cause, I traced the exact sequence of events that occurs when a user clicks the "Sign Out" button.

### The Logout Sequence (`js/core/auth-service.js`)
When `logout()` is called, the following steps execute:
1. `await logout()`: Firebase successfully invalidates the user's session.
2. `clearLocalProgress(this.appId)`: The application correctly deletes the user's progress from `localStorage` to prevent data leaking.
3. `window.location.reload()`: The application triggers a page reload to reset the UI.

### The Hidden Unload Event (`js/core/app.js`)
When `window.location.reload()` is executed, the browser prepares to tear down the page. Before the page closes, it fires a `beforeunload` event. 

If we look at `js/core/app.js` (around line 486), there is a global event listener:
```javascript
// WP-008: Ensure pending data is saved when the page unloads
window.addEventListener('beforeunload', () => {
    if (window.app && window.app._save) {
        try { window.app._save(); } catch (e) { /* best effort */ }
    }
});
```

## 3. Previous Failed Fixes
Before discovering the hidden Unload event, we attempted two separate fixes to solve this data leak. Because of the race condition explained below, **neither of these fixes actually worked**. They did not introduce any new bugs, but they completely failed to solve the problem, meaning it's as if we did nothing at all.

1. **Restoring `clearLocalProgress()`**: We discovered that the `logout()` function was intentionally leaving data behind for offline usage. We added `clearLocalProgress(this.appId)` into the logout sequence to wipe the data. 
   - *Why it failed:* As explained below, the `beforeunload` event runs *after* this wipe and writes the data right back to the disk.

2. **UID Data Tagging**: We updated `localStorage` to stamp every save with the current user's UID. We added a check so that if User B logs in, the app checks the stamp, sees User A's UID, and discards the stale data.
   - *Why it failed:* When User B clicks "Sign In", they authenticate, and the page reloads. During that reload, the `beforeunload` event fires. Because the authentication just finished, the app's RAM now has User B's UID. The Unload event takes User A's massive 257-word array (which is still in RAM), stamps it with **User B's UID**, and saves it to the disk. The UID tagging system is completely bypassed.

## 4. The True Root Cause (The Race Condition)
The data leak happens because of a race condition between `logout()` and `beforeunload`. Here is exactly what happens in real-time:

1. **User clicks Sign Out**.
2. Local storage is correctly wiped clean.
3. The page reload is triggered.
4. **The `beforeunload` event fires.**
5. The `beforeunload` event calls `window.app._save()`. 
6. `_save()` looks at `state.data` in the computer's RAM memory. Because the page hasn't actually reloaded yet, the RAM memory *still contains all the user's data*.
7. `_save()` writes the data from RAM back into `localStorage`. 
8. The page finishes reloading. 

Because of this, the `clearLocalProgress` call is completely nullified. The data is written back to `localStorage` milliseconds before the page refreshes.

### How it infects the new account:
When the page loads, the user is signed out, so the app reads `localStorage` (which was just rewritten by the unload event) and displays the data in offline mode. 
When the user clicks "Sign In" with a new account, the app authenticates, updates the UID in RAM, and triggers *another* page reload. The `beforeunload` event fires again, this time saving the old data but tagging it with the **new account's UID**. Finally, when the page finishes loading, the app sees the old data tagged with the new UID, assumes it is valid offline work, and permanently syncs it to the new account's cloud.

## 5. Suggested Fixing Strategies

**Goal:** Prevent `beforeunload` from saving RAM data to disk during an explicit logout.

### Strategy A: Skip Save on Logout Flag (Recommended)
1. **[Step]** Modify `AuthService.logout()` to set a flag (e.g., `window._isLoggingOut = true`) before reloading.
   - *Verify:* Flag is exactly `true` when "Sign Out" is clicked.
2. **[Step]** Modify `beforeunload` listener in `app.js` to immediately return if `window._isLoggingOut` is true.
   - *Verify:* Data is not saved back to `localStorage` during the logout reload.

### Strategy B: Memory Wipe
1. **[Step]** Modify `AuthService.logout()` to set `this.state.data = getDefaultProgressObj();`.
   - *Verify:* RAM is cleared before the reload triggers.
2. **[Step]** Even if `beforeunload` fires, it saves empty defaults to `localStorage`.
   - *Verify:* `localStorage` contains empty defaults after logout.

Both strategies will permanently cure the data leak. Strategy A is technically safer as it prevents any accidental writes of corrupted RAM data during the critical logout transition.
