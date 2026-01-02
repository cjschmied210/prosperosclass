'use client';

// Web Audio API helper to generate sounds without external files

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

export const playPositiveSound = () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Create a nice "ding" or chime using a high sine wave
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Chime settings (Sine wave, high pitch, decaying)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime); // Start at 800Hz
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); // Slide up slightly for brightness

        // Envelope
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5); // Long decay

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);

        // Add a second harmonic for richness
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1600, ctx.currentTime);
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 1.0);

    } catch (error) {
        console.error('Error playing positive sound:', error);
    }
};

export const playNegativeSound = () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Create a "fart" sound using a low saw wave with frequency modulation and noise
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Sawtooth for the "buzz"
        osc.type = 'sawtooth';

        // Pitch drop - classic cartoon fart/fail sound
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);

        // Filter to muffle it slightly
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.4);

        // Envelope
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); // Sharp attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4); // Short decay

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);

    } catch (error) {
        console.error('Error playing negative sound:', error);
    }
};
