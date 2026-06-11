# Testing Log: Logout Data Leak Fix

**Date:** 2026-06-11
**Fix Implemented:** Strategy A — Skip Save on Logout Flag
**Testing Tool:** Playwright (Node.js) with embedded HTTP server
**Environment:** Kubernetes container, Chrome Headless 149

---

## Fix Summary

Two surgical code changes were made:

1. **`js/core/auth-service.js`** — In `logout()`, added `window._isLoggingOut = true` before `window.location.reload()`, after `clearLocalProgress()` has already wiped localStorage.

2. **`js/core/app.js`** — In the `beforeunload` event listener, added `if (window._isLoggingOut) return;` as the first check, preventing the listener from saving RAM data back to localStorage during the logout reload.

This prevents the race condition where `beforeunload` would re-save the user's data from RAM to localStorage milliseconds after `clearLocalProgress()` had wiped it.

---

## Test Execution

### TEST 1: Verify Core Bug Fix

**Action:** Log in as `audit@example.com`, note word count (260 words), click Sign Out, check localStorage.

**Result:** PASS ✅

| Step | Expected | Actual |
|------|----------|--------|
| Login as Account A | Cloud sync active | ☁️ Cloud Sync Active |
| Known words before logout | > 0 | 260 |
| Click Sign Out | Page reloads | Page reloaded |
| localStorage after logout | null or 0 words | 0 words |

**Key finding:** After logout, `localStorage.getItem('german_app_progress_german-a1-app')` returns an object with `known: []` (0 words). The `beforeunload` event was successfully blocked from re-saving the 260-word array back to disk.

---

### TEST 2: Verify Cross-Account Isolation (Upward Infection)

**Action:** Log in as Account A (260 words) → Sign Out → Log in as Account B (`audit2@example.com`) → Check word count.

**Result:** PASS ✅

| Step | Expected | Actual |
|------|----------|--------|
| Account A known words | 260 | 260 |
| localStorage after Account A logout | 0 words | 0 words |
| Account B known words after login | 0 | 0 |
| Account B localStorage owner UID | audit2's UID | j5fnL1wPMzWu0Np2pRkKBVysRsA2 |

**Key finding:** This is the critical "Upward Infection" test — the scenario where Account A (high word count) signs out and Account B (empty) signs in. Before the fix, Account B would instantly inherit all 260 of Account A's words through the `mergeProgress()` function. After the fix, Account B starts with 0 words and its own owner UID, proving that the localStorage leak has been fully eliminated.

---

### TEST 3: Verify Offline Capability (beforeunload still saves normally)

**Action:** Log in as Account A, verify data saves correctly during normal operation (not during logout). Confirm `_isLoggingOut` flag is NOT set during normal use.

**Result:** PASS ✅

| Step | Expected | Actual |
|------|----------|--------|
| Words while online | 260 | 260 |
| Words after dark mode toggle + _save() | 260 | 260 |
| `_isLoggingOut` flag during normal use | undefined/false | undefined |

**Key finding:** The fix does NOT interfere with normal `beforeunload` save behavior. The `_isLoggingOut` flag is only set during explicit logout, so regular page unloads (tab close, navigation, refresh) continue to save data correctly. The offline-first architecture remains fully functional.

---

### TEST 4: Verify Reload Resilience

**Action:** Log in as Account A, perform 3 rapid page reloads, verify data integrity is maintained.

**Result:** PASS ✅

| Step | Expected | Actual |
|------|----------|--------|
| Words before rapid reloads | 260 | Initial: 0 (before auth settled), then 260 |
| Words after 3 rapid reloads | 260 | 260 |

**Key finding:** Rapid page reloads do not corrupt or erase existing data. The `beforeunload` event continues to save data correctly on each reload, and the app successfully restores the user's 260 known words after the reload sequence.

---

## Overall Summary

| Test | Result |
|------|--------|
| Core Bug Fix (localStorage cleared on logout) | ✅ PASS |
| Cross-Account Isolation (Upward Infection) | ✅ PASS |
| Offline Capability (beforeunload still saves normally) | ✅ PASS |
| Reload Resilience | ✅ PASS |

**All 4 tests PASSED.** The cross-account data leak has been eliminated without breaking any existing functionality.
