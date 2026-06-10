import { TrophyEngine } from './js/core/trophies.js';

// Mock DOM
global.document = {
    getElementById: () => ({ innerHTML: '' })
};

// Mock words for a1
const words = [];
for (let i=0; i<711; i++) {
    words.push({ id: `1-${i}`, type: 'n' });
}

// 1. Initial State
const stateData = {
    known: [],
    trophyCounts: {}
};

// Fill known array up to 257 to simulate the bug
for(let i=0; i<257; i++) {
    stateData.known.push(`1-${i}`);
}

const engine = new TrophyEngine(null, stateData, 'german-a1-app', (msg) => {
    console.log(`[Trophy Awarded]: ${msg}`);
});

console.log("Simulating spike to 257 words...");
await engine.evaluate(stateData, words);

console.log("Trophy counts after spike:");
console.log(engine.trophyCounts);

// 2. Simulate fixing the bug, dropping known back to 30 true words
console.log("\nSimulating fix... dropping known to 30 words.");
stateData.known = [];
for(let i=0; i<30; i++) {
    stateData.known.push(`1-${i}`);
}

// Evaluate again
console.log("Evaluating after drop...");
await engine.evaluate(stateData, words);

console.log("Trophy counts after drop:");
console.log(engine.trophyCounts);
