import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Load storage.js verbatim (package.json is commonjs) inside a VM and strip
// the `export` keywords — same technique as the engine unit tests.
const src = readFileSync(new URL('../../js/core/storage.js', import.meta.url), 'utf8').replace(/^export\s+/gm, '');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
    src + `
;globalThis.__STORAGE = { mergeVerbRecord, trackNumericTime, pickTrackSide, mergeVerbLearning, mergeProgress, VERB_LEARNING_SCHEMA_VERSION };
`,
    sandbox
);
const { mergeVerbRecord, trackNumericTime, pickTrackSide, mergeVerbLearning, VERB_LEARNING_SCHEMA_VERSION } = sandbox.__STORAGE;

const t = (ms) => new Date(ms).toISOString();

const fullRecord = (over = {}) => ({
    recognitionWin: null,
    productionWin: null,
    srs: { level: 0, nextReviewDate: '' },
    productionSrs: { level: 0, nextReviewDate: '' },
    updatedAt: 0,
    ...over
});

test('schema version is bumped to 2 for per-track merging', () => {
    assert.equal(VERB_LEARNING_SCHEMA_VERSION, 2);
});

test('trackNumericTime returns null for a track that does not exist', () => {
    const rec = fullRecord();
    assert.equal(trackNumericTime(rec, 'recognitionWin', 'srs', 'recognitionUpdatedAt'), null);
    assert.equal(trackNumericTime(rec, 'productionWin', 'productionSrs', 'productionUpdatedAt'), null);
});

test('trackNumericTime falls back to record updatedAt for legacy explicit win', () => {
    const rec = fullRecord({ recognitionWin: '$B', updatedAt: 1000 });
    assert.equal(trackNumericTime(rec, 'recognitionWin', 'srs', 'recognitionUpdatedAt'), 1000);
});

test('trackNumericTime prefers the explicit track timestamp', () => {
    const rec = fullRecord({ recognitionWin: '$B', recognitionUpdatedAt: 5000, updatedAt: 1000 });
    assert.equal(trackNumericTime(rec, 'recognitionWin', 'srs', 'recognitionUpdatedAt'), 5000);
});

test('mergeVerbRecord joins per-track data without an explicit track timestamp', () => {
    const a = fullRecord({ recognitionWin: '$A', productionWin: null, updatedAt: 2000 });
    const b = fullRecord({ recognitionWin: null, productionWin: '$B', updatedAt: 1000 });
    const out = mergeVerbRecord(a, b);
    assert.equal(out.recognitionWin, '$A');
    assert.equal(out.productionWin, '$B');
    assert.equal(out.updatedAt, 2000);
});

test('mergeVerbRecord keeps the newer explicit recognition track', () => {
    const a = fullRecord({ recognitionWin: '$A', recognitionUpdatedAt: t(4000), updatedAt: 9000 });
    const b = fullRecord({ recognitionWin: '$B', recognitionUpdatedAt: t(6000), updatedAt: 7000 });
    const out = mergeVerbRecord(a, b);
    assert.equal(out.recognitionWin, '$B');
    assert.equal(out.recognitionUpdatedAt, t(6000));
    assert.equal(out.updatedAt, 6000); // overall updatedAt is the newest TRACK time
});

test('mergeVerbRecord does not invent an SRS track that never existed', () => {
    const a = fullRecord({ recognitionWin: '$A', srs: { level: 2, nextReviewDate: '$SRS' }, updatedAt: 100 });
    const out = mergeVerbRecord(a, fullRecord({ updatedAt: 200 }));
    assert.equal(out.srs.nextReviewDate, '$SRS');
    assert.equal(out.productionWin, undefined);
    assert.equal(out.productionSrs, undefined);
    assert.equal(out.productionUpdatedAt, undefined);
});

test('mergeVerbLearning preserves both sides and sessions', () => {
    const local = {
        schemaVersion: 1,
        verbs: { v_1: fullRecord({ recognitionWin: '$A', updatedAt: 100 }) },
        sessions: { s1: { updatedAt: 500 } }
    };
    const remote = {
        schemaVersion: 1,
        verbs: { v_2: fullRecord({ productionWin: '$B', updatedAt: 300 }) },
        sessions: { s2: { updatedAt: 700 } }
    };
    const out = mergeVerbLearning(local, remote);
    assert.equal(out.schemaVersion, 2);
    assert.equal(out.verbs.v_1.recognitionWin, '$A');
    assert.equal(out.verbs.v_2.productionWin, '$B');
    assert.equal(out.sessions.s1.updatedAt, 500);
    assert.equal(out.sessions.s2.updatedAt, 700);
});

function createStorageSandbox() {
    const s = {};
    vm.createContext(s);
    vm.runInContext(
        src + `
;globalThis.__STORAGE = { mergeVerbRecord, trackNumericTime, pickTrackSide, mergeVerbLearning, mergeProgress, getDefaultProgressObj, normalizeVerbLearning, migrateCanonicalVerbIds, VERB_LEARNING_SCHEMA_VERSION };
`,
        s
    );
    return s.__STORAGE;
}

test('GC-09: migration backup is created on first migration and never overwritten or appended to', () => {
    const st = createStorageSandbox();
    let data = { knownVerbIds: ['v_werden', 'werden', 'sein'] };
    st.migrateCanonicalVerbIds(data);
    let b1 = JSON.stringify(data._knownIdsBackup);
    
    // Second migration with different knownVerbIds
    data.knownVerbIds.push('haben');
    st.migrateCanonicalVerbIds(data);
    let b2 = JSON.stringify(data._knownIdsBackup);

    assert.equal(b1, b2, 'backup must remain immutable and not be overwritten on second migration');
});

test('GC-11: schema version 2 default, upgrade, and merge produce version 2', () => {
    const st = createStorageSandbox();
    let def = st.getDefaultProgressObj();
    let upgraded = st.normalizeVerbLearning({ schemaVersion: 1, verbs: {} });
    let merged = st.mergeVerbLearning({ schemaVersion: 1, verbs: {} }, { schemaVersion: 1, verbs: {} });

    assert.equal(def.verbLearning.schemaVersion, 2, 'getDefaultProgressObj must specify schemaVersion 2');
    assert.equal(upgraded.schemaVersion, 2, 'normalizeVerbLearning must upgrade schemaVersion to 2');
    assert.equal(merged.schemaVersion, 2, 'mergeVerbLearning must return schemaVersion 2');
});

test('GC-15: mergeVerbLearning handles complete track conflict matrix independently', () => {
    // 1. Newer local recognition + newer remote production
    const local1 = {
        schemaVersion: 2,
        verbs: {
            v_1: fullRecord({ recognitionWin: 'LOCAL_REC', recognitionUpdatedAt: t(5000), productionWin: 'LOCAL_PROD', productionUpdatedAt: t(1000) })
        }
    };
    const remote1 = {
        schemaVersion: 2,
        verbs: {
            v_1: fullRecord({ recognitionWin: 'REMOTE_REC', recognitionUpdatedAt: t(2000), productionWin: 'REMOTE_PROD', productionUpdatedAt: t(6000) })
        }
    };
    const out1 = mergeVerbLearning(local1, remote1);
    assert.equal(out1.verbs.v_1.recognitionWin, 'LOCAL_REC');
    assert.equal(out1.verbs.v_1.productionWin, 'REMOTE_PROD');

    // 2. Newer remote recognition + newer local production
    const local2 = {
        schemaVersion: 2,
        verbs: {
            v_1: fullRecord({ recognitionWin: 'LOCAL_REC', recognitionUpdatedAt: t(1000), productionWin: 'LOCAL_PROD', productionUpdatedAt: t(8000) })
        }
    };
    const remote2 = {
        schemaVersion: 2,
        verbs: {
            v_1: fullRecord({ recognitionWin: 'REMOTE_REC', recognitionUpdatedAt: t(7000), productionWin: 'REMOTE_PROD', productionUpdatedAt: t(2000) })
        }
    };
    const out2 = mergeVerbLearning(local2, remote2);
    assert.equal(out2.verbs.v_1.recognitionWin, 'REMOTE_REC');
    assert.equal(out2.verbs.v_1.productionWin, 'LOCAL_PROD');
});