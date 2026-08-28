const ALLOWED_TRANSLATION_LANGUAGES = new Set(['en', 'ar', 'mixed']);

function addError(errors, code, path, message) {
    errors.push({ code, path, message });
}

function validateExample(card, example, index, errors) {
    const path = `card ${card.id}.examples[${index}]`;
    if (!example || typeof example !== 'object') {
        addError(errors, 'EXAMPLE_SHAPE', path, 'Example must be an object.');
        return;
    }
    if (typeof example.de !== 'string' || example.de.trim() === '') {
        addError(errors, 'EXAMPLE_GERMAN_REQUIRED', `${path}.de`, 'Example German text is required.');
    }
    if (typeof example.translation !== 'string') {
        addError(errors, 'EXAMPLE_TRANSLATION_SHAPE', `${path}.translation`, 'Example translation must be a string.');
    }
    if (example.translationLanguage !== null && !ALLOWED_TRANSLATION_LANGUAGES.has(example.translationLanguage)) {
        addError(errors, 'EXAMPLE_LANGUAGE', `${path}.translationLanguage`, 'Example translation language is unsupported.');
    }
}

/**
 * Validate the normalized vocabulary shape without mutating the input.
 * Empty units are allowed so a level can reserve a future unit number.
 */
export function validateVocabulary(vocabulary) {
    const errors = [];
    if (!Array.isArray(vocabulary)) {
        return {
            ok: false,
            errors: [{ code: 'VOCABULARY_SHAPE', path: 'vocabulary', message: 'Vocabulary must be an array of units.' }]
        };
    }

    const ids = new Set();
    vocabulary.forEach((unit, unitIndex) => {
        const unitPath = `unit ${unitIndex + 1}`;
        if (!Array.isArray(unit)) {
            addError(errors, 'UNIT_SHAPE', unitPath, 'Unit must be an array of cards.');
            return;
        }

        unit.forEach((card, cardIndex) => {
            const path = `${unitPath}.card ${cardIndex + 1}`;
            if (!card || typeof card !== 'object') {
                addError(errors, 'CARD_SHAPE', path, 'Card must be an object.');
                return;
            }
            if (typeof card.id !== 'string' || card.id.trim() === '') {
                addError(errors, 'CARD_ID_REQUIRED', `${path}.id`, 'Card ID is required.');
            } else if (ids.has(card.id)) {
                addError(errors, 'CARD_ID_DUPLICATE', `${path}.id`, `Duplicate card ID: ${card.id}.`);
            } else {
                ids.add(card.id);
            }
            if (!Number.isInteger(card.unitId) || card.unitId !== unitIndex + 1) {
                addError(errors, 'CARD_UNIT_MISMATCH', `${path}.unitId`, 'Card unitId must match its containing unit.');
            }
            if (typeof card.de !== 'string' || card.de.trim() === '') {
                addError(errors, 'CARD_GERMAN_REQUIRED', `${path}.de`, 'German term is required.');
            }
            if (typeof card.en !== 'string' || card.en.trim() === '') {
                addError(errors, 'CARD_TRANSLATION_REQUIRED', `${path}.en`, 'Display translation is required.');
            }
            if (card.translationLanguage !== undefined && !ALLOWED_TRANSLATION_LANGUAGES.has(card.translationLanguage)) {
                addError(errors, 'CARD_LANGUAGE', `${path}.translationLanguage`, 'Translation language is unsupported.');
            }
            if (typeof card.exampleDe !== 'string' || typeof card.exampleTranslation !== 'string') {
                addError(errors, 'EXAMPLE_FIELDS_SHAPE', path, 'Explicit example fields must be strings.');
            }
            if (card.exampleTranslationLanguage !== undefined
                && card.exampleTranslationLanguage !== null
                && !ALLOWED_TRANSLATION_LANGUAGES.has(card.exampleTranslationLanguage)) {
                addError(errors, 'EXAMPLE_LANGUAGE', `${path}.exampleTranslationLanguage`, 'Example translation language is unsupported.');
            }
            if (!Array.isArray(card.examples)) {
                addError(errors, 'EXAMPLES_SHAPE', `${path}.examples`, 'Examples must be an array.');
            } else {
                card.examples.forEach((example, index) => validateExample(card, example, index, errors));
                if (card.exampleDe && card.examples[0]?.de !== card.exampleDe) {
                    addError(errors, 'EXAMPLE_ALIAS_MISMATCH', `${path}.examples[0].de`, 'First example must match exampleDe.');
                }
                if (card.exampleTranslation && card.examples[0]?.translation !== card.exampleTranslation) {
                    addError(errors, 'EXAMPLE_TRANSLATION_ALIAS_MISMATCH', `${path}.examples[0].translation`, 'First example translation must match exampleTranslation.');
                }
                if (!card.exampleDe && card.examples.length > 0) {
                    addError(errors, 'EXAMPLE_ORPHAN', `${path}.examples`, 'Cards without exampleDe cannot contain examples.');
                }
            }
        });
    });

    return { ok: errors.length === 0, errors };
}

/**
 * Return a deterministic, content-sensitive snapshot suitable for tests and audits.
 * The source card order is intentionally retained so accidental reordering is visible.
 */
export function createVocabularySnapshot(vocabulary) {
    const units = vocabulary.map((cards, index) => ({
        unitId: index + 1,
        count: cards.length,
        cards: cards.map(card => ({
            id: card.id,
            unitId: card.unitId,
            de: card.de,
            en: card.en,
            type: card.type,
            exampleDe: card.exampleDe,
            exampleTranslation: card.exampleTranslation,
            exampleTranslationLanguage: card.exampleTranslationLanguage ?? null
        }))
    }));

    return {
        unitCount: units.length,
        totalCards: units.reduce((total, unit) => total + unit.count, 0),
        unitCounts: units.map(unit => unit.count),
        units
    };
}
