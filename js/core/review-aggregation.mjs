// REVIEW-001 — pure current-level review aggregation (LR-AGG / AC-13 / AC-14).
//
// Deterministic calculation for the Review Center sources: given the current
// level's normalized vocabulary, persisted progress, an injected clock, and an
// optional unit scope, it returns independent Due and Favorites candidate sets
// with totals, per-unit lists/counts, and safe diagnostics for ignored
// malformed, stale, duplicate, or foreign entries. It never reads a hidden
// clock (Date.parse is only applied to explicitly supplied, validated ISO
// strings), never randomizes, never touches the DOM, storage, or network, and
// never mutates its inputs.
//
// Due semantics reuse the existing scheduling rule (js/core/flashcards.js):
// only an existing, well-formed SRS record with level 1-5 whose
// nextReviewDate is exactly equal to or earlier than the injected clock is
// due. Unseen cards, level-0 cards, and mastered level-6 cards are never due.
// No SRS interval or scheduling behavior is introduced or changed.

const ISO_DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_UTC_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z$/;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Record-level validity range (level 0 and 6 are legitimate, never-due states).
const SRS_LEVEL_MIN = 0;
const SRS_LEVEL_MAX = 6;
// Due eligibility range: levels 1-5 only.
const DUE_LEVEL_MIN = 1;
const DUE_LEVEL_MAX = 5;

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Valid nextReviewDate formats are exactly the two the production code writes:
// a full UTC ISO timestamp (calculateNextReview via toISOString) or the legacy
// date-only form (the SRS legacy migration, e.g. '2099-01-01' = UTC midnight).
// Calendar components are validated explicitly so rollover values such as
// 2026-02-30 or hour 24 are rejected instead of silently shifting the date,
// and timezone-less datetimes are rejected because their interpretation is
// environment-dependent. Returns epoch milliseconds, or null when invalid.
function parseSrsTimestamp(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const dateOnly = ISO_DATE_ONLY_PATTERN.exec(value);
    const fullTimestamp = ISO_DATETIME_UTC_PATTERN.exec(value);
    if (!dateOnly && !fullTimestamp) {
        return null;
    }

    const year = Number(dateOnly ? dateOnly[1] : fullTimestamp[1]);
    const month = Number(dateOnly ? dateOnly[2] : fullTimestamp[2]);
    const day = Number(dateOnly ? dateOnly[3] : fullTimestamp[3]);
    if (month < 1 || month > 12) {
        return null;
    }
    const maxDay = (month === 2 && isLeapYear(year)) ? 29 : DAYS_IN_MONTH[month - 1];
    if (day < 1 || day > maxDay) {
        return null;
    }
    if (fullTimestamp) {
        const hour = Number(fullTimestamp[4]);
        const minute = Number(fullTimestamp[5]);
        const second = Number(fullTimestamp[6]);
        if (hour > 23 || minute > 59 || second > 59) {
            return null;
        }
    }

    const time = Date.parse(value);
    return Number.isFinite(time) ? time : null;
}

// A candidate descriptor is a fresh identity copy; it never aliases the input
// card object, so mutating a result cannot corrupt the caller's vocabulary.
function describeCard(card) {
    return { id: card.id, levelId: card.levelId, unitId: card.unitId };
}

function buildDiagnostic(source, code, message, id, unitId) {
    return { source, code, message, id, unitId };
}

// Validates the top-level arguments. These are programmer errors, not
// persisted-data faults: bad arguments fail fast with an actionable
// TypeError instead of producing a silently wrong aggregation.
function validateInput(input) {
    if (!isPlainObject(input)) {
        throw new TypeError('input must be an options object.');
    }
    if (typeof input.levelId !== 'string' || input.levelId.trim() === '') {
        throw new TypeError(`input.levelId must be a non-empty string (received ${typeof input.levelId}).`);
    }
    if (!Array.isArray(input.vocabulary)) {
        throw new TypeError('input.vocabulary must be an array of units.');
    }
    input.vocabulary.forEach((unit, unitIndex) => {
        if (!Array.isArray(unit)) {
            throw new TypeError(`input.vocabulary[${unitIndex}] must be an array of cards (unit ${unitIndex + 1}).`);
        }
    });
    if (!isPlainObject(input.progress)) {
        throw new TypeError('input.progress must be a plain object.');
    }
    if (typeof input.now !== 'number' || !Number.isFinite(input.now) || input.now < 0) {
        throw new TypeError('input.now must be a finite epoch-milliseconds number (>= 0).');
    }
    if (input.unitId !== undefined && input.unitId !== null) {
        if (!Number.isInteger(input.unitId) || input.unitId < 1) {
            throw new TypeError('input.unitId must be an integer >= 1 when provided.');
        }
    }
}

// Scans the normalized vocabulary in source order and returns the cards that
// explicitly belong to the requested level. Identity failures are ignored and
// reported: malformed cards, foreign-level cards, cards whose unitId disagrees
// with their unit slot, and duplicate card IDs (first occurrence participates,
// mirroring the normalized contract the level-data validator enforces).
function collectParticipatingCards(vocabulary, levelId) {
    const participatingCards = [];
    const cardById = new Map();
    const diagnostics = [];

    vocabulary.forEach((unit, unitIndex) => {
        const unitNumber = unitIndex + 1;
        unit.forEach((card, cardIndex) => {
            if (!isPlainObject(card) || typeof card.id !== 'string' || card.id.trim() === '') {
                diagnostics.push(buildDiagnostic('vocabulary', 'VOCAB_CARD_MALFORMED',
                    `Unit ${unitNumber} card ${cardIndex + 1} is malformed; a card must be an object with a non-empty string id. The card was ignored.`,
                    null, unitNumber));
                return;
            }
            if (card.levelId !== levelId) {
                diagnostics.push(buildDiagnostic('vocabulary', 'VOCAB_CARD_FOREIGN_LEVEL',
                    `Card '${card.id}' belongs to level '${card.levelId}' and cannot participate in level '${levelId}'. The card was ignored.`,
                    card.id, unitNumber));
                return;
            }
            if (!Number.isInteger(card.unitId) || card.unitId !== unitNumber) {
                diagnostics.push(buildDiagnostic('vocabulary', 'VOCAB_CARD_UNIT_MISMATCH',
                    `Card '${card.id}' claims unit ${card.unitId} but sits in unit slot ${unitNumber}. The card was ignored.`,
                    card.id, unitNumber));
                return;
            }
            if (cardById.has(card.id)) {
                diagnostics.push(buildDiagnostic('vocabulary', 'VOCAB_CARD_ID_DUPLICATE',
                    `Duplicate card ID '${card.id}' in level '${levelId}'; only the first occurrence participates.`,
                    card.id, unitNumber));
                return;
            }
            cardById.set(card.id, card);
            participatingCards.push(card);
        });
    });

    return { participatingCards, cardById, vocabularyDiagnostics: diagnostics };
}

// Evaluates every stored SRS entry. Unknown or stale keys (no matching card in
// the requested level, including IDs that only exist in another level) and
// malformed records are ignored and reported; the card is never due through a
// rejected entry.
function collectDueCardIds(srsData, cardById, now) {
    const dueCardIds = new Set();
    const diagnostics = [];

    const hasSrsData = srsData !== undefined && srsData !== null;
    if (!hasSrsData || isPlainObject(srsData)) {
        for (const [id, record] of Object.entries(srsData || {})) {
            const card = cardById.get(id);
            if (!card) {
                diagnostics.push(buildDiagnostic('srs', 'SRS_ID_UNKNOWN',
                    `SRS record key '${id}' does not match any card in the requested level; the unknown or stale entry was ignored.`,
                    id, null));
                continue;
            }
            const level = isPlainObject(record) ? record.level : undefined;
            if (!isPlainObject(record) || !Number.isInteger(level) || level < SRS_LEVEL_MIN || level > SRS_LEVEL_MAX) {
                diagnostics.push(buildDiagnostic('srs', 'SRS_RECORD_MALFORMED',
                    `SRS record for card '${id}' is malformed; level must be an integer between ${SRS_LEVEL_MIN} and ${SRS_LEVEL_MAX}. The card was ignored for due evaluation.`,
                    id, card.unitId));
                continue;
            }
            const nextTime = parseSrsTimestamp(record.nextReviewDate);
            if (nextTime === null) {
                diagnostics.push(buildDiagnostic('srs', 'SRS_RECORD_MALFORMED',
                    `SRS record for card '${id}' has a missing or invalid nextReviewDate; expected a UTC ISO timestamp or a YYYY-MM-DD date. The card was ignored for due evaluation.`,
                    id, card.unitId));
                continue;
            }
            // Existing due semantics: levels 1-5 are due at the inclusive
            // boundary (exactly equal to or earlier than the injected clock).
            if (level >= DUE_LEVEL_MIN && level <= DUE_LEVEL_MAX && nextTime <= now) {
                dueCardIds.add(id);
            }
        }
    } else {
        diagnostics.push(buildDiagnostic('srs', 'SRS_STATE_MALFORMED',
            `progress.srsData must be an object when present (received ${typeof srsData}); it was treated as empty.`,
            null, null));
    }

    return { dueCardIds, srsDiagnostics: diagnostics };
}

// Evaluates every stored favorites entry. Membership is independent of due
// status: duplicate stored IDs count once, unknown or stale IDs (including IDs
// that only exist in another level) and malformed entries are ignored and
// reported, and an unseen card remains a legitimate favorite.
function collectFavoriteCardIds(favorites, cardById) {
    const favoriteCardIds = new Set();
    const diagnostics = [];

    const hasFavorites = favorites !== undefined && favorites !== null;
    if (!hasFavorites || Array.isArray(favorites)) {
        for (const entry of favorites || []) {
            if (typeof entry !== 'string' || entry.trim() === '') {
                diagnostics.push(buildDiagnostic('favorites', 'FAVORITES_ENTRY_MALFORMED',
                    'Favorites entries must be non-empty card ID strings; the malformed entry was ignored.',
                    null, null));
                continue;
            }
            const card = cardById.get(entry);
            if (!card) {
                diagnostics.push(buildDiagnostic('favorites', 'FAVORITES_ID_UNKNOWN',
                    `Favorite ID '${entry}' does not match any card in the requested level; the unknown or stale entry was ignored.`,
                    entry, null));
                continue;
            }
            if (favoriteCardIds.has(entry)) {
                diagnostics.push(buildDiagnostic('favorites', 'FAVORITES_ID_DUPLICATE',
                    `Favorite ID '${entry}' is stored more than once; it counts once.`,
                    entry, card.unitId));
                continue;
            }
            favoriteCardIds.add(entry);
        }
    } else {
        diagnostics.push(buildDiagnostic('favorites', 'FAVORITES_STATE_MALFORMED',
            `progress.favorites must be an array when present (received ${typeof favorites}); it was treated as empty.`,
            null, null));
    }

    return { favoriteCardIds, favoritesDiagnostics: diagnostics };
}

export function aggregateCurrentLevelReview(input) {
    validateInput(input);

    const levelId = input.levelId;
    const vocabulary = input.vocabulary;
    const progress = input.progress;
    const now = input.now;
    const unitScope = (input.unitId === undefined || input.unitId === null) ? null : input.unitId;

    const { participatingCards, cardById, vocabularyDiagnostics } = collectParticipatingCards(vocabulary, levelId);
    const { dueCardIds, srsDiagnostics } = collectDueCardIds(progress.srsData, cardById, now);
    const { favoriteCardIds, favoritesDiagnostics } = collectFavoriteCardIds(progress.favorites, cardById);

    const inScope = (card) => unitScope === null || card.unitId === unitScope;
    const scopedCards = participatingCards.filter(inScope);

    // Unscoped results cover every unit slot of the level (including empty or
    // fully-ignored units) so totals and per-unit counts always reconcile; a
    // scoped result contains only the requested unit, echoed even when it has
    // no candidates.
    const unitNumbers = [];
    if (unitScope === null) {
        for (let unitIndex = 0; unitIndex < vocabulary.length; unitIndex++) {
            unitNumbers.push(unitIndex + 1);
        }
    } else {
        unitNumbers.push(unitScope);
    }

    const buildSourceResult = (candidateCards, sourceDiagnostics) => {
        const byUnit = {};
        const countsByUnit = {};
        for (const unitNumber of unitNumbers) {
            byUnit[String(unitNumber)] = [];
            countsByUnit[String(unitNumber)] = 0;
        }
        const candidates = candidateCards.map(describeCard);
        for (const candidate of candidates) {
            const key = String(candidate.unitId);
            byUnit[key].push({ id: candidate.id, levelId: candidate.levelId, unitId: candidate.unitId });
            countsByUnit[key] += 1;
        }
        return { total: candidates.length, candidates, byUnit, countsByUnit, diagnostics: sourceDiagnostics };
    };

    const dueCandidateCards = scopedCards.filter(card => dueCardIds.has(card.id));
    const favoriteCandidateCards = scopedCards.filter(card => favoriteCardIds.has(card.id));

    // Vocabulary-level faults affected both candidate pools, so each source
    // result reports them alongside its own progress-side diagnostics; the
    // entries are independent copies so mutating one report cannot alter the other.
    return {
        levelId,
        unitScope,
        due: buildSourceResult(dueCandidateCards,
            [...vocabularyDiagnostics.map(d => ({ ...d })), ...srsDiagnostics]),
        favorites: buildSourceResult(favoriteCandidateCards,
            [...vocabularyDiagnostics.map(d => ({ ...d })), ...favoritesDiagnostics])
    };
}
