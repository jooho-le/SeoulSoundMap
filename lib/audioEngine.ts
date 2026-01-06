import { getRiskLevel } from '@/lib/risk';

type VoiceNodes = {
  gain: GainNode;
  osc?: OscillatorNode;
  osc2?: OscillatorNode;
  filter?: BiquadFilterNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
  noise?: AudioBufferSourceNode;
  noiseGain?: GainNode;
};

export type AudioEngine = {
  init: () => void;
  setEnabled: (enabled: boolean) => void;
  setRisk: (score: number) => void;
  dispose: () => void;
  isReady: () => boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Smooth parameter changes to avoid audible clicks.
const smoothParam = (
  param: AudioParam,
  value: number,
  now: number,
  time = 0.2
) => {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + time);
};

// Short noise buffer to add tension for the HIGH layer.
const createNoiseBuffer = (ctx: AudioContext) => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const createAudioEngine = (): AudioEngine => {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let low: VoiceNodes | null = null;
  let mid: VoiceNodes | null = null;
  let high: VoiceNodes | null = null;

  const createLow = (context: AudioContext): VoiceNodes => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const gain = context.createGain();
    gain.gain.value = 0;
    osc.connect(filter).connect(gain);
    osc.start();
    return { osc, filter, gain };
  };

  const createMid = (context: AudioContext): VoiceNodes => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    const osc2 = context.createOscillator();
    osc2.type = 'triangle';
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    const gain = context.createGain();
    gain.gain.value = 0;

    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 3.2;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.25;

    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);

    osc.start();
    osc2.start();
    lfo.start();

    return { osc, osc2, filter, gain, lfo, lfoGain };
  };

  const createHigh = (context: AudioContext): VoiceNodes => {
    const osc = context.createOscillator();
    osc.type = 'sawtooth';
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 900;

    const gain = context.createGain();
    gain.gain.value = 0;

    const lfo = context.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 2.1;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(filter.frequency);

    const noise = context.createBufferSource();
    noise.buffer = createNoiseBuffer(context);
    noise.loop = true;
    const noiseGain = context.createGain();
    noiseGain.gain.value = 0.1;

    noise.connect(noiseGain).connect(filter);
    osc.connect(filter);
    filter.connect(gain);

    osc.start();
    noise.start();
    lfo.start();

    return { osc, filter, gain, lfo, lfoGain, noise, noiseGain };
  };

  const connectVoices = () => {
    if (!ctx || !master || !low || !mid || !high) return;
    low.gain.connect(master);
    mid.gain.connect(master);
    high.gain.connect(master);
  };

  const stopVoice = (voice: VoiceNodes | null) => {
    if (!voice) return;
    voice.osc?.stop();
    voice.osc2?.stop();
    voice.lfo?.stop();
    voice.noise?.stop();
    voice.osc?.disconnect();
    voice.osc2?.disconnect();
    voice.lfo?.disconnect();
    voice.noise?.disconnect();
    voice.filter?.disconnect();
    voice.gain.disconnect();
    voice.lfoGain?.disconnect();
    voice.noiseGain?.disconnect();
  };

  return {
    init: () => {
      if (ctx) return;
      // AudioContext must be created after a user gesture.
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      low = createLow(ctx);
      mid = createMid(ctx);
      high = createHigh(ctx);
      connectVoices();
    },
    setEnabled: (enabled: boolean) => {
      if (!ctx || !master) return;
      if (enabled && ctx.state === 'suspended') {
        void ctx.resume();
      }
      const now = ctx.currentTime;
      smoothParam(master.gain, enabled ? 0.85 : 0, now, 0.25);
    },
    setRisk: (score: number) => {
      if (!ctx || !low || !mid || !high) return;
      const now = ctx.currentTime;
      const safe = clamp(score, 0, 100);
      const t = safe / 100;
      const level = getRiskLevel(safe);

      const lowTarget = level === 'LOW' ? 0.45 : 0;
      const midTarget = level === 'MID' ? 0.55 : 0;
      const highTarget = level === 'HIGH' ? 0.65 : 0;

      smoothParam(low.gain.gain, lowTarget, now, 0.18);
      smoothParam(mid.gain.gain, midTarget, now, 0.18);
      smoothParam(high.gain.gain, highTarget, now, 0.18);

      if (low.osc && low.filter) {
        smoothParam(low.osc.frequency, 120 + t * 60, now, 0.2);
        smoothParam(low.filter.frequency, 260 + t * 380, now, 0.2);
      }

      if (mid.osc && mid.osc2 && mid.filter && mid.lfo && mid.lfoGain) {
        smoothParam(mid.osc.frequency, 200 + t * 140, now, 0.2);
        smoothParam(mid.osc2.frequency, 160 + t * 120, now, 0.2);
        smoothParam(mid.filter.frequency, 420 + t * 520, now, 0.2);
        smoothParam(mid.lfo.frequency, 2.8 + t * 3.6, now, 0.2);
        smoothParam(mid.lfoGain.gain, 0.18 + t * 0.28, now, 0.2);
      }

      if (high.osc && high.filter && high.lfo && high.lfoGain) {
        smoothParam(high.osc.frequency, 240 + t * 300, now, 0.2);
        smoothParam(high.filter.frequency, 700 + t * 1400, now, 0.2);
        smoothParam(high.lfo.frequency, 1.6 + t * 5.4, now, 0.2);
        smoothParam(high.lfoGain.gain, 200 + t * 340, now, 0.2);
      }

      if (high.noiseGain) {
        smoothParam(high.noiseGain.gain, 0.06 + t * 0.24, now, 0.2);
      }
    },
    dispose: () => {
      stopVoice(low);
      stopVoice(mid);
      stopVoice(high);
      master?.disconnect();
      ctx?.close();
      low = null;
      mid = null;
      high = null;
      master = null;
      ctx = null;
    },
    isReady: () => Boolean(ctx)
  };
};
