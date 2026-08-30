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
// Icon-only controls carry an explicit aria-label so their accessible name is
// a stable description, never the bare emoji glyph (SC2-C1-A11Y-001); the
// favorite state lives on aria-pressed while its name never changes.
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
        const speakName = sanitize(speak.title || 'Speak verb');
        right.push(
            `<button type="button" class="speak-btn card-affordance" data-action="speak" title="${speakName}" aria-label="${speakName}">🔊</button>`
        );
    }
    if (favorite) {
        // No id attribute: the adapter resolves the current card, so an
        // unrevealed card carries no answer-bearing metadata (SC-01d).
        right.push(
            `<button type="button" class="fav-icon-btn card-affordance${favorite.active ? ' active' : ''}"` +
            ` data-action="fav" title="Toggle Favorite" aria-label="Toggle Favorite" aria-pressed="${favorite.active ? 'true' : 'false'}">` +
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
// `inert: true` isolates the face from keyboard focus and assistive technology
// while the card displays its back side (SC2-C1-A11Y-002) — the adapter passes
// its flip state so the displayed face is always the reachable one.
export function renderCardFront({ affordancesHtml = '', contentHtml = '', footerActionsHtml = '', flipHintText = '', inert = false } = {}) {
    return `
        <div class="verb-card-front"${inert ? ' inert' : ''}>
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

// Direction metadata for a translation language tag (SC2-C1-DESIGN-001):
// Arabic renders right-to-left, known Latin-script tags render left-to-right,
// and mixed or unknown content falls back to the browser's automatic
// direction — the safe choice when the script cannot be assumed.
function translationDirection(lang) {
    if (lang === 'ar') return 'rtl';
    if (lang === 'en' || lang === 'de') return 'ltr';
    return 'auto';
}

// Shared example block (LF-CARD after-reveal rules, SC-02): exactly the FIRST
// German example, with its translation always visible next to it when one
// exists. No chip toggle, no additional examples on the card. Returns '' for
// cards without an example (no stale or placeholder content).
// The API is language-neutral (SC2-C1-DESIGN-001): the caller supplies the
// source text, the translated text and the translation's language metadata;
// the renderer derives the direction (rtl/ltr/auto) from that metadata and
// never invents or translates vocabulary content itself.
export function renderExampleBlock({ sourceText = '', sourceLang = 'de', translation = '', translationLang = '', label = 'Example:' } = {}) {
    if (!sourceText) return '';
    const attrText = sanitize(sourceText);
    const dir = translationDirection(translationLang);
    // Mixed or unknown translations carry no single language tag; dir="auto"
    // keeps their display safe in either direction.
    const langAttr = (translationLang === 'en' || translationLang === 'ar' || translationLang === 'de')
        ? ` lang="${sanitize(translationLang)}"`
        : '';
    return `
        <div class="back-example-box">
            <div class="ex-label">${sanitize(label)}</div>
            <div class="ex-text">
                <button type="button" class="ex-sentence-span card-affordance" data-action="speak-text" data-text="${attrText}" lang="${sanitize(sourceLang)}" title="Click sentence to pronounce">💬 ${sanitize(sourceText)}</button>
            </div>
            ${translation ? `<div class="ex-translation-line" dir="${sanitize(dir)}"${langAttr}>(${sanitize(translation)})</div>` : ''}
        </div>
    `;
}

// The shared card block: the ordinary flip shell (.verb-flashcard front/back
// faces — the same core classes for every adapter) plus adapter-owned actions
// below the card. `flippable: false` renders a single-face presentation card
// (e.g. the Guided intro) with no flip affordance. `backHtml` is supplied by
// the adapter only after reveal; an unrevealed back stays an empty face.
// `activatable: false` (SC2-C1-A11Y-003) keeps the two-faced shell but strips
// the flip action, button role, focus target and accessible name — a revealed
// Guided card must not advertise a no-op "activate to reveal" operation. The
// hidden back face renders inert until the card flips so only the displayed
// face is ever keyboard-reachable or exposed to assistive technology
// (SC2-C1-A11Y-002); the adapter marks the front face inert when flipped.
export function renderSharedCard({ mode = 'ordinary', flippable = true, flipped = false, activatable = null, ariaLabel = 'Flashcard: activate to flip', frontHtml = '', backHtml = '', actionsHtml = '' } = {}) {
    const canActivate = activatable === null ? flippable : activatable;
    const attrs = canActivate
        ? ` data-action="flip" tabindex="0" role="button" aria-label="${sanitize(ariaLabel)}"`
        : '';
    return `
        <div class="shared-card-block shared-card-${sanitize(mode)}">
            <div class="verb-flashcard${flipped ? ' flipped' : ''}"${attrs}>
                ${frontHtml}
                ${flippable ? `<div class="verb-card-back"${flipped ? '' : ' inert'}>${backHtml}</div>` : ''}
            </div>
            ${actionsHtml}
        </div>
    `;
}
