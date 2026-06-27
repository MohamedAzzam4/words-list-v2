const audioCtx = typeof window !== 'undefined' && window.AudioContext
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

export const cleanTextForAudio = (text) => {
    if (!text) return '';
    return text
        // استخدام وظيفة التنظيف (التي تزيل الأقواس وعلامات الجمع) قبل النطق
        .replace(/\([^)]*\)/g, '')
        .replace(/[\s,]*[-–—]\s*(n|en|er|¨|s|e|r|m)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

let germanVoice = null;

const setGermanVoice = () => {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    germanVoice = voices.find(v => v.lang === 'de-DE' || v.lang === 'de_DE')
               || voices.find(v => v.lang.startsWith('de'))
               || null;
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = setGermanVoice;
    setGermanVoice();
}

export const speak = (text) => {
    if (window.app && window.app.stopAudioQueue) {
        window.app.stopAudioQueue();
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (window.app && window.app.userData) {
        window.app.userData.ttsCount = (window.app.userData.ttsCount || 0) + 1;
        if (window.app._save) window.app._save();
    }

    const clean = cleanTextForAudio(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'de-DE';
    if (germanVoice) utterance.voice = germanVoice;
    utterance.rate = 0.85;

    window.speechSynthesis.speak(utterance);
};

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
        
        // Notify highlight callback
        if (this.onHighlightCallback) {
            this.onHighlightCallback(this.currentIndex, item);
        }

        if (!window.speechSynthesis) {
            // Simulated delay for non-speech environments
            setTimeout(() => {
                this.currentIndex++;
                this._speakCurrent();
            }, 1500);
            return;
        }

        // Clear any watchdog from the previous utterance
        if (this._watchdogTimer) {
            clearTimeout(this._watchdogTimer);
            this._watchdogTimer = null;
        }

        // Cancel first to reset Chrome's internal speech state, then wait
        // 250ms before speaking. Without this delay, mobile Chrome kills
        // the new utterance immediately after cancel().
        window.speechSynthesis.cancel();

        this._speakDelayTimer = setTimeout(() => {
            if (!this.isPlaying) return;

            const clean = cleanTextForAudio(item.de || item);
            if (!clean) {
                this.currentIndex++;
                this._speakCurrent();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(clean);
            utterance.lang = 'de-DE';
            if (germanVoice) utterance.voice = germanVoice;
            utterance.rate = 0.85;

            utterance.onend = () => {
                if (this.currentUtterance === utterance) {
                    if (this._watchdogTimer) { clearTimeout(this._watchdogTimer); this._watchdogTimer = null; }
                    this.currentUtterance = null;
                    this.currentIndex++;
                    this._speakCurrent();
                }
            };

            utterance.onerror = (e) => {
                // 'interrupted' is expected from cancel() — ignore it
                if (e.error === 'interrupted' || e.error === 'canceled') return;
                console.warn('SpeechQueue: Speech error occurred', e.error);
                if (this.currentUtterance === utterance) {
                    if (this._watchdogTimer) { clearTimeout(this._watchdogTimer); this._watchdogTimer = null; }
                    this.currentUtterance = null;
                    this.currentIndex++;
                    this._speakCurrent();
                }
            };

            this.currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);

            // Watchdog: if mobile Chrome silently drops the utterance (no onend/onerror),
            // force-advance the queue after 15s.
            this._watchdogTimer = setTimeout(() => {
                if (this.isPlaying && this.currentUtterance === utterance) {
                    console.warn('SpeechQueue: Watchdog fired — advancing.');
                    window.speechSynthesis.cancel();
                    this.currentUtterance = null;
                    this.currentIndex++;
                    this._speakCurrent();
                }
            }, 15000);
        }, 250);
    }

    speakSingle(text) {
        this.stop();
        speak(text);
    }

    stop() {
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

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
}

export const SpeechQueue = new SpeechQueueClass();