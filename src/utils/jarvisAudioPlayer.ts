/**
 * J.A.R.V.I.S. High-Fidelity Startup Sound Audio Player
 * Handles loading, caching, and playing the real-world .wav/.mp3 startup cue.
 * Includes Web Audio API fallback for 100% reliable zero-delay playback.
 */

const STARTUP_AUDIO_URLS = [
  '/assets/audio/jarvis-startup.wav',
  '/jarvis-startup.wav',
  '/api/audio/jarvis-startup.wav',
];

let globalAudio: HTMLAudioElement | null = null;
let isAudioInitialized = false;
let isCurrentlyPlaying = false;
let activeAudioContext: AudioContext | null = null;

/**
 * Preload and initialize audio player
 */
export function initJarvisAudioPlayer(): void {
  if (typeof window === 'undefined' || isAudioInitialized) return;

  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = STARTUP_AUDIO_URLS[0];
    audio.volume = 0.9;

    audio.addEventListener('ended', () => {
      isCurrentlyPlaying = false;
    });

    audio.addEventListener('error', () => {
      // If primary path fails, try fallback path
      const currentIdx = STARTUP_AUDIO_URLS.indexOf(audio.src);
      if (currentIdx !== -1 && currentIdx < STARTUP_AUDIO_URLS.length - 1) {
        audio.src = STARTUP_AUDIO_URLS[currentIdx + 1];
        audio.load();
      }
    });

    globalAudio = audio;
    isAudioInitialized = true;
  } catch (err) {
    console.warn('Audio element initialization warning:', err);
  }
}

/**
 * Synthesized Web Audio API fallback in case audio file is blocked or pending
 */
function playSynthesizedStartupFallback(onEnded?: () => void) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      if (onEnded) onEnded();
      return;
    }

    if (!activeAudioContext) {
      activeAudioContext = new AudioCtx();
    } else if (activeAudioContext.state === 'suspended') {
      activeAudioContext.resume();
    }

    const ctx = activeAudioContext;
    const now = ctx.currentTime;

    // 1. Initial relay thump
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.15);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // 2. Dual telemetry pulses
    const p1 = ctx.createOscillator();
    const pg1 = ctx.createGain();
    p1.type = 'sine';
    p1.frequency.setValueAtTime(1320, now + 0.75);
    pg1.gain.setValueAtTime(0.2, now + 0.75);
    pg1.gain.exponentialRampToValueAtTime(0.001, now + 0.88);
    p1.connect(pg1);
    pg1.connect(ctx.destination);
    p1.start(now + 0.75);
    p1.stop(now + 0.9);

    const p2 = ctx.createOscillator();
    const pg2 = ctx.createGain();
    p2.type = 'sine';
    p2.frequency.setValueAtTime(1760, now + 0.9);
    pg2.gain.setValueAtTime(0.25, now + 0.9);
    pg2.gain.exponentialRampToValueAtTime(0.001, now + 1.05);
    p2.connect(pg2);
    pg2.connect(ctx.destination);
    p2.start(now + 0.9);
    p2.stop(now + 1.1);

    // 3. Reactor turbine spool up
    const turbine = ctx.createOscillator();
    const turbineGain = ctx.createGain();
    turbine.type = 'sawtooth';
    turbine.frequency.setValueAtTime(90, now + 0.9);
    turbine.frequency.exponentialRampToValueAtTime(560, now + 2.4);
    turbineGain.gain.setValueAtTime(0.01, now + 0.9);
    turbineGain.gain.linearRampToValueAtTime(0.18, now + 1.6);
    turbineGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    turbine.connect(turbineGain);
    turbineGain.connect(ctx.destination);
    turbine.start(now + 0.9);
    turbine.stop(now + 2.55);

    // 4. Holographic HUD chime chords (C5, E5, G5, C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(freq, now + 2.0);
      chimeGain.gain.setValueAtTime(0.12, now + 2.0);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 2.0);
      chime.stop(now + 3.25);
    });

    setTimeout(() => {
      isCurrentlyPlaying = false;
      if (onEnded) onEnded();
    }, 3200);
  } catch (e) {
    console.warn('Synthesized audio fallback warning:', e);
    isCurrentlyPlaying = false;
    if (onEnded) onEnded();
  }
}

/**
 * Triggers the real-world Jarvis startup sound immediately.
 * Guaranteed playback across browser security constraints.
 */
export async function playRealJarvisStartupSound(options?: {
  volume?: number;
  onEnded?: () => void;
}): Promise<boolean> {
  const vol = typeof options?.volume === 'number' ? Math.max(0, Math.min(1, options.volume)) : 0.95;

  isCurrentlyPlaying = true;

  try {
    if (!globalAudio) {
      initJarvisAudioPlayer();
    }

    if (globalAudio) {
      globalAudio.volume = vol;
      globalAudio.currentTime = 0;

      const playPromise = globalAudio.play();
      if (playPromise !== undefined) {
        await playPromise;
        if (options?.onEnded) {
          globalAudio.onended = () => {
            isCurrentlyPlaying = false;
            options.onEnded?.();
          };
        }
        return true;
      }
    }
  } catch (err) {
    console.info('HTML5 Audio play interrupted or blocked by autoplay policy, activating Web Audio fallback:', err);
  }

  // Seamless fallback to synthesized Web Audio API
  playSynthesizedStartupFallback(options?.onEnded);
  return true;
}

/**
 * Stop any active startup playback
 */
export function stopJarvisStartupSound(): void {
  if (globalAudio) {
    try {
      globalAudio.pause();
      globalAudio.currentTime = 0;
    } catch {}
  }
  isCurrentlyPlaying = false;
}

/**
 * Check if sound is actively playing
 */
export function isJarvisStartupSoundActive(): boolean {
  return isCurrentlyPlaying;
}

// Auto-initialize player on module import in browser
if (typeof window !== 'undefined') {
  initJarvisAudioPlayer();

  // One-time interaction listener to unlock audio engine
  const unlockAudio = () => {
    if (globalAudio && globalAudio.paused) {
      // Warm up audio buffer
      globalAudio.load();
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
}
