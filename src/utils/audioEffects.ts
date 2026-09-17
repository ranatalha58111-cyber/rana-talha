/**
 * Web Audio API synthesizer for authentic J.A.R.V.I.S and Iron Man machine assembly sound effects.
 * Synthesizes mechanical servos, hydraulic pneumatics, metallic armor locks, and arc reactor turbine power-ups.
 * Requires zero external audio files or network requests.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Generate realistic white/pink noise for pneumatic hisses and mechanical friction
function createNoiseBuffer(ctx: AudioContext, duration: number = 0.6): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Synthesize a heavy metallic clamp / armor segment interlocking snap
function playMetallicClamp(ctx: AudioContext, startTime: number, pitch = 180) {
  // Heavy metallic impact transient
  const impactOsc = ctx.createOscillator();
  const impactGain = ctx.createGain();
  impactOsc.type = 'triangle';
  impactOsc.frequency.setValueAtTime(pitch, startTime);
  impactOsc.frequency.exponentialRampToValueAtTime(35, startTime + 0.12);

  impactGain.gain.setValueAtTime(0.001, startTime);
  impactGain.gain.linearRampToValueAtTime(0.28, startTime + 0.015);
  impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

  impactOsc.connect(impactGain);
  impactGain.connect(ctx.destination);
  impactOsc.start(startTime);
  impactOsc.stop(startTime + 0.16);

  // Metallic resonance chime
  const clangOsc = ctx.createOscillator();
  const clangGain = ctx.createGain();
  clangOsc.type = 'sine';
  clangOsc.frequency.setValueAtTime(pitch * 4.2, startTime);
  clangOsc.frequency.exponentialRampToValueAtTime(pitch * 3.8, startTime + 0.2);

  clangGain.gain.setValueAtTime(0.001, startTime);
  clangGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
  clangGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

  clangOsc.connect(clangGain);
  clangGain.connect(ctx.destination);
  clangOsc.start(startTime);
  clangOsc.stop(startTime + 0.24);
}

// Synthesize a high-torque robotic servo motor whirring into position
function playRoboticServo(ctx: AudioContext, startTime: number, duration = 0.35, startFreq = 300, endFreq = 750) {
  const servoOsc = ctx.createOscillator();
  const servoGain = ctx.createGain();
  servoOsc.type = 'sawtooth';
  servoOsc.frequency.setValueAtTime(startFreq, startTime);
  servoOsc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration * 0.7);
  servoOsc.frequency.exponentialRampToValueAtTime(endFreq * 0.85, startTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(startFreq * 1.5, startTime);
  filter.frequency.exponentialRampToValueAtTime(endFreq * 1.8, startTime + duration);
  filter.Q.setValueAtTime(3.5, startTime);

  servoGain.gain.setValueAtTime(0.001, startTime);
  servoGain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
  servoGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  servoOsc.connect(filter);
  filter.connect(servoGain);
  servoGain.connect(ctx.destination);
  servoOsc.start(startTime);
  servoOsc.stop(startTime + duration + 0.05);
}

// Synthesize a pneumatic hydraulic air release / compression hiss
function playPneumaticHiss(ctx: AudioContext, startTime: number, duration = 0.28) {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2400, startTime);
  filter.frequency.exponentialRampToValueAtTime(800, startTime + duration);
  filter.Q.setValueAtTime(2.0, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(0.14, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(startTime);
  noise.stop(startTime + duration);
}

/**
 * Play authentic Machine Assembly Sequence:
 * Multi-stage robotic arm servos, pneumatic pressure releases, interlocking metallic armor clamps,
 * followed by the high-tech arc reactor turbine power-up.
 */
export function playJarvisMachineAssemblySequence() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Initial gantry engagement & pneumatic burst (0.0s)
  playPneumaticHiss(ctx, now, 0.35);

  // 2. Robotic arm 1 extends & swings into place (0.08s -> 0.42s)
  playRoboticServo(ctx, now + 0.08, 0.36, 260, 680);

  // 3. First armor segment snaps into place (0.28s) - heavy metallic lock
  playMetallicClamp(ctx, now + 0.28, 210);

  // 4. Secondary robotic servo motors align (0.35s -> 0.72s)
  playRoboticServo(ctx, now + 0.35, 0.38, 420, 950);

  // 5. Pneumatic clamp pressure burst 2 (0.50s)
  playPneumaticHiss(ctx, now + 0.5, 0.3);

  // 6. Second armor segment interlocking clamp (0.58s) - deeper clamp
  playMetallicClamp(ctx, now + 0.58, 160);

  // 7. Third high-speed robotic servo (0.65s -> 0.98s)
  playRoboticServo(ctx, now + 0.65, 0.32, 550, 1150);

  // 8. Main chest/faceplate armor locking into place (0.85s) - heavy metallic lock
  playMetallicClamp(ctx, now + 0.85, 130);

  // 9. Arc Reactor Turbine Wind-Up (0.8s -> 1.5s)
  const powerOsc = ctx.createOscillator();
  const powerGain = ctx.createGain();
  powerOsc.type = 'sawtooth';
  powerOsc.frequency.setValueAtTime(65, now + 0.8);
  powerOsc.frequency.exponentialRampToValueAtTime(260, now + 1.4);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, now + 0.8);
  filter.frequency.exponentialRampToValueAtTime(2200, now + 1.45);

  powerGain.gain.setValueAtTime(0.001, now + 0.8);
  powerGain.gain.linearRampToValueAtTime(0.2, now + 1.0);
  powerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.55);

  powerOsc.connect(filter);
  filter.connect(powerGain);
  powerGain.connect(ctx.destination);
  powerOsc.start(now + 0.8);
  powerOsc.stop(now + 1.6);

  // 10. Holographic HUD boot harmonic chime (1.2s -> 1.8s)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(587.33, now + 1.15); // D5
  osc1.frequency.exponentialRampToValueAtTime(880, now + 1.4); // A5
  gain1.gain.setValueAtTime(0.001, now + 1.15);
  gain1.gain.linearRampToValueAtTime(0.2, now + 1.25);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now + 1.15);
  osc1.stop(now + 1.85);

  // 11. Final crystal confirmation lock ping (1.4s)
  const oscPing = ctx.createOscillator();
  const gainPing = ctx.createGain();
  oscPing.type = 'sine';
  oscPing.frequency.setValueAtTime(1760, now + 1.38); // A6
  oscPing.frequency.exponentialRampToValueAtTime(2349.32, now + 1.52); // D7
  gainPing.gain.setValueAtTime(0.001, now + 1.38);
  gainPing.gain.linearRampToValueAtTime(0.18, now + 1.42);
  gainPing.gain.exponentialRampToValueAtTime(0.001, now + 1.75);
  oscPing.connect(gainPing);
  gainPing.connect(ctx.destination);
  oscPing.start(now + 1.38);
  oscPing.stop(now + 1.8);
}

// Track if the startup sound effect has already executed in this session
let hasBootSoundPlayedInSession = false;

/**
 * Play authentic Machine Boot Sequence:
 * Electronic machine boot sounds: "tunt... unt... t-tunt... vmmm..."
 * Stage 1: "tunt" (0.0s) - Low-mid punchy analog synth pulse + mechanical relay tick
 * Stage 2: "unt" (0.38s) - Secondary relay engagement and power conduit latch
 * Stage 3: "t-tunt" (0.75s, 0.90s) - Double high-frequency digital telemetry pulses
 * Stage 4: "vmmm..." (1.15s - 2.5s) - Progressive arc reactor turbine hum winding up (50Hz -> 320Hz)
 * Stage 5: (2.2s) - Crystal HUD activation tone
 * Strictly plays only ONCE per application session.
 */
export function playElectronicMachineBootSequence(onProgress?: (phase: number) => void) {
  // Enforce one-time playback across module and sessionStorage
  if (hasBootSoundPlayedInSession) {
    if (onProgress) onProgress(5);
    return;
  }

  try {
    if (typeof window !== 'undefined' && sessionStorage.getItem('jarvis_boot_initialized_session') === 'true') {
      hasBootSoundPlayedInSession = true;
      if (onProgress) onProgress(5);
      return;
    }
  } catch {}

  hasBootSoundPlayedInSession = true;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Phase 1 (0.0s): First "tunt"
  if (onProgress) onProgress(1);
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(160, now);
  osc1.frequency.exponentialRampToValueAtTime(55, now + 0.12);
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(0.3, now + 0.015);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.18);

  // Mechanical tick transient 1
  const tick1 = ctx.createOscillator();
  const tickGain1 = ctx.createGain();
  tick1.type = 'square';
  tick1.frequency.setValueAtTime(800, now);
  tick1.frequency.exponentialRampToValueAtTime(120, now + 0.04);
  tickGain1.gain.setValueAtTime(0.18, now);
  tickGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  tick1.connect(tickGain1);
  tickGain1.connect(ctx.destination);
  tick1.start(now);
  tick1.stop(now + 0.06);

  // Phase 2 (0.38s): Second "unt"
  setTimeout(() => onProgress && onProgress(2), 380);
  const t2 = now + 0.38;
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(140, t2);
  osc2.frequency.exponentialRampToValueAtTime(45, t2 + 0.14);
  gain2.gain.setValueAtTime(0.001, t2);
  gain2.gain.linearRampToValueAtTime(0.28, t2 + 0.015);
  gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.18);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(t2);
  osc2.stop(t2 + 0.2);

  // Phase 3 (0.75s, 0.90s): Double "t-tunt"
  setTimeout(() => onProgress && onProgress(3), 750);
  const t3a = now + 0.75;
  const osc3a = ctx.createOscillator();
  const gain3a = ctx.createGain();
  osc3a.type = 'sine';
  osc3a.frequency.setValueAtTime(440, t3a);
  osc3a.frequency.exponentialRampToValueAtTime(220, t3a + 0.08);
  gain3a.gain.setValueAtTime(0.001, t3a);
  gain3a.gain.linearRampToValueAtTime(0.22, t3a + 0.01);
  gain3a.gain.exponentialRampToValueAtTime(0.001, t3a + 0.09);
  osc3a.connect(gain3a);
  gain3a.connect(ctx.destination);
  osc3a.start(t3a);
  osc3a.stop(t3a + 0.1);

  const t3b = now + 0.90;
  const osc3b = ctx.createOscillator();
  const gain3b = ctx.createGain();
  osc3b.type = 'triangle';
  osc3b.frequency.setValueAtTime(520, t3b);
  osc3b.frequency.exponentialRampToValueAtTime(130, t3b + 0.12);
  gain3b.gain.setValueAtTime(0.001, t3b);
  gain3b.gain.linearRampToValueAtTime(0.26, t3b + 0.01);
  gain3b.gain.exponentialRampToValueAtTime(0.001, t3b + 0.14);
  osc3b.connect(gain3b);
  gain3b.connect(ctx.destination);
  osc3b.start(t3b);
  osc3b.stop(t3b + 0.16);

  // Phase 4 (1.15s - 2.5s): "vmmmm..." turbine & reactor windup
  setTimeout(() => onProgress && onProgress(4), 1150);
  const t4 = now + 1.15;
  const turbineOsc = ctx.createOscillator();
  const turbineGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  turbineOsc.type = 'sawtooth';
  turbineOsc.frequency.setValueAtTime(50, t4);
  turbineOsc.frequency.exponentialRampToValueAtTime(320, t4 + 1.2);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(120, t4);
  filter.frequency.exponentialRampToValueAtTime(2400, t4 + 1.25);
  filter.Q.setValueAtTime(3.0, t4);

  turbineGain.gain.setValueAtTime(0.001, t4);
  turbineGain.gain.linearRampToValueAtTime(0.25, t4 + 0.35);
  turbineGain.gain.exponentialRampToValueAtTime(0.001, t4 + 1.35);

  turbineOsc.connect(filter);
  filter.connect(turbineGain);
  turbineGain.connect(ctx.destination);
  turbineOsc.start(t4);
  turbineOsc.stop(t4 + 1.4);

  // Crystal lock ping (2.1s)
  setTimeout(() => onProgress && onProgress(5), 2100);
  const t5 = now + 2.1;
  const pingOsc = ctx.createOscillator();
  const pingGain = ctx.createGain();
  pingOsc.type = 'sine';
  pingOsc.frequency.setValueAtTime(1480, t5);
  pingOsc.frequency.exponentialRampToValueAtTime(2217.46, t5 + 0.18); // C#7
  pingGain.gain.setValueAtTime(0.001, t5);
  pingGain.gain.linearRampToValueAtTime(0.18, t5 + 0.03);
  pingGain.gain.exponentialRampToValueAtTime(0.001, t5 + 0.35);
  pingOsc.connect(pingGain);
  pingGain.connect(ctx.destination);
  pingOsc.start(t5);
  pingOsc.stop(t5 + 0.4);
}

/**
 * Play futuristic robotic startup announcement:
 * "Initializing core. Systems online. JARVIS online."
 * Robotic, deep machine-like tone with synchronized robotic sub-carrier modulation.
 * Only plays once per application session.
 */
export function playRoboticStartupVoice(onComplete?: () => void) {
  if (typeof window === 'undefined') {
    if (onComplete) onComplete();
    return;
  }

  // Play subtle electronic confirmation blip
  playJarvisWakeBlip();

  if (onComplete) {
    setTimeout(onComplete, 150);
  }
}

/**
 * Play quick tactical confirmation blip for wake-word detection
 */
export function playJarvisWakeBlip() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(950, now);
  osc.frequency.exponentialRampToValueAtTime(1420, now + 0.07);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * Backward compatibility alias for startup sequence
 */
export function playJarvisStartupSequence() {
  playElectronicMachineBootSequence();
}

/**
 * Play high-tech activation chime: dual ascending harmonics
 */
export function playJarvisActivateSound() {
  playJarvisMachineAssemblySequence();
}

/**
 * Play quick tactical confirmation blip
 */
export function playJarvisBlip() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * Play subtle radar resonance hum
 */
export function playJarvisPulse() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.linearRampToValueAtTime(90, now + 0.25);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.32);
}
