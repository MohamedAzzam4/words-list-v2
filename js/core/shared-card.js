/**
 * SHARED-CARD-002 — shared flashcard presentation.
 *
 * Pure presentation helpers for the ONE card shell used by both the ordinary
 * Verbs flashcard and the Guided Challenge card (LF-CARD / GC-UI-001).
 * The module renders HTML strings from explicit view-model inputs only:
 * it never touches storage, the challenge scheduler, persistence, TTS or the
 * DOM, and callers must not pass engine/storage objects into it (FP-DESIGN-009).
 *
 * Secrecy invariants (LF-CARD / AC-06):
 * - answer-bearing back markup is supplied by the adapter ONLY after reveal
 *   (`backHtml` stays empty while the answer side is hidden);
 * - the shared favorite button carries no card-id attribute, so an unrevealed
 *   card never embeds answer stems in data-* metadata (SC-01d);
 * - the shared hint box renders its text only while the hint is visible.
 */
import { sanitize } from './utils.js';

// Topbar affordance row: hint (left), speak + favorite (right). All controls
// are real buttons so they are keyboard-operable and never bubble into the
// flip action; the 44x44 minimum lives in css/shared-card.css (.card-affordance).
export function renderCardAffordances({ hint = null, speak = null, favorite = null } = {}) {
    const left = [];
    if (hint) {
        left.push(
            `<button type="button" class="hint-btn card-affordance" data-action="toggle-hint" title="Get a hint">` +
            `💡 ${sanitize(hint.label)}` +
            `</button>`
        );
    }
    const right = [];
    if (speak) {
        right.push(
            `<button type="button" class="speak-btn card-affordance" data-action="speak" title="${sanitize(speak.title || 'Speak')}">🔊</button>`
        );
    }
    if (favorite) {
        // No id attribute: the adapter resolves the current card, so an
        // unrevealed card carries no answer-bearing metadata (SC-01d).
        right.push(
            `<button type="button" class="fav-icon-btn card-affordance${favorite.active ? ' active' : ''}"` +
            ` data-action="fav" title="Toggle Favorite" aria-pressed="${favorite.active ? 'true' : 'false'}">` +
            `${favorite.active ? '⭐' : '☆'}` +
            `</button>`
        );
    }
    let html = '';
    if (left.length) html += left.join('');
    if (right.length) html += `<div class="topbar-right-btns">${right.join('')}</div>`;
    return html;
}

// Front face: optional affordance topbar, centered content, optional footer
// actions (adapter-owned, e.g. the Guided intro buttons) and flip hint line.
export function renderCardFront({ affordancesHtml = '', contentHtml = '', footerActionsHtml = '', flipHintText = '' } = {}) {
    return `
        <div class="verb-card-front">
            ${affordancesHtml ? `<div class="verb-card-topbar">${affordancesHtml}</div>` : ''}
            <div class="verb-center-content">
                ${contentHtml}
                ${footerActionsHtml}
            </div>
            ${flipHintText ? `<div class="verb-tap-hint">${sanitize(flipHintText)}</div>` : ''}
        </div>
    `;
}

// Hint box. The hint text is rendered ONLY while visible: an unrevealed card
// must not carry hidden answer fragments anywhere in the DOM (SC-01b).
export function renderHintBox({ visible = false, html = '' } = {}) {
    return `<div class="verb-hint-box${visible ? '' : ' hidden'}">${visible ? html : ''}</div>`;
}

// Shared example block (LF-CARD after-reveal rules, SC-02): exactly the FIRST
// German example, with its translation always visible next to it when one
// exists. No chip toggle, no additional examples on the card. Returns '' for
// cards without an example (no stale or placeholder content).
export function renderExampleBlock({ de = '', en = '', label = 'Example:' } = {}) {
    if (!de) return '';
    const attrDe = sanitize(de);
    return `
        <div class="back-example-box">
            <div class="ex-label">${sanitize(label)}</div>
            <div class="ex-text">
                <button type="button" class="ex-sentence-span card-affordance" data-action="speak-text" data-text="${attrDe}" title="Click sentence to pronounce">💬 ${sanitize(de)}</button>
            </div>
            ${en ? `<div class="ex-en-line">(${sanitize(en)})</div>` : ''}
        </div>
    `;
}

// The shared card block: the ordinary flip shell (.verb-flashcard front/back
// faces — the same core classes for every adapter) plus adapter-owned actions
// below the card. `flippable: false` renders a single-face presentation card
// (e.g. the Guided intro) with no flip affordance. `backHtml` is supplied by
// the adapter only after reveal; an unrevealed back stays an empty face.
export function renderSharedCard({ mode = 'ordinary', flippable = true, flipped = false, ariaLabel = 'Flashcard: activate to flip', frontHtml = '', backHtml = '', actionsHtml = '' } = {}) {
    const attrs = flippable
        ? ` data-action="flip" tabindex="0" role="button" aria-label="${sanitize(ariaLabel)}"`
        : '';
    return `
        <div class="shared-card-block shared-card-${sanitize(mode)}">
            <div class="verb-flashcard${flipped ? ' flipped' : ''}"${attrs}>
                ${frontHtml}
                ${flippable ? `<div class="verb-card-back">${backHtml}</div>` : ''}
            </div>
            ${actionsHtml}
        </div>
    `;
}
