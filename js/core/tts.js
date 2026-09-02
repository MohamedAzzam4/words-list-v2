const audioCtx = typeof window !== 'undefined' && window.AudioContext
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

export const cleanTextForAudio = (text) => {
    if (!text) return '';
    return text
        // Remove explicit grammar labels like Präsens, Präteritum, Partizip II, Futur I
        .replace(/Präsens|Präteritum|Partizip\s*(II|2)?|Futur\s*(I|1)?/gi, '')
        // Remove all parenthetical content e.g. (Präsens), (Partizip II), (with 'sein' for movement)
        .replace(/\([^)]*\)/g, '')
        // Remove all square bracket content
        .replace(/\[[^\]]*\]/g, '')
        // Remove leftover dash artifacts
        .replace(/[\s,]*[-–—]\s*[a-zäöüß¨]*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

let germanVoice = null;
let englishVoice = null;
// AUDIO-003: Arabic steps need their own voice slot so Arabic text is
// never routed through the English or German voice (LF-AUDIO).
let arabicVoice = null;

export const setVoices = () => {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Helper to score voice quality (higher score = more natural / human-like)
    const scoreVoice = (v, preferredLangPrefix) => {
        const langLower = (v.lang || '').toLowerCase();
        if (!langLower.startsWith(preferredLangPrefix)) return -1;
        let score = 10;
        const name = (v.name || '').toLowerCase();

        if (name.includes('natural') || name.includes('online')) score += 50;
        if (name.includes('google')) score += 40;
        if (name.includes('premium') || name.includes('enhanced')) score += 30;
        if (name.includes('samantha') || name.includes('alex') || name.includes('daniel') || name.includes('karen')) score += 20;
        if (name.includes('zira') || name.includes('jenni') || name.includes('guy') || name.includes('aria')) score += 15;
        if (name.includes('desktop')) score -= 20; // Penalize legacy SAPI5 Windows Desktop voices (David, Mark)
        if (v.localService === false) score += 10; // Web-synthesized neural voices are smoother

        return score;
    };

    const englishVoices = voices
        .map(v => ({ voice: v, score: scoreVoice(v, 'en') }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

    const germanVoices = voices
        .map(v => ({ voice: v, score: scoreVoice(v, 'de') }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

    // AUDIO-003: select an Arabic voice with the same language-prefix rule
    // so Arabic utterances get a matching voice when the platform has one.
    const arabicVoices = voices
        .map(v => ({ voice: v, score: scoreVoice(v, 'ar') }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

    if (englishVoices.length > 0) {
        englishVoice = englishVoices[0].voice;
        console.log('🎙️ Selected English Voice:', englishVoice.name);
    }
    if (germanVoices.length > 0) {
        germanVoice = germanVoices[0].voice;
        console.log('🎙️ Selected German Voice:', germanVoice.name);
    }
    if (arabicVoices.length > 0) {
        arabicVoice = arabicVoices[0].voice;
        console.log('🎙️ Selected Arabic Voice:', arabicVoice.name);
    }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = setVoices;
    setVoices();
}

export const speak = (text, lang = 'de') => {
    if (window.verbsEngine && window.verbsEngine.stopAudioQueue) {
        window.verbsEngine.stopAudioQueue();
    }
    // AUDIO-003: level pages own their autoplay through window.app — a
    // single pronunciation replaces any running level autoplay queue,
    // the same ownership rule the Verbs page applies.
    if (window.app && typeof window.app.stopAudioQueue === 'function') {
        window.app.stopAudioQueue();
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = cleanTextForAudio(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    // AUDIO-003: explicit language tags at the real utterance boundary —
    // Arabic text is tagged Arabic and never routed to the English voice.
    utterance.lang = lang === 'de' ? 'de-DE' : (lang === 'ar' ? 'ar' : 'en-US');

    if (lang === 'de' && germanVoice) {
        utterance.voice = germanVoice;
    } else if (lang === 'en' && englishVoice) {
        utterance.voice = englishVoice;
    } else if (lang === 'ar' && arabicVoice) {
        utterance.voice = arabicVoice;
    }
    utterance.rate = lang === 'en' ? 0.95 : 0.85;

    if (speakHook) speakHook(text, lang);
    window.speechSynthesis.speak(utterance);
};

// WP-040: Optional hook fired right before each spoken word (single + queue paths)
let speakHook = null;
export const setSpeakHook = (fn) => { speakHook = fn; };

export const playChime = (frequency = 600, duration = 150) => {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
        osc.start();
        osc.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
        // Silent fail for browsers without Web Audio
    }
};

class SpeechQueueClass {
    constructor() {
        this.queue = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.onHighlightCallback = null;
        this.onFinishedCallback = null;
        this.currentUtterance = null;
        this._watchdogTimer = null;
        this._speakDelayTimer = null;
        // AUDIO-002: the no-speech-synthesis fallback timer is tracked like
        // the other two timers so stop()/pause() can always cancel it.
        this._noSynthesisTimer = null;
        // AUDIO-002: queue-ownership generation. Every stop()/pause() mints a
        // new generation; every async callback below captures the generation
        // that scheduled it and ignores the event once a later queue (or a
        // pause) owns the speaker. Stale callbacks can no longer advance the
        // cursor, speak, highlight, or complete a replacement queue.
        this._generation = 0;
    }

    playAll(items, onHighlight, onFinished) {
        this.stop();

        if (!items || items.length === 0) return;

        this.queue = items;
        this.currentIndex = 0;
        this.isPlaying = true;
        this.onHighlightCallback = onHighlight;
        this.onFinishedCallback = onFinished;

        this._speakCurrent();
    }

    _speakCurrent() {
        if (!this.isPlaying || this.currentIndex >= this.queue.length) {
            const cb = this.onFinishedCallback;
            this.stop();
            if (cb) cb();
            return;
        }

        const item = this.queue[this.currentIndex];
        const generation = this._generation;
        
        // Notify highlight callback
        if (this.onHighlightCallback) {
            this.onHighlightCallback(this.currentIndex, item);
        }

        if (!window.speechSynthesis) {
            // AUDIO-002: tracked, generation-owned fallback advance. A paused,
            // stopped, or replaced queue is never advanced by a stale
            // no-synthesis timer (it was previously untracked, so pause and
            // stop could not cancel it and it fired completion early).
            this._noSynthesisTimer = setTimeout(() => {
                if (this._generation !== generation || !this.isPlaying) return;
                this.currentIndex++;
                this._speakCurrent();
            }, 1500);
            return;
        }

        if (this._watchdogTimer) {
            clearTimeout(this._watchdogTimer);
            this._watchdogTimer = null;
        }

        window.speechSynthesis.cancel();

        this._speakDelayTimer = setTimeout(() => {
            // AUDIO-002: ownership guard — a stopped, paused, or replaced
            // queue must never speak.
            if (this._generation !== generation || !this.isPlaying) return;

            const itemLang = item.lang || 'de';
            const rawText = item.text || item.de || item;
            const clean = cleanTextForAudio(rawText);

            if (!clean) {
                this.currentIndex++;
                this._speakCurrent();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(clean);
            // AUDIO-003: per-step language tags — 'ar' steps carry an
            // Arabic tag and are never voiced by the English or German
            // voice; a platform without an Arabic voice resolves the voice
            // from the utterance language itself.
            utterance.lang = itemLang === 'en' ? 'en-US' : (itemLang === 'ar' ? 'ar' : 'de-DE');

            if (itemLang === 'en' && englishVoice) {
                utterance.voice = englishVoice;
            } else if (itemLang === 'ar' && arabicVoice) {
                utterance.voice = arabicVoice;
            } else if (itemLang !== 'en' && itemLang !== 'ar' && germanVoice) {
                utterance.voice = germanVoice;
            }
            utterance.rate = itemLang === 'en' ? 0.92 : 0.85;

            utterance.onend = () => {
                // AUDIO-002: generation + utterance identity — only the
                // utterance of the currently owning queue may advance.
                if (this._generation !== generation) return;
                if (this.currentUtterance === utterance) {
                    if (this._watchdogTimer) { clearTimeout(this._watchdogTimer); this._watchdogTimer = null; }
                    this.currentUtterance = null;
                    this.currentIndex++;
                    this._speakCurrent();
                }
            };

            utterance.onerror = (e) => {
                if (e.error === 'interrupted' || e.error === 'canceled') return;
                console.warn('SpeechQueue: Speech error occurred', e.error);
                // AUDIO-002: generation + utterance identity — a stale error
                // from a replaced or paused queue never advances.
                if (this._generation !== generation) return;
                if (this.currentUtterance === utterance) {
                    if (this._watchdogTimer) { clearTimeout(this._watchdogTimer); this._watchdogTimer = null; }
                    this.currentUtterance = null;
                    this.currentIndex++;
                    this._speakCurrent();
                }
            };

            this.currentUtterance = utterance;
            if (speakHook) speakHook(clean, itemLang);
            window.speechSynthesis.speak(utterance);

            this._watchdogTimer = setTimeout(() => {
                // AUDIO-002: generation-guarded watchdog.
                if (this._generation !== generation) return;
                if (this.isPlaying && this.currentUtterance === utterance) {
                    console.warn('SpeechQueue: Watchdog fired — advancing.');
                    window.speechSynthesis.cancel();
                    this.currentUtterance = null;
                    this.currentIndex++;
                    this._speakCurrent();
                }
            }, 12000);
        }, 250);
    }

    speakSingle(text, lang = 'de') {
        this.stop();
        speak(text, lang);
    }

    stop() {
        // AUDIO-002: minting a new generation invalidates every outstanding
        // callback of the queue being stopped (delayed speak, utterance
        // onend/onerror, watchdog, no-synthesis fallback).
        this._generation++;
        this.isPlaying = false;
        this.queue = [];
        this.currentIndex = 0;
        this.currentUtterance = null;

        if (this._speakDelayTimer) {
            clearTimeout(this._speakDelayTimer);
            this._speakDelayTimer = null;
        }

        if (this._watchdogTimer) {
            clearTimeout(this._watchdogTimer);
            this._watchdogTimer = null;
        }

        if (this._noSynthesisTimer) {
            clearTimeout(this._noSynthesisTimer);
            this._noSynthesisTimer = null;
        }

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    pause() {
        // AUDIO-002: pause keeps the queue and cursor (item-level position)
        // but mints a new generation and clears ALL pending timers, so the
        // canceled utterance's late onend/onerror can never advance the
        // paused cursor or fire completion early.
        this._generation++;
        this.isPlaying = false;
        this.currentUtterance = null;
        if (this._speakDelayTimer) {
            clearTimeout(this._speakDelayTimer);
            this._speakDelayTimer = null;
        }
        if (this._watchdogTimer) {
            clearTimeout(this._watchdogTimer);
            this._watchdogTimer = null;
        }
        if (this._noSynthesisTimer) {
            clearTimeout(this._noSynthesisTimer);
            this._noSynthesisTimer = null;
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    resume() {
        if (!this.isPlaying && this.queue.length > 0 && this.currentIndex < this.queue.length) {
            this.isPlaying = true;
            this._speakCurrent();
        }
    }
}

export const SpeechQueue = new SpeechQueueClass();