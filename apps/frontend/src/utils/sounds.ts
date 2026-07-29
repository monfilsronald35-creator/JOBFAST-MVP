// JOBFAST Sound System — Web Audio API (zero files, works offline)
// All sounds are synthesized. Call sounds.X() anywhere in the app.

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

let _ctx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!_ctx) {
    const AudioCtx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    _ctx = new AudioCtx();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => undefined);
  }
  return _ctx;
};

let _enabled = true;
try {
  _enabled = localStorage.getItem('jf_sound') !== 'off';
} catch {
  // Safari Private Mode
}

export function setSoundEnabled(v: boolean): void {
  _enabled = v;
  try {
    localStorage.setItem('jf_sound', v ? 'on' : 'off');
  } catch {
    // ignore
  }
}

export function isSoundEnabled(): boolean {
  return _enabled;
}

function tone(
  freq: number,
  type: OscillatorType = 'sine',
  duration = 0.15,
  gain = 0.25,
  delay = 0,
): void {
  if (!_enabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    amp.gain.setValueAtTime(0, ctx.currentTime + delay);
    amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch {
    // ignore audio errors
  }
}

export const sounds = {
  click:        (): void => tone(700, 'sine', 0.06, 0.18),
  tab:          (): void => tone(520, 'sine', 0.05, 0.12),
  toggle:       (): void => { tone(600, 'sine', 0.06, 0.15); tone(800, 'sine', 0.06, 0.15, 0.07); },
  swipe:        (): void => tone(400, 'sine', 0.08, 0.1),
  open:         (): void => { tone(440, 'sine', 0.08, 0.15); tone(550, 'sine', 0.08, 0.15, 0.07); },
  close:        (): void => { tone(550, 'sine', 0.08, 0.12); tone(440, 'sine', 0.08, 0.12, 0.07); },
  success:      (): void => { tone(523, 'sine', 0.12, 0.3); tone(659, 'sine', 0.12, 0.3, 0.12); tone(784, 'sine', 0.2, 0.3, 0.24); },
  error:        (): void => { tone(350, 'sawtooth', 0.15, 0.3); tone(280, 'sawtooth', 0.2, 0.3, 0.12); },
  warning:      (): void => { tone(600, 'triangle', 0.15, 0.25); tone(600, 'triangle', 0.15, 0.25, 0.25); },
  confirm:      (): void => { tone(660, 'sine', 0.1, 0.2); tone(880, 'sine', 0.18, 0.2, 0.1); },
  message:      (): void => { tone(800, 'sine', 0.08, 0.2); tone(1000, 'sine', 0.12, 0.2, 0.09); },
  send:         (): void => { tone(600, 'sine', 0.07, 0.18); tone(900, 'sine', 0.1, 0.18, 0.08); },
  notification: (): void => { tone(880, 'sine', 0.12, 0.35); tone(1100, 'sine', 0.18, 0.35, 0.14); },
  alert:        (): void => { for (let i = 0; i < 3; i++) tone(1000, 'square', 0.09, 0.35, i * 0.2); },
  hire:         (): void => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.14, 0.35, i * 0.1)); },
  apply:        (): void => { tone(440, 'sine', 0.1, 0.2); tone(550, 'sine', 0.12, 0.2, 0.1); tone(660, 'sine', 0.16, 0.2, 0.2); },
  jobPosted:    (): void => { tone(523, 'sine', 0.1, 0.3); tone(659, 'sine', 0.1, 0.3, 0.12); tone(784, 'sine', 0.15, 0.3, 0.24); },
  payment:      (): void => { tone(440, 'sine', 0.08, 0.28); tone(550, 'sine', 0.08, 0.28, 0.08); tone(660, 'sine', 0.18, 0.28, 0.16); },
  deposit:      (): void => { tone(523, 'sine', 0.1, 0.25); tone(784, 'sine', 0.18, 0.25, 0.12); },
  withdraw:     (): void => { tone(784, 'sine', 0.1, 0.2); tone(523, 'sine', 0.15, 0.2, 0.12); },
  escrow:       (): void => { tone(600, 'triangle', 0.1, 0.2); tone(800, 'triangle', 0.15, 0.2, 0.12); },
  login:        (): void => { [440, 550, 660, 880].forEach((f, i) => tone(f, 'sine', 0.12, 0.25, i * 0.08)); },
  logout:       (): void => { [880, 660, 550, 440].forEach((f, i) => tone(f, 'sine', 0.1, 0.2, i * 0.07)); },
  emergency:    (): void => {
    for (let i = 0; i < 5; i++) {
      tone(1200, 'square', 0.1, 0.5, i * 0.18);
      tone(900, 'square', 0.1, 0.5, i * 0.18 + 0.09);
    }
  },
} as const;

export type SoundName = keyof typeof sounds;

export default sounds;