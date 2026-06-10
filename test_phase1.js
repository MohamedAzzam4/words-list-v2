const fs = require('fs');

// Mock data and state
const levelConfig = {
    vocabulary: [
        [{ id: "1-0" }, { id: "1-1" }],
        [{ id: "2-0" }]
    ]
};

const state = {
    data: {
        known: [0, 1, 2], // Simulate old numeric IDs
        migrationVersion: 0
    }
};

function runMigration() {
    console.log(`Starting migration. Initial known:`, state.data.known);
    
    if ((state.data.migrationVersion || 0) < 1) {
        const oldIdToNewId = {};
        let globalIndex = 0;
        for (let u = 0; u < levelConfig.vocabulary.length; u++) {
            const unitWords = levelConfig.vocabulary[u];
            for (let w = 0; w < unitWords.length; w++) {
                oldIdToNewId[globalIndex] = unitWords[w].id;
                globalIndex++;
            }
        }

        // Handle stringified numbers just in case
        for (let i = 0; i < globalIndex; i++) {
            oldIdToNewId[String(i)] = oldIdToNewId[i];
        }

        const oldKnown = [...(state.data.known || [])];
        
        const newKnown = oldKnown
            .map(oldId => oldIdToNewId[oldId] !== undefined ? oldIdToNewId[oldId] : oldId)
            .filter(id => id !== undefined);

        state.data.known = newKnown;
        state.data.migrationVersion = 1;
        
        console.log(`Migration ran. New known array:`, state.data.known);
    } else {
        console.log(`Migration skipped. Version already 1. Known array:`, state.data.known);
    }
}

// Run once
runMigration();

// Try running again to simulate second boot
runMigration();
