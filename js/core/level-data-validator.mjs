const ALLOWED_TRANSLATION_LANGUAGES = new Set(['en', 'ar', 'mixed']);
const CARD_ID_PATTERN = /^\d+-\d+$/;

function addError(errors, code, path, message) {
    errors.push({ code, path, message });
}

function normalizedGerman(value) {
    return typeof value === 'string'
        ? value.normalize('NFKC').trim().toLocaleLowerCase('de-DE')
        : '';
}

function canonicalPair(first, second) {
    return [first, second].sort().join('|');
}

function expectedTranslationLanguage(translations) {
    const hasEnglish = translations.en.trim() !== '';
    const hasArabic = translations.ar.trim() !== '';
    if (hasEnglish && hasArabic) return 'mixed';
    if (hasArabic) return 'ar';
    if (hasEnglish) return 'en';
    return null;
}

function validateTranslations(value, language, path, errors, { required, display }) {
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || typeof value.en !== 'string' || typeof value.ar !== 'string') {
        addError(errors, 'TRANSLATIONS_SHAPE', path, 'Translations must expose en and ar strings.');
        return null;
    }

    const expectedLanguage = expectedTranslationLanguage(value);
    if (required && expectedLanguage === null) {
        addError(errors, 'TRANSLATION_TEXT_REQUIRED', path, 'At least one language-specific translation is required.');
    }
    if (language !== expectedLanguage) {
        addError(
            errors,
            'TRANSLATION_LANGUAGE_MISMATCH',
            `${path}.language`,
            `Translation language must be ${expectedLanguage ?? 'null'} for the available text.`
        );
    }
    const expectedDisplay = expectedLanguage === 'mixed'
        ? `${value.en} / ${value.ar}`
        : (expectedLanguage ? value[expectedLanguage] : '');
    if (typeof display === 'string' && display !== expectedDisplay) {
        addError(errors, 'TRANSLATION_DISPLAY_MISMATCH', path, 'Display translation must match its language-specific fields.');
    }
    return value;
}

function validateSpeechText(value, german, translations, path, errors) {
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || ['de', 'en', 'ar'].some(language => typeof value[language] !== 'string')) {
        addError(errors, 'SPEECH_TEXT_SHAPE', path, 'Speech text must expose de, en, and ar strings.');
        return;
    }
    if (value.de !== german || (translations && (value.en !== translations.en || value.ar !== translations.ar))) {
        addError(errors, 'SPEECH_TEXT_MISMATCH', path, 'Speech text must match its language-specific source fields.');
    }
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
    const translations = validateTranslations(
        example.translations,
        example.translationLanguage,
        `${path}.translations`,
        errors,
        { required: false, display: example.translation }
    );
    validateSpeechText(example.speechText, example.de, translations, `${path}.speechText`, errors);
}

/**
 * Validate the normalized vocabulary shape without mutating the input.
 * Empty units are allowed so a level can reserve a future unit number.
 * Existing content duplicates require exact, explicit ID-pair allowances.
 */
export function validateVocabulary(vocabulary, options = {}) {
    const errors = [];
    if (!Array.isArray(vocabulary)) {
        return {
            ok: false,
            errors: [{ code: 'VOCABULARY_SHAPE', path: 'vocabulary', message: 'Vocabulary must be an array of units.' }]
        };
    }

    const expectedLevelId = options.levelId;
    const allowedDuplicatePairs = new Set();
    for (const pair of options.allowedDuplicateWordIdPairs || []) {
        if (!Array.isArray(pair) || pair.length !== 2 || pair.some(id => typeof id !== 'string')) {
            addError(errors, 'DUPLICATE_ALLOWANCE_SHAPE', 'options.allowedDuplicateWordIdPairs', 'Each allowance must contain exactly two card IDs.');
            continue;
        }
        allowedDuplicatePairs.add(canonicalPair(pair[0], pair[1]));
    }

    const observedAllowedPairs = new Set();
    const ids = new Set();
    vocabulary.forEach((unit, unitIndex) => {
        const unitPath = `unit ${unitIndex + 1}`;
        if (!Array.isArray(unit)) {
            addError(errors, 'UNIT_SHAPE', unitPath, 'Unit must be an array of cards.');
            return;
        }

        const words = new Map();
        unit.forEach((card, cardIndex) => {
            const path = `${unitPath}.card ${cardIndex + 1}`;
            if (!card || typeof card !== 'object') {
                addError(errors, 'CARD_SHAPE', path, 'Card must be an object.');
                return;
            }
            if (typeof card.id !== 'string' || card.id.trim() === '') {
                addError(errors, 'CARD_ID_REQUIRED', `${path}.id`, 'Card ID is required.');
            } else {
                if (!CARD_ID_PATTERN.test(card.id)) {
                    addError(errors, 'CARD_ID_FORMAT', `${path}.id`, 'Card ID must retain the unitIndex-cardIndex format.');
                }
                if (card.id !== `${unitIndex + 1}-${cardIndex}`) {
                    addError(errors, 'CARD_ID_POSITION_MISMATCH', `${path}.id`, 'Card ID must match its stable unit and position.');
                }
                if (ids.has(card.id)) {
                    addError(errors, 'CARD_ID_DUPLICATE', `${path}.id`, `Duplicate card ID: ${card.id}.`);
                } else {
                    ids.add(card.id);
                }
            }
            if (typeof card.levelId !== 'string' || card.levelId.trim() === '') {
                addError(errors, 'CARD_LEVEL_REQUIRED', `${path}.levelId`, 'Card levelId is required.');
            } else if (expectedLevelId && card.levelId !== expectedLevelId) {
                addError(errors, 'CARD_LEVEL_MISMATCH', `${path}.levelId`, `Card levelId must be ${expectedLevelId}.`);
            }
            if (!Number.isInteger(card.unitId) || card.unitId !== unitIndex + 1) {
                addError(errors, 'CARD_UNIT_MISMATCH', `${path}.unitId`, 'Card unitId must match its containing unit.');
            }
            if (typeof card.de !== 'string' || card.de.trim() === '') {
                addError(errors, 'CARD_GERMAN_REQUIRED', `${path}.de`, 'German term is required.');
            } else {
                const wordKey = normalizedGerman(card.de);
                const previousId = words.get(wordKey);
                if (previousId) {
                    const pair = canonicalPair(previousId, card.id);
                    if (allowedDuplicatePairs.has(pair)) {
                        observedAllowedPairs.add(pair);
                    } else {
                        addError(errors, 'CARD_GERMAN_DUPLICATE', `${path}.de`, `Duplicate German term in unit: ${card.de}.`);
                    }
                } else {
                    words.set(wordKey, card.id);
                }
            }
            if (typeof card.type !== 'string' || card.type.trim() === '') {
                addError(errors, 'CARD_TYPE_REQUIRED', `${path}.type`, 'Card word type is required.');
            }
            if (typeof card.en !== 'string' || card.en.trim() === '') {
                addError(errors, 'CARD_TRANSLATION_REQUIRED', `${path}.en`, 'Display translation is required.');
            }
            if (typeof card.translation !== 'string' || card.translation !== card.en) {
                addError(errors, 'CARD_TRANSLATION_ALIAS_MISMATCH', `${path}.translation`, 'translation must match the legacy en display value.');
            }
            if (!ALLOWED_TRANSLATION_LANGUAGES.has(card.translationLanguage)) {
                addError(errors, 'CARD_LANGUAGE', `${path}.translationLanguage`, 'Translation language is unsupported.');
            }
            const translations = validateTranslations(
                card.translations,
                card.translationLanguage,
                `${path}.translations`,
                errors,
                { required: true, display: card.translation }
            );
            validateSpeechText(card.speechText, card.de, translations, `${path}.speechText`, errors);
            if (typeof card.context !== 'string' || card.context !== card.exampleDe) {
                addError(errors, 'EXAMPLE_CONTEXT_ALIAS_MISMATCH', `${path}.context`, 'context must match exampleDe.');
            }
            if (typeof card.exampleDe !== 'string' || typeof card.exampleTranslation !== 'string') {
                addError(errors, 'EXAMPLE_FIELDS_SHAPE', path, 'Explicit example fields must be strings.');
            }
            if (card.exampleTranslationLanguage !== null
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
                if (card.exampleTranslation !== (card.examples[0]?.translation || '')) {
                    addError(errors, 'EXAMPLE_TRANSLATION_ALIAS_MISMATCH', `${path}.examples[0].translation`, 'First example translation must match exampleTranslation.');
                }
                if (card.exampleTranslationLanguage !== (card.examples[0]?.translationLanguage ?? null)) {
                    addError(errors, 'EXAMPLE_LANGUAGE_ALIAS_MISMATCH', `${path}.examples[0].translationLanguage`, 'First example language must match exampleTranslationLanguage.');
                }
                if (!card.exampleDe && (card.examples.length > 0 || card.exampleTranslation)) {
                    addError(errors, 'EXAMPLE_ORPHAN', `${path}.examples`, 'Cards without exampleDe cannot contain example data.');
                }
            }
        });
    });

    for (const pair of allowedDuplicatePairs) {
        if (!observedAllowedPairs.has(pair)) {
            addError(errors, 'DUPLICATE_ALLOWANCE_STALE', 'options.allowedDuplicateWordIdPairs', `Duplicate allowance no longer matches source data: ${pair}.`);
        }
    }

    return { ok: errors.length === 0, errors };
}

export function validateLevelConfig(levelConfig) {
    if (!levelConfig || typeof levelConfig !== 'object' || Array.isArray(levelConfig)) {
        return {
            ok: false,
            errors: [{ code: 'LEVEL_CONFIG_SHAPE', path: 'levelConfig', message: 'Level config must be an object.' }]
        };
    }
    const result = validateVocabulary(levelConfig.vocabulary, {
        levelId: levelConfig.levelId,
        allowedDuplicateWordIdPairs: levelConfig.validation?.allowedDuplicateWordIdPairs || []
    });
    if (typeof levelConfig.levelId !== 'string' || levelConfig.levelId.trim() === '') {
        result.errors.unshift({ code: 'LEVEL_ID_REQUIRED', path: 'levelConfig.levelId', message: 'Level config must expose a levelId.' });
        result.ok = false;
    }
    return result;
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
            levelId: card.levelId,
            unitId: card.unitId,
            de: card.de,
            deContext: card.deContext || '',
            en: card.en,
            type: card.type,
            context: card.context,
            translation: card.translation,
            translationLanguage: card.translationLanguage,
            translations: { ...card.translations },
            speechText: { ...card.speechText },
            exampleDe: card.exampleDe,
            exampleTranslation: card.exampleTranslation,
            exampleTranslationLanguage: card.exampleTranslationLanguage ?? null,
            examples: card.examples.map(example => ({
                de: example.de,
                translation: example.translation,
                translationLanguage: example.translationLanguage ?? null,
                translations: { ...example.translations },
                speechText: { ...example.speechText }
            }))
        }))
    }));

    return {
        unitCount: units.length,
        totalCards: units.reduce((total, unit) => total + unit.count, 0),
        unitCounts: units.map(unit => unit.count),
        units
    };
}
