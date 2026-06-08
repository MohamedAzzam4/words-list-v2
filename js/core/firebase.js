import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, writeBatch } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let auth, db;

export const initFirebase = (config, appId) => {
    // Initialize default app so Firebase Auth is shared seamlessly across the entire domain.
    // (Passing appId here partitions the Auth databases, breaking cross-level login)
    const app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    return { auth, db };
};


export const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
};

export const loginWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmailAndPassword = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
};

export const logout = () => signOut(auth);

export const getProgressDocRef = (appId, uid) =>
    doc(db, `artifacts/${appId}/users/${uid}/progress/main`);

export const loadProgress = async (appId, uid) => {
    try {
        const ref = getProgressDocRef(appId, uid);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    } catch (e) {
        console.warn('Firebase load failed:', e);
        return null;
    }
};

export const saveProgress = async (appId, uid, data) => {
    try {
        const ref = getProgressDocRef(appId, uid);
        // { merge: true } preserves existing fields and enables offline sync
        await setDoc(ref, { ...data, lastUpdated: new Date().toISOString() }, { merge: true });
    } catch (e) {
        console.warn('Firebase save failed:', e);
    }
};

export const listenAuth = (callback) =>
    onAuthStateChanged(auth, callback);


// WP-033: Dynamic level detection from appId
function getLevelKey(appId) {
    // Extract level from appId like 'german-a1-app' → 'a1', 'german-b2-app' → 'b2'
    const match = appId.match(/german-([a-z0-9]+)-app/i);
    return match ? match[1].toLowerCase() : appId;
}

// WP-012: Batch progress and leaderboard writes into a single Firestore batch
export const batchSaveProgressAndLeaderboard = async (appId, uid, progressData, displayName, photoURL, knownCount) => {
    try {
        const batch = writeBatch(db);

        // Progress document
        const progressRef = doc(db, `artifacts/${appId}/users/${uid}/progress/main`);
        batch.set(progressRef, { ...progressData, lastUpdated: new Date().toISOString() }, { merge: true });

        // Leaderboard document — WP-033: dynamic levels map
        const leaderboardRef = doc(db, `leaderboard/${uid}`);
        const levelKey = getLevelKey(appId);
        batch.set(leaderboardRef, {
            displayName: displayName || "Anonymous Linguist",
            photoURL: photoURL || "",
            levels: { [levelKey]: knownCount },
            lastActive: new Date().toISOString()
        }, { merge: true });

        await batch.commit();
    } catch (e) {
        console.warn('Batch save failed:', e);
        // Fallback: try individual writes
        try { await saveProgress(appId, uid, progressData); } catch (e2) { /* ignore */ }
    }
};

// ── LEADERBOARD SERVICES ──
// WP-013: Removed getDoc read — now uses setDoc with merge:true (no read-before-write)
// WP-033: Dynamic level map instead of hardcoded a1Count/b2Count
export const updateLeaderboard = async (appId, uid, displayName, photoURL, knownCount) => {
    try {
        const ref = doc(db, `leaderboard/${uid}`);
        const levelKey = getLevelKey(appId);
        
        await setDoc(ref, {
            displayName: displayName || "Anonymous Linguist",
            photoURL: photoURL || "",
            levels: { [levelKey]: knownCount },
            lastActive: new Date().toISOString()
        }, { merge: true });
    } catch(e) {
        console.warn("Leaderboard update failed", e);
    }
};

// WP-033: Compute totalWords from dynamic levels map (backward-compatible with old a1Count/b2Count)
function computeTotalWords(data) {
    let total = 0;
    // New format: levels map
    if (data.levels && typeof data.levels === 'object') {
        for (const val of Object.values(data.levels)) {
            total += (typeof val === 'number' ? val : 0);
        }
    }
    // Backward-compatible: old a1Count/b2Count fields
    if (data.a1Count) total += data.a1Count;
    if (data.b2Count) total += data.b2Count;
    // Avoid double-counting if both formats exist
    if (data.levels && (data.a1Count || data.b2Count)) {
        // Prefer new format, ignore old fields
        total = 0;
        for (const val of Object.values(data.levels)) {
            total += (typeof val === 'number' ? val : 0);
        }
    }
    return total;
}

export const getLeaderboard = async () => {
    try {
        const q = query(collection(db, "leaderboard"), orderBy("lastActive", "desc"), limit(50));
        const qs = await getDocs(q);
        const entries = qs.docs.map(d => {
            const data = d.data();
            const totalWords = computeTotalWords(data);
            return { ...data, totalWords, uid: d.id };
        });
        // Sort by totalWords descending
        entries.sort((a, b) => b.totalWords - a.totalWords);
        return entries.map((d, index) => ({ ...d, rank: index + 1 }));
    } catch(e) {
        console.warn("Leaderboard fetch failed", e);
        return [];
    }
};