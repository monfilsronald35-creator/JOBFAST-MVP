import React from 'react';

const CARD   = '#0d1526';
const BORDER = '#1F2937';
const GOLD   = '#FACC15';

const BUSINESS_TYPES = [
  { id: 'hotel',       role: 'hotel',       label: 'Hotel',          icon: '🏨' },
  { id: 'restaurant',  role: 'restaurant',  label: 'Restoran',       icon: '🍽' },
  { id: 'hospital',    role: 'hospital',    label: 'Lopital',        icon: '🏥' },
  { id: 'clinic',      role: 'clinic',      label: 'Klinik',         icon: '🩺' },
  { id: 'company',     role: 'company',     label: 'Konpayi',        icon: '🏢' },
  { id: 'shop',        role: 'company',     label: 'Boutik / Shop',  icon: '🏪' },
  { id: 'real_estate', role: 'company',     label: 'Imobilye',       icon: '🏠' },
  { id: 'marketplace', role: 'company',     label: 'Marketplace',    icon: '🛒' },
  { id: 'supplier',    role: 'company',     label: 'Founisè',        icon: '🚚' },
  { id: 'bank',        role: 'company',     label: 'Bank / Finans',  icon: '🏦' },
  { id: 'school',      role: 'company',     label: 'Lekòl',          icon: '🏫' },
  { id: 'government',  role: 'company',     label: 'Gouvènman',      icon: '🏛' },
  { id: 'ngo',         role: 'company',     label: 'ONG',            icon: '🌍' },
  { id: 'tourism',     role: 'tourism',     label: 'Touris / Agans', icon: '✈️' },
];

export default function Step1b_BusinessType({ onSelect }) {
  const [hovered, setHovered] = React.useState(null);

  return (
    <div className="w-full mt-4">
      <p className="text-center text-xs text-slate-500 uppercase tracking-widest font-bold mb-5">
        Chwazi kalite biznis ou genyen
      </p>

      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap:                 '12px',
      }}>
        {BUSINESS_TYPES.map((biz) => {
          const isHovered = hovered === biz.id;
          return (
            <button
              key={biz.id}
              type="button"
              onClick={() => onSelect(biz)}
              onMouseEnter={() => setHovered(biz.id)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(biz.id)}
              onTouchEnd={() => setHovered(null)}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '10px',
                padding:        '20px 12px',
                borderRadius:   '18px',
                border:         `1.5px solid ${isHovered ? `${GOLD}60` : BORDER}`,
                background:     isHovered ? `${GOLD}08` : CARD,
                boxShadow:      isHovered ? `0 0 0 3px rgba(250,204,21,0.12)` : 'none',
                transition:     'all 0.16s ease',
                cursor:         'pointer',
              }}
            >
              <span style={{
                fontSize:   '32px',
                lineHeight: 1,
                filter:     isHovered ? 'drop-shadow(0 0 8px rgba(250,204,21,0.4))' : 'none',
                transition: 'filter 0.16s ease',
              }}>
                {biz.icon}
              </span>
              <p style={{
                fontSize:   '12px',
                fontWeight: 800,
                color:      isHovered ? GOLD : '#e2e8f0',
                textAlign:  'center',
                lineHeight: 1.3,
                transition: 'color 0.16s ease',
              }}>
                {biz.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}