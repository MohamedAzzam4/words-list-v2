// REVIEW-002 — pure seeded bounded review session plans (LR-SESSION / AC-15 / AC-16).
//
// Deterministic calculation for Review Center session planning: an explicit
// list of review candidates is validated, deduplicated, shuffled once with
// the versioned fnv1a32-mulberry32-fisher-yates-v1 permutation, and split
// into balanced chunks of at most maxSessionSize (default 50) cards, so a
// review-all action can never produce one unbounded session. The module is a
// pure calculation: it receives fully explicit input, never reads a hidden
// clock or hidden random source, and never touches the DOM, persisted state,
// the network, or any controller. Later work packages own lifecycle,
// rendering, and persistence; this planner only converts a candidate list
// into a fully materialized plan value that is safe to serialize and resume.

const SCHEMA_VERSION = 1;
const ALGORITHM_ID = 'fnv1a32-mulberry32-fisher-yates-v1';
const DEFAULT_MAX_SESSION_SIZE = 50;
const MIN_SESSION_SIZE = 1;
const MAX_SESSION_SIZE_LIMIT = 50;
const PLAN_SOURCES = ['due', 'favorites'];
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const MULBERRY_INCREMENT = 0x6D2B79F5;

// A plain data record is an ordinary object whose inheritance chain has
// record shape: either no prototype at all (a null-prototype dictionary) or a
// direct prototype that is itself prototype-less, the shape the core object
// prototype has in every realm. Object literals qualify in any realm, while
// Date, Map, Set, and RegExp instances, arrays, functions, and class
// instances do not. This is the same data-shape check REVIEW-001-C1
// established, so both pure review modules share one notion of a record.
function isPlainRecord(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
}

// Error-message helper: names arrays and null explicitly instead of "object".
function describeType(value) {
    if (Array.isArray(value)) {
        return 'array';
    }
    return value === null ? 'null' : typeof value;
}

// Validates the top-level arguments. These are programmer or input-contract
// errors, not persisted-data faults: invalid input fails fast with an
// actionable TypeError instead of producing a silently wrong plan. unitId is
// a required field: null means the all-units scope, and omitting it is an
// error rather than an implicit all-units default.
function validateInput(input) {
    if (!isPlainRecord(input)) {
        throw new TypeError('input must be an options object.');
    }
    if (typeof input.source !== 'string' || !PLAN_SOURCES.includes(input.source)) {
        throw new TypeError(`input.source must be "due" or "favorites" (received ${describeType(input.source)}).`);
    }
    if (typeof input.levelId !== 'string' || input.levelId.trim() === '') {
        throw new TypeError(`input.levelId must be a non-empty string (received ${describeType(input.levelId)}).`);
    }
    if (input.unitId !== null && (!Number.isInteger(input.unitId) || input.unitId < 1)) {
        throw new TypeError(`input.unitId must be null (all units) or a positive integer (received ${describeType(input.unitId)}).`);
    }
    if (!Array.isArray(input.candidates)) {
        throw new TypeError(`input.candidates must be an array of candidate records (received ${describeType(input.candidates)}).`);
    }
    if (typeof input.seed !== 'string' || input.seed.trim() === '') {
        throw new TypeError(`input.seed must be a non-empty string (received ${describeType(input.seed)}).`);
    }
    if (input.maxSessionSize !== undefined
        && (!Number.isInteger(input.maxSessionSize) || input.maxSessionSize < MIN_SESSION_SIZE || input.maxSessionSize > MAX_SESSION_SIZE_LIMIT)) {
        throw new TypeError(`input.maxSessionSize must be an integer between 1 and 50 when provided (received ${describeType(input.maxSessionSize)}).`);
    }
}

// Validates every candidate and returns fresh descriptors in first-occurrence
// order, copying only id, levelId, and unitId (unrelated extra properties are
// ignored, never copied). Exact duplicate descriptors count once through
// their first occurrence; the same id reappearing with conflicting levelId
// or unitId metadata is a contract conflict and throws. Invalid candidates
// are never silently omitted.
function collectCandidateDescriptors(candidates, levelId, unitScope) {
    const descriptors = [];
    const descriptorById = new Map();
    candidates.forEach((candidate, index) => {
        if (!isPlainRecord(candidate)) {
            throw new TypeError(`input.candidates[${index}] must be a plain object (received ${describeType(candidate)}).`);
        }
        const id = candidate.id;
        const candidateLevelId = candidate.levelId;
        const unitId = candidate.unitId;
        if (typeof id !== 'string' || id.trim() === '') {
            throw new TypeError(`input.candidates[${index}] must have a non-empty string id.`);
        }
        if (candidateLevelId !== levelId) {
            throw new TypeError(`input.candidates[${index}] ('${id}') must carry levelId '${levelId}' to match the requested level.`);
        }
        if (!Number.isInteger(unitId) || unitId < 1) {
            throw new TypeError(`input.candidates[${index}] ('${id}') must have a positive integer unitId.`);
        }
        if (unitScope !== null && unitId !== unitScope) {
            throw new TypeError(`input.candidates[${index}] ('${id}') has unitId ${unitId} outside the requested unit scope ${unitScope}.`);
        }
        const earlier = descriptorById.get(id);
        if (earlier !== undefined) {
            if (earlier.levelId !== candidateLevelId || earlier.unitId !== unitId) {
                throw new TypeError(`input.candidates[${index}] ('${id}') conflicts with an earlier occurrence of the same id: levelId and unitId metadata must agree.`);
            }
            return;
        }
        const descriptor = { id, levelId: candidateLevelId, unitId };
        descriptors.push(descriptor);
        descriptorById.set(id, descriptor);
    });
    return descriptors;
}

// Step 1 of the versioned algorithm: FNV-1a over the seed's JavaScript
// UTF-16 code units produces the initial 32-bit state. Hashing code units
// (not code points) keeps the state identical across engines and releases.
function fnv1a32SeedState(seed) {
    let state = FNV_OFFSET_BASIS;
    for (let i = 0; i < seed.length; i++) {
        state ^= seed.charCodeAt(i);
        state = Math.imul(state, FNV_PRIME) >>> 0;
    }
    return state >>> 0;
}

// Steps 2 and 3 of the versioned algorithm: one exact Mulberry32 step per
// swap value, driving a descending Fisher-Yates pass over a fresh copy of
// the deduplicated descriptors. The permutation depends only on the seed and
// the first-occurrence order, so the same seed and input always produce the
// same plan across browsers and future releases.
function seededShuffle(descriptors, seed) {
    const shuffled = [...descriptors];
    let state = fnv1a32SeedState(seed);
    for (let i = shuffled.length - 1; i > 0; i--) {
        state = (state + MULBERRY_INCREMENT) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        const random = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        const swapIndex = Math.floor(random * (i + 1));
        const swap = shuffled[i];
        shuffled[i] = shuffled[swapIndex];
        shuffled[swapIndex] = swap;
    }
    return shuffled;
}

// Balanced contiguous partition of the shuffled order. count 0 yields no
// chunks at all (never one empty chunk); otherwise the first remainder
// chunks hold baseSize + 1 candidates and the rest hold baseSize, so no
// chunk exceeds maxSessionSize, chunk sizes differ by at most one, and no
// tiny final chunk is left behind. Chunks are contiguous slices of the
// shuffled order, so flattening them preserves that order exactly.
function buildBalancedChunks(ordered, maxSessionSize) {
    if (ordered.length === 0) {
        return [];
    }
    const chunkCount = Math.ceil(ordered.length / maxSessionSize);
    const baseSize = Math.floor(ordered.length / chunkCount);
    const remainder = ordered.length % chunkCount;
    const chunks = [];
    let cursor = 0;
    for (let index = 0; index < chunkCount; index++) {
        const size = index < remainder ? baseSize + 1 : baseSize;
        const chunkCandidates = [];
        for (let i = 0; i < size; i++) {
            chunkCandidates.push(ordered[cursor]);
            cursor += 1;
        }
        chunks.push({ index, size, candidates: chunkCandidates });
    }
    return chunks;
}

// Creates a fully materialized, deterministic session plan from an explicit
// candidate list. The result holds only fresh values: no descriptor, chunk,
// or array aliases the input, so later mutations of the input can never
// change the returned plan (frozen membership by value, without freezing:
// plain serializable values stay open for the session-state work packages
// that will own cursors and resume). No plan id, timestamp, random seed, or
// session state is generated here.
export function createReviewSessionPlan(input) {
    validateInput(input);

    const unitScope = input.unitId === null ? null : input.unitId;
    const maxSessionSize = input.maxSessionSize === undefined ? DEFAULT_MAX_SESSION_SIZE : input.maxSessionSize;
    const ordered = seededShuffle(
        collectCandidateDescriptors(input.candidates, input.levelId, unitScope),
        input.seed
    );

    return {
        schemaVersion: SCHEMA_VERSION,
        algorithm: ALGORITHM_ID,
        source: input.source,
        scope: { levelId: input.levelId, unitId: unitScope },
        seed: input.seed,
        maxSessionSize,
        totalCandidates: ordered.length,
        chunks: buildBalancedChunks(ordered, maxSessionSize)
    };
}
