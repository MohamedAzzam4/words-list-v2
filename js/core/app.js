// WP-030: app.js — thin orchestrator
// Wires services together; delegates to AuthService, NavigationService, StatsService, LeaderboardService

import { initFirebase, loginWithGoogle, logout, loadProgress, saveProgress, listenAuth, updateLeaderboard, getLeaderboard, batchSaveProgressAndLeaderboard } from './firebase.js?v=3';
import { getLocalProgress, saveLocalProgress, mergeProgress, clearLocalProgress, getDefaultProgressObj } from './storage.js?v=3';
import { GlossaryEngine } from './glossary.js?v=3';
import { FlashcardEngine } from './flashcards.js?v=3';
import { QuizEngine } from './quiz.js?v=3';
import { TrophyEngine } from './trophies.js?v=3';
import { speak, cleanTextForAudio, playChime } from './tts.js?v=3';
import { debounce } from './utils.js?v=3';
import { AuthService } from './auth-service.js?v=3';
import { NavigationService } from './nav-service.js?v=3';
import { StatsService } from './stats-service.js?v=3';
import { LeaderboardService } from './leaderboard-service.js?v=3';

// 1. Load Level Config
const level = document.querySelector('script[data-level]')?.dataset?.level || 'a1';
let levelConfig;
try {
    const configModule = await import(`../levels/${level}.config.js`);
    levelConfig = configModule.levelConfig;
    console.log(`✅ [${level.toUpperCase()}] Config loaded:`, levelConfig.levelTitle);
} catch (e) {
    console.error('❌ Failed to load level config:', e);
    alert('Error: Could not load vocabulary data. Check console.');
}

const appId = levelConfig?.appId || `german-${level}-app`;

// 2. Initialize Firebase (with graceful fallback)
let auth = null, db = null;
const firebaseConfig = {
    apiKey: "AIzaSyDqZ78cAPfbuD4cUBlAlfW7gqHlnvf7yfM",
    authDomain: "german-words-list-v2.firebaseapp.com",
    projectId: "german-words-list-v2",
    storageBucket: "german-words-list-v2.firebasestorage.app",
    messagingSenderId: "346436274259",
    appId: "1:346436274259:web:af9d60923bddda2a985ea6"
};

try {
    const firebaseInit = await initFirebase(firebaseConfig, appId);
    auth = firebaseInit.auth;
    db = firebaseInit.db;
    console.log('✅ Firebase initialized for appId:', appId);
} catch (e) {
    console.warn('⚠️ Firebase init failed (using offline mode):', e.message);
    auth = null;
    db = null;
}

// 3. App State (Initialize with defaults IMMEDIATELY)
const state = {
    uid: null,
    data: getLocalProgress(appId), // ← Always has data, even if null
    view: 'glossary',
    unit: 0
};

const engines = {
    glossary: null,
    flashcard: null,
    quiz: null,
    trophy: null
};

// ── Internal helpers (staying in orchestrator for shared state access) ──

function _showToast(msg) {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if (m) m.textContent = msg;
    if (t) {
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 4000);
    }
    playChime(600, 150);
    setTimeout(() => playChime(900, 150), 150);
}

function _applyTheme() {
    const isDark = state.data?.darkMode || false;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// WP-017: Accumulate elapsed dark mode time since last measurement
function _accumulateDarkModeTime() {
    if (state.data?.darkMode && window.app._darkModeStartTime) {
        const elapsed = (Date.now() - window.app._darkModeStartTime) / 60000; // minutes
        state.data.darkModeStudyMinutes = (state.data.darkModeStudyMinutes || 0) + elapsed;
        window.app._darkModeStartTime = Date.now(); // Reset for next interval
    }
}

function _save() {
    if (!state.data) state.data = getLocalProgress(appId);

    // WP-017: Accumulate dark mode time on each save
    _accumulateDarkModeTime();

    // WP-018: Accumate real elapsed study time
    if (window.app._lastSaveTime) {
        const elapsed = Date.now() - window.app._lastSaveTime;
        state.data.totalStudyTimeMs = (state.data.totalStudyTimeMs || 0) + elapsed;
    }
    window.app._lastSaveTime = Date.now();

    // ── Sync live engine state back to state.data before saving ──
    const knownSet = engines.flashcard?.knownIds || engines.glossary?.knownIds;
    const favSet = engines.flashcard?.favoritesIds || engines.glossary?.favoritesIds;

    if (knownSet) {
        state.data.known = Array.from(knownSet);
    }
    if (favSet) {
        state.data.favorites = Array.from(favSet);
    }
    if (engines.flashcard?.errors) {
        state.data.flashcardErrors = { ...engines.flashcard.errors };
    }
    if (engines.trophy?.trophyCounts) {
        state.data.trophyCounts = { ...engines.trophy.trophyCounts };
    }

    // WP-038: Prune studyDates to prevent unbounded growth (keep last 90)
    if (state.data.studyDates && state.data.studyDates.length > 90) {
        state.data.studyDates = [...new Set(state.data.studyDates)].sort().slice(-90);
    }

    const payload = {
        known: state.data.known || [],
        favorites: state.data.favorites || [],
        trophyCounts: state.data.trophyCounts || {},
        sessionsCompleted: state.data.sessionsCompleted || 0,
        sessionKnown: state.data.sessionKnown || 0,
        sessionFlashcardErrors: state.data.sessionFlashcardErrors || 0,
        sessionWordsReviewed: state.data.sessionWordsReviewed || 0,
        lastSessionDate: state.data.lastSessionDate || '',
        darkMode: state.data.darkMode || false,
        darkModeStudyMinutes: state.data.darkModeStudyMinutes || 0,
        totalStudyTimeMs: state.data.totalStudyTimeMs || 0,
        ttsCount: state.data.ttsCount || 0,
        columnHideCount: state.data.columnHideCount || 0,
        darkModeToggleCount: state.data.darkModeToggleCount || 0,
        flashcardErrors: state.data.flashcardErrors || {},
        studyDates: state.data.studyDates || [],
        migrationVersion: state.data.migrationVersion || 0,
        lastUpdated: new Date().toISOString()
    };

    // WP-011: Save to localStorage immediately, debounce Firestore writes
    // WP-019: Ensure _sessionStartTime and _lastSaveTime are NOT persisted
    const localPayload = { ...state.data, ...payload };
    delete localPayload._sessionStartTime;
    delete localPayload._lastSaveTime;
    saveLocalProgress(appId, localPayload);

    // Debounced remote save
    if (state.uid && auth) {
        _scheduleRemoteSave(payload);
    }
}

// WP-011: Debounced remote save — batches Firestore writes (WP-012: uses batch)
const _scheduleRemoteSave = debounce(function(payload) {
    if (state.uid && auth) {
        batchSaveProgressAndLeaderboard(appId, state.uid, payload, auth.currentUser?.displayName, auth.currentUser?.photoURL, payload.known.length)
            .then(() => {
                // WP-035: Reset failure counter on success
                window.app._consecutiveSaveFailures = 0;
            })
            .catch(e => {
                console.warn('Debounced batch save failed:', e);
                // WP-035: Track consecutive failures and show toast
                window.app._consecutiveSaveFailures = (window.app._consecutiveSaveFailures || 0) + 1;
                if (window.app._consecutiveSaveFailures >= 3) {
                    _showToast('⚠️ Cloud sync failed. Your progress is saved locally.');
                }
            });
    }
}, 3000);

// WP-011: Flush pending remote saves immediately (used by beforeunload)
function _flushRemoteSave() {
    if (state.uid && auth && state.data) {
        const knownSet = engines.flashcard?.knownIds || engines.glossary?.knownIds;
        const knownCount = knownSet ? knownSet.size : (state.data.known?.length || 0);
        saveProgress(appId, state.uid, state.data).catch(e => console.warn('Flush save failed:', e));
    }
}

// ── Trophy evaluation helper ──
async function _evaluateTrophies() {
    if (engines.trophy) {
        const allWords = levelConfig.vocabulary.flat();
        const earned = await engines.trophy.evaluate(state.data, allWords);
        if (earned && earned.length > 0) {
            _save();
            // WP-016: Clear returnedAfter7Days flag after "We're So Back" trophy is earned
            if (earned.some(t => t.id === 'were_so_back')) {
                state.data.returnedAfter7Days = false;
            }
        }
    }
}

// ── Instantiate Services ──
const authService = new AuthService({
    auth, state, appId, engines, levelConfig,
    onSave: () => _save(),
    showToast: (msg) => _showToast(msg)
});

const navService = new NavigationService({
    state, engines, levelConfig,
    onSave: () => _save(),
    onUpdateStats: () => statsService.updateStats(),
    onRenderUnitList: () => navService.renderUnitList()
});

const statsService = new StatsService({
    state, engines, levelConfig,
    onGetUnitProgress: (i) => navService._getUnitProgress(i),
    onResolveUnitLabel: (i) => navService._resolveUnitLabel(i)
});

const leaderboardService = new LeaderboardService({ state });

// ── Initialize Engines ──
let _enginesReady = false;

async function _initEngines() {
    if (_enginesReady) {
        console.log('ℹ️ Engines already initialized, skipping.');
        return;
    }
    if (!levelConfig?.vocabulary) {
        console.error('❌ No vocabulary data loaded!');
        return;
    }
    _enginesReady = true;

    // WP-014: Reset session counters on new day (matches "Words Studied Today" semantics)
    if (state.data) {
        const today = new Date().toISOString().split('T')[0];
        if ((state.data.lastSessionDate || '') !== today) {
            state.data.sessionKnown = 0;
            state.data.sessionFlashcardErrors = 0;
            state.data.sessionWordsReviewed = 0;
            // WP-039: Reset modesUsed on new session
            state.data.modesUsed = [];
            state.data.lastSessionDate = today;
            // Persist the reset immediately so it survives reload
            saveLocalProgress(appId, state.data);
        }
    }

    // WP-016: Detect 7+ day gap and set returnedAfter7Days flag
    if (state.data && !state.data.returnedAfter7Days) {
        const studyDates = state.data.studyDates || [];
        if (studyDates.length > 0) {
            const lastStudyDate = new Date(studyDates[studyDates.length - 1]);
            const now = new Date();
            const daysSinceLastStudy = Math.floor((now - lastStudyDate) / 86400000);
            if (daysSinceLastStudy >= 7) {
                state.data.returnedAfter7Days = true;
            }
        }
    }

    // WP-010: Migrate numeric word IDs to deterministic string IDs
    if (state.data && (state.data.migrationVersion || 0) < 1) {
        const allWords = levelConfig.vocabulary.flat();

        const oldIdToNewId = {};
        let globalIndex = 0;
        for (let u = 0; u < levelConfig.vocabulary.length; u++) {
            const unitWords = levelConfig.vocabulary[u];
            for (let w = 0; w < unitWords.length; w++) {
                oldIdToNewId[globalIndex] = unitWords[w].id;
                globalIndex++;
            }
        }

        for (let i = 0; i < globalIndex; i++) {
            oldIdToNewId[String(i)] = oldIdToNewId[i];
        }

        const oldKnown = [...(state.data.known || [])];
        const oldFavorites = [...(state.data.favorites || [])];
        const oldFlashcardErrors = { ...(state.data.flashcardErrors || {}) };

        const newKnown = [...new Set(oldKnown
            .map(oldId => oldIdToNewId[oldId] !== undefined ? oldIdToNewId[oldId] : oldId)
            .filter(id => id !== undefined))];

        const newFavorites = [...new Set(oldFavorites
            .map(oldId => oldIdToNewId[oldId] !== undefined ? oldIdToNewId[oldId] : oldId)
            .filter(id => id !== undefined))];

        const newFlashcardErrors = {};
        for (const [oldKey, value] of Object.entries(oldFlashcardErrors)) {
            const newKey = oldIdToNewId[oldKey] !== undefined ? oldIdToNewId[oldKey] : oldKey;
            newFlashcardErrors[newKey] = value;
        }

        // Create backups before modifying
        state.data._known_backup_v1 = oldKnown;
        state.data._favorites_backup_v1 = oldFavorites;
        state.data._flashcardErrors_backup_v1 = oldFlashcardErrors;

        // Apply migration
        state.data.known = newKnown;
        state.data.favorites = newFavorites;
        state.data.flashcardErrors = newFlashcardErrors;
        state.data.migrationVersion = 1;

        // Persist migrated data
        _save();
        console.log('[WP-010] Migration complete. Version set to 1.');
    }

    const words = levelConfig.vocabulary[state.unit] || [];
    const known = new Set(state.data?.known || []);
    const favorites = new Set(state.data?.favorites || []);

    engines.glossary = new GlossaryEngine('glossary-tbody', words, known, favorites, (t) => window.app.speakText(t));
    engines.flashcard = new FlashcardEngine(
        words, known, favorites, state.data?.flashcardErrors || {},
        () => _save(),
        () => {
            // onSessionComplete: safely increment session counter and record today's date
            if (!state.data) state.data = getLocalProgress(appId);
            state.data.sessionsCompleted = (state.data.sessionsCompleted || 0) + 1;
            const today = new Date().toISOString().split('T')[0];
            if (!state.data.studyDates) state.data.studyDates = [];
            if (!state.data.studyDates.includes(today)) {
                state.data.studyDates.push(today);
            }
        }
    );
    engines.quiz = new QuizEngine(words, (s, t) => {
        const el = document.getElementById('quiz-score');
        if (el) el.textContent = `Score: ${s} / ${t}`;
    });
    engines.trophy = new TrophyEngine('trophy-container', state.data || {}, appId, (msg) => _showToast(msg));

    navService.renderUnitList();
    statsService.updateStats();

    // Ensure the initial view is explicitly unhidden
    navService.switchView(state.view);

    // Also update the title
    navService._updateTitles(state.unit);

    // WP-001 + WP-002 + WP-003: Evaluate trophies on boot, using full level vocabulary
    await _evaluateTrophies();

    // WP-017: Initialize dark mode start time if currently active
    if (state.data?.darkMode) {
        window.app._darkModeStartTime = Date.now();
    }

    // WP-018: Initialize session time tracking
    window.app._lastSaveTime = Date.now();

    console.log(`✅ Engines initialized with ${words.length} words in Unit ${state.unit + 1}`);
}

// 4. Global App Object — thin delegating wrapper
window.app = {
    _enginesReady: false,
    _darkModeStartTime: null,
    _lastSaveTime: null,
    _consecutiveSaveFailures: 0,

    // ── AUTH ── (delegates to AuthService)
    loginWithGoogle: () => authService.loginWithGoogle(),
    openEmailAuthModal: () => authService.openEmailAuthModal(),
    closeEmailAuthModal: () => authService.closeEmailAuthModal(),
    toggleEmailAuthMode: () => authService.toggleEmailAuthMode(),
    handleEmailAuth: (e) => authService.handleEmailAuth(e),
    logout: () => authService.logout(),
    resetData: () => authService.resetData(),

    // ── NAVIGATION ── (delegates to NavigationService)
    switchView: (v) => {
        navService.switchView(v);
        if (v === 'leaderboard') leaderboardService.render();
    },
    switchMode: (m) => navService.switchMode(m),
    toggleSidebar: () => navService.toggleSidebar(),
    switchUnit: (i) => navService.switchUnit(i).then(() => _evaluateTrophies()),

    // ── LEADERBOARD ── (delegates to LeaderboardService)
    _renderLeaderboard: () => leaderboardService.render(),

    // ── THEME ──
    toggleDarkMode() {
        if (!state.data) state.data = getLocalProgress(appId);
        _accumulateDarkModeTime();
        state.data.darkMode = !state.data.darkMode;
        _applyTheme();
        state.data.darkModeToggleCount = (state.data.darkModeToggleCount || 0) + 1;
        if (state.data.darkMode) {
            this._darkModeStartTime = Date.now();
        } else {
            this._darkModeStartTime = null;
        }
        _save();
    },

    // ── GLOSSARY ──
    setTypeFilter(v) { engines.glossary?.setFilter(v); },
    hideTableColumn(col) {
        engines.glossary?.toggleColumn(col);
        state.data.columnHideCount = (state.data.columnHideCount || 0) + 1;
        _save();
    },
    revealAllTable() { engines.glossary?.revealAll(); },
    playUnitAudio() { engines.glossary?.speakAll(); },
    speakText(t) {
        speak(cleanTextForAudio(t));
        state.data.ttsCount = (state.data.ttsCount || 0) + 1;
        _save();
    },

    // ── FLASHCARDS ──
    flipCard() { engines.flashcard?.flip(); },
    speakCurrentCard() { engines.flashcard?.speak(); },
    async markCard(known) {
        engines.flashcard?.mark(known);
        // WP-022: Record study date on every flashcard interaction
        if (!state.data.studyDates) state.data.studyDates = [];
        const today = new Date().toISOString().split('T')[0];
        if (!state.data.studyDates.includes(today)) {
            state.data.studyDates.push(today);
        }
        _save();
        statsService.updateStats();
        navService.renderUnitList();
        await _evaluateTrophies();
    },
    async toggleFavorite(id) {
        if (engines.flashcard && engines.flashcard.favoritesIds) {
            if (engines.flashcard.favoritesIds.has(id)) {
                engines.flashcard.favoritesIds.delete(id);
            } else {
                engines.flashcard.favoritesIds.add(id);
            }
        }
        if (state.view === 'glossary' && engines.glossary) engines.glossary.render();
        if (state.view === 'flashcard' && engines.flashcard) engines.flashcard.render();
        _save();
        await _evaluateTrophies();
    },
    nextCard() { engines.flashcard?.next(); },
    prevCard() { engines.flashcard?.prev(); },
    toggleShuffle() { engines.flashcard?.toggleShuffle(); },
    setReviewFilter(f) { engines.flashcard?.setFilter(f); },
    setCardFace(f) { engines.flashcard?.setFace(f); },

    // ── QUIZ ──
    async checkArticleAnswer(a, btn) {
        engines.quiz?.answer(a, btn);
        _save();
        await _evaluateTrophies();
    },

    // ── INTERNAL (exposed for backward compatibility) ──
    _save,
    _showToast,
    _applyTheme,
    _initEngines,
    _renderAuthUI: () => authService.renderAuthUI(),
    _renderUnitList: () => navService.renderUnitList(),
    _updateStats: () => statsService.updateStats(),
    _flushRemoteSave
};

// WP-008: Ensure pending data is saved when the page unloads
window.addEventListener('beforeunload', () => {
    if (window.app && window.app._save) {
        try { window.app._save(); } catch (e) { /* best effort */ }
    }
    if (window.app && window.app._flushRemoteSave) {
        try { window.app._flushRemoteSave(); } catch (e) { /* best effort */ }
    }
});

// 5. Boot Sequence
if (auth) {
    listenAuth(u => {
        authService._onAuth(u, [
            () => _applyTheme(),
            () => authService.renderAuthUI(),
            () => _initEngines(),
            () => {
                // Immediately auto-publish progress to the server on load
                if (state.uid && auth) {
                    updateLeaderboard(appId, state.uid, auth.currentUser?.displayName, auth.currentUser?.photoURL, state.data?.known?.length || 0).then(() => {
                        if (state.view === 'leaderboard') leaderboardService.render();
                    });
                }
            }
        ]);
    });
} else {
    console.log('⚠️ Running in offline mode (no Firebase)');
    // Initialize immediately without auth
    authService._onAuth(null, [
        () => _applyTheme(),
        () => authService.renderAuthUI(),
        () => _initEngines()
    ]);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded.');
    if (!state.data) state.data = getLocalProgress(appId);
    _applyTheme();
    if (!auth && !_enginesReady) {
        authService.renderAuthUI();
        _initEngines();
    }
});
