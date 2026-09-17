import fs from 'fs';
import path from 'path';

// Generate authentic J.A.R.V.I.S. system startup sound as high-fidelity 16-bit 44.1kHz Stereo PCM WAV
const SAMPLE_RATE = 44100;
const DURATION = 3.2; // 3.2 seconds of cinematic startup
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

const leftBuffer = new Float32Array(TOTAL_SAMPLES);
const rightBuffer = new Float32Array(TOTAL_SAMPLES);

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  let left = 0;
  let right = 0;

  // --- STAGE 1: Mechanical Relay Click & Sub-Bass Thump (0.00s - 0.35s) ---
  if (t < 0.35) {
    const decay = Math.exp(-t * 18);
    // Sub-bass reactor ignition pulse
    const freq = 120 * Math.exp(-t * 8) + 42;
    const sub = Math.sin(2 * Math.PI * freq * t) * decay * 0.7;
    
    // Crisp mechanical snap (high-freq transient at t=0.015s)
    let click = 0;
    if (t > 0.01 && t < 0.035) {
      const ct = t - 0.01;
      click = (Math.sin(2 * Math.PI * 1800 * ct) + (Math.random() * 2 - 1) * 0.5) * Math.exp(-ct * 220) * 0.5;
    }
    
    left += (sub + click) * 0.85;
    right += (sub + click) * 0.85;
  }

  // --- STAGE 2: Secondary Conduit Engagement & Relay (0.32s - 0.65s) ---
  if (t >= 0.32 && t < 0.70) {
    const t2 = t - 0.32;
    const decay2 = Math.exp(-t2 * 14);
    const sub2 = Math.sin(2 * Math.PI * (160 * Math.exp(-t2 * 10) + 55) * t2) * decay2 * 0.45;
    
    let click2 = 0;
    if (t2 > 0.008 && t2 < 0.025) {
      click2 = Math.sin(2 * Math.PI * 2400 * (t2 - 0.008)) * 0.35 * Math.exp(-(t2 - 0.008) * 200);
    }
    left += (sub2 + click2 * 1.1) * 0.8;
    right += (sub2 + click2 * 0.9) * 0.8;
  }

  // --- STAGE 3: Dual High-Frequency Telemetry Pings "t-tunt" (0.75s & 0.90s) ---
  // Ping 1 at 0.75s
  if (t >= 0.75 && t < 0.92) {
    const tp1 = t - 0.75;
    const env1 = Math.exp(-tp1 * 32);
    const tone1 = (Math.sin(2 * Math.PI * 1320 * tp1) + 0.4 * Math.sin(2 * Math.PI * 2640 * tp1)) * env1 * 0.35;
    left += tone1 * 0.9;
    right += tone1 * 0.6; // subtle left bias
  }
  // Ping 2 at 0.90s (higher pitch, right bias)
  if (t >= 0.90 && t < 1.15) {
    const tp2 = t - 0.90;
    const env2 = Math.exp(-tp2 * 28);
    const tone2 = (Math.sin(2 * Math.PI * 1760 * tp2) + 0.5 * Math.sin(2 * Math.PI * 3520 * tp2)) * env2 * 0.45;
    left += tone2 * 0.6;
    right += tone2 * 0.95; // right bias
  }

  // --- STAGE 4: Arc Reactor Turbine Spool-Up "vmmmm..." (0.85s - 2.45s) ---
  if (t >= 0.85 && t < 2.50) {
    const tt = t - 0.85;
    // Exponential pitch curve from 85Hz up to 580Hz
    const progress = tt / 1.65;
    const currentFreq = 85 * Math.pow(6.8, Math.min(progress, 1));
    
    // Smooth attack and release envelope
    let envTurbine = 0;
    if (tt < 0.4) {
      envTurbine = tt / 0.4;
    } else if (tt > 1.2) {
      envTurbine = Math.max(0, 1 - (tt - 1.2) / 0.45);
    } else {
      envTurbine = 1.0;
    }

    // Fundamental + 2nd harmonic + 3rd harmonic + subtle pulse modulation
    const mod = 1 + 0.12 * Math.sin(2 * Math.PI * 14 * tt);
    const wave1 = Math.sin(2 * Math.PI * currentFreq * tt);
    const wave2 = 0.45 * Math.sin(2 * Math.PI * currentFreq * 2.01 * tt);
    const wave3 = 0.22 * Math.sin(2 * Math.PI * currentFreq * 3.02 * tt);
    const turbine = (wave1 + wave2 + wave3) * envTurbine * mod * 0.38;

    // Stereo panning sweeping from center to ultra-wide
    const pan = 0.5 + 0.4 * Math.sin(2 * Math.PI * 1.5 * tt);
    left += turbine * (1 - pan * 0.4);
    right += turbine * (0.6 + pan * 0.4);
  }

  // --- STAGE 5: Holographic HUD Activation Chords (2.00s - 3.20s) ---
  if (t >= 2.00) {
    const th = t - 2.00;
    const hudDecay = Math.exp(-th * 3.2); // Smooth 1.2s chime sustain

    // Major 9th chord of Stark HUD:
    // C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), D6 (1174.66)
    const c5 = Math.sin(2 * Math.PI * 523.25 * th);
    const e5 = Math.sin(2 * Math.PI * 659.25 * th) * 0.85;
    const g5 = Math.sin(2 * Math.PI * 783.99 * th) * 0.75;
    const b5 = Math.sin(2 * Math.PI * 987.77 * th) * 0.65;
    const d6 = Math.sin(2 * Math.PI * 1174.66 * th) * 0.55;
    
    // Shimmer harmonic sparkle
    const sparkle = 0.25 * Math.sin(2 * Math.PI * 2093.00 * th) * Math.exp(-th * 5.0);

    const hudLeft = (c5 + g5 + d6 + sparkle) * hudDecay * 0.38;
    const hudRight = (c5 + e5 + b5 + sparkle) * hudDecay * 0.38;

    left += hudLeft;
    right += hudRight;

    // Low foundational stabilization drone
    const drone = Math.sin(2 * Math.PI * 65.41 * th) * Math.exp(-th * 2.2) * 0.25;
    left += drone;
    right += drone;
  }

  // Soft limiter to prevent clipping
  leftBuffer[i] = Math.tanh(left * 1.05);
  rightBuffer[i] = Math.tanh(right * 1.05);
}

// Encode to WAV format (16-bit Stereo PCM)
function encodeWAV(left, right, sampleRate) {
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = left.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < left.length; i++) {
    // Left channel
    let sampleL = Math.max(-1, Math.min(1, left[i]));
    let intL = sampleL < 0 ? sampleL * 0x8000 : sampleL * 0x7FFF;
    buffer.writeInt16LE(Math.floor(intL), offset);
    offset += 2;

    // Right channel
    let sampleR = Math.max(-1, Math.min(1, right[i]));
    let intR = sampleR < 0 ? sampleR * 0x8000 : sampleR * 0x7FFF;
    buffer.writeInt16LE(Math.floor(intR), offset);
    offset += 2;
  }

  return buffer;
}

const wavBuffer = encodeWAV(leftBuffer, rightBuffer, SAMPLE_RATE);

// Save to public assets
const outDir1 = path.resolve('public/assets/audio');
const outDir2 = path.resolve('public');
if (!fs.existsSync(outDir1)) fs.mkdirSync(outDir1, { recursive: true });

const targetPath1 = path.join(outDir1, 'jarvis-startup.wav');
const targetPath2 = path.join(outDir2, 'jarvis-startup.wav');

fs.writeFileSync(targetPath1, wavBuffer);
fs.writeFileSync(targetPath2, wavBuffer);

console.log(`Generated JARVIS Startup Sound WAV at:`);
console.log(`- ${targetPath1} (${wavBuffer.length} bytes)`);
console.log(`- ${targetPath2} (${wavBuffer.length} bytes)`);
