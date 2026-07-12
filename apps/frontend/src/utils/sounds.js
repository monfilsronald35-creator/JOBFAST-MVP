// JOBFAST Sound System — Web Audio API (zero files, works offline)
// All sounds are synthesized. Call sounds.X() anywhere in the app.

let _ctx = null;
const getCtx = () => {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume context if browser suspended it (autoplay policy)
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
};

// enabled flag — user can mute via settings
let _enabled = localStorage.getItem('jf_sound') !== 'off';

export const setSoundEnabled = (v) => {
  _enabled = v;
  localStorage.setItem('jf_sound', v ? 'on' : 'off');
};

export const isSoundEnabled = () => _enabled;

// ── Core tone builder ──────────────────────────────────────────────────────────
function tone(freq, type = 'sine', duration = 0.15, gain = 0.25, delay = 0) {
  if (!_enabled) return;
  try {
    const ctx  = getCtx();
    const osc  = ctx.createOscillator();
    const amp  = ctx.createGain();
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    amp.gain.setValueAtTime(0, ctx.currentTime + delay);
    amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch (_) {}
}

// ── Sound library ──────────────────────────────────────────────────────────────
export const sounds = {
  // UI
  click:        () => tone(700, 'sine', 0.06, 0.18),
  tab:          () => tone(520, 'sine', 0.05, 0.12),
  toggle:       () => { tone(600, 'sine', 0.06, 0.15); tone(800, 'sine', 0.06, 0.15, 0.07); },
  swipe:        () => tone(400, 'sine', 0.08, 0.1),
  open:         () => { tone(440, 'sine', 0.08, 0.15); tone(550, 'sine', 0.08, 0.15, 0.07); },
  close:        () => { tone(550, 'sine', 0.08, 0.12); tone(440, 'sine', 0.08, 0.12, 0.07); },

  // Feedback
  success:      () => { tone(523, 'sine', 0.12, 0.3); tone(659, 'sine', 0.12, 0.3, 0.12); tone(784, 'sine', 0.2, 0.3, 0.24); },
  error:        () => { tone(350, 'sawtooth', 0.15, 0.3); tone(280, 'sawtooth', 0.2, 0.3, 0.12); },
  warning:      () => { tone(600, 'triangle', 0.15, 0.25); tone(600, 'triangle', 0.15, 0.25, 0.25); },
  confirm:      () => { tone(660, 'sine', 0.1, 0.2); tone(880, 'sine', 0.18, 0.2, 0.1); },

  // Communication
  message:      () => { tone(800, 'sine', 0.08, 0.2); tone(1000, 'sine', 0.12, 0.2, 0.09); },
  send:         () => { tone(600, 'sine', 0.07, 0.18); tone(900, 'sine', 0.1, 0.18, 0.08); },
  notification: () => { tone(880, 'sine', 0.12, 0.35); tone(1100, 'sine', 0.18, 0.35, 0.14); },
  alert:        () => {
    for (let i = 0; i < 3; i++) {
      tone(1000, 'square', 0.09, 0.35, i * 0.2);
    }
  },

  // Jobs & Business
  hire:         () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.14, 0.35, i * 0.1)); },
  apply:        () => { tone(440, 'sine', 0.1, 0.2); tone(550, 'sine', 0.12, 0.2, 0.1); tone(660, 'sine', 0.16, 0.2, 0.2); },
  jobPosted:    () => { tone(523, 'sine', 0.1, 0.3); tone(659, 'sine', 0.1, 0.3, 0.12); tone(784, 'sine', 0.15, 0.3, 0.24); },

  // Finance
  payment:      () => { tone(440, 'sine', 0.08, 0.28); tone(550, 'sine', 0.08, 0.28, 0.08); tone(660, 'sine', 0.18, 0.28, 0.16); },
  deposit:      () => { tone(523, 'sine', 0.1, 0.25); tone(784, 'sine', 0.18, 0.25, 0.12); },
  withdraw:     () => { tone(784, 'sine', 0.1, 0.2); tone(523, 'sine', 0.15, 0.2, 0.12); },
  escrow:       () => { tone(600, 'triangle', 0.1, 0.2); tone(800, 'triangle', 0.15, 0.2, 0.12); },

  // Navigation
  login:        () => { [440, 550, 660, 880].forEach((f, i) => tone(f, 'sine', 0.12, 0.25, i * 0.08)); },
  logout:       () => { [880, 660, 550, 440].forEach((f, i) => tone(f, 'sine', 0.1, 0.2, i * 0.07)); },

  // Emergency
  emergency:    () => {
    for (let i = 0; i < 5; i++) {
      tone(1200, 'square', 0.1, 0.5, i * 0.18);
      tone(900,  'square', 0.1, 0.5, i * 0.18 + 0.09);
    }
  },
};

export default sounds;
