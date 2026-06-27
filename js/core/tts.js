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
        this.heartbeatInterval = null;
        this.currentUtterance = null;
    }

    playAll(items, onHighlight, onFinished) {
        this.stop();

        if (!items || items.length === 0) return;

        this.queue = items;
        this.currentIndex = 0;
        this.isPlaying = true;
        this.onHighlightCallback = onHighlight;
        this.onFinishedCallback = onFinished;

        // Start active Chrome speechSynthesis.resume() heartbeat
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.heartbeatInterval = setInterval(() => {
                if (this.isPlaying && window.speechSynthesis.speaking) {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }
            }, 10000);
        }

        this._speakCurrent();
    }

    _speakCurrent() {
        if (!this.isPlaying || this.currentIndex >= this.queue.length) {
            this.stop();
            if (this.onFinishedCallback) this.onFinishedCallback();
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

        window.speechSynthesis.cancel();

        const clean = cleanTextForAudio(item.de || item);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'de-DE';
        if (germanVoice) utterance.voice = germanVoice;
        utterance.rate = 0.85;

        utterance.onend = () => {
            if (this.currentUtterance === utterance) {
                this.currentUtterance = null;
                this.currentIndex++;
                this._speakCurrent();
            }
        };

        utterance.onerror = (e) => {
            console.warn('SpeechQueue: Speech error occurred', e);
            if (this.currentUtterance === utterance) {
                this.currentUtterance = null;
                this.currentIndex++;
                this._speakCurrent();
            }
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
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

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
}

export const SpeechQueue = new SpeechQueueClass();