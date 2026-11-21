/**
 * Multi-Style Offline 3-Act 199X Synthwave Soundtrack Composer
 * Synthesizes a real 40-second 16-bit WAV Blob directly in the browser (zero external tabs!)
 * across 5 distinct 1990s vibes that progress through Act I -> Act II -> Act III:
 *   0: VHS Neon Synthwave (118 BPM driving octave bass + gated snare + saw lead)
 *   1: 16-Bit Sega Action (126 BPM punchy FM slap bass + heroic arcade brass lead)
 *   2: Midnight Mall Vapor-Funk (104 BPM warm electric-piano chords + funky bass + glass bells)
 *   3: Laser-Tag Electro Pulse (124 BPM hypnotic 16th-note acid arp + crisp electro drums)
 *   4: Dreamy Lo-Fi Cassette (96 BPM nostalgic detuned chords + chill groove + chime melody)
 */

export const SYNTH_STYLE_PRESETS = [
  { id: 'vhs-synthwave', label: 'VHS Neon Synthwave', bpm: 118 },
  { id: 'sega-action', label: '16-Bit Sega Action', bpm: 126 },
  { id: 'mall-funk', label: 'Midnight Mall Vapor-Funk', bpm: 104 },
  { id: 'laser-electro', label: 'Laser-Tag Electro Pulse', bpm: 124 },
  { id: 'lofi-cassette', label: 'Dreamy Lo-Fi Cassette', bpm: 96 },
] as const;

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function encodeMonoBufferToWav(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const dataSize = numFrames * 2;
  const outBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(outBuffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono (compact ~1.7MB WAV for instant HTML/Drive export!)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const mixed = (ch0[i] + ch1[i]) * 0.5;
    const clamped = Math.max(-1, Math.min(1, mixed));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

export async function render199x3ActSynthTrackWav(
  seedKey: string,
  styleIndex?: number
): Promise<{ blob: Blob; title: string; styleIdx: number }> {
  const seed = hashSeed(seedKey || '199x-zine');
  const resolvedStyleIdx =
    typeof styleIndex === 'number'
      ? Math.abs(styleIndex) % SYNTH_STYLE_PRESETS.length
      : seed % SYNTH_STYLE_PRESETS.length;
  const preset = SYNTH_STYLE_PRESETS[resolvedStyleIdx];

  const sampleRate = 22050;
  const durationSec = 40;
  const offline = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  const roots = [36, 38, 40, 41, 43, 45];
  const rootNames = ['C', 'D', 'E', 'F', 'G', 'A'];
  const rootSlot = (seed + resolvedStyleIdx * 2) % roots.length;
  const rootMidi = roots[rootSlot];
  const keyName = `${rootNames[rootSlot]}m`;
  const bpm = preset.bpm;
  const beat = 60 / bpm;
  const sixteenth = beat / 4;

  // Distinct chord progressions per style
  const progressions: number[][] = [
    [0, 8, 3, 10], // VHS Synthwave: i - VI - III - VII
    [0, 0, 5, 7],  // 16-Bit Action: i - i - iv - v
    [0, 5, 10, 3], // Mall Vapor-Funk: i - iv - VII - III
    [0, 3, 8, 7],  // Laser Electro: i - III - VI - v
    [8, 10, 0, 3], // Lo-Fi Cassette: VI - VII - i - III
  ];
  const chordRoots = progressions[resolvedStyleIdx];
  const minorScale = [0, 2, 3, 5, 7, 8, 10, 12];

  // Master chain
  const master = offline.createGain();
  master.gain.setValueAtTime(0.78, 0);
  master.gain.setValueAtTime(0.78, durationSec - 2.2);
  master.gain.linearRampToValueAtTime(0.001, durationSec);

  const comp = offline.createDynamicsCompressor();
  comp.threshold.value = -13;
  comp.ratio.value = 4.2;
  master.connect(comp);
  comp.connect(offline.destination);

  const noiseBuf = offline.createBuffer(1, sampleRate, sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const schedulePad = (
    start: number,
    dur: number,
    midis: number[],
    vol: number,
    cutoffStart: number,
    cutoffEnd: number,
    wave: OscillatorType = 'sawtooth'
  ) => {
    const filter = offline.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffStart, start);
    filter.frequency.linearRampToValueAtTime(cutoffEnd, start + dur * 0.68);
    filter.Q.value = resolvedStyleIdx === 3 ? 4.2 : 1.8;

    const gain = offline.createGain();
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(vol, start + Math.min(0.9, dur * 0.22));
    gain.gain.setValueAtTime(vol, Math.max(start + 0.1, start + dur - 0.8));
    gain.gain.linearRampToValueAtTime(0.001, start + dur);

    filter.connect(gain);
    gain.connect(master);

    midis.forEach((m) => {
      [-9, 9].forEach((detune) => {
        const osc = offline.createOscillator();
        osc.type = wave;
        osc.frequency.setValueAtTime(midiToHz(m), start);
        osc.detune.setValueAtTime(detune, start);
        osc.connect(filter);
        osc.start(start);
        osc.stop(start + dur + 0.04);
      });
    });
  };

  const scheduleBass = (
    start: number,
    dur: number,
    midi: number,
    vol: number,
    wave: OscillatorType = 'sawtooth',
    filterPeak: number = 1400
  ) => {
    const osc = offline.createOscillator();
    const filter = offline.createBiquadFilter();
    const gain = offline.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(midiToHz(midi), start);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterPeak, start);
    filter.frequency.exponentialRampToValueAtTime(200, start + dur);
    filter.Q.value = resolvedStyleIdx === 3 ? 5.5 : 3.0;

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  const scheduleSynth = (
    start: number,
    dur: number,
    midi: number,
    vol: number,
    wave: OscillatorType = 'square',
    cutoff: number = 2800
  ) => {
    const osc = offline.createOscillator();
    const filter = offline.createBiquadFilter();
    const gain = offline.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(midiToHz(midi), start);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, start);
    filter.frequency.exponentialRampToValueAtTime(520, start + dur);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  };

  const scheduleKick = (start: number, punch: number = 0.56) => {
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, start);
    osc.frequency.exponentialRampToValueAtTime(42, start + 0.12);
    gain.gain.setValueAtTime(punch, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.21);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 0.23);
  };

  const scheduleSnare = (start: number, tight: boolean = false) => {
    const src = offline.createBufferSource();
    src.buffer = noiseBuf;
    const bp = offline.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = tight ? 2300 : 1750;
    bp.Q.value = tight ? 1.2 : 0.75;
    const gain = offline.createGain();
    gain.gain.setValueAtTime(tight ? 0.22 : 0.28, start);
    gain.gain.setValueAtTime(tight ? 0.14 : 0.21, start + (tight ? 0.05 : 0.1));
    gain.gain.exponentialRampToValueAtTime(0.001, start + (tight ? 0.11 : 0.18));
    src.connect(bp);
    bp.connect(gain);
    gain.connect(master);
    src.start(start);
    src.stop(start + 0.2);
  };

  const scheduleHat = (start: number, accent: boolean) => {
    const src = offline.createBufferSource();
    src.buffer = noiseBuf;
    const hp = offline.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6400;
    const gain = offline.createGain();
    gain.gain.setValueAtTime(accent ? 0.085 : 0.04, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(master);
    src.start(start);
    src.stop(start + 0.05);
  };

  // ================= ACT I (0:00 - 0:11): Atmospheric Intro =================
  const act1End = 11;
  const introWave: OscillatorType = resolvedStyleIdx === 2 || resolvedStyleIdx === 4 ? 'triangle' : 'sawtooth';
  schedulePad(0, 5.8, [rootMidi + 12, rootMidi + 15, rootMidi + 19, rootMidi + 22], 0.16, 300, 1050, introWave);
  schedulePad(5.5, 5.8, [rootMidi + 12, rootMidi + 15, rootMidi + 19, rootMidi + 24], 0.17, 420, 1550, introWave);

  for (let t = 0; t < act1End; t += beat / 2) {
    const step = Math.round(t / (beat / 2));
    scheduleBass(t, beat * 0.45, rootMidi + (step % 4 === 3 ? 7 : 0), 0.14 + (t / act1End) * 0.09);
    if (step % 2 === 0) {
      const arp = rootMidi + 24 + minorScale[(step + resolvedStyleIdx * 2 + seed) % minorScale.length];
      scheduleSynth(t, beat * 0.65, arp, 0.08, resolvedStyleIdx === 1 ? 'square' : 'triangle', 2200);
    }
  }

  // ================= ACT II (0:11 - 0:30): Good Guy vs. Bad Guy Main Groove =================
  const act2Start = 11;
  const act2End = 30;
  const barLen = beat * 4;

  const melodies: number[][] = [
    [0, 3, 7, 10, 12, 10, 7, 5, 3, 5, 7, 3, 2, 0, 7, 5],   // VHS Synthwave
    [0, 7, 10, 12, 10, 7, 12, 15, 12, 10, 7, 5, 7, 3, 5, 0], // Sega Action
    [12, 10, 7, 3, 5, 7, 10, 7, 3, 5, 7, 10, 12, 14, 12, 10], // Mall Vapor-Funk
    [0, 12, 3, 12, 7, 12, 10, 12, 5, 12, 7, 12, 10, 15, 12, 7], // Laser Acid Arp
    [7, 10, 12, 10, 7, 5, 3, 5, 7, 3, 2, 3, 5, 7, 10, 7],   // Lo-Fi Cassette
  ];
  const melody = melodies[resolvedStyleIdx];

  let barIdx = 0;
  for (let barStart = act2Start; barStart < act2End; barStart += barLen) {
    const shift = chordRoots[barIdx % chordRoots.length];
    const barRoot = rootMidi + shift;

    schedulePad(
      barStart,
      barLen,
      [barRoot + 12, barRoot + 15, barRoot + 19, barRoot + 22],
      resolvedStyleIdx === 4 ? 0.16 : 0.11,
      resolvedStyleIdx === 4 ? 750 : 950,
      resolvedStyleIdx === 4 ? 1200 : 2100,
      introWave
    );

    for (let s = 0; s < 16; s++) {
      const t = barStart + s * sixteenth;
      if (t >= act2End) break;

      // Style-specific drums
      if (resolvedStyleIdx === 2 || resolvedStyleIdx === 4) {
        // Funk / Lo-Fi syncopated boom-bap groove
        if (s === 0 || s === 6 || s === 10) scheduleKick(t, 0.52);
        if (s === 4 || s === 12) scheduleSnare(t, true);
        if (s % 2 === 0) scheduleHat(t, s % 4 === 2);
      } else if (resolvedStyleIdx === 1) {
        // 16-Bit Action driving breakbeat
        if (s === 0 || s === 3 || s === 8 || s === 10) scheduleKick(t, 0.58);
        if (s === 4 || s === 12 || s === 15) scheduleSnare(t, true);
        scheduleHat(t, s % 4 === 0);
      } else {
        // Classic 4-on-the-floor Synthwave / Electro
        if (s === 0 || s === 4 || s === 8 || s === 12) scheduleKick(t, 0.56);
        if (s === 4 || s === 12) scheduleSnare(t, false);
        if (s % 2 === 0) scheduleHat(t, s % 4 === 2);
      }

      // Style-specific bassline
      if (resolvedStyleIdx === 2) {
        // Syncopated funk slap bass
        if (s === 0 || s === 3 || s === 6 || s === 8 || s === 11 || s === 14) {
          scheduleBass(t, sixteenth * 1.4, s === 11 || s === 14 ? barRoot + 10 : barRoot, 0.24, 'triangle', 1800);
        }
      } else if (resolvedStyleIdx === 4) {
        // Warm slow sub bass
        if (s === 0 || s === 6 || s === 10) {
          scheduleBass(t, sixteenth * 2.5, barRoot, 0.22, 'triangle', 750);
        }
      } else {
        const bassNote = s % 2 === 0 ? barRoot : barRoot + 12;
        scheduleBass(
          t,
          sixteenth * 0.85,
          bassNote,
          s % 4 === 0 ? 0.24 : 0.16,
          resolvedStyleIdx === 1 ? 'square' : 'sawtooth',
          resolvedStyleIdx === 3 ? 2200 : 1400
        );
      }

      // Style-specific lead / arp
      const shouldPlayLead =
        resolvedStyleIdx === 3
          ? true // continuous hypnotic 16th electro arp
          : resolvedStyleIdx === 4
          ? s % 4 === 0 || s === 10
          : s % 2 === 0;

      if (shouldPlayLead) {
        const mIdx = (barIdx * 8 + Math.floor(s / (resolvedStyleIdx === 3 ? 1 : 2))) % melody.length;
        const leadMidi = rootMidi + 24 + melody[mIdx];
        const leadWave: OscillatorType =
          resolvedStyleIdx === 2 || resolvedStyleIdx === 4
            ? 'triangle'
            : resolvedStyleIdx === 3
            ? 'sawtooth'
            : 'square';
        scheduleSynth(
          t,
          sixteenth * (resolvedStyleIdx === 3 ? 0.9 : 1.9),
          leadMidi,
          resolvedStyleIdx === 3 ? 0.1 : 0.13,
          leadWave,
          resolvedStyleIdx === 4 ? 1500 : 2900
        );
      }
    }
    barIdx++;
  }

  // ================= ACT III (0:30 - 0:40): Warm Midnight Resolution =================
  const act3Start = 30;
  schedulePad(
    act3Start,
    5.2,
    [rootMidi + 12, rootMidi + 15, rootMidi + 19, rootMidi + 22],
    0.16,
    1300,
    520,
    'triangle'
  );
  schedulePad(
    act3Start + 4.8,
    5.4,
    [rootMidi + 12, rootMidi + 16, rootMidi + 19, rootMidi + 24],
    0.16,
    1050,
    380,
    'triangle'
  );

  const bellNotes = [24, 27, 31, 34, 36, 31, 27, 24];
  let bIdx = 0;
  for (let t = act3Start; t < durationSec - 1.2; t += beat * 0.75) {
    const fade = 1 - (t - act3Start) / (durationSec - act3Start);
    scheduleSynth(
      t,
      beat * 1.4,
      rootMidi + bellNotes[bIdx % bellNotes.length],
      0.085 * Math.max(0.15, fade),
      'sine',
      2200
    );
    bIdx++;
  }

  const rendered = await offline.startRendering();
  const blob = encodeMonoBufferToWav(rendered);
  return {
    blob,
    title: `${preset.label} (${keyName} • ${bpm} BPM)`,
    styleIdx: resolvedStyleIdx,
  };
}
