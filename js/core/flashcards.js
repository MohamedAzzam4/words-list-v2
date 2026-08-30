import { calculateNextReview, getLocalDateString } from './srs-logic.js?v=3';
import { renderCardAffordances, renderCardFront, renderExampleBlock, renderSharedCard } from './shared-card.js';
import { sanitize } from './utils.js?v=3';

function formatTimeRemaining(nextReviewDateStr) {
    if (!nextReviewDateStr) return 'New Card';

    // Support legacy "YYYY-MM-DD" local date strings by appending midnight time if missing
    const nextDateStr = nextReviewDateStr.includes('T') ? nextReviewDateStr : nextReviewDateStr + 'T00:00:00';
    const nextDate = new Date(nextDateStr);
    const now = new Date();

    const diffMs = nextDate - now;
    if (diffMs <= 0) return 'Due now';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours <= 0) {
        return 'in < 1 hour';
    }
    if (diffHours < 24) {
        return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    }

    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;

    if (hours === 0) {
        return `in ${days} day${days === 1 ? '' : 's'}`;
    }

    return `in ${days} day${days === 1 ? '' : 's'} and ${hours} hour${hours === 1 ? '' : 's'}`;
}

// SHARED-CARD-003 — the FIRST structured example only (LF-CARD): additional
// examples stay in the glossary/autoplay experiences, and cards without
// examples yield null so no stale or fake example is ever rendered.
export function firstExample(word) {
    if (!word || !Array.isArray(word.examples) || word.examples.length === 0) return null;
    return word.examples[0] || null;
}

// Direction + language metadata for a display translation (LF-CARD; the
// SC2-C1-DESIGN-001 language rules applied to ordinary level cards): English
// reads LTR with its language tag, Arabic reads RTL, and mixed or unknown
// content falls back to the browser's automatic direction and never carries a
// single-language label — Arabic or mixed text is never labeled English.
export function translationDisplayAttrs(language) {
    if (language === 'en' || language === 'de') return { dir: 'ltr', lang: language };
    if (language === 'ar') return { dir: 'rtl', lang: 'ar' };
    return { dir: 'auto', lang: null };
}

export class FlashcardEngine {
    constructor(words, knownIds, favoritesIds, errors, srsData, onSave, onSessionComplete, source = 'words') {
        this.words = words || [];
        this.knownIds = knownIds || new Set();
        this.favoritesIds = favoritesIds || new Set();
        this.errors = errors || {};
        this.srsData = srsData || {};
        this.onSave = onSave || (() => { });
        this.onSessionComplete = onSessionComplete || (() => { });
        this.queue = [];
        this.index = 0;
        this.flipped = false;
        this.face = 'de'; // 'de' or 'en'
        this.filter = 'all'; // 'all' or 'learning'
        this.shuffle = true;
        this.isFinished = false;
        // Explicit card-source boundary (SHARED-CARD-003): 'words' renders
        // through the shared card presentation; 'phrases' keeps the legacy
        // flashcard markup. NavigationService always passes the source — the
        // card type is never inferred from incidental object fields.
        this.source = source;
        this._legacyCardHtml = null; // snapshot of the static phrase-card markup
        this._buildQueue();
        // The shared-card event delegation binds to the level page mount once.
        // Unit tests run the engine in a DOM-less VM sandbox.
        if (typeof document !== 'undefined') {
            this._bindSharedCardEvents();
        }
    }

    loadUnit(newWords, newKnownIds = null, newFavoritesIds = null, newErrors = null, newSrsData = null, source = null) {
        this.words = newWords || [];
        if (newKnownIds !== null) this.knownIds = newKnownIds;
        if (newFavoritesIds !== null) this.favoritesIds = newFavoritesIds;
        if (newErrors !== null) this.errors = newErrors;
        if (newSrsData !== null) this.srsData = newSrsData;
        if (source !== null) this.source = source;
        this._buildQueue();
        this.index = 0;
        this.flipped = false;
        this.render();
    }

    _buildQueue() {
        if (this.filter === 'learning') {
            const todayIso = new Date().toISOString();

            // Due cards: srsData exists, level > 0 and < 6, nextReviewDate <= todayIso
            const dueCards = this.words.filter(w => {
                const srs = this.srsData[w.id];
                return srs && srs.level > 0 && srs.level < 6 && srs.nextReviewDate <= todayIso;
            });

            // New cards: no srsData or level 0
            const newCards = this.words.filter(w => {
                const srs = this.srsData[w.id];
                return !srs || srs.level === 0;
            });

            let finalDue = [...dueCards];
            let finalNew = [...newCards];

            if (this.shuffle) {
                finalDue.sort(() => Math.random() - 0.5);
                finalNew.sort(() => Math.random() - 0.5);
            }

            const combined = [...finalDue, ...finalNew];
            this.queue = combined.slice(0, 20);
        } else if (this.filter === 'favorites') {
            this.queue = this.words.filter(w => this.favoritesIds.has(w.id));
            if (this.shuffle) this.queue.sort(() => Math.random() - 0.5);
        } else {
            this.queue = [...this.words];
            if (this.shuffle) this.queue.sort(() => Math.random() - 0.5);
        }
    }

    setFilter(f) { this.filter = f; this.isFinished = false; this._buildQueue(); this.index = 0; this.flipped = false; this.render(); }

    setFace(f) { this.face = f; this.flipped = false; this.render(); }

    toggleShuffle() { this.shuffle = !this.shuffle; this.isFinished = false; this._buildQueue(); this.index = 0; this.flipped = false; this.render(); }

    flip() {
        this.flipped = !this.flipped;
        if (this.source === 'words') {
            const card = document.querySelector('#fc-card-mount .verb-flashcard');
            if (card) {
                card.classList.toggle('flipped', this.flipped);
                // Inactive-face isolation (SC2-C1-A11Y-002): only the
                // displayed face stays keyboard-focusable and exposed to
                // assistive technology. The flip stays a surgical class
                // toggle so keyboard focus on the card survives.
                const frontFace = card.querySelector('.verb-card-front');
                const backFace = card.querySelector('.verb-card-back');
                if (frontFace) frontFace.toggleAttribute('inert', this.flipped);
                if (backFace) backFace.toggleAttribute('inert', !this.flipped);
                // Lazy revealed back (LF-CARD secrecy): the answer markup
                // exists only while the card shows its answer side; flipping
                // back removes it again.
                if (backFace) {
                    const w = this.queue[this.index];
                    backFace.innerHTML = (this.flipped && w) ? this._buildWordsBackHtml(w) : '';
                }
            }
        } else {
            const card = document.getElementById('active-flashcard');
            if (card) card.classList.toggle('flipped');
        }
    }

    speak() {
        const w = this.queue[this.index];
        if (!w) return;

        const isDeVisible = (this.face === 'de' && !this.flipped) || (this.face === 'en' && this.flipped);
        if (isDeVisible) {
            window.app.speakText(w.de, 'de');
        } else {
            const hasNormalizedSpeech = w.speechText && w.translations;
            const englishText = hasNormalizedSpeech ? w.speechText.en : (w.en || w.de);
            if (englishText) window.app.speakText(englishText, 'en');
        }
    }

    mark(known) {
        const w = this.queue[this.index];
        if (!w) return;

        const nowIso = new Date().toISOString();
        const srs = this.srsData[w.id];

        const isDue = !srs || srs.level === 0 || srs.nextReviewDate <= nowIso;
        const currentLevel = srs ? srs.level : 0;

        const result = calculateNextReview(currentLevel, isDue, known, nowIso);

        this.srsData[w.id] = {
            level: result.level,
            nextReviewDate: result.nextReviewDate,
            lastReviewed: Date.now()
        };

        if (known) {
            if (result.level >= 1) {
                this.knownIds.add(w.id);
            }
        } else {
            this.errors[w.id] = (this.errors[w.id] || 0) + 1;
            this.queue.push(w);
        }

        this.onSave();
        this.next();
    }

    next() {
        if (this.index < this.queue.length - 1) {
            this.index++;
            this._resetFlipAndRender();
        } else {
            // Session complete — notify app.js to increment sessionsCompleted
            this.onSessionComplete();
            this.onSave();
            this.isFinished = true;
            this.render();
        }
    }

    restart() {
        this.isFinished = false;
        this._buildQueue();
        this.index = 0;
        this.flipped = false;
        this.render();
    }

    _resetFlipAndRender() {
        if (this.source === 'words') {
            // A fresh shared card renders unflipped; replacing the mount
            // markup means no flip-back animation needs suppressing.
            this.flipped = false;
            this.render();
            return;
        }
        const inner = document.querySelector('.flashcard-inner');
        if (inner && this.flipped) {
            inner.classList.add('no-transition');
            this.flipped = false;
            this.render();
            // Force reflow
            void inner.offsetWidth;
            requestAnimationFrame(() => {
                inner.classList.remove('no-transition');
            });
        } else {
            this.flipped = false;
            this.render();
        }
    }

    prev() {
        if (this.index > 0) {
            this.index--;
            this.flipped = false;
            this.render();
        }
    }

    render() {
        const working = document.getElementById('fc-working-area');
        const empty = document.getElementById('fc-empty-state');
        const finished = document.getElementById('fc-finished-state');
        const q = this.queue;

        // Hide all states first
        if (working) working.classList.add('hidden');
        if (empty) empty.classList.add('hidden');
        if (finished) finished.classList.add('hidden');

        if (this.isFinished) {
            if (finished) finished.classList.remove('hidden');
            return;
        }

        if (q.length === 0) {
            const emptyTitle = document.getElementById('fc-empty-title');
            const emptyDesc = document.getElementById('fc-empty-desc');
            if (emptyTitle && emptyDesc) {
                if (this.filter === 'learning') {
                    emptyTitle.textContent = "You're all caught up!";
                    emptyDesc.textContent = 'You have no more cards due for review right now. Switch to "All Words" to study ahead of time.';
                } else if (this.filter === 'favorites') {
                    emptyTitle.textContent = "No favorites yet!";
                    emptyDesc.textContent = 'Star some words while reviewing to add them to your favorites queue.';
                } else {
                    emptyTitle.textContent = "No words found!";
                    emptyDesc.textContent = 'There are no words available in this unit.';
                }
            }
            if (empty) empty.classList.remove('hidden');
            return;
        }

        if (working) working.classList.remove('hidden');

        const w = q[this.index];
        if (!w) return;

        if (this.source === 'words') {
            this._renderWordsCard(w);
        } else {
            this._renderLegacyCard(w);
        }

        // Shared chrome below the card: current-card counter plus the filter,
        // face and shuffle controls (owned by the level page, shared by both
        // card sources).
        const counterEl = document.getElementById('fc-counter');
        const filterAllBtn = document.getElementById('filter-all-btn');
        const filterLearnBtn = document.getElementById('filter-learning-btn');
        const filterFavBtn = document.getElementById('filter-favorites-btn');
        const faceDeBtn = document.getElementById('face-de-btn');
        const faceEnBtn = document.getElementById('face-en-btn');
        const shuffleBtn = document.getElementById('shuffle-btn');

        if (counterEl) counterEl.textContent = `${this.index + 1} / ${q.length}`;
        if (filterAllBtn) filterAllBtn.classList.toggle('primary', this.filter === 'all');
        if (filterLearnBtn) filterLearnBtn.classList.toggle('primary', this.filter === 'learning');
        if (filterFavBtn) filterFavBtn.classList.toggle('primary', this.filter === 'favorites');
        if (faceDeBtn) faceDeBtn.classList.toggle('primary', this.face === 'de');
        if (faceEnBtn) faceEnBtn.classList.toggle('primary', this.face === 'en');
        if (shuffleBtn) shuffleBtn.textContent = `🔀 Shuffle: ${this.shuffle ? 'ON' : 'OFF'}`;
    }

    // ── SHARED-CARD-003: ordinary vocabulary through the shared renderer ──

    // The mount holds exactly ONE card at a time: the shared card for the
    // words source, the untouched static legacy card for phrases. The legacy
    // markup is snapshotted before the first replacement so phrase mode can
    // restore it verbatim (its controls are inline handlers).
    _renderWordsCard(w) {
        const mount = document.getElementById('fc-card-mount');
        if (!mount) return;
        if (this._legacyCardHtml === null) {
            this._legacyCardHtml = mount.innerHTML;
        }
        mount.innerHTML = renderSharedCard({
            mode: 'ordinary',
            flippable: true,
            flipped: this.flipped,
            ariaLabel: 'Vocabulary flashcard: activate to flip',
            frontHtml: this._buildWordsFrontHtml(w),
            // Answer-bearing markup exists only while the card is flipped
            // (LF-CARD secrecy / AC-06).
            backHtml: this.flipped ? this._buildWordsBackHtml(w) : '',
            actionsHtml: ''
        });
        // Compatibility alias: the shared flip surface is the active
        // flashcard (kept for existing callers and tests).
        const flipSurface = mount.querySelector('.verb-flashcard');
        if (flipSurface) flipSurface.id = 'active-flashcard';
    }

    _buildWordsFrontHtml(w) {
        const isFav = this.favoritesIds.has(w.id);
        const affordancesHtml = renderCardAffordances({
            // Face-aware audio: the action pronounces the visible side only,
            // so it can never speak the hidden answer (LF-CARD secrecy).
            speak: { title: 'Speak word' },
            favorite: { active: isFav }
        });
        const termHtml = this.face === 'de' ? this._germanTermHtml(w) : this._translationTermHtml(w);
        return renderCardFront({
            affordancesHtml,
            contentHtml: `
                <span class="type-badge">${sanitize(w.type || 'Vocab')}</span>
                <div id="fc-srs-dots" class="srs-dots-container fc-srs-row">${this._srsDotsInnerHtml(w)}</div>
                ${termHtml}
            `,
            flipHintText: 'Tap card to flip to back 🔄',
            // SC2-C1-A11Y-002: while the card displays its answer side, the
            // front face (with its controls) is inert.
            inert: this.flipped
        });
    }

    // Answer side — built ONLY after reveal. The first German example and its
    // actual translation render through the language-neutral shared block;
    // cards without examples render no example box at all (LF-CARD / AC-05).
    _buildWordsBackHtml(w) {
        const isFav = this.favoritesIds.has(w.id);
        const affordancesHtml = renderCardAffordances({
            speak: { title: 'Speak word' },
            favorite: { active: isFav }
        });
        const answerHtml = this.face === 'de'
            ? this._translationAnswerHtml(w)
            : this._germanAnswerHtml(w);
        const example = firstExample(w);
        const exampleHtml = example
            ? renderExampleBlock({
                sourceText: example.de || '',
                sourceLang: 'de',
                translation: example.translation || '',
                translationLang: example.translationLanguage || '',
                label: 'Example:'
            })
            : '';
        return `
            <div class="verb-card-topbar">${affordancesHtml}</div>
            <div class="verb-center-content">
                ${answerHtml}
                ${exampleHtml}
            </div>
        `;
    }

    _germanTermHtml(w) {
        return `
            <div class="fc-card-label">German</div>
            <div class="fc-card-term" id="fc-de" lang="de">${sanitize(w.de)}</div>
            ${w.deContext ? `<div class="fc-card-context">${sanitize(w.deContext)}</div>` : ''}
        `;
    }

    // Translation display with truthful direction/language metadata; a card
    // without any translation shows a muted placeholder instead of leaking
    // the German answer.
    _translationTermHtml(w) {
        const display = w.en || w.translation || '';
        const attrs = translationDisplayAttrs(w.translationLanguage);
        const langAttr = attrs.lang ? ` lang="${attrs.lang}"` : '';
        const body = display ? sanitize(display) : '<span class="fc-card-muted">—</span>';
        const dirAttrs = display ? ` dir="${attrs.dir}"${langAttr}` : '';
        return `
            <div class="fc-card-label">Translation</div>
            <div class="fc-card-term" id="fc-de"${dirAttrs}>${body}</div>
        `;
    }

    _germanAnswerHtml(w) {
        return `
            <div class="fc-card-label">German</div>
            <div class="fc-card-term fc-card-answer" id="fc-en" lang="de">${sanitize(w.de)}</div>
            ${w.deContext ? `<div class="fc-card-context">${sanitize(w.deContext)}</div>` : ''}
        `;
    }

    _translationAnswerHtml(w) {
        const display = w.en || w.translation || '';
        const attrs = translationDisplayAttrs(w.translationLanguage);
        const langAttr = attrs.lang ? ` lang="${attrs.lang}"` : '';
        const body = display ? sanitize(display) : '<span class="fc-card-muted">—</span>';
        const dirAttrs = display ? ` dir="${attrs.dir}"${langAttr}` : '';
        return `
            <div class="fc-card-label">Translation</div>
            <div class="fc-card-term fc-card-answer" id="fc-en"${dirAttrs}>${body}</div>
        `;
    }

    _srsDotsInnerHtml(w) {
        const srs = this.srsData[w.id];
        const level = srs ? srs.level : 0;

        let dotsHtml = '<div style="display:flex; gap:4px; align-items:center;">';
        if (level === 6) {
            dotsHtml += '<span class="srs-master-badge">⭐ Mastered</span>';
        } else {
            for (let i = 1; i <= 5; i++) {
                dotsHtml += `<span class="srs-dot ${i <= level ? 'filled' : ''}"></span>`;
            }
        }
        dotsHtml += '</div>';

        if (level > 0 && level < 6 && srs && srs.nextReviewDate) {
            const timeText = formatTimeRemaining(srs.nextReviewDate);
            dotsHtml += `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; font-weight: 500;">Next review: ${timeText}</div>`;
        } else if (level === 0) {
            dotsHtml += `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; font-weight: 500;">New Card</div>`;
        }
        return dotsHtml;
    }

    // ── Legacy presentation (phrases source — unchanged behavior) ──

    _renderLegacyCard(w) {
        const mount = document.getElementById('fc-card-mount');
        if (mount && this._legacyCardHtml !== null && !mount.querySelector('.flashcard-inner')) {
            // Words mode replaced the static phrase card; restore it verbatim.
            mount.innerHTML = this._legacyCardHtml;
        }

        const isDeFront = this.face === 'de';
        const typeEl = document.getElementById('fc-type');
        const typeElBack = document.getElementById('fc-type-back');
        const favBadge = document.getElementById('fc-fav-badge');
        const favBadgeBack = document.getElementById('fc-fav-badge-back');

        if (typeEl) typeEl.textContent = w.type || 'Vocab';
        if (typeElBack) typeElBack.textContent = w.type || 'Vocab';

        const updateFavBadge = (badge) => {
            if (!badge) return;
            const isFav = this.favoritesIds.has(w.id);
            badge.style.filter = isFav ? 'grayscale(0)' : 'grayscale(100%)';
            badge.style.opacity = isFav ? '1' : '0.3';
        };
        updateFavBadge(favBadge);
        updateFavBadge(favBadgeBack);

        const updateDots = (container) => {
            if (!container) return;
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.innerHTML = this._srsDotsInnerHtml(w);
        };
        updateDots(document.getElementById('fc-srs-dots'));
        updateDots(document.getElementById('fc-srs-dots-back'));

        const deHtml = `${w.de} ${w.deContext ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">${w.deContext}</div>` : ''}`;
        const deEl = document.getElementById('fc-de');
        const enEl = document.getElementById('fc-en');
        const exDeEl = document.getElementById('fc-ex-de');
        const exEnEl = document.getElementById('fc-ex-en');

        if (isDeFront) {
            if (deEl) deEl.innerHTML = deHtml;
            if (enEl) enEl.innerHTML = w.en;
        } else {
            if (deEl) deEl.innerHTML = w.en;
            if (enEl) enEl.innerHTML = deHtml;
        }

        if (exDeEl) exDeEl.textContent = w.context ? w.de : '';
        if (exEnEl) exEnEl.textContent = w.context ? w.en : '';

        // Legacy observable behavior: a phrases re-render resets to the front.
        const card = document.getElementById('active-flashcard');
        if (card) {
            card.classList.remove('flipped');
            this.flipped = false;
        }
    }

    // ── Shared-card event delegation (words source only) ──

    // Scoped to the card mount so the phrase card, the glossary and every
    // other view stay untouched (FP-UI-004: delegated data-action pattern).
    _bindSharedCardEvents() {
        const mount = document.getElementById('fc-card-mount');
        if (!mount) return;
        mount.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            const action = actionBtn.dataset.action;
            if (action === 'speak') {
                e.stopPropagation();
                this.speak();
            } else if (action === 'speak-text') {
                e.stopPropagation();
                // Example sentences are German; the language is passed
                // explicitly to the app speech wrapper.
                if (window.app) window.app.speakText(actionBtn.dataset.text, 'de');
            } else if (action === 'fav') {
                e.stopPropagation();
                const w = this.queue[this.index];
                if (w && window.app) window.app.toggleFavorite(w.id);
            } else if (action === 'flip') {
                // Every inner control is a real button, so only card-body
                // clicks (never control clicks) reach the flip action — one
                // interaction can never trigger two actions.
                if (!e.target.closest('button')) {
                    e.stopPropagation();
                    this.flip();
                }
            }
        });
        // Keyboard activation (LF-CARD: pointer, Enter and Space): exactly
        // one flip per keypress. Real buttons keep their native key handling
        // and are excluded; key repeats are ignored, so one activation can
        // never cause a second transition.
        mount.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const target = e.target;
            if (!target || typeof target.closest !== 'function') return;
            if (target.closest('button, a, select, input, textarea')) return;
            const card = target.closest('.verb-flashcard[data-action="flip"]');
            if (!card) return;
            e.preventDefault();
            this.flip();
        });
    }
}
