import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// REVIEW-002 — seeded bounded review session plan tests (LR-SESSION / AC-15 / AC-16).
// Every expected order below is an independently pinned literal reference vector
// supplied by the assignment; the module under test never computes the oracle.
// Balance and membership invariants are asserted from these literals and from
// exact sorted-multiset comparisons, never by re-running the planner against
// itself as the expected value.

import { createReviewSessionPlan } from '../../js/core/review-session-plan.mjs';

const ALGORITHM_ID = 'fnv1a32-mulberry32-fisher-yates-v1';
const ALPHA_SEED = 'review-seed-alpha';
const BETA_SEED = 'review-seed-beta';

// Pinned reference permutations for candidates card-0 through card-9.
const ALPHA_ORDER = [
    'card-5', 'card-1', 'card-9', 'card-0', 'card-6',
    'card-4', 'card-2', 'card-8', 'card-3', 'card-7'
];
const BETA_ORDER = [
    'card-8', 'card-9', 'card-3', 'card-2', 'card-0',
    'card-4', 'card-6', 'card-5', 'card-7', 'card-1'
];

function candidate(id, unitId = 1, overrides = {}) {
    // Extra properties prove the planner copies only id, levelId, and unitId.
    return {
        id,
        levelId: 'a1',
        unitId,
        de: `Wort ${id}`,
        en: `word ${id}`,
        ...overrides
    };
}

function tenCandidates() {
    return Array.from({ length: 10 }, (_, index) => candidate(`card-${index}`));
}

function planInput(overrides = {}) {
    return {
        source: 'due',
        levelId: 'a1',
        unitId: null,
        candidates: tenCandidates(),
        seed: ALPHA_SEED,
        ...overrides
    };
}

function chunkSizesOf(plan) {
    return plan.chunks.map(chunk => chunk.size);
}

function flattenedIds(plan) {
    return plan.chunks.flatMap(chunk => chunk.candidates.map(descriptor => descriptor.id));
}

// Exactly-once membership without depending on the shuffle: an equal length,
// a duplicate-free id set, and an equal sorted multiset.
function assertExactMembership(plan, ids) {
    const flattened = flattenedIds(plan);
    assert.equal(flattened.length, ids.length);
    assert.equal(new Set(flattened).size, ids.length);
    assert.deepEqual([...flattened].sort(), [...ids].sort());
}

test('REVIEW-002 case 1 (LR-SESSION): empty input produces zero chunks, not one empty chunk', () => {
    const plan = createReviewSessionPlan({
        source: 'due',
        levelId: 'a1',
        unitId: null,
        candidates: [],
        seed: ALPHA_SEED
    });

    assert.equal(plan.totalCandidates, 0);
    assert.deepEqual(plan.chunks, []);
    assert.equal(plan.schemaVersion, 1);
    assert.equal(plan.algorithm, ALGORITHM_ID);
    assert.equal(plan.source, 'due');
    assert.deepEqual(plan.scope, { levelId: 'a1', unitId: null });
    assert.equal(plan.seed, ALPHA_SEED);
    assert.equal(plan.maxSessionSize, 50);

    // Zero candidates is zero chunks for the favorites source too.
    const favorites = createReviewSessionPlan({
        source: 'favorites',
        levelId: 'b2',
        unitId: 3,
        candidates: [],
        seed: BETA_SEED
    });
    assert.deepEqual(favorites.chunks, []);
    assert.equal(favorites.totalCandidates, 0);
});

test('REVIEW-002 case 2 (AC-15): exact chunk sizes for 1, 49, 50, 51, 99, 100, and 101 candidates', () => {
    const expectedSizes = {
        1: [1],
        49: [49],
        50: [50],
        51: [26, 25],
        99: [50, 49],
        100: [50, 50],
        101: [34, 34, 33]
    };
    for (const [count, expected] of Object.entries(expectedSizes)) {
        const ids = Array.from({ length: Number(count) }, (_, index) => `card-${index}`);
        const plan = createReviewSessionPlan({
            source: 'due',
            levelId: 'a1',
            unitId: null,
            candidates: ids.map((id, index) => candidate(id, 1 + (index % 5))),
            seed: ALPHA_SEED
        });

        assert.equal(plan.totalCandidates, Number(count));
        assert.deepEqual(chunkSizesOf(plan), expected);
        // Chunk indices are zero-based and consecutive; the size field agrees
        // with the actual candidate count of every chunk.
        plan.chunks.forEach((chunk, index) => {
            assert.equal(chunk.index, index);
            assert.equal(chunk.candidates.length, chunk.size);
        });
        // Every candidate appears exactly once: none missing, none duplicated.
        assertExactMembership(plan, ids);
    }
});

test('REVIEW-002 case 3 (AC-15): a large synthetic set stays bounded, balanced, and complete', () => {
    for (const [count, expected] of [
        [473, [48, 48, 48, 47, 47, 47, 47, 47, 47, 47]],
        [500, [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]]
    ]) {
        const ids = Array.from({ length: count }, (_, index) => `card-${index}`);
        const plan = createReviewSessionPlan({
            source: 'favorites',
            levelId: 'a1',
            unitId: null,
            candidates: ids.map((id, index) => candidate(id, 1 + (index % 24))),
            seed: BETA_SEED
        });

        assert.equal(plan.totalCandidates, count);
        assert.deepEqual(chunkSizesOf(plan), expected);
        for (const size of chunkSizesOf(plan)) {
            assert.ok(size <= 50, `chunk size ${size} exceeds the maximum of 50`);
        }
        const sizes = chunkSizesOf(plan);
        assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, 'chunk sizes differ by more than one');
        assertExactMembership(plan, ids);
    }
});

test('REVIEW-002 case 4 (AC-15): custom maxSessionSize values including 1 and a value below 50', () => {
    // maxSessionSize 1: every chunk holds exactly one candidate.
    const ids5 = ['card-0', 'card-1', 'card-2', 'card-3', 'card-4'];
    const singles = createReviewSessionPlan({
        source: 'due',
        levelId: 'a1',
        unitId: null,
        candidates: ids5.map(id => candidate(id, 1)),
        seed: ALPHA_SEED,
        maxSessionSize: 1
    });
    assert.deepEqual(chunkSizesOf(singles), [1, 1, 1, 1, 1]);
    assert.equal(singles.maxSessionSize, 1);
    singles.chunks.forEach(chunk => assert.equal(chunk.candidates.length, 1));
    assertExactMembership(singles, ids5);

    // A custom maximum below 50: 25 candidates at 10 become 9, 8, 8.
    const ids25 = Array.from({ length: 25 }, (_, index) => `card-${index}`);
    const tens = createReviewSessionPlan({
        source: 'favorites',
        levelId: 'a1',
        unitId: null,
        candidates: ids25.map(id => candidate(id, 2)),
        seed: BETA_SEED,
        maxSessionSize: 10
    });
    assert.deepEqual(chunkSizesOf(tens), [9, 8, 8]);
    assert.equal(tens.maxSessionSize, 10);
    assertExactMembership(tens, ids25);

    // An explicit maximum of 50 equals the default for the same input.
    const ids60 = Array.from({ length: 60 }, (_, index) => `card-${index}`);
    const explicit = createReviewSessionPlan({
        source: 'due',
        levelId: 'a1',
        unitId: null,
        candidates: ids60.map(id => candidate(id, 3)),
        seed: ALPHA_SEED,
        maxSessionSize: 50
    });
    assert.deepEqual(chunkSizesOf(explicit), [30, 30]);
    assert.equal(explicit.maxSessionSize, 50);
});

test('REVIEW-002 case 5 (AC-16): the pinned alpha and beta reference permutations are reproduced exactly', () => {
    const alphaPlan = createReviewSessionPlan({
        source: 'due',
        levelId: 'a1',
        unitId: null,
        candidates: tenCandidates(),
        seed: ALPHA_SEED
    });
    assert.deepEqual(chunkSizesOf(alphaPlan), [10]);
    assert.deepEqual(flattenedIds(alphaPlan), ALPHA_ORDER);
    // Each returned descriptor is exactly {id, levelId, unitId}: extra input
    // properties are ignored, never copied into the plan.
    alphaPlan.chunks[0].candidates.forEach((descriptor, position) => {
        assert.deepEqual(descriptor, {
            id: ALPHA_ORDER[position],
            levelId: 'a1',
            unitId: 1
        });
    });

    const betaPlan = createReviewSessionPlan({
        source: 'favorites',
        levelId: 'a1',
        unitId: null,
        candidates: tenCandidates(),
        seed: BETA_SEED
    });
    assert.deepEqual(flattenedIds(betaPlan), BETA_ORDER);
});

test('REVIEW-002 case 6 (AC-16): repeated calls with identical input and seed return deeply equal plans', () => {
    const first = createReviewSessionPlan(planInput());
    const second = createReviewSessionPlan(planInput());
    assert.deepStrictEqual(first, second);

    // The same input object also yields the deeply equal plan on re-runs.
    const shared = planInput();
    const third = createReviewSessionPlan(shared);
    const fourth = createReviewSessionPlan(shared);
    assert.deepStrictEqual(third, fourth);
    assert.deepStrictEqual(first, third);
});

test('REVIEW-002 case 7 (AC-16): the chosen alpha and beta seeds produce their separately pinned distinct permutations', () => {
    const alphaOrder = flattenedIds(createReviewSessionPlan(planInput()));
    const betaOrder = flattenedIds(createReviewSessionPlan({ ...planInput(), seed: BETA_SEED }));

    // Only the chosen pair is claimed to differ; both match their own literal.
    assert.notDeepEqual(alphaOrder, betaOrder);
    assert.deepEqual(alphaOrder, ALPHA_ORDER);
    assert.deepEqual(betaOrder, BETA_ORDER);
});

test('REVIEW-002 case 8 (AC-16): the flattened chunks equal the complete shuffled order', () => {
    const chunked = createReviewSessionPlan({ ...planInput(), maxSessionSize: 4 });
    assert.deepEqual(chunkSizesOf(chunked), [4, 3, 3]);

    // Flattening preserves the shuffled order exactly: the pinned literal
    // permutation, not a per-chunk reshuffle or re-selection.
    assert.deepEqual(flattenedIds(chunked), ALPHA_ORDER);
    assertExactMembership(chunked, Array.from({ length: 10 }, (_, index) => `card-${index}`));
});

test('REVIEW-002 case 9 (LR-SESSION): exact duplicate descriptors count once using their first occurrence', () => {
    // card-3 appears twice and card-7 three times. The repeats are exact
    // descriptor duplicates (their extra properties differ but are ignored),
    // so the plan still holds each of the ten ids exactly once.
    const duplicated = [
        ...tenCandidates(),
        candidate('card-3', 1, { de: 'erstes Duplikat' }),
        candidate('card-7', 1, { de: 'zweites Duplikat' }),
        candidate('card-7', 1, { en: 'duplicate word' })
    ];
    const plan = createReviewSessionPlan({ ...planInput(), candidates: duplicated });
    assert.equal(plan.totalCandidates, 10);
    assert.deepEqual(chunkSizesOf(plan), [10]);
    assert.deepEqual(flattenedIds(plan), ALPHA_ORDER);
});

test('REVIEW-002 case 10 (LR-SESSION): duplicate IDs with conflicting metadata throw TypeError', () => {
    // The same id carrying a different unitId contradicts its first occurrence.
    assert.throws(() => createReviewSessionPlan({
        ...planInput(),
        candidates: [candidate('card-1', 1), candidate('card-2', 1), candidate('card-1', 2)]
    }), (err) => {
        assert.ok(err instanceof TypeError);
        assert.match(err.message, /card-1/);
        assert.match(err.message, /conflict/i);
        return true;
    });
});

test('REVIEW-002 case 11 (LR-SESSION): foreign-level candidates throw TypeError', () => {
    assert.throws(() => createReviewSessionPlan({
        ...planInput(),
        candidates: [candidate('card-1', 1), candidate('card-2', 1, { levelId: 'b2' })]
    }), (err) => {
        assert.ok(err instanceof TypeError);
        assert.match(err.message, /card-2/);
        assert.match(err.message, /level/i);
        return true;
    });
});

test('REVIEW-002 case 12 (LR-SESSION): a candidate outside the requested unit scope throws TypeError', () => {
    assert.throws(() => createReviewSessionPlan({
        ...planInput(),
        unitId: 2,
        candidates: [candidate('card-1', 2), candidate('card-2', 1)]
    }), (err) => {
        assert.ok(err instanceof TypeError);
        assert.match(err.message, /card-2/);
        assert.match(err.message, /unit/i);
        return true;
    });
});

test('REVIEW-002 case 13 (LR-SESSION): all-unit scope accepts candidates from multiple units', () => {
    const mixed = [
        candidate('card-1', 1), candidate('card-2', 1),
        candidate('card-3', 2), candidate('card-4', 2),
        candidate('card-5', 3), candidate('card-6', 3)
    ];
    const allUnits = createReviewSessionPlan({ ...planInput(), candidates: mixed });
    assert.equal(allUnits.totalCandidates, 6);
    assert.deepEqual(allUnits.scope, { levelId: 'a1', unitId: null });
    assertExactMembership(allUnits, mixed.map(card => card.id));
    // Descriptors keep their own unit identity inside the plan.
    const unitIdById = new Map(allUnits.chunks.flatMap(chunk => chunk.candidates).map(d => [d.id, d.unitId]));
    for (const card of mixed) {
        assert.equal(unitIdById.get(card.id), card.unitId);
    }

    // A scoped plan accepts the requested unit's candidates and echoes the scope.
    const scoped = createReviewSessionPlan({
        ...planInput(),
        unitId: 2,
        candidates: [candidate('card-3', 2), candidate('card-4', 2)]
    });
    assert.deepEqual(scoped.scope, { levelId: 'a1', unitId: 2 });
    assert.equal(scoped.totalCandidates, 2);
    scoped.chunks.flatMap(chunk => chunk.candidates).forEach(descriptor => {
        assert.equal(descriptor.unitId, 2);
    });
});

test('REVIEW-002 case 14 (LR-SESSION): source and scope are preserved exactly in the result', () => {
    const due = createReviewSessionPlan({
        source: 'due',
        levelId: 'b2',
        unitId: 3,
        candidates: [candidate('card-1', 3, { levelId: 'b2' })],
        seed: 'some-seed'
    });
    assert.equal(due.source, 'due');
    assert.deepEqual(due.scope, { levelId: 'b2', unitId: 3 });
    assert.equal(due.seed, 'some-seed');
    assert.equal(due.maxSessionSize, 50);
    assert.equal(due.schemaVersion, 1);
    assert.equal(due.algorithm, ALGORITHM_ID);
    assert.equal(due.totalCandidates, 1);

    const favorites = createReviewSessionPlan({
        source: 'favorites',
        levelId: 'a1',
        unitId: null,
        candidates: [candidate('card-1', 1)],
        seed: 'other-seed',
        maxSessionSize: 10
    });
    assert.equal(favorites.source, 'favorites');
    assert.deepEqual(favorites.scope, { levelId: 'a1', unitId: null });
    assert.equal(favorites.seed, 'other-seed');
    assert.equal(favorites.maxSessionSize, 10);
});

test('REVIEW-002 case 15 (LR-SESSION): input arrays, candidate objects, and the options object remain unchanged', () => {
    const input = planInput();
    const inputBefore = structuredClone(input);
    const candidatesBefore = structuredClone(input.candidates);

    createReviewSessionPlan(input);

    assert.deepStrictEqual(input, inputBefore);
    assert.deepStrictEqual(input.candidates, candidatesBefore);
});

test('REVIEW-002 case 16 (AC-16): mutating input objects after plan creation cannot change the returned plan', () => {
    const input = planInput();
    const plan = createReviewSessionPlan(input);
    const planBefore = structuredClone(plan);

    // Aggressive post-creation mutation of every input shape.
    input.source = 'favorites';
    input.levelId = 'b2';
    input.unitId = 9;
    input.seed = 'a-different-seed';
    input.maxSessionSize = 1;
    input.candidates.push(candidate('card-99', 9));
    input.candidates.shift();
    input.candidates[0].id = 'mutated-id';
    input.candidates[0].levelId = 'b2';
    input.candidates[0].unitId = 42;

    assert.deepStrictEqual(plan, planBefore);
    // A fresh plan built from the original values still equals the plan.
    assert.deepStrictEqual(createReviewSessionPlan(planInput()), planBefore);
});

test('REVIEW-002 case 17 (LR-SESSION): returned candidate descriptors do not alias input candidates', () => {
    const input = planInput();
    const plan = createReviewSessionPlan(input);
    const returned = plan.chunks.flatMap(chunk => chunk.candidates);
    assert.equal(returned.length, 10);
    for (const descriptor of returned) {
        for (const original of input.candidates) {
            assert.notEqual(descriptor, original);
        }
    }

    // Mutating a returned descriptor cannot reach the input vocabulary.
    returned[0].id = 'mutated';
    assert.ok(input.candidates.every(card => card.id !== 'mutated'));
});

test('REVIEW-002 case 18 (LR-SESSION): invalid source, levelId, unitId, seed, candidates, and candidate fields throw TypeError', () => {
    const valid = {
        source: 'due',
        levelId: 'a1',
        unitId: null,
        candidates: [candidate('card-1', 1)],
        seed: ALPHA_SEED
    };
    const throwsWithType = (overrides, messagePattern) => {
        assert.throws(() => createReviewSessionPlan({ ...valid, ...overrides }), (err) => {
            assert.ok(err instanceof TypeError);
            assert.match(err.message, messagePattern);
            return true;
        });
    };

    // Non-plain top-level input objects fail fast.
    class ForeignOptions {
        constructor() {
            this.source = 'due';
            this.levelId = 'a1';
            this.unitId = null;
            this.candidates = valid.candidates;
            this.seed = ALPHA_SEED;
        }
    }
    for (const badInput of [null, 'oops', 42, new Date(), new Map(), new ForeignOptions()]) {
        assert.throws(() => createReviewSessionPlan(badInput), TypeError);
    }

    // source must be exactly "due" or "favorites".
    for (const source of [undefined, null, '', 'Due', 'due ', 'favorites!', 'both', 42]) {
        throwsWithType({ source }, /source/);
    }

    // levelId must be a non-empty string.
    for (const levelId of [undefined, null, '', '   ', 42]) {
        throwsWithType({ levelId }, /levelId/);
    }

    // unitId must be null or a positive integer; the field is required, so a
    // missing unitId is not silently treated as the all-units scope.
    for (const unitId of [undefined, 0, -1, -3, 2.5, '3', {}, [], true]) {
        throwsWithType({ unitId }, /unitId/);
    }

    // seed must be a non-empty, non-whitespace string.
    for (const seed of [undefined, null, '', '   ', '\t\n', 42, { seed: true }]) {
        throwsWithType({ seed }, /seed/);
    }

    // candidates must be an array.
    for (const candidates of [undefined, null, 'oops', {}, 42]) {
        throwsWithType({ candidates }, /candidates/);
    }

    // Candidate records must be plain objects with valid identity fields.
    class ForeignCard {
        constructor() {
            this.id = 'card-9';
            this.levelId = 'a1';
            this.unitId = 1;
        }
    }
    const badCandidates = [
        null,
        'card-1',
        42,
        new Date(),
        new ForeignCard(),
        { levelId: 'a1', unitId: 1 },
        { id: '', levelId: 'a1', unitId: 1 },
        { id: '   ', levelId: 'a1', unitId: 1 },
        { id: 42, levelId: 'a1', unitId: 1 },
        { id: 'card-1', levelId: 'b2', unitId: 1 },
        { id: 'card-1', levelId: 'a1', unitId: 0 },
        { id: 'card-1', levelId: 'a1', unitId: -2 },
        { id: 'card-1', levelId: 'a1', unitId: 2.5 },
        { id: 'card-1', levelId: 'a1', unitId: '1' },
        { id: 'card-1', levelId: 'a1' },
        { id: 'card-1', unitId: 1 }
    ];
    for (const bad of badCandidates) {
        assert.throws(() => createReviewSessionPlan({ ...valid, candidates: [bad] }), (err) => {
            assert.ok(err instanceof TypeError);
            assert.match(err.message, /candidates\[0\]/);
            return true;
        });
    }
});

test('REVIEW-002 case 19 (AC-15): maxSessionSize values 0, 51, negative, fractional, NaN, Infinity, and strings are rejected', () => {
    const valid = {
        source: 'due',
        levelId: 'a1',
        unitId: null,
        candidates: [candidate('card-1', 1)],
        seed: ALPHA_SEED
    };
    for (const maxSessionSize of [0, 51, -5, 2.5, NaN, Infinity, -Infinity, '50', '10', null, true, [50]]) {
        assert.throws(() => createReviewSessionPlan({ ...valid, maxSessionSize }), (err) => {
            assert.ok(err instanceof TypeError);
            assert.match(err.message, /maxSessionSize/);
            return true;
        });
    }

    // The inclusive bounds 1 and 50 are the accepted custom values.
    for (const maxSessionSize of [1, 50]) {
        const plan = createReviewSessionPlan({ ...valid, maxSessionSize });
        assert.equal(plan.maxSessionSize, maxSessionSize);
    }
});

test('REVIEW-002 case 20 (AC-16): no hidden randomness or clock dependency is used', () => {
    const moduleSource = readFileSync(new URL('../../js/core/review-session-plan.mjs', import.meta.url), 'utf8');

    // The planner's only permitted engine use is deterministic arithmetic.
    for (const forbidden of ['Math.random', 'Date.now', 'new Date', 'Date.parse', 'crypto', 'performance.now', 'setTimeout', 'setInterval']) {
        assert.ok(!moduleSource.includes(forbidden), `module source must not reference ${forbidden}`);
    }

    // Behaviorally: identical inputs and seeds produce deeply equal plans.
    assert.deepStrictEqual(
        createReviewSessionPlan(planInput()),
        createReviewSessionPlan(planInput())
    );
});

test('REVIEW-002 case 21 (LR-SESSION): the module has no DOM, storage, network, or controller dependency', async () => {
    const moduleSource = readFileSync(new URL('../../js/core/review-session-plan.mjs', import.meta.url), 'utf8');

    // No DOM, persisted-state, network, or controller references, and no
    // imports at all: the module is a self-contained pure calculation.
    for (const forbidden of ['document', 'window.', 'localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'navigator', 'firebase', 'app.']) {
        assert.ok(!moduleSource.includes(forbidden), `module source must not reference ${forbidden}`);
    }
    assert.ok(!/^import\b/m.test(moduleSource), 'the module must not import anything');

    // Export surface: exactly the one planned public function.
    const moduleNamespace = await import('../../js/core/review-session-plan.mjs');
    assert.deepEqual(Object.keys(moduleNamespace).sort(), ['createReviewSessionPlan']);
});
