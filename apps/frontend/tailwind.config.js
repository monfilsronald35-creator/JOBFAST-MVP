/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {
    extend: {

      /* ── COLORS ─────────────────────────────────────────────── */
      colors: {
        // JOBFAST brand namespace
        jf: {
          brand:    '#F0B429',
          light:    '#F5C842',
          dark:     '#D4961A',
          midnight: '#030C19',
          bg:       '#050F1E',
          s1:       '#0A1628',
          s2:       '#0F1E35',
          s3:       '#162540',
          s4:       '#1C2E4A',
          success:  '#10B981',
          warning:  '#F59E0B',
          error:    '#EF4444',
          info:     '#3B82F6',
          gold:     '#D4AF37',
        },
        // Navy scale (dark backgrounds)
        navy: {
          950: '#030C19',
          900: '#050F1E',
          800: '#0A1628',
          700: '#0F1E35',
          600: '#162540',
          500: '#1C2E4A',
          400: '#243858',
        },
        // Gold scale
        gold: {
          200: '#FEE6A0',
          300: '#FDD86A',
          400: '#F5C842',
          500: '#F0B429',
          600: '#D4961A',
          700: '#B07A13',
          800: '#8A5F10',
        },
        // Premium / Luxury
        premium: {
          gold:   '#D4AF37',
          luxury: '#C9A227',
          platinum: '#E8EDF3',
        },
        // Finance
        finance: {
          green: '#059669',
          blue:  '#0284C7',
          card:  '#6366F1',
          crypto: '#F7931A',
        },
      },

      /* ── FONT FAMILIES ──────────────────────────────────────── */
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        sora:    ['Sora', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        numeric: ['Inter', 'system-ui', 'sans-serif'],
      },

      /* ── FONT SIZES ─────────────────────────────────────────── */
      fontSize: {
        '2xs': ['0.625rem',  { lineHeight: '0.875rem', letterSpacing: '0.06em' }],
        xs:    ['0.75rem',   { lineHeight: '1rem' }],
        sm:    ['0.875rem',  { lineHeight: '1.25rem' }],
        base:  ['1rem',      { lineHeight: '1.5rem' }],
        lg:    ['1.125rem',  { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',   { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem',    { lineHeight: '2rem',    letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem',  { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem',   { lineHeight: '2.5rem',  letterSpacing: '-0.025em' }],
        '5xl': ['3rem',      { lineHeight: '1.1',     letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem',   { lineHeight: '1.05',    letterSpacing: '-0.035em' }],
        '7xl': ['4.5rem',    { lineHeight: '1.0',     letterSpacing: '-0.04em' }],
        '8xl': ['6rem',      { lineHeight: '1.0',     letterSpacing: '-0.04em' }],
      },

      /* ── BORDER RADII ───────────────────────────────────────── */
      borderRadius: {
        none:    '0',
        xs:      '4px',
        sm:      '8px',
        DEFAULT: '12px',
        md:      '12px',
        lg:      '16px',
        xl:      '20px',
        '2xl':   '24px',
        '3xl':   '32px',
        '4xl':   '40px',
        pill:    '9999px',
      },

      /* ── BOX SHADOWS ────────────────────────────────────────── */
      boxShadow: {
        xs:      '0 1px 2px rgba(0,0,0,0.50)',
        sm:      '0 2px 4px rgba(0,0,0,0.45),0 1px 2px rgba(0,0,0,0.30)',
        DEFAULT: '0 4px 12px rgba(0,0,0,0.50),0 2px 4px rgba(0,0,0,0.35)',
        md:      '0 4px 12px rgba(0,0,0,0.50),0 2px 4px rgba(0,0,0,0.35)',
        lg:      '0 8px 24px rgba(0,0,0,0.55),0 4px 8px rgba(0,0,0,0.40)',
        xl:      '0 16px 40px rgba(0,0,0,0.60),0 8px 16px rgba(0,0,0,0.45)',
        '2xl':   '0 24px 60px rgba(0,0,0,0.65),0 12px 24px rgba(0,0,0,0.50)',
        '3xl':   '0 40px 80px rgba(0,0,0,0.70),0 20px 40px rgba(0,0,0,0.55)',
        brand:   '0 4px 20px rgba(240,180,41,0.28),0 0 0 1px rgba(240,180,41,0.14)',
        premium: '0 8px 32px rgba(0,0,0,0.50),0 0 0 1px rgba(240,180,41,0.18)',
        success: '0 4px 20px rgba(16,185,129,0.25)',
        error:   '0 4px 20px rgba(239,68,68,0.25)',
        info:    '0 4px 20px rgba(59,130,246,0.25)',
        card:    '0 2px 8px rgba(0,0,0,0.40),0 0 0 1px rgba(255,255,255,0.06)',
        glass:   '0 4px 24px rgba(0,0,0,0.30),0 0 0 1px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.10)',
        glow:    '0 0 28px rgba(240,180,41,0.20),0 0 10px rgba(240,180,41,0.08)',
        inner:   'inset 0 2px 4px rgba(0,0,0,0.30)',
        none:    'none',
      },

      /* ── SPACING EXTRAS ─────────────────────────────────────── */
      spacing: {
        4.5:  '1.125rem',
        5.5:  '1.375rem',
        13:   '3.25rem',
        15:   '3.75rem',
        17:   '4.25rem',
        18:   '4.5rem',
        22:   '5.5rem',
        26:   '6.5rem',
        30:   '7.5rem',
        34:   '8.5rem',
        38:   '9.5rem',
        42:   '10.5rem',
        'screen-header': 'var(--jf-header-height)',
        'screen-nav':    'var(--jf-nav-height)',
        'screen-tab':    'var(--jf-tab-bar-height)',
        'touch':         'var(--jf-touch-target)',
      },

      /* ── SCREENS ────────────────────────────────────────────── */
      screens: {
        xs:    '375px',
        sm:    '640px',
        md:    '768px',
        lg:    '1024px',
        xl:    '1280px',
        '2xl': '1440px',
        '3xl': '1920px',
      },

      /* ── ANIMATIONS ─────────────────────────────────────────── */
      animation: {
        'fade-in':     'jf-fade-in    350ms cubic-bezier(0.00,0.00,0.20,1.00) both',
        'slide-up':    'jf-slide-up   350ms cubic-bezier(0.00,0.00,0.20,1.00) both',
        'slide-down':  'jf-slide-down 350ms cubic-bezier(0.00,0.00,0.20,1.00) both',
        'slide-left':  'jf-slide-left 350ms cubic-bezier(0.00,0.00,0.20,1.00) both',
        'scale-in':    'jf-scale-in   300ms cubic-bezier(0.16,1.00,0.30,1.00) both',
        'bounce-in':   'jf-bounce-in  500ms cubic-bezier(0.34,1.56,0.64,1.00) both',
        'sheet-in':    'jf-sheet-in   380ms cubic-bezier(0.16,1.00,0.30,1.00) both',
        'float':       'jf-float 3s ease-in-out infinite',
        'shimmer':     'jf-shimmer 1.8s ease-in-out infinite',
        'spin-slow':   'jf-spin 1.4s linear infinite',
        'pulse-brand': 'jf-pulse-brand 2s ease-in-out infinite',
      },

      /* ── KEYFRAMES ──────────────────────────────────────────── */
      keyframes: {
        'jf-fade-in':    { from:{opacity:'0'},                       to:{opacity:'1'} },
        'jf-slide-up':   { from:{opacity:'0',transform:'translateY(18px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        'jf-slide-down': { from:{opacity:'0',transform:'translateY(-18px)'},to:{opacity:'1',transform:'translateY(0)'} },
        'jf-slide-left': { from:{opacity:'0',transform:'translateX(24px)'}, to:{opacity:'1',transform:'translateX(0)'} },
        'jf-scale-in':   { from:{opacity:'0',transform:'scale(0.92)'}, to:{opacity:'1',transform:'scale(1)'} },
        'jf-bounce-in':  { from:{opacity:'0',transform:'scale(0.68)'}, '60%':{transform:'scale(1.09)'}, '80%':{transform:'scale(0.97)'}, to:{opacity:'1',transform:'scale(1)'} },
        'jf-sheet-in':   { from:{transform:'translateY(100%)',opacity:'0'}, to:{transform:'translateY(0)',opacity:'1'} },
        'jf-float':      { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-6px)'} },
        'jf-shimmer':    { '0%':{backgroundPosition:'200% 0'}, '100%':{backgroundPosition:'-200% 0'} },
        'jf-spin':       { from:{transform:'rotate(0deg)'}, to:{transform:'rotate(360deg)'} },
        'jf-pulse-brand':{ '0%,100%':{boxShadow:'0 0 0 0 rgba(240,180,41,0)'}, '50%':{boxShadow:'0 0 0 8px rgba(240,180,41,0.14)'} },
      },

      /* ── TRANSITION TIMING ──────────────────────────────────── */
      transitionTimingFunction: {
        spring:    'cubic-bezier(0.16,1.00,0.30,1.00)',
        standard:  'cubic-bezier(0.20,0.00,0.00,1.00)',
        decel:     'cubic-bezier(0.00,0.00,0.20,1.00)',
        accel:     'cubic-bezier(0.30,0.00,1.00,1.00)',
        overshoot: 'cubic-bezier(0.34,1.56,0.64,1.00)',
      },

      /* ── TRANSITION DURATION ────────────────────────────────── */
      transitionDuration: {
        '50':  '50ms',
        '120': '120ms',
        '220': '220ms',
        '350': '350ms',
        '500': '500ms',
        '700': '700ms',
      },

      /* ── BACKDROP BLUR ──────────────────────────────────────── */
      backdropBlur: {
        xs:      '4px',
        sm:      '8px',
        DEFAULT: '20px',
        md:      '20px',
        lg:      '40px',
        xl:      '60px',
      },

      /* ── Z-INDEX ────────────────────────────────────────────── */
      zIndex: {
        1:       '1',
        2:       '2',
        3:       '3',
        raised:  '10',
        overlay: '100',
        sheet:   '150',
        modal:   '200',
        toast:   '300',
        tooltip: '400',
        shell:   '9999',
      },
    },
  },

  plugins: [],
}