function computeTotalWords(data) {
    let total = 0;
    // New format: levels map
    if (data.levels && typeof data.levels === 'object') {
        for (const val of Object.values(data.levels)) {
            total += (typeof val === 'number' ? val : 0);
        }
    }
    // Backward-compatible: old a1Count/b2Count fields
    if (data.a1Count) total += data.a1Count;
    if (data.b2Count) total += data.b2Count;
    // Avoid double-counting if both formats exist
    if (data.levels && (data.a1Count || data.b2Count)) {
        // Prefer new format, ignore old fields
        total = 0;
        for (const val of Object.values(data.levels)) {
            total += (typeof val === 'number' ? val : 0);
        }
    }
    return total;
}

const data1 = { a1Count: 9, levels: { a1: 257 } };
console.log(`Test 1 (a1Count=9, levels.a1=257):`, computeTotalWords(data1));

const data2 = { a1Count: undefined, b2Count: 5, levels: { a1: 257 } };
console.log(`Test 2 (b2Count=5, levels.a1=257):`, computeTotalWords(data2));

const data3 = { levels: { a1: 257, b2: "9" } }; // string instead of number
console.log(`Test 3 (levels.b2 is string):`, computeTotalWords(data3));
