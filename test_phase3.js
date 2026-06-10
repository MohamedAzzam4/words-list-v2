// Mocking the environment
const state = {
    data: {
        known: new Array(30).fill("word") // 30 items
    }
};

const engines = {
    flashcard: undefined, // Engines not fully loaded yet
    glossary: undefined
};

// Mock level config
const levelConfig = {
    vocabulary: [
        ["word1", "word2"], 
        ["word3"] // total 3 words for test
    ]
};

// 1. How knownCount is calculated in updateStats()
const all = levelConfig?.vocabulary?.flat() || [];
const knownSet = engines.flashcard?.knownIds || engines.glossary?.knownIds;

// If knownSet is undefined, it falls back to state.data.known.length
const knownCount = knownSet ? knownSet.size : (state.data?.known?.length || 0);

console.log(`knownSet defined? ${!!knownSet}`);
console.log(`knownCount: ${knownCount}`);

// 2. Percentage calculation safety check
const pct = all.length ? Math.round((knownCount / all.length) * 100) : 0;
console.log(`Calculated Percentage: ${pct}%`);

// 3. Testing NaN prevention (what if all.length is 0)
const emptyAll = [];
const safePct = emptyAll.length ? Math.round((knownCount / emptyAll.length) * 100) : 0;
console.log(`Safe Percentage (empty array): ${safePct}% (Expected 0, not NaN)`);

// 4. Checking if StatsService filters duplicates if falling back to state.data.known
state.data.known = ["1-0", "1-0", "1-0"]; // 3 duplicate strings
const knownCountDuplicates = knownSet ? knownSet.size : (state.data?.known?.length || 0);
console.log(`knownCount with duplicates in state.data: ${knownCountDuplicates} (Expected 3)`);
