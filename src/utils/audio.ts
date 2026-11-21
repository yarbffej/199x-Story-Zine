// Web Audio API Retro Sound Synthesizer for 199X Suburban Cosmic Arcade

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
}

export function getSoundMuted(): boolean {
  return isMuted;
}

export function playRetroRoll() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

export function playAttackTick(index: number) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const freqs = [440, 587.33, 880];
  osc.type = 'square';
  osc.frequency.setValueAtTime(freqs[index % freqs.length], now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

export function playCriticalSmashSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Power chord surge
  [220, 277.18, 329.63, 554.37].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + i * 0.03);
    osc.frequency.exponentialRampToValueAtTime(freq * 2.2, now + 0.35);

    gain.gain.setValueAtTime(0.1, now + i * 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.03);
    osc.stop(now + 0.45);
  });
}

export function playSynergyEffect() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(523.25, now);
  osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

export function playBinderPageFlipSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Vinyl binder sleeve flutter / page turn swoosh using filtered noise
  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.pow(1 - i / bufferSize, 1.8);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.16);
    filter.Q.setValueAtTime(1.4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Soft ring snap / page flex tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

    oscGain.gain.setValueAtTime(0.04, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start(now);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Graceful silent fallback
  }
}

export function playWheelClick(frequency: number = 850) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.025);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // Graceful silent fallback
  }
}

export function playWheelWin() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const chord = [330, 440, 554.37, 659.25, 880];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.35);

      gain.gain.setValueAtTime(0.06, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + 0.45);
    });
  } catch {
    // Graceful silent fallback
  }
}

export function playZineBlip(frequency: number = 820) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.35, now + 0.045);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  } catch {
    // Graceful silent fallback
  }
}

export function playZineResonanceChime() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.035);
      gain.gain.setValueAtTime(0.07, now + i * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.035);
      osc.stop(now + 1.15);
    });
  } catch {
    // Graceful silent fallback
  }
}

export function playProcedural199xSongPreview(seedIndex: number = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const scales = [
      [220, 261.63, 329.63, 392.0, 440, 523.25],
      [196.0, 246.94, 293.66, 369.99, 392.0, 493.88],
      [164.81, 196.0, 246.94, 293.66, 329.63, 392.0],
    ];
    const scale = scales[Math.abs(seedIndex) % scales.length];
    const step = 0.22;
    for (let i = 0; i < 18; i++) {
      const t = now + i * step;
      // Bass pulse
      if (i % 2 === 0) {
        const bass = ctx.createOscillator();
        const bGain = ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(scale[0] / 2, t);
        bGain.gain.setValueAtTime(0.055, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + step * 1.7);
        bass.connect(bGain);
        bGain.connect(ctx.destination);
        bass.start(t);
        bass.stop(t + step * 1.8);
      }
      // Synth lead arpeggio
      const lead = ctx.createOscillator();
      const lGain = ctx.createGain();
      lead.type = 'square';
      const note = scale[(i * 2 + seedIndex) % scale.length];
      lead.frequency.setValueAtTime(note, t);
      lGain.gain.setValueAtTime(0.035, t);
      lGain.gain.exponentialRampToValueAtTime(0.001, t + step * 0.9);
      lead.connect(lGain);
      lGain.connect(ctx.destination);
      lead.start(t);
      lead.stop(t + step * 0.95);
    }
  } catch {
    // Graceful silent fallback
  }
}

