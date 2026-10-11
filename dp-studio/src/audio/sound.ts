import { useSyncExternalStore } from 'react';

/**
 * Sound engine (Web Audio API).
 *
 * - Everything is synthesised in the browser, so no audio files are needed.
 * - To use your own audio, drop files into src/assets/audio/ named
 *   music / footsteps / key / unlock / pageturn (see the README there).
 * - Browsers only allow audio after a click/tap, so `unlock()` is called from the
 *   "Enter with sound" gate (and the mute toggle). Before that, every call is a no-op.
 */

type Custom = 'music' | 'footsteps' | 'key' | 'unlock' | 'pageturn';

export type Sfx =
  | 'hello'
  | 'paper'
  | 'success'
  | 'shimmer'
  | 'whoosh'
  | 'reveal'
  | 'lockTap'
  | 'keyTrail'
  | 'keyInsert'
  | 'keyTurn'
  | 'unlock'
  | 'lockDrop'
  | 'bookOpen'
  | 'pageTurn'
  | 'click';

const CUSTOM_FOR: Partial<Record<Sfx, Custom>> = { keyTrail: 'key', unlock: 'unlock', pageTurn: 'pageturn' };

const customFiles = import.meta.glob('../assets/audio/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function customUrl(name: Custom): string | undefined {
  for (const [path, url] of Object.entries(customFiles)) {
    const file = path.split('/').pop() ?? '';
    if (file.replace(/\.[^.]+$/, '').toLowerCase() === name) return url;
  }
  return undefined;
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  to?: number;
  dest?: AudioNode;
}
interface NoiseOpts {
  type?: BiquadFilterType;
  freq?: number;
  to?: number;
  q?: number;
  gain?: number;
  attack?: number;
  dest?: AudioNode;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private buffers: Partial<Record<Custom, AudioBuffer>> = {};
  private loading: Promise<void> = Promise.resolve();
  private muted = false;
  private listeners = new Set<() => void>();
  private musicStarted = false;
  private foot: { gain: GainNode; src?: AudioBufferSourceNode } | null = null;

  /* ── React store ─────────────────────────────────────────── */
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };
  getMuted = () => this.muted;

  setMuted(m: boolean) {
    this.muted = m;
    if (m === false && !this.ctx) this.unlock();
    const c = this.ctx;
    if (c) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, c.currentTime, 0.05);
      void c.resume();
    }
    if (!m) this.startMusic();
    this.listeners.forEach((l) => l());
  }

  /* ── setup ───────────────────────────────────────────────── */
  /** Must be called from a user gesture (click / tap / key). */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        return;
      }
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(c.destination);
      this.sfx = c.createGain();
      this.sfx.gain.value = 0.9;
      this.sfx.connect(this.master);
      this.musicBus = c.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);

      this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      document.addEventListener('visibilitychange', this.onVis);
      this.loading = this.loadCustom();
    }
    void this.ctx?.resume();
  }

  private onVis = () => {
    const c = this.ctx;
    if (!c) return;
    if (document.hidden) void c.suspend();
    else void c.resume();
  };

  private async loadCustom() {
    const c = this.ctx;
    if (!c) return;
    const names: Custom[] = ['music', 'footsteps', 'key', 'unlock', 'pageturn'];
    await Promise.all(
      names.map(async (n) => {
        const url = customUrl(n);
        if (!url) return;
        try {
          const res = await fetch(url);
          this.buffers[n] = await c.decodeAudioData(await res.arrayBuffer());
        } catch (e) {
          console.warn(`Could not load custom sound "${n}"`, e);
        }
      }),
    );
  }

  /* ── building blocks ─────────────────────────────────────── */
  private tone(freq: number, t: number, dur: number, o: ToneOpts = {}) {
    const c = this.ctx!;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const a = Math.min(o.attack ?? 0.005, dur * 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.1, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(o.dest ?? this.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(t: number, dur: number, o: NoiseOpts = {}) {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.freq ?? 1000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    f.Q.value = o.q ?? 1;
    const g = c.createGain();
    const a = Math.min(o.attack ?? 0.004, dur * 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.1, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.dest ?? this.sfx);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  private playBuffer(name: Custom, t: number) {
    const c = this.ctx;
    const b = this.buffers[name];
    if (!c || !b) return;
    const s = c.createBufferSource();
    s.buffer = b;
    s.connect(this.sfx);
    s.start(t);
  }

  /* ── robot footsteps ─────────────────────────────────────── */
  /** Walking sound for `duration` seconds (one step per `interval`, matching the walk cycle). */
  footsteps(duration: number, interval = 0.34) {
    const c = this.ctx;
    if (!c || this.muted) return;
    this.stopFootsteps();
    const gain = c.createGain();
    gain.connect(this.sfx);
    this.foot = { gain };
    const t0 = c.currentTime + 0.02;

    const buf = this.buffers.footsteps;
    if (buf) {
      const s = c.createBufferSource();
      s.buffer = buf;
      s.connect(gain);
      s.start(t0);
      gain.gain.setTargetAtTime(0, t0 + duration, 0.08);
      s.stop(t0 + duration + 0.5);
      this.foot.src = s;
      return;
    }

    const steps = Math.max(1, Math.floor(duration / interval));
    for (let i = 0; i < steps; i++) {
      const t = t0 + i * interval;
      const side = i % 2;
      this.tone(side ? 96 : 118, t, 0.15, { to: 50, gain: 0.5, dest: gain });
      this.noise(t, 0.07, { type: 'lowpass', freq: 700, gain: 0.16, dest: gain });
      this.noise(t, 0.05, { type: 'bandpass', freq: 1700, q: 1.3, gain: 0.09, dest: gain });
      this.tone(side ? 2300 : 2700, t + 0.004, 0.04, { type: 'square', gain: 0.012, dest: gain });
    }
  }

  stopFootsteps() {
    const c = this.ctx;
    if (!c || !this.foot) return;
    const { gain, src } = this.foot;
    gain.gain.cancelScheduledValues(c.currentTime);
    gain.gain.setTargetAtTime(0, c.currentTime, 0.04);
    try {
      src?.stop(c.currentTime + 0.3);
    } catch {
      /* already stopped */
    }
    this.foot = null;
  }

  /* ── one-shot effects ────────────────────────────────────── */
  play(name: Sfx) {
    const c = this.ctx;
    if (!c || this.muted) return;
    const t = c.currentTime + 0.01;

    const custom = CUSTOM_FOR[name];
    if (custom && this.buffers[custom]) {
      this.playBuffer(custom, t);
      return;
    }

    switch (name) {
      case 'hello': // friendly two-note robot beep
        this.tone(660, t, 0.12, { type: 'triangle', gain: 0.13, to: 880 });
        this.tone(990, t + 0.14, 0.18, { type: 'triangle', gain: 0.13 });
        break;
      case 'paper': // card unfolding
        this.noise(t, 0.5, { type: 'highpass', freq: 1500, to: 4500, q: 0.7, gain: 0.07, attack: 0.1 });
        this.tone(1200, t + 0.45, 0.06, { gain: 0.04 });
        break;
      case 'success': // rising chime
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.tone(f, t + i * 0.08, 0.5, { gain: 0.1 });
          this.tone(f * 2, t + i * 0.08, 0.3, { type: 'triangle', gain: 0.02 });
        });
        break;
      case 'shimmer':
        [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, t + i * 0.09, 1.1, { gain: 0.035, attack: 0.05 }));
        break;
      case 'whoosh':
        this.noise(t, 0.95, { freq: 400, to: 3000, q: 0.8, gain: 0.13, attack: 0.35 });
        break;
      case 'reveal': // warm swell as the book appears
        [261.63, 329.63, 392, 523.25].forEach((f, i) => this.tone(f, t + i * 0.05, 2.6, { gain: 0.05, attack: 1 }));
        this.tone(1568, t + 0.5, 1.6, { gain: 0.03, attack: 0.2 });
        break;
      case 'lockTap': // metallic tap/bounce
        this.tone(1800, t, 0.22, { gain: 0.1 });
        this.tone(2700, t, 0.16, { gain: 0.06 });
        this.tone(160, t, 0.12, { to: 70, gain: 0.25 });
        break;
      case 'keyTrail': // sparkle arpeggio
        [2093, 2349, 2637, 3136, 3520, 4186].forEach((f, i) => this.tone(f, t + i * 0.075, 0.3, { gain: 0.04 }));
        break;
      case 'keyInsert': // key scrapes in, then clicks
        this.noise(t, 0.3, { freq: 1800, to: 3200, q: 2.5, gain: 0.05, attack: 0.08 });
        this.noise(t + 0.3, 0.05, { freq: 3000, q: 3, gain: 0.16 });
        this.tone(900, t + 0.3, 0.06, { type: 'square', gain: 0.03 });
        break;
      case 'keyTurn': // ratchet clicks
        for (let i = 0; i < 5; i++) {
          this.noise(t + i * 0.14, 0.03, { freq: 2400 + i * 250, q: 3, gain: 0.13 });
          this.tone(300 + i * 40, t + i * 0.14, 0.04, { type: 'square', gain: 0.02 });
        }
        break;
      case 'unlock': // clunk + bright ring + chime
        this.tone(200, t, 0.28, { to: 60, gain: 0.5 });
        this.noise(t, 0.05, { freq: 3500, q: 2, gain: 0.25 });
        this.tone(1760, t + 0.02, 0.9, { gain: 0.09 });
        this.tone(2349, t + 0.02, 0.8, { gain: 0.06 });
        [1046.5, 1318.5, 1568, 2093].forEach((f, i) => this.tone(f, t + 0.25 + i * 0.09, 0.9, { gain: 0.05 }));
        break;
      case 'lockDrop':
        this.tone(700, t, 0.5, { to: 160, type: 'triangle', gain: 0.05 });
        break;
      case 'bookOpen': // creak + air + warm chord
        this.noise(t, 1.6, { freq: 300, to: 900, q: 4, gain: 0.1, attack: 0.4 });
        this.noise(t + 0.3, 1.4, { freq: 500, to: 2500, q: 0.8, gain: 0.1, attack: 0.5 });
        [196, 293.66, 392, 493.88].forEach((f) => this.tone(f, t + 0.8, 3.5, { gain: 0.045, attack: 1.2 }));
        break;
      case 'pageTurn':
        this.noise(t, 0.38, { freq: 1400, to: 3800, q: 0.9, gain: 0.13, attack: 0.07 });
        break;
      case 'click':
        this.tone(1200, t, 0.05, { gain: 0.05 });
        break;
    }
  }

  /* ── background music ────────────────────────────────────── */
  startMusic() {
    const c = this.ctx;
    if (!c || this.musicStarted) return;
    this.musicStarted = true;
    this.musicBus.gain.cancelScheduledValues(c.currentTime);
    this.musicBus.gain.setValueAtTime(0, c.currentTime);
    this.musicBus.gain.linearRampToValueAtTime(0.5, c.currentTime + 3);

    void this.loading.then(() => {
      if (!this.ctx) return;
      const buf = this.buffers.music;
      if (buf) {
        const s = this.ctx.createBufferSource();
        s.buffer = buf;
        s.loop = true;
        s.connect(this.musicBus);
        s.start();
      } else {
        this.startSynthMusic();
      }
    });
  }

  /** Soft generative ambient: slow warm chords + sparse pentatonic plucks with an echo. */
  private startSynthMusic() {
    const c = this.ctx!;
    const bus = this.musicBus;

    const delay = c.createDelay(1.5);
    delay.delayTime.value = 0.52;
    const fb = c.createGain();
    fb.gain.value = 0.38;
    const wet = c.createGain();
    wet.gain.value = 0.5;
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(bus);

    const CHORDS = [
      [130.81, 164.81, 196, 246.94], // Cmaj7
      [110, 164.81, 196, 246.94], // Am9
      [87.31, 130.81, 164.81, 220], // Fmaj7
      [98, 146.83, 196, 246.94], // G6
    ];
    const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

    const pad = (freqs: number[], t: number, dur: number) => {
      freqs.forEach((f) => {
        [
          ['triangle', f],
          ['sine', f * 1.004],
        ].forEach(([type, fr]) => {
          const o = c.createOscillator();
          o.type = type as OscillatorType;
          o.frequency.value = fr as number;
          const lp = c.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 1100;
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.028, t + 2);
          g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.5);
          o.connect(lp);
          lp.connect(g);
          g.connect(bus);
          o.start(t);
          o.stop(t + dur + 1.6);
        });
      });
    };

    const pluck = (f: number, t: number) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g);
      g.connect(bus);
      g.connect(delay);
      o.start(t);
      o.stop(t + 2.3);
    };

    let nextChord = c.currentTime + 0.1;
    let idx = 0;
    let nextPluck = c.currentTime + 2;
    const schedule = () => {
      const horizon = c.currentTime + 4;
      while (nextChord < horizon) {
        pad(CHORDS[idx % CHORDS.length], nextChord, 6);
        idx++;
        nextChord += 6;
      }
      while (nextPluck < horizon) {
        if (Math.random() < 0.8) pluck(PENT[Math.floor(Math.random() * PENT.length)], nextPluck);
        nextPluck += 1.2 + Math.random() * 1.6;
      }
    };
    schedule();
    window.setInterval(schedule, 1000);
  }
}

export const sound = new SoundEngine();

export function useMuted(): boolean {
  return useSyncExternalStore(sound.subscribe, sound.getMuted, () => false);
}
