import React from 'react';

const BG   = '#050B18';
const CARD = '#0d1526';

const ACCOUNT_TYPES = [
  {
    id:    'personal',
    icon:  '👤',
    label: 'Kont Pèsonèl',
    desc:  'Mwen vle jwenn travay oswa ofri sèvis kòm yon moun.',
    accent:      '#FACC15',
    borderIdle:  '#1F2937',
    borderHover: 'rgba(250,204,21,0.45)',
    bgHover:     'rgba(250,204,21,0.05)',
    glow:        'rgba(250,204,21,0.12)',
  },
  {
    id:    'business',
    icon:  '🏢',
    label: 'Kont Biznis',
    desc:  'Mwen gen yon konpayi, restoran, otèl, magazen, klinik, elatriye.',
    accent:      '#60a5fa',
    borderIdle:  '#1F2937',
    borderHover: 'rgba(96,165,250,0.45)',
    bgHover:     'rgba(96,165,250,0.05)',
    glow:        'rgba(96,165,250,0.12)',
  },
];

export default function Step0_AccountType({ onSelect }) {
  const [hovered, setHovered] = React.useState(null);

  return (
    <div className="w-full mt-6 space-y-4">
      <p className="text-center text-xs text-slate-500 uppercase tracking-widest font-bold mb-6">
        Chwazi kalite kont ki pi bon pou ou
      </p>

      {ACCOUNT_TYPES.map((type) => {
        const isHovered = hovered === type.id;
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            onMouseEnter={() => setHovered(type.id)}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered(type.id)}
            onTouchEnd={() => setHovered(null)}
            style={{
              display:       'flex',
              alignItems:    'center',
              gap:           '16px',
              width:         '100%',
              padding:       '20px 20px',
              borderRadius:  '20px',
              border:        `1.5px solid ${isHovered ? type.borderHover : type.borderIdle}`,
              background:    isHovered ? type.bgHover : CARD,
              boxShadow:     isHovered ? `0 0 0 4px ${type.glow}` : 'none',
              transition:    'all 0.18s ease',
              cursor:        'pointer',
              textAlign:     'left',
            }}
          >
            {/* Icon circle */}
            <div style={{
              width:          '56px',
              height:         '56px',
              borderRadius:   '16px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     isHovered ? `${type.accent}18` : '#0f172a',
              border:         `1.5px solid ${isHovered ? type.accent + '40' : '#1F2937'}`,
              fontSize:       '26px',
              flexShrink:     0,
              transition:     'all 0.18s ease',
            }}>
              {type.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize:   '17px',
                fontWeight: 800,
                color:      isHovered ? type.accent : '#f8fafc',
                lineHeight: 1.2,
                transition: 'color 0.18s ease',
                marginBottom: '4px',
              }}>
                {type.label}
              </p>
              <p style={{
                fontSize:   '12px',
                color:      '#64748b',
                lineHeight: 1.5,
              }}>
                {type.desc}
              </p>
            </div>

            {/* Arrow */}
            <span style={{
              fontSize:   '18px',
              color:      isHovered ? type.accent : '#334155',
              flexShrink: 0,
              transition: 'all 0.18s ease',
              transform:  isHovered ? 'translateX(3px)' : 'none',
            }}>
              →
            </span>
          </button>
        );
      })}

      <p className="text-center text-xs text-slate-600 pt-2">
        Ou ka toujou chanje kalite kont ou pita
      </p>
    </div>
  );
}