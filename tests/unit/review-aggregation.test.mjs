import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// REVIEW-001 — pure current-level review aggregation tests (LR-AGG / AC-13 / AC-14).
// Every expected outcome below is an independently specified literal; the module
// under test never computes the oracle. The injected clock is a fixed epoch.

import { aggregateCurrentLevelReview } from '../../js/core/review-aggregation.mjs';

const CLOCK = Date.parse('2026-09-03T12:00:00.000Z');
const PAST_ISO = '2026-09-01T00:00:00.000Z';
const BOUNDARY_ISO = '2026-09-03T12:00:00.000Z';
const FUTURE_ISO = '2026-09-05T00:00:00.000Z';

function cardFixture(id, unitId, overrides = {}) {
    return {
        id,
        levelId: 'a1',
        unitId,
        de: `Wort ${id}`,
        en: `word ${id}`,
        type: 'noun',
        ...overrides
    };
}

// Unit 1 holds the five boundary-level cards; units 2 and 3 provide scope spread.
function baseVocabulary() {
    return [
        ['1-0', '1-1', '1-2', '1-3', '1-4'].map(id => cardFixture(id, 1)),
        ['2-0', '2-1'].map(id => cardFixture(id, 2)),
        ['3-0', '3-1'].map(id => cardFixture(id, 3))
    ];
}

function srsRecord(level, nextReviewDate) {
    return { level, nextReviewDate, lastReviewed: 1780000000000 };
}

function run(input) {
    return aggregateCurrentLevelReview(input);
}

function baseInput(overrides = {}) {
    return {
        levelId: 'a1',
        vocabulary: baseVocabulary(),
        progress: { srsData: {}, favorites: [] },
        now: CLOCK,
        ...overrides
    };
}

test('REVIEW-001 case 1 (LR-AGG): no progress yields empty due and favorites with all-unit zero counts', () => {
    const result = run(baseInput());

    assert.equal(result.levelId, 'a1');
    assert.equal(result.unitScope, null);
    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.candidates, []);
    assert.deepEqual(Object.keys(result.due.byUnit), ['1', '2', '3']);
    assert.deepEqual(result.due.byUnit['1'], []);
    assert.deepEqual(result.due.byUnit['2'], []);
    assert.deepEqual(result.due.byUnit['3'], []);
    assert.deepEqual(result.due.countsByUnit, { '1': 0, '2': 0, '3': 0 });
    assert.equal(result.favorites.total, 0);
    assert.deepEqual(result.favorites.candidates, []);
    assert.deepEqual(result.favorites.countsByUnit, { '1': 0, '2': 0, '3': 0 });
    assert.deepEqual(result.due.diagnostics, []);
    assert.deepEqual(result.favorites.diagnostics, []);
});

test('REVIEW-001 case 2 (AC-13): unseen cards without any SRS record are never due', () => {
    const result = run(baseInput({ progress: { srsData: {}, favorites: ['1-0'] } }));

    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.candidates, []);
    // The unseen card is a legitimate favorites member; it must not leak into due.
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.due.diagnostics, []);
});

test('REVIEW-001 case 3 (AC-13): a well-formed level-0 record is not due and reports no diagnostic', () => {
    const result = run(baseInput({
        progress: { srsData: { '1-0': srsRecord(0, PAST_ISO) }, favorites: [] }
    }));

    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.candidates, []);
    assert.deepEqual(result.due.diagnostics, []);
});

test('REVIEW-001 case 4 (AC-13): levels 1-5 are due when nextReviewDate is exactly equal to the injected clock', () => {
    const progress = {
        srsData: {
            '1-0': srsRecord(1, BOUNDARY_ISO),
            '1-1': srsRecord(2, BOUNDARY_ISO),
            '1-2': srsRecord(3, BOUNDARY_ISO),
            '1-3': srsRecord(4, BOUNDARY_ISO),
            '1-4': srsRecord(5, BOUNDARY_ISO)
        },
        favorites: []
    };
    const result = run(baseInput({ progress }));

    // The exact boundary is inclusive: all five cards at the clock are due.
    assert.equal(result.due.total, 5);
    assert.deepEqual(result.due.candidates.map(c => c.id), ['1-0', '1-1', '1-2', '1-3', '1-4']);
    assert.deepEqual(result.due.countsByUnit, { '1': 5, '2': 0, '3': 0 });
    assert.deepEqual(result.due.diagnostics, []);

    // A legacy date-only boundary date at exactly midnight is also due at midnight.
    const midnight = Date.parse('2026-09-03T00:00:00.000Z');
    const dateOnly = run(baseInput({
        progress: { srsData: { '2-0': srsRecord(2, '2026-09-03') }, favorites: [] },
        now: midnight
    }));
    assert.deepEqual(dateOnly.due.candidates.map(c => c.id), ['2-0']);
});

test('REVIEW-001 case 5 (AC-13): future nextReviewDate cards are not due and report no diagnostic', () => {
    const result = run(baseInput({
        progress: {
            srsData: {
                '1-0': srsRecord(3, FUTURE_ISO),
                '2-0': srsRecord(2, '2099-01-01')
            },
            favorites: []
        }
    }));

    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.candidates, []);
    assert.deepEqual(result.due.diagnostics, []);
});

test('REVIEW-001 case 6 (AC-13): mastered level-6 records are not due even with a past date', () => {
    const result = run(baseInput({
        progress: {
            srsData: {
                '3-0': srsRecord(6, '2020-01-01T00:00:00.000Z'),
                '3-1': srsRecord(6, '2099-01-01')
            },
            favorites: []
        }
    }));

    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.candidates, []);
    assert.deepEqual(result.due.diagnostics, []);
});

test('REVIEW-001 case 7 (AC-13): invalid or missing nextReviewDate values are ignored and reported', () => {
    const progress = {
        srsData: {
            '1-0': srsRecord(2, 'not-a-date'),
            '1-1': srsRecord(2, '2026-02-30'),
            '1-2': srsRecord(2, '2026-13-01T00:00:00.000Z'),
            '1-3': srsRecord(2, '2026-09-03T10:00:00'),
            '1-4': srsRecord(2, 42),
            '2-0': { level: 2 }
        },
        favorites: []
    };
    const result = run(baseInput({ progress }));

    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.candidates, []);
    assert.equal(result.due.diagnostics.length, 6);
    for (const diag of result.due.diagnostics) {
        assert.equal(diag.source, 'srs');
        assert.equal(diag.code, 'SRS_RECORD_MALFORMED');
    }
    assert.deepEqual(result.due.diagnostics.map(d => d.id), ['1-0', '1-1', '1-2', '1-3', '1-4', '2-0']);
});

test('REVIEW-001 case 8 (AC-13): malformed SRS state is ignored and reported without crashing', () => {
    const progress = {
        srsData: {
            '1-0': null,
            '1-1': 'malformed',
            '1-2': 17,
            '1-3': [1, 2],
            '1-4': { nextReviewDate: PAST_ISO },
            '2-0': { level: 2.5, nextReviewDate: PAST_ISO },
            '2-1': { level: 7, nextReviewDate: PAST_ISO },
            '3-0': { level: -1, nextReviewDate: PAST_ISO }
        },
        favorites: []
    };
    const result = run(baseInput({ progress }));

    assert.equal(result.due.total, 0);
    assert.equal(result.due.diagnostics.length, 8);
    for (const diag of result.due.diagnostics) {
        assert.equal(diag.code, 'SRS_RECORD_MALFORMED');
    }
    assert.deepEqual(result.due.diagnostics.map(d => d.id), ['1-0', '1-1', '1-2', '1-3', '1-4', '2-0', '2-1', '3-0']);

    // A wholesale malformed srsData container is a data fault, not a crash.
    const wholesale = run(baseInput({ progress: { srsData: 'oops', favorites: [] } }));
    assert.equal(wholesale.due.total, 0);
    assert.equal(wholesale.due.diagnostics.length, 1);
    assert.equal(wholesale.due.diagnostics[0].code, 'SRS_STATE_MALFORMED');
});

test('REVIEW-001 case 9 (AC-14): duplicate stored favorite IDs count once and are reported', () => {
    const result = run(baseInput({
        progress: {
            srsData: { '1-0': srsRecord(2, PAST_ISO) },
            favorites: ['1-0', '1-0', '2-0']
        }
    }));

    assert.equal(result.favorites.total, 2);
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-0', '2-0']);
    assert.deepEqual(result.favorites.countsByUnit, { '1': 1, '2': 1, '3': 0 });
    assert.equal(result.favorites.diagnostics.length, 1);
    assert.equal(result.favorites.diagnostics[0].code, 'FAVORITES_ID_DUPLICATE');
    assert.equal(result.favorites.diagnostics[0].id, '1-0');
    // The duplicate is a favorites-side data fault: due stays untouched.
    assert.deepEqual(result.due.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.due.diagnostics, []);

    // A wholesale malformed favorites container is a data fault, not a crash.
    const wholesale = run(baseInput({ progress: { srsData: {}, favorites: 'oops' } }));
    assert.equal(wholesale.favorites.total, 0);
    assert.equal(wholesale.favorites.diagnostics.length, 1);
    assert.equal(wholesale.favorites.diagnostics[0].code, 'FAVORITES_STATE_MALFORMED');
});

test('REVIEW-001 case 10 (AC-14): unknown and stale IDs are ignored and reported in both sources', () => {
    const result = run(baseInput({
        progress: {
            srsData: { '99-0': srsRecord(3, PAST_ISO), '0-0': srsRecord(3, PAST_ISO) },
            favorites: ['99-0', '1-0']
        }
    }));

    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.diagnostics.map(d => d.code), ['SRS_ID_UNKNOWN', 'SRS_ID_UNKNOWN']);
    assert.deepEqual(result.due.diagnostics.map(d => d.id), ['99-0', '0-0']);

    assert.equal(result.favorites.total, 1);
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.favorites.diagnostics.map(d => d.code), ['FAVORITES_ID_UNKNOWN']);
    assert.deepEqual(result.favorites.diagnostics.map(d => d.id), ['99-0']);

    // Malformed favorite entries (non-string, empty) are ignored and reported too.
    const malformed = run(baseInput({ progress: { srsData: {}, favorites: [42, '', '2-0'] } }));
    assert.deepEqual(malformed.favorites.candidates.map(c => c.id), ['2-0']);
    assert.deepEqual(malformed.favorites.diagnostics.map(d => d.code),
        ['FAVORITES_ENTRY_MALFORMED', 'FAVORITES_ENTRY_MALFORMED']);
});

test('REVIEW-001 case 11 (AC-13): the same local ID in two different levels cannot cross into the result', () => {
    // The a1 vocabulary and a b2 vocabulary both contain a card with local ID '1-0'.
    const a1Vocabulary = baseVocabulary();
    const b2Vocabulary = [[cardFixture('1-0', 1, { levelId: 'b2', de: 'b2 Wort' })]];
    const sharedProgress = {
        srsData: { '1-0': srsRecord(2, PAST_ISO) },
        favorites: ['1-0']
    };

    // Aggregating a1 resolves the ID against the a1 card only.
    const a1Result = run({ levelId: 'a1', vocabulary: a1Vocabulary, progress: sharedProgress, now: CLOCK });
    assert.deepEqual(a1Result.due.candidates, [{ id: '1-0', levelId: 'a1', unitId: 1 }]);
    assert.deepEqual(a1Result.favorites.candidates, [{ id: '1-0', levelId: 'a1', unitId: 1 }]);

    // Aggregating b2 resolves the same stored ID against the b2 card only.
    const b2Result = run({ levelId: 'b2', vocabulary: b2Vocabulary, progress: sharedProgress, now: CLOCK });
    assert.deepEqual(b2Result.due.candidates, [{ id: '1-0', levelId: 'b2', unitId: 1 }]);
    assert.deepEqual(b2Result.favorites.candidates, [{ id: '1-0', levelId: 'b2', unitId: 1 }]);

    // A foreign-level card present in the requested level's vocabulary is excluded
    // and reported; its stored record then resolves to no participating card.
    const contaminated = run({
        levelId: 'a1',
        vocabulary: b2Vocabulary,
        progress: sharedProgress,
        now: CLOCK
    });
    assert.equal(contaminated.due.total, 0);
    assert.equal(contaminated.due.diagnostics.length, 2);
    assert.equal(contaminated.due.diagnostics[0].code, 'VOCAB_CARD_FOREIGN_LEVEL');
    assert.equal(contaminated.due.diagnostics[0].id, '1-0');
    assert.equal(contaminated.due.diagnostics[1].code, 'SRS_ID_UNKNOWN');
    assert.equal(contaminated.favorites.diagnostics.length, 2);
    assert.equal(contaminated.favorites.diagnostics[0].code, 'VOCAB_CARD_FOREIGN_LEVEL');
    assert.equal(contaminated.favorites.diagnostics[1].code, 'FAVORITES_ID_UNKNOWN');
});

test('REVIEW-001 case 12 (AC-14): optional unit filtering contains only the requested unit', () => {
    const progress = {
        srsData: {
            '1-0': srsRecord(2, PAST_ISO),
            '3-1': srsRecord(4, PAST_ISO)
        },
        favorites: ['1-0', '3-1', '2-0']
    };
    const result = run(baseInput({ progress, unitId: 3 }));

    assert.equal(result.unitScope, 3);
    assert.equal(result.due.total, 1);
    assert.deepEqual(result.due.candidates.map(c => c.id), ['3-1']);
    assert.deepEqual(Object.keys(result.due.byUnit), ['3']);
    assert.deepEqual(result.due.countsByUnit, { '3': 1 });

    assert.equal(result.favorites.total, 1);
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['3-1']);
    assert.deepEqual(Object.keys(result.favorites.byUnit), ['3']);
    assert.deepEqual(result.favorites.countsByUnit, { '3': 1 });

    // Out-of-scope level cards are not candidates and are not reported as unknown.
    assert.deepEqual(result.due.diagnostics, []);
    assert.deepEqual(result.favorites.diagnostics, []);

    // Unscoped, the same progress yields the full membership.
    const unscoped = run(baseInput({ progress }));
    assert.equal(unscoped.due.total, 2);
    assert.equal(unscoped.favorites.total, 3);
    assert.equal(unscoped.unitScope, null);
});

test('REVIEW-001 case 13 (AC-14): due and favorites overlap without coupling the sources', () => {
    const progress = {
        srsData: {
            '1-0': srsRecord(2, PAST_ISO), // due and favorite
            '3-0': srsRecord(3, PAST_ISO)  // due only
        },
        favorites: ['1-0', '2-0'] // '2-0' is unseen: favorite only
    };
    const result = run(baseInput({ progress }));

    assert.deepEqual(result.due.candidates.map(c => c.id), ['1-0', '3-0']);
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-0', '2-0']);
    // The unseen favorite must remain a favorites member even though it is not due.
    assert.equal(result.favorites.total, 2);
    assert.deepEqual(result.due.diagnostics, []);
    assert.deepEqual(result.favorites.diagnostics, []);
});

test('REVIEW-001 case 14 (LR-AGG): empty vocabulary yields empty results without diagnostics for structure', () => {
    const empty = run({ levelId: 'a1', vocabulary: [], progress: { srsData: {}, favorites: ['1-0'] }, now: CLOCK });
    assert.equal(empty.due.total, 0);
    assert.deepEqual(empty.due.byUnit, {});
    assert.deepEqual(empty.due.countsByUnit, {});
    assert.equal(empty.favorites.total, 0);
    assert.deepEqual(empty.favorites.byUnit, {});
    assert.deepEqual(empty.favorites.countsByUnit, {});
    // The stored favorite has no card to match: unknown, reported.
    assert.deepEqual(empty.favorites.diagnostics.map(d => d.code), ['FAVORITES_ID_UNKNOWN']);

    // Reserved empty unit slots exist in the level structure with zero counts.
    const emptyUnits = run({ levelId: 'a1', vocabulary: [[], [], []], progress: { srsData: {}, favorites: [] }, now: CLOCK });
    assert.deepEqual(Object.keys(emptyUnits.due.byUnit), ['1', '2', '3']);
    assert.deepEqual(emptyUnits.due.countsByUnit, { '1': 0, '2': 0, '3': 0 });
});

test('REVIEW-001 case 15 (AC-14): candidate order follows vocabulary source order, not stored order', () => {
    const progress = {
        srsData: {
            '3-1': srsRecord(2, PAST_ISO),
            '1-0': srsRecord(3, PAST_ISO)
        },
        favorites: ['3-1', '1-0', '2-0']
    };
    const first = run(baseInput({ progress }));
    const second = run(baseInput({ progress }));

    assert.deepEqual(first.due.candidates.map(c => c.id), ['1-0', '3-1']);
    assert.deepEqual(first.favorites.candidates.map(c => c.id), ['1-0', '2-0', '3-1']);
    // Determinism: identical inputs produce deep-equal results.
    assert.deepStrictEqual(first, second);
    // Descriptors are fresh objects, not aliases of the input cards.
    const aliasedInput = baseInput({ progress });
    const aliasedResult = run(aliasedInput);
    assert.notEqual(aliasedResult.due.candidates[0], aliasedInput.vocabulary[0][0]);
    assert.notEqual(aliasedResult.favorites.candidates[0], aliasedInput.vocabulary[0][0]);
    // Mutating an output descriptor cannot affect the input vocabulary.
    aliasedResult.due.candidates[0].id = 'mutated';
    assert.equal(aliasedInput.vocabulary[0][0].id, '1-0');
});

test('REVIEW-001 case 16 (AC-14): inputs are never mutated', () => {
    const input = {
        levelId: 'a1',
        vocabulary: baseVocabulary(),
        progress: {
            srsData: {
                '1-0': srsRecord(2, PAST_ISO),
                '99-0': srsRecord(3, 'garbage-date')
            },
            favorites: ['1-0', '1-0', '77-0']
        },
        now: CLOCK,
        unitId: 1
    };
    const vocabularyBefore = structuredClone(input.vocabulary);
    const progressBefore = structuredClone(input.progress);

    run(input);

    assert.deepStrictEqual(input.vocabulary, vocabularyBefore);
    assert.deepStrictEqual(input.progress, progressBefore);
    assert.equal(input.levelId, 'a1');
    assert.equal(input.now, CLOCK);
    assert.equal(input.unitId, 1);
});

test('REVIEW-001 case 17 (LR-AGG): invalid top-level arguments and clock values throw TypeError', () => {
    const valid = baseInput();

    const invalidInputs = [
        [{ ...valid, levelId: undefined }, /levelId/],
        [{ ...valid, levelId: '' }, /levelId/],
        [{ ...valid, levelId: 42 }, /levelId/],
        [{ ...valid, vocabulary: undefined }, /vocabulary/],
        [{ ...valid, vocabulary: 'not-an-array' }, /vocabulary/],
        [{ ...valid, vocabulary: [42] }, /unit/],
        [{ ...valid, progress: undefined }, /progress/],
        [{ ...valid, progress: null }, /progress/],
        [{ ...valid, progress: 'oops' }, /progress/],
        [{ ...valid, progress: [] }, /progress/],
        [{ ...valid, now: undefined }, /now/],
        [{ ...valid, now: NaN }, /now/],
        [{ ...valid, now: Infinity }, /now/],
        [{ ...valid, now: -Infinity }, /now/],
        [{ ...valid, now: -1 }, /now/],
        [{ ...valid, now: '2026-09-03T12:00:00.000Z' }, /now/],
        [{ ...valid, unitId: 0 }, /unitId/],
        [{ ...valid, unitId: -3 }, /unitId/],
        [{ ...valid, unitId: 2.5 }, /unitId/],
        [{ ...valid, unitId: '3' }, /unitId/]
    ];
    for (const [badInput, messagePattern] of invalidInputs) {
        assert.throws(() => run(badInput), (err) => {
            assert.ok(err instanceof TypeError);
            assert.match(err.message, messagePattern);
            return true;
        });
    }

    // unitId null and undefined both mean "all units" and must not throw.
    assert.equal(run(baseInput({ unitId: null })).unitScope, null);
    assert.equal(run(baseInput({ unitId: undefined })).unitScope, null);
});

test('REVIEW-001 case 18 (LR-AGG): malformed, unit-mismatched, and duplicate vocabulary cards are ignored and reported', () => {
    const vocabulary = [
        [
            null,
            { levelId: 'a1', unitId: 1, de: 'no id' },
            cardFixture('1-0', 2),
            cardFixture('1-0', 1),
            cardFixture('1-0', 1),
            cardFixture('1-1', 1)
        ],
        [cardFixture('2-0', 2)]
    ];
    const progress = { srsData: { '1-0': srsRecord(2, PAST_ISO) }, favorites: ['1-1', '1-0'] };
    const result = run({ levelId: 'a1', vocabulary, progress, now: CLOCK });

    // Only the first well-formed '1-0' and '1-1' participate; stored progress
    // still resolves against the participating card.
    assert.deepEqual(result.due.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-0', '1-1']);
    assert.deepEqual(result.due.diagnostics.map(d => d.code),
        ['VOCAB_CARD_MALFORMED', 'VOCAB_CARD_MALFORMED', 'VOCAB_CARD_UNIT_MISMATCH', 'VOCAB_CARD_ID_DUPLICATE']);
    assert.deepEqual(result.due.diagnostics.map(d => d.id), [null, null, '1-0', '1-0']);
    assert.deepEqual(result.favorites.diagnostics.map(d => d.code),
        ['VOCAB_CARD_MALFORMED', 'VOCAB_CARD_MALFORMED', 'VOCAB_CARD_UNIT_MISMATCH', 'VOCAB_CARD_ID_DUPLICATE']);
    assert.deepEqual(result.favorites.diagnostics.map(d => d.id), [null, null, '1-0', '1-0']);
});

// REVIEW-001-C1 — strict plain-record validation tests (LR-AGG / AC-21).
// A plain data record is an ordinary object with a record-shaped inheritance
// chain: no prototype at all (a null-prototype dictionary) or a direct
// prototype that is itself prototype-less (the shape of Object.prototype in
// every realm). Date, Map, Set, and RegExp instances, arrays, functions, and
// user-defined class instances are not plain records and must never be
// processed as persisted records. Cases A-E are the intentional RED failures
// against the uncorrected permissive predicate; cases F and G guard against
// overcorrection (null-prototype and cross-realm dictionaries must remain
// valid records). The original 18 cases above must remain green unchanged.

test('REVIEW-001-C1 case A (LR-AGG): a class-instance progress object throws TypeError', () => {
    class ProgressRecord {
        constructor() {
            // The instance is object-shaped and carries valid-looking fields,
            // but it is not a plain data record and must fail fast.
            this.srsData = { '1-0': srsRecord(2, PAST_ISO) };
            this.favorites = ['1-0'];
        }
    }
    assert.throws(() => run(baseInput({ progress: new ProgressRecord() })), (err) => {
        assert.ok(err instanceof TypeError);
        assert.match(err.message, /progress/);
        return true;
    });

    // Other non-plain progress containers throw the same way.
    for (const nonPlain of [new Date(), new Map(), new Set(), /pattern/]) {
        assert.throws(() => run(baseInput({ progress: nonPlain })), (err) => {
            assert.ok(err instanceof TypeError);
            assert.match(err.message, /progress/);
            return true;
        });
    }

    // A non-plain top-level input object fails fast even when every field
    // inside it is valid.
    class OptionsRecord {
        constructor() {
            this.levelId = 'a1';
            this.vocabulary = baseVocabulary();
            this.progress = { srsData: {}, favorites: [] };
            this.now = CLOCK;
        }
    }
    assert.throws(() => run(new OptionsRecord()), TypeError);
    assert.throws(() => run(new Date()), TypeError);
});

test('REVIEW-001-C1 case B (LR-AGG): Date and Map used as srsData produce SRS_STATE_MALFORMED', () => {
    for (const nonPlainContainer of [new Date(), new Map(), new Set(), /pattern/]) {
        const result = run(baseInput({ progress: { srsData: nonPlainContainer, favorites: [] } }));

        // The non-plain container is treated as empty with exactly one diagnostic.
        assert.equal(result.due.total, 0);
        assert.deepEqual(result.due.candidates, []);
        assert.equal(result.due.diagnostics.length, 1);
        assert.equal(result.due.diagnostics[0].source, 'srs');
        assert.equal(result.due.diagnostics[0].code, 'SRS_STATE_MALFORMED');
        assert.equal(result.due.diagnostics[0].id, null);
        // The favorites side is untouched by an srsData container fault.
        assert.deepEqual(result.favorites.diagnostics, []);
    }
});

test('REVIEW-001-C1 case C (LR-AGG): a class-instance srsData container with own enumerable SRS entries cannot admit due cards', () => {
    class SrsDataContainer {
        constructor() {
            // Own enumerable entries that look exactly like due-ready records.
            this['1-0'] = srsRecord(2, PAST_ISO);
            this['3-0'] = srsRecord(3, PAST_ISO);
        }
    }
    const result = run(baseInput({ progress: { srsData: new SrsDataContainer(), favorites: ['1-0'] } }));

    // The class instance is not a plain record container: no entry can admit a card.
    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.candidates, []);
    assert.equal(result.due.diagnostics.length, 1);
    assert.equal(result.due.diagnostics[0].code, 'SRS_STATE_MALFORMED');
    // The favorite still resolves normally: the container fault is srs-side only.
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.favorites.diagnostics, []);
});

test('REVIEW-001-C1 case D (LR-AGG): a class-instance SRS record produces SRS_RECORD_MALFORMED', () => {
    class SrsRecordEntry {
        constructor(level, nextReviewDate) {
            this.level = level;
            this.nextReviewDate = nextReviewDate;
            this.lastReviewed = 1780000000000;
        }
    }
    const progress = {
        srsData: {
            '1-0': new SrsRecordEntry(2, PAST_ISO),
            '2-0': new Date()
        },
        favorites: []
    };
    const result = run(baseInput({ progress }));

    // Neither a class-instance record nor a Date record can make its card due.
    assert.equal(result.due.total, 0);
    assert.deepEqual(result.due.candidates, []);
    assert.equal(result.due.diagnostics.length, 2);
    for (const diag of result.due.diagnostics) {
        assert.equal(diag.source, 'srs');
        assert.equal(diag.code, 'SRS_RECORD_MALFORMED');
    }
    assert.deepEqual(result.due.diagnostics.map(d => d.id), ['1-0', '2-0']);
});

test('REVIEW-001-C1 case E (LR-AGG): a class-instance vocabulary card produces VOCAB_CARD_MALFORMED', () => {
    class VocabularyCard {
        constructor(id, unitId) {
            this.id = id;
            this.levelId = 'a1';
            this.unitId = unitId;
            this.de = 'Wort';
            this.en = 'word';
        }
    }
    const vocabulary = [
        [new VocabularyCard('1-0', 1), cardFixture('1-1', 1)],
        []
    ];
    const progress = { srsData: { '1-0': srsRecord(2, PAST_ISO) }, favorites: ['1-0', '1-1'] };
    const result = run({ levelId: 'a1', vocabulary, progress, now: CLOCK });

    // Only the plain card participates; the class-instance card is ignored and reported.
    assert.deepEqual(result.due.candidates.map(c => c.id), []);
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-1']);
    assert.equal(result.favorites.diagnostics.length, 2);
    assert.equal(result.favorites.diagnostics[0].code, 'VOCAB_CARD_MALFORMED');
    assert.equal(result.favorites.diagnostics[0].id, null);
    assert.equal(result.favorites.diagnostics[0].unitId, 1);
    assert.equal(result.favorites.diagnostics[1].code, 'FAVORITES_ID_UNKNOWN');
    assert.equal(result.favorites.diagnostics[1].id, '1-0');
    // The stored record for the rejected card cannot make anything due either.
    assert.equal(result.due.diagnostics.length, 2);
    assert.equal(result.due.diagnostics[0].code, 'VOCAB_CARD_MALFORMED');
    assert.equal(result.due.diagnostics[1].code, 'SRS_ID_UNKNOWN');
});

test('REVIEW-001-C1 case F (LR-AGG): an ordinary null-prototype dictionary remains supported', () => {
    // Every plain-object validation site accepts a null-prototype dictionary.
    const nullProtoCard = Object.assign(Object.create(null), {
        id: '1-0', levelId: 'a1', unitId: 1, de: 'Wort', en: 'word'
    });
    const nullProtoRecord = Object.assign(Object.create(null), srsRecord(2, PAST_ISO));
    const nullProtoSrsData = Object.assign(Object.create(null), { '1-0': nullProtoRecord });
    const nullProtoProgress = Object.assign(Object.create(null), { srsData: nullProtoSrsData, favorites: ['1-0'] });
    const nullProtoInput = Object.assign(Object.create(null), {
        levelId: 'a1',
        vocabulary: [[nullProtoCard], [cardFixture('2-0', 2)]],
        progress: nullProtoProgress,
        now: CLOCK
    });

    const result = run(nullProtoInput);

    assert.deepEqual(result.due.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.due.diagnostics, []);
    assert.deepEqual(result.favorites.diagnostics, []);
    assert.deepEqual(result.favorites.countsByUnit, { '1': 1, '2': 0 });
});

test('REVIEW-001-C1 case G (LR-AGG): a genuine cross-realm plain object remains supported', () => {
    // The whole input graph (options object, progress, srsData container, SRS
    // record, and vocabulary cards) is created inside a separate JavaScript
    // realm, so every prototype is that realm's Object.prototype.
    const crossRealmInput = vm.runInNewContext(
        '({' +
        '    levelId: "a1",' +
        '    vocabulary: [' +
        '        [({ id: "1-0", levelId: "a1", unitId: 1, de: "Wort", en: "word" })],' +
        '        [({ id: "2-0", levelId: "a1", unitId: 2, de: "Wort", en: "word" })]' +
        '    ],' +
        '    progress: { srsData: { "1-0": { level: 2, nextReviewDate: past, lastReviewed: 1780000000000 } }, favorites: ["1-0"] },' +
        '    now: clock' +
        '})',
        vm.createContext({ past: PAST_ISO, clock: CLOCK })
    );

    // Prove the objects are genuinely cross-realm: their prototypes are not
    // this realm's Object.prototype, so a same-realm-only check would fail.
    assert.notEqual(Object.getPrototypeOf(crossRealmInput), Object.prototype);
    assert.notEqual(Object.getPrototypeOf(crossRealmInput.progress), Object.prototype);
    assert.notEqual(Object.getPrototypeOf(crossRealmInput.progress.srsData), Object.prototype);
    assert.notEqual(Object.getPrototypeOf(crossRealmInput.progress.srsData['1-0']), Object.prototype);
    assert.notEqual(Object.getPrototypeOf(crossRealmInput.vocabulary[0][0]), Object.prototype);

    const result = run(crossRealmInput);

    assert.deepEqual(result.due.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.favorites.candidates.map(c => c.id), ['1-0']);
    assert.deepEqual(result.due.diagnostics, []);
    assert.deepEqual(result.favorites.diagnostics, []);
    assert.deepEqual(result.favorites.countsByUnit, { '1': 1, '2': 0 });
});
