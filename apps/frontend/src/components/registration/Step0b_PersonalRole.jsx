import React from 'react';

const CARD = '#0d1526';

const PERSONAL_ROLES = [
  {
    id:     'worker',
    icon:   '👷',
    label:  'Mwen ap chèche travay',
    desc:   'Mwen bezwen jwenn yon anplwa oswa yon djòb tanporè.',
    accent: '#FACC15',
    hover:  'rgba(250,204,21,0.4)',
    bg:     'rgba(250,204,21,0.05)',
    glow:   'rgba(250,204,21,0.12)',
  },
  {
    id:     'service_provider',
    icon:   '🛠',
    label:  'Mwen ofri sèvis',
    desc:   'Mwen vle ofri pwofesyon mwen — plonbye, elektrisyen, kuyinye, elatriye.',
    accent: '#34d399',
    hover:  'rgba(52,211,153,0.4)',
    bg:     'rgba(52,211,153,0.05)',
    glow:   'rgba(52,211,153,0.12)',
  },
  {
    id:     'freelancer',
    icon:   '👔',
    label:  'Mwen se Freelancer',
    desc:   'Mwen travay poukont mwen — designer, dev, kominikasyon, foto, elatriye.',
    accent: '#a78bfa',
    hover:  'rgba(167,139,250,0.4)',
    bg:     'rgba(167,139,250,0.05)',
    glow:   'rgba(167,139,250,0.12)',
  },
];

export default function Step0b_PersonalRole({ onSelect }) {
  const [hovered, setHovered] = React.useState(null);

  return (
    <div className="w-full mt-4 space-y-3">
      <p className="text-center text-xs text-slate-500 uppercase tracking-widest font-bold mb-5">
        Chwazi wòl ou nan platfòm nan
      </p>

      {PERSONAL_ROLES.map((role) => {
        const isHovered = hovered === role.id;
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelect(role)}
            onMouseEnter={() => setHovered(role.id)}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered(role.id)}
            onTouchEnd={() => setHovered(null)}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '14px',
              width:        '100%',
              padding:      '18px 18px',
              borderRadius: '18px',
              border:       `1.5px solid ${isHovered ? role.hover : '#1F2937'}`,
              background:   isHovered ? role.bg : CARD,
              boxShadow:    isHovered ? `0 0 0 4px ${role.glow}` : 'none',
              transition:   'all 0.18s ease',
              cursor:       'pointer',
              textAlign:    'left',
            }}
          >
            <div style={{
              width:          '50px',
              height:         '50px',
              borderRadius:   '14px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     isHovered ? `${role.accent}18` : '#0f172a',
              border:         `1.5px solid ${isHovered ? role.accent + '40' : '#1F2937'}`,
              fontSize:       '24px',
              flexShrink:     0,
              transition:     'all 0.18s ease',
            }}>
              {role.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize:   '15px',
                fontWeight: 800,
                color:      isHovered ? role.accent : '#f8fafc',
                lineHeight: 1.2,
                transition: 'color 0.18s ease',
                marginBottom: '3px',
              }}>
                {role.label}
              </p>
              <p style={{
                fontSize: '11px',
                color:    '#64748b',
                lineHeight: 1.5,
              }}>
                {role.desc}
              </p>
            </div>

            <span style={{
              fontSize:   '16px',
              color:      isHovered ? role.accent : '#334155',
              flexShrink: 0,
              transition: 'all 0.18s ease',
              transform:  isHovered ? 'translateX(3px)' : 'none',
            }}>
              →
            </span>
          </button>
        );
      })}
    </div>
  );
}