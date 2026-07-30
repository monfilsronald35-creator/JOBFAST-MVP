import React, { memo } from 'react';

// ── Canonical brand values ────────────────────────────────────────────────
const GOLD   = '#F0B429';
const GOLD_L = '#F5C842';
const GOLD_D = '#D4961A';
const WHITE  = '#F8FAFC';
const DARK   = '#030C19';

// ── Lightning bolt path (24×24 viewBox) ──────────────────────────────────
const BOLT = 'M13 2 L5 14 H11 L9 22 L19 10 H13 Z';

// ── Types ─────────────────────────────────────────────────────────────────
type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type LogoVariant = 'default' | 'white' | 'black' | 'gold' | 'monochrome';
type LogoLayout  = 'horizontal' | 'stacked' | 'symbol';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  layout?: LogoLayout;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

const sizeMap: Record<LogoSize, { symbol: number; fontSize: number; gap: number }> = {
  xs:  { symbol: 20, fontSize: 16, gap: 5 },
  sm:  { symbol: 28, fontSize: 22, gap: 7 },
  md:  { symbol: 36, fontSize: 28, gap: 9 },
  lg:  { symbol: 48, fontSize: 36, gap: 12 },
  xl:  { symbol: 64, fontSize: 48, gap: 16 },
  '2xl': { symbol: 96, fontSize: 72, gap: 22 },
};

// ── Symbol (lightning bolt in rounded square) ─────────────────────────────
interface SymbolProps {
  size?: number;
  bg?: string;
  bolt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LogoSymbol = memo(function LogoSymbol({
  size = 40,
  bg = DARK,
  bolt = GOLD,
  className,
  style,
}: SymbolProps) {
  const rx = size * 0.225;
  const scale = size / 24;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <rect width={size} height={size} rx={rx} fill={bg} />
      <g transform={`scale(${scale})`}>
        <path d={BOLT} fill={bolt} />
      </g>
    </svg>
  );
});

// ── App Icon (with gradient background) ───────────────────────────────────
export const AppIcon = memo(function AppIcon({
  size = 48,
  className,
  style,
}: Pick<SymbolProps, 'size' | 'className' | 'style'>) {
  const rx = size * 0.225;
  const scale = size / 24;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="jf-icon-bg" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F1E35" />
          <stop offset="100%" stopColor="#030C19" />
        </linearGradient>
        <linearGradient id="jf-icon-bolt" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={GOLD_L} />
          <stop offset="100%" stopColor={GOLD_D} />
        </linearGradient>
      </defs>
      <rect width={size} height={size} rx={rx} fill="url(#jf-icon-bg)" />
      <g transform={`scale(${scale})`}>
        <path d={BOLT} fill="url(#jf-icon-bolt)" />
      </g>
    </svg>
  );
});

// ── Wordmark ──────────────────────────────────────────────────────────────
interface WordmarkProps {
  jobColor?: string;
  fastColor?: string;
  fontSize?: number;
  letterSpacing?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LogoWordmark = memo(function LogoWordmark({
  jobColor = GOLD,
  fastColor = WHITE,
  fontSize = 28,
  letterSpacing = '-0.03em',
  className,
  style,
}: WordmarkProps) {
  const fw = 900;
  const ff = "'Inter', system-ui, -apple-system, sans-serif";
  const dy = fontSize * 0.82;
  const jobW = fontSize * 2.4;
  const fastW = fontSize * 3.0;
  const totalW = jobW + fastW;
  const h = fontSize;
  return (
    <svg
      width={totalW}
      height={h}
      viewBox={`0 0 ${totalW} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <text
        x="0" y={dy}
        fontFamily={ff}
        fontWeight={fw}
        fontSize={fontSize}
        letterSpacing={letterSpacing}
        fill={jobColor}
      >
        JOB
      </text>
      <text
        x={jobW} y={dy}
        fontFamily={ff}
        fontWeight={fw}
        fontSize={fontSize}
        letterSpacing={letterSpacing}
        fill={fastColor}
      >
        FAST
      </text>
    </svg>
  );
});

// ── Full Logo (symbol + wordmark) ─────────────────────────────────────────
export const Logo = memo(function Logo({
  size = 'md',
  variant = 'default',
  layout = 'horizontal',
  className,
  style,
  'aria-label': ariaLabel = 'JOBFAST',
}: LogoProps) {
  const s = sizeMap[size];

  const jobColor  = variant === 'white' ? WHITE
                  : variant === 'black' ? DARK
                  : variant === 'gold'  ? GOLD
                  : variant === 'monochrome' ? 'currentColor'
                  : GOLD;

  const fastColor = variant === 'white' ? WHITE
                  : variant === 'black' ? DARK
                  : variant === 'gold'  ? GOLD
                  : variant === 'monochrome' ? 'currentColor'
                  : WHITE;

  const symbolBg   = variant === 'white' ? WHITE
                   : variant === 'black' ? DARK
                   : DARK;

  const symbolBolt = variant === 'monochrome' ? 'currentColor'
                   : variant === 'black' ? WHITE
                   : GOLD;

  if (layout === 'symbol') {
    return (
      <LogoSymbol
        size={s.symbol}
        bg={symbolBg}
        bolt={symbolBolt}
        className={className}
        style={style}
      />
    );
  }

  if (layout === 'stacked') {
    return (
      <div
        className={className}
        style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: s.gap / 2, ...style }}
        role="img"
        aria-label={ariaLabel}
      >
        <LogoSymbol size={s.symbol} bg={symbolBg} bolt={symbolBolt} />
        <LogoWordmark jobColor={jobColor} fastColor={fastColor} fontSize={s.fontSize * 0.7} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap, ...style }}
      role="img"
      aria-label={ariaLabel}
    >
      <LogoSymbol size={s.symbol} bg={symbolBg} bolt={symbolBolt} />
      <LogoWordmark jobColor={jobColor} fastColor={fastColor} fontSize={s.fontSize} />
    </div>
  );
});

// ── Specialized variants ──────────────────────────────────────────────────

export const LogoWhite = memo(function LogoWhite(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="white" />;
});

export const LogoGold = memo(function LogoGold(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="gold" />;
});

export const LogoMonochrome = memo(function LogoMonochrome(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="monochrome" />;
});

// Wallet logo — compact with subtle premium gold gradient text
export const LogoWallet = memo(function LogoWallet({ size = 'sm', className, style }: Pick<LogoProps, 'size' | 'className' | 'style'>) {
  const s = sizeMap[size];
  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap * 0.7, ...style }}
      role="img"
      aria-label="JOBFAST Wallet"
    >
      <LogoSymbol size={s.symbol * 0.85} bg="#0F1E35" bolt="#D4AF37" />
      <LogoWordmark jobColor="#D4AF37" fastColor="#E8EDF3" fontSize={s.fontSize * 0.85} />
    </div>
  );
});

// AI logo — blue-tinted mark
export const LogoAI = memo(function LogoAI({ size = 'sm', className, style }: Pick<LogoProps, 'size' | 'className' | 'style'>) {
  const s = sizeMap[size];
  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap * 0.7, ...style }}
      role="img"
      aria-label="JOBFAST AI"
    >
      <LogoSymbol size={s.symbol * 0.85} bg="#0A1628" bolt="#60A5FA" />
      <LogoWordmark jobColor="#60A5FA" fastColor={WHITE} fontSize={s.fontSize * 0.85} />
    </div>
  );
});

// Splash variant — large, centered
export const LogoSplash = memo(function LogoSplash({ className, style }: Pick<LogoProps, 'className' | 'style'>) {
  return (
    <div
      className={className}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 16, ...style }}
      role="img"
      aria-label="JOBFAST"
    >
      <AppIcon size={80} />
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
        <span style={{ color: GOLD }}>JOB</span>
        <span style={{ color: WHITE }}>FAST</span>
      </div>
    </div>
  );
});

export default Logo;