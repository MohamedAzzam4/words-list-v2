/**
 * ContentLoader
 * Fetches and parses Markdown content for Phrases and Conversations.
 */
class ContentLoaderClass {
    constructor() {
        this.cache = new Map();
    }

    async _fetchWithCache(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`ContentLoader: File not found at ${url}`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            this.cache.set(url, text);
            return text;
        } catch (error) {
            console.error(`ContentLoader: Failed to fetch content from ${url}`, error);
            return null;
        }
    }

    _pad(unitId) {
        return String(Number(unitId) + 1).padStart(2, '0');
    }

    async loadPhrases(level, unitId) {
        const url = `content/generated/${level.toLowerCase()}/unit-${this._pad(unitId)}-phrases.md`;
        const markdown = await this._fetchWithCache(url);
        if (!markdown) return [];

        return this.parsePhrases(markdown, level, unitId);
    }

    async loadConversation(level, unitId) {
        const url = `content/generated/${level.toLowerCase()}/unit-${this._pad(unitId)}-conversation.md`;
        const markdown = await this._fetchWithCache(url);
        if (!markdown) return null;

        return this.parseConversation(markdown, level, unitId);
    }

    parsePhrases(markdown, level, unitId) {
        if (!markdown) return [];

        const chunks = markdown.split(/(?=###\s+[PS]\d+)/);
        const phrases = [];

        for (const chunk of chunks) {
            const idMatch = chunk.match(/^###\s+([PS]\d+)/m);
            if (!idMatch) continue;

            const rawId = idMatch[1];
            // Format ID: P-{level}-{unitIndex}-{rawId}
            const stableId = `P-${level.toLowerCase()}-${unitId}-${rawId}`;

            const getValue = (label) => {
                const regex = new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.*)$`, 'mi');
                const match = chunk.match(regex);
                return match ? match[1].trim() : '';
            };

            const de = getValue('German');
            const en = getValue('Meaning');
            const register = getValue('Register') || 'neutral';
            const usedWords = getValue('Used words') || '';
            const note = getValue('Note') || '';

            if (de) {
                phrases.push({
                    id: stableId,
                    unitId: Number(unitId),
                    level: level.toLowerCase(),
                    de,
                    en,
                    type: 'Phrase', // Fixed type badge for compatibility
                    register,
                    usedWords,
                    note,
                    context: note, // mapped to context for compatibility with FlashcardEngine
                    deContext: ''
                });
            }
        }

        return phrases;
    }

    parseConversation(markdown, level, unitId) {
        if (!markdown) return null;

        const version1Index = markdown.search(/##\s*Version\s*1/i);
        if (version1Index === -1) return null;

        let version2Index = markdown.search(/##\s*Version\s*2/i);
        if (version2Index === -1) {
            version2Index = markdown.length;
        }

        const rawVersion1 = markdown.substring(version1Index, version2Index);
        const lines = rawVersion1.split(/\r?\n/);
        const scenes = [];
        let currentScene = null;

        const getOrCreateScene = (title = '') => {
            if (!currentScene) {
                currentScene = { title: title.trim(), lines: [] };
                scenes.push(currentScene);
            }
            return currentScene;
        };

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') continue;

            if (/^##\s*Version\s*1/i.test(trimmed)) {
                continue;
            }

            // Match scene headings, e.g. "### Szene 1: Sommerkleidung"
            const sceneMatch = trimmed.match(/^###\s+(Szene\s+\d+.*|Scene\s+\d+.*|Szene\s*.*|Scene\s*.*)$/i);
            if (sceneMatch) {
                currentScene = { title: sceneMatch[1].trim(), lines: [] };
                scenes.push(currentScene);
                continue;
            }

            // Dialogue line: "Speaker: Text"
            const dialogueMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
            if (dialogueMatch) {
                const speaker = dialogueMatch[1].trim();
                const text = dialogueMatch[2].trim();

                const scene = getOrCreateScene();
                scene.lines.push({ speaker, text });
            }
        }

        // Parse metadata
        const metadata = {};
        const topOfFile = markdown.substring(0, version1Index);
        const metadataLines = topOfFile.split(/\r?\n/);
        for (const line of metadataLines) {
            const match = line.match(/^\*\*(Level|Theme|Characters|Situation|Goal):\*\*\s*(.*)$/i);
            if (match) {
                metadata[match[1].toLowerCase()] = match[2].trim();
            }
        }

        return {
            unitId: Number(unitId),
            level: level.toLowerCase(),
            metadata,
            scenes
        };
    }
}

export const ContentLoader = new ContentLoaderClass();
