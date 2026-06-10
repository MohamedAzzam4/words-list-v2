const mergeProgress = (local, remote) => {
    if (!remote) return local;

    const merged = { ...local, ...remote };

    // Deep merge arrays (known words)
    merged.known = Array.from(new Set([
        ...(local.known || []),
        ...(remote.known || [])
    ]));

    // Deep merge arrays (favorites)
    merged.favorites = Array.from(new Set([
        ...(local.favorites || []),
        ...(remote.favorites || [])
    ]));

    return merged;
};

const localState = { known: ["1-0"] };
const remoteState = { known: ["1-0", "1-1"] };

console.log("Local state:", localState);
console.log("Remote state:", remoteState);

const result = mergeProgress(localState, remoteState);

console.log("Merged state:", result);
console.log(`Length of known array: ${result.known.length}`);

// Test with mixed numbers and strings to see if deduplication fails
const localState2 = { known: [0, 1] };
const remoteState2 = { known: ["0", "1"] };

const result2 = mergeProgress(localState2, remoteState2);
console.log("\nMerged state (numeric + string):", result2);
console.log(`Length of known array (numeric + string): ${result2.known.length}`);
