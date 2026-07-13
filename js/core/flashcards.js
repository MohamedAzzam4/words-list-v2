import { calculateNextReview, getLocalDateString } from './srs-logic.js?v=3';

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

export class FlashcardEngine {
    constructor(words, knownIds, favoritesIds, errors, srsData, onSave, onSessionComplete) {
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
        this._buildQueue();
    }

    loadUnit(newWords, newKnownIds = null, newFavoritesIds = null, newErrors = null, newSrsData = null) {
        this.words = newWords || [];
        if (newKnownIds !== null) this.knownIds = newKnownIds;
        if (newFavoritesIds !== null) this.favoritesIds = newFavoritesIds;
        if (newErrors !== null) this.errors = newErrors;
        if (newSrsData !== null) this.srsData = newSrsData;
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

    setFilter(f) { this.filter = f; this.isFinished = false; this._buildQueue(); this.index = 0; this.render(); }

    setFace(f) { this.face = f; this.render(); }

    toggleShuffle() { this.shuffle = !this.shuffle; this.isFinished = false; this._buildQueue(); this.index = 0; this.render(); }

    flip() {
        this.flipped = !this.flipped;
        const card = document.getElementById('active-flashcard');
        if (card) card.classList.toggle('flipped');
    }

    speak() {
        const w = this.queue[this.index];
        if (!w) return;
        
        const isDeVisible = (this.face === 'de' && !this.flipped) || (this.face === 'en' && this.flipped);
        if (isDeVisible) {
            window.app.speakText(w.de, 'de');
        } else {
            window.app.speakText(w.en || w.de, 'en');
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
        
        // Render SRS Level indicator
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

        const updateDots = (container) => {
            if (!container) return;
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.innerHTML = dotsHtml;
        };
        updateDots(document.getElementById('fc-srs-dots'));
        updateDots(document.getElementById('fc-srs-dots-back'));
        
        const deHtml = `${w.de} ${w.deContext ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">${w.deContext}</div>` : ''}`;
        const deEl = document.getElementById('fc-de');
        const enEl = document.getElementById('fc-en');
        const exDeEl = document.getElementById('fc-ex-de');
        const exEnEl = document.getElementById('fc-ex-en');
        const counterEl = document.getElementById('fc-counter');
        const filterAllBtn = document.getElementById('filter-all-btn');
        const filterLearnBtn = document.getElementById('filter-learning-btn');
        const filterFavBtn = document.getElementById('filter-favorites-btn');
        const faceDeBtn = document.getElementById('face-de-btn');
        const faceEnBtn = document.getElementById('face-en-btn');
        const shuffleBtn = document.getElementById('shuffle-btn');

        if (isDeFront) {
            if (deEl) deEl.innerHTML = deHtml;
            if (enEl) enEl.innerHTML = w.en;
        } else {
            if (deEl) deEl.innerHTML = w.en;
            if (enEl) enEl.innerHTML = deHtml;
        }
        
        if (exDeEl) exDeEl.textContent = w.context ? w.de : '';
        if (exEnEl) exEnEl.textContent = w.context ? w.en : '';
        if (counterEl) counterEl.textContent = `${this.index + 1} / ${q.length}`;

        // Update filter button states
        if (filterAllBtn) filterAllBtn.classList.toggle('primary', this.filter === 'all');
        if (filterLearnBtn) filterLearnBtn.classList.toggle('primary', this.filter === 'learning');
        if (filterFavBtn) filterFavBtn.classList.toggle('primary', this.filter === 'favorites');
        if (faceDeBtn) faceDeBtn.classList.toggle('primary', this.face === 'de');
        if (faceEnBtn) faceEnBtn.classList.toggle('primary', this.face === 'en');
        if (shuffleBtn) shuffleBtn.textContent = `🔀 Shuffle: ${this.shuffle ? 'ON' : 'OFF'}`;

        // Reset flip state
        const card = document.getElementById('active-flashcard');
        if (card) {
            card.classList.remove('flipped');
            this.flipped = false;
        }
    }
}