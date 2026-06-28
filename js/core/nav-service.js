// WP-027: NavigationService — extracted from app.js
// Handles view switching, unit switching, sidebar logic, and title management

import { sanitize } from './utils.js?v=3';

export class NavigationService {
    constructor({ state, engines, levelConfig, onSave, onUpdateStats, onRenderUnitList }) {
        this.state = state;
        this.engines = engines;
        this.levelConfig = levelConfig;
        this._onSave = onSave;
        this._onUpdateStats = onUpdateStats;
        this._onRenderUnitList = onRenderUnitList;
    }

    switchView(v) {
        document.querySelectorAll('#content-area > div[id^="view-"]').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`view-${v}`);
        if (target) {
            target.classList.remove('hidden');
            this.state.view = v;
        }

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('visible');
        }
    }

    switchMode(m) {
        if (m === 'flashcard') {
            if (this.state.tab === 'phrases') {
                this.state.flashcardSource = 'phrases';
                const phrases = this.state.activePhrases || [];
                const knownPhrases = new Set(this.state.data?.knownPhrases || []);
                const favoritePhrases = new Set(this.state.data?.favoritePhrases || []);
                const phraseErrors = this.state.data?.phraseErrors || {};
                this.engines.flashcard?.loadUnit(phrases, knownPhrases, favoritePhrases, phraseErrors);
            } else {
                this.state.flashcardSource = 'words';
                const words = this.levelConfig?.vocabulary?.[this.state.unit] || [];
                const known = new Set(this.state.data?.known || []);
                const favorites = new Set(this.state.data?.favorites || []);
                const errors = this.state.data?.flashcardErrors || {};
                this.engines.flashcard?.loadUnit(words, known, favorites, errors);
            }
            this.switchView('flashcard');
        } else {
            this.switchView('glossary');
            if (this.state.tab === 'phrases') {
                if (window.app && typeof window.app.switchUnitTab === 'function') {
                    window.app.switchUnitTab('phrases');
                }
            } else {
                if (window.app && typeof window.app.switchUnitTab === 'function') {
                    window.app.switchUnitTab('words');
                }
                const words = this.levelConfig?.vocabulary?.[this.state.unit] || [];
                this.engines.glossary?.loadUnit(words);
                this.engines.glossary?.render();
            }
        }
    }

    toggleSidebar(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const now = Date.now();
        if (now - (this._lastSidebarToggle || 0) < 350) {
            return;
        }
        this._lastSidebarToggle = now;

        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar) return;

        const isOpen = sidebar.classList.toggle('open');
        overlay?.classList.toggle('visible', isOpen);
    }

    async switchUnit(i) {
        this.state.unit = i;
        if (window.app && typeof window.app.switchUnitTab === 'function') {
            window.app.switchUnitTab('words');
        }
        const words = this.levelConfig?.vocabulary?.[i] || [];

        this._updateTitles(i);

        // If user is on a "view-only" screen (dashboard/trophies), clicking a unit
        // should navigate them back to the glossary for that unit.
        if (this.state.view === 'dashboard' || this.state.view === 'trophies' || this.state.view === 'leaderboard') {
            this.engines.glossary?.loadUnit(words);
            this.engines.glossary?.render();
            this.switchView('glossary'); // switchView already closes mobile sidebar
        } else {
            if (this.state.view === 'glossary') {
                this.engines.glossary?.loadUnit(words);
                this.engines.glossary?.render();
            } else if (this.state.view === 'flashcard') {
                this.engines.flashcard?.loadUnit(words);
            } else if (this.state.view === 'article-quiz') {
                this.engines.quiz?.loadUnit(words);
            }
            // Always close sidebar on mobile when selecting a unit
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar')?.classList.remove('open');
                document.getElementById('sidebar-overlay')?.classList.remove('visible');
            }
        }

        this._onRenderUnitList();
        this._onUpdateStats();
    }

    _updateTitles(i) {
        const slabel = this.levelConfig.sectionLabel || 'Modul';
        const sectionName = this.levelConfig.sectionLabels?.[i] ? `: ${this.levelConfig.sectionLabels[i]}` : '';
        const label = `${slabel} ${i + 1}${sectionName}`;

        let prefix = '';
        if (!this.levelConfig.chapterGroups && this.levelConfig.modulesPerChapter) {
            const ch = Math.floor(i / this.levelConfig.modulesPerChapter) + 1;
            prefix = `Kapitel ${ch} - `;
        }

        const gTitle = document.getElementById('glossary-title');
        if (gTitle) gTitle.textContent = prefix + label;
    }

    renderUnitList() {
        const list = document.getElementById('unit-list');
        if (!list || !this.levelConfig?.vocabulary) return;

        let html = '';
        const vocab = this.levelConfig.vocabulary;

        if (this.levelConfig.unitTitles) {
            // B2 ARCHITECTURAL HANDOVER: Dynamic Grouping via unitTitles
            let currentChapter = "";
            const maxUnits = vocab.length;

            for (let i = 0; i < maxUnits; i++) {
                const globalIndex = i + 1; // Since unitTitles dictionary starts at 1
                if (!this.levelConfig.unitTitles[globalIndex]) {
                    html += this._createUnitItem(i, `Unit ${i + 1}`);
                    continue;
                }

                const titleStr = this.levelConfig.unitTitles[globalIndex];
                const parts = titleStr.split(':');
                const chapterPrefix = parts[0].trim();

                if (chapterPrefix !== currentChapter) {
                    html += `<div style="padding: 10px 20px; font-weight: bold; color: var(--text-muted); margin-top: 10px; border-bottom: 1px solid var(--border); font-size: 0.85rem; text-transform: uppercase;">
            📖 ${chapterPrefix.replace('K', 'Kapitel ')}
          </div>`;
                    currentChapter = chapterPrefix;
                }

                const cleanTitle = parts.slice(1).join(':').trim();
                html += this._createUnitItem(i, cleanTitle);
            }
        } else if (this.levelConfig.chapterGroups && this.levelConfig.chapterGroups.length > 0) {
            this.levelConfig.chapterGroups.forEach((chapter, chIndex) => {
                const nextStart = this.levelConfig.chapterGroups[chIndex + 1]?.start || vocab.length;
                html += `<div style="padding: 10px 20px; font-weight: bold; color: var(--text-muted); margin-top: 10px; border-bottom: 1px solid var(--border); font-size: 0.85rem; text-transform: uppercase;">
        ${chapter.title}
      </div>`;
                for (let i = chapter.start; i < nextStart && i < vocab.length; i++) {
                    html += this._createUnitItem(i, null);
                }
            });
        }
        else if (this.levelConfig.modulesPerChapter) {
            const perChapter = this.levelConfig.modulesPerChapter;
            const totalChapters = Math.ceil(vocab.length / perChapter);

            for (let ch = 0; ch < totalChapters; ch++) {
                const startIdx = ch * perChapter;
                const endIdx = Math.min(startIdx + perChapter, vocab.length);

                html += `<div style="padding: 10px 20px; font-weight: bold; color: var(--text-muted); margin-top: 10px; border-bottom: 1px solid var(--border); font-size: 0.85rem; text-transform: uppercase;">
        Kapitel ${ch + 1}
      </div>`;

                for (let i = startIdx; i < endIdx; i++) {
                    html += this._createUnitItem(i, null);
                }
            }
        } else {
             // NO GROUPING: Render flat list
             for (let i = 0; i < vocab.length; i++) {
                 html += this._createUnitItem(i, null);
             }
        }

        list.innerHTML = html;
    }

    _createUnitItem(index, overrideLabel = null) {
        const isActive = index === this.state.unit;
        const prog = this._getUnitProgress(index);

        let label = '';
        if (overrideLabel) {
            label = overrideLabel;
        } else if (this.levelConfig.exactLabels) {
            label = this.levelConfig.sectionLabels?.[index] || `${this.levelConfig.sectionLabel || 'Modul'} ${index + 1}`;
        } else {
            const slabel = this.levelConfig.sectionLabel || 'Modul';
            const sectionName = this.levelConfig.sectionLabels?.[index] ? `: ${this.levelConfig.sectionLabels[index]}` : '';
            label = `${slabel} ${index + 1}${sectionName}`;
        }

        return `<div class="nav-item ${isActive ? 'active' : ''}" onclick="window.app.switchUnit(${index})" style="padding-left: 30px; font-size: 0.9rem;">
    <span>${sanitize(label)}</span>
    <span class="unit-progress">${prog.known}/${prog.total} (${prog.pct}%)</span>
  </div>`;
    }

    _getUnitProgress(i) {
        const unit = this.levelConfig?.vocabulary?.[i] || [];
        if (!unit.length) return { pct: 0, known: 0, total: 0 };
        // Use the live engine Set (always current), fall back to saved array on first load
        const knownSet = (this.state.flashcardSource === 'words' && this.engines.flashcard?.knownIds) || this.engines.glossary?.knownIds;
        const known = knownSet
            ? unit.filter(w => knownSet.has(w.id)).length
            : unit.filter(w => this.state.data?.known?.includes(w.id)).length;
        return {
            pct: Math.round((known / unit.length) * 100),
            known: known,
            total: unit.length
        };
    }

    // Returns { chapter, module } for any unit index, regardless of config type.
    _resolveUnitLabel(i) {
        if (this.levelConfig.unitTitles) {
            const titleStr = this.levelConfig.unitTitles[i + 1];
            if (!titleStr) return { chapter: `Unit ${i + 1}`, module: '' };
            const parts = titleStr.split(':');
            return {
                chapter: parts[0].trim().replace(/^K(\d+)$/, 'Kapitel $1'),
                module: parts.slice(1).join(':').trim()
            };
        }
        if (this.levelConfig.modulesPerChapter) {
            const ch = Math.floor(i / this.levelConfig.modulesPerChapter) + 1;
            const mod = this.levelConfig.sectionLabels?.[i] || `${this.levelConfig.sectionLabel || 'Modul'} ${i + 1}`;
            return { chapter: `Kapitel ${ch}`, module: mod };
        }
        return { chapter: `Unit ${i + 1}`, module: this.levelConfig.sectionLabels?.[i] || '' };
    }
}
