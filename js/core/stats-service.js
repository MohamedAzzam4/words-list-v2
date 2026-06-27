// WP-028: StatsService — extracted from app.js
// Handles dashboard stats rendering and unit progress calculations

export class StatsService {
    constructor({ state, engines, levelConfig, onGetUnitProgress, onResolveUnitLabel }) {
        this.state = state;
        this.engines = engines;
        this.levelConfig = levelConfig;
        this._getUnitProgress = onGetUnitProgress;
        this._resolveUnitLabel = onResolveUnitLabel;
    }

    updateStats() {
        const all = this.levelConfig?.vocabulary?.flat() || [];
        // Always use the live engine Set — state.data.known can be stale during a session
        const knownSet = (this.state.flashcardSource === 'words' && this.engines.flashcard?.knownIds) || this.engines.glossary?.knownIds;
        let knownCount = 0;
        if (knownSet) {
            knownCount = all.filter(w => knownSet.has(w.id)).length;
        } else {
            const savedKnown = new Set(this.state.data?.known || []);
            knownCount = all.filter(w => savedKnown.has(w.id)).length;
        }
        const pct = all.length ? Math.round((knownCount / all.length) * 100) : 0;

        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setEl('stat-known', knownCount);
        setEl('stat-total', all.length);
        setEl('stat-percent', `${pct}%`);
        setEl('overall-progress-text', `${pct}%`);

        const fill = document.getElementById('overall-progress-fill');
        if (fill) fill.style.width = `${pct}%`;

        // DASHBOARD RENDERING
        const statsTbody = document.getElementById('stats-tbody');
        if (statsTbody && this.levelConfig?.vocabulary) {
            const vocab = this.levelConfig.vocabulary;
            const usesChapters = !!(this.levelConfig.unitTitles || this.levelConfig.modulesPerChapter);
            let html = '';
            for (let i = 0; i < vocab.length; i++) {
                if (!vocab[i] || vocab[i].length === 0) continue;
                const { chapter, module } = this._resolveUnitLabel(i);
                const prog = this._getUnitProgress(i);
                html += `<tr>
                    <td>${chapter}</td>
                    <td>${module}</td>
                    <td>
                        <div class="progress-bar-bg" style="width: 100%; height: 6px; margin-bottom: 4px;">
                            <div class="progress-bar-fill" style="width: ${prog.pct}%;"></div>
                        </div>
                        <div style="font-size: 0.75rem; text-align: right; color: var(--text-muted);">${prog.known}/${prog.total} (${prog.pct}%)</div>
                    </td>
                </tr>`;
            }
            statsTbody.innerHTML = html;
            const thead = statsTbody.closest('table')?.querySelector('thead tr');
            if (thead) {
                thead.innerHTML = usesChapters
                    ? '<th>Chapter</th><th>Module</th><th>Progress</th>'
                    : '<th>Unit</th><th>Topic</th><th>Progress</th>';
            }
        }

        // Weakest unit
        let weakestIdx = -1;
        let lowestPct = 101;
        for (let i = 0; i < (this.levelConfig?.vocabulary?.length || 0); i++) {
            if (this.levelConfig.vocabulary[i]?.length > 0) {
                const prog = this._getUnitProgress(i);
                if (prog.pct < lowestPct) { lowestPct = prog.pct; weakestIdx = i; }
            }
        }
        let weakestLabel = '-';
        if (weakestIdx !== -1) {
            const { chapter, module } = this._resolveUnitLabel(weakestIdx);
            weakestLabel = module ? `${chapter}: ${module}` : chapter;
        }
        setEl('stat-weakest', weakestLabel);
    }
}
