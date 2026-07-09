import React, { memo, useCallback, useMemo } from 'react';
import { PROFESSION_METADATA } from '../../constants/categories';
import AvatarUpload from '../../components/AvatarUpload';

// Fields handled by dedicated sections — skip in dynamic field loop
const SKIP_FIELDS = new Set(['fullName', 'location', 'role', 'yearsExperience', 'hourlyRate', 'phone', 'specialties']);

// Real options for every 'select' fieldType
const FIELD_OPTIONS = {
  // Business
  industry:         ['Konstriksyon','Sante','Edikasyon','Teknoloji','Komès','Tourizm','Agrikilti','Transpò','Finans','Imobilye','Medya','Otomobi','Lòt'],
  businessType:     ['SARL','SA','Antrepriz Endivizyèl','ONG','Asosyasyon','Patenarya','Kooperativ','Lòt'],
  cuisine:          ['Ayisyen','Kreyòl','Ameriken','Italian','Meksiken','Chinwa','Franse','Karayibeyen','Mediteranyen','Entenasyonal'],
  cuisineTypes:     ['Ayisyen','Kreyòl','Ameriken','Italian','Meksiken','Chinwa','Franse','Karayibeyen','Mediteranyen','Entenasyonal'],
  stars:            ['1 ★','2 ★★','3 ★★★','4 ★★★★','5 ★★★★★'],
  specialization:   ['Medisin Jeneral','Pedyatri','Chiriji','Kardyoloji','Dèmatoloji','Òtopedi','Ginekoloji','Pisikiatri','Oftalmo','Dantistri','Lòt'],
  vehicleTypes:     ['Moto','Sedan','SUV','Pick-up','Van','Minibus','Bus','Machin elektrik','Lòt'],
  vehicleType:      ['Moto','Sedan','SUV','Pick-up','Van','Minibus','Bus','Camion','Lòt'],
  languages:        ['Kreyòl','Français','English','Español','Português','Arabic','Lòt'],
  serviceTypes:     ['Nan Kay (In-home)','Nan Biwo (In-office)','À Distans (Remote)','Mobil (Mobile)','Tout Opsyon'],
  designType:       ['Grafik','Enteryè','Mòd','Wèb/UI','Logo','Piblisite','Lòt'],
  designSpecialty:  ['Grafik','UI/UX','Branding','Motion','3D','Piblisite','Lòt'],
  genres:           ['Konpa','Rara','Rasin','Hip-Hop','R&B','Gospel','Zouk','Salsa','Reggae','Pop','Klasik','Lòt'],
  artType:          ['Penti','Eskiltè','Fotografi','Atizana','Desen','Mirayab','Lòt'],
  platform:         ['Instagram','TikTok','YouTube','Facebook','Twitter/X','LinkedIn','Podcast','Lòt'],
  niche:            ['Mòd/Bote','Norisaj','Vwayaj','Tekno','Edikasyon','Divertisман','Biznis','Sante','Lòt'],
  genre:            ['Fiksyon','Non-Fiksyon','Pezi','Jounalis','Piblisite','Teknik','Byografi','Lòt'],
  productCategories:['Elektronik','Vetman/Mòd','Manje','Lakay','Sante/Bote','Zouti','Lòt'],
  propertyType:     ['Appatman','Kaz','Biwo','Tèren','Komèsyal','Endistriyèl','Lòt'],
  make:             ['Toyota','Honda','Hyundai','Ford','Chevrolet','Nissan','Mercedes','BMW','Kia','Mitsubishi','Lòt'],
  condition:        ['Nèf','Kòm Nèf','Bon','Mwayen','Pou Pjès'],
  color:            ['Blan','Nwa','Gri','Wouj','Ble','Vèt','Jòn','Mawon','Lòt'],
  transmission:     ['Otomatik','Manwèl'],
  category:         ['Elektronik','Vetman','Manje','Lakay','Sante','Zouti','Jwèt','Lòt'],
  priceRange:       ['Gratis','$1-50','$51-150','$151-500','$500+','Negosiab'],
  availability:     ['Toulejou','Jou Semèn','Weekend','Sou Demann','Pateyes'],
  type:             ['Plaj','Kiltirèl','Eko-Touris','Biznis','Relijye','Gastronomik','Aventir','Lòt'],
};

const EXP_OPTIONS = [
  { value: 'less_1',  label: 'Mwens pase 1 an',  en: '< 1 year' },
  { value: '1_2',     label: '1 – 2 an',          en: '1–2 years' },
  { value: '3_5',     label: '3 – 5 an',          en: '3–5 years' },
  { value: '6_10',    label: '6 – 10 an',         en: '6–10 years' },
  { value: '10_plus', label: '10+ an',             en: '10+ years' },
];

const CURRENCIES = ['HTG', 'USD', 'EUR', 'DOP'];

// Specialties per profession category — comprehensive list for search indexing
const SPECIALTIES_BY_CATEGORY = {
  services_on_demand: {
    construction: [
      'Albani (Maçonnerie)','Blòk Albani','Brik Albani','Albani Konplè',
      'Karla (Carrelage)','Pent (Peinture)','Elektrisite','Plonbri (Plomberie)',
      'Chapant (Charpente)','Soudaj (Soudure)','Kouvèti (Toiture)','Fè (Ferraillage)',
      'Betòn (Béton)','Demolisyon','Renovasyon','Finisaj','Estime Travay','Jesyon Chantye',
      'Drenaj (Drainage)','Endwisaj (Enduit)','Eskalatye (Escalier)','Pòt/Fènèt',
    ],
    plumber: [
      'Tiyo Dlo (Tuyauterie)','Sistèm Egou','Enstale WC/Douch','Reparasyon Tiyo',
      'Chanfon Dlo Cho','Ponp Dlo','Foraj Pui','Tanvèsyon',
    ],
    chef: [
      'Manje Ayisyen','Manje Karayibeyen','Patisri/Gato','Griyad (BBQ)','Manje Frans',
      'Manje Italyen','Manje Entenasyonal','Jis/Boisson','Traiteur/Evènman',
      'Manje Midi/Lajounen','Manje Vegan','Dekorasyon Gato','Sushi/Japonè',
    ],
    doctor: [
      'Medisin Jeneral','Pedyatri','Chiriji','Kardyoloji','Dèmatoloji',
      'Òtopedi','Ginekoloji','Neroloji','Pisikiatri','Oftalmo',
      'ORL (Zòrèy/Nen/Gòj)','Gastro','Edikoloji','Ijans',
    ],
    nurse: [
      'Swen Jeneral','Swen Blesi','Swen Panseman','Swen Domisil','Swen Vye Moun',
      'Swen Timoun','Asistans Medikal','Prèlvman San','Swen Apre Operasyon',
    ],
    taxi: [
      'Taksi Vil','Taksi Ayewopò','Transpò Prive','Kourses Lontan (Long Distans)',
      'Transpò Medikal','Ekspres/Rapid','Tou-ristik','VIP/Luks',
    ],
    delivery: [
      'Livrezon Manje','Livrezon Pake/Kolis','Livrezon Rapid','Livrezon Ekspres',
      'Livrezon Entènasyonal','Kourye Dokiman','Transpò Machandiz',
    ],
    cleaning: [
      'Netwayaj Kay','Netwayaj Biwo','Netwayaj Pwofesyonèl','Dezenfeksyon',
      'Netwayaj Apre Konstriksyon','Lavaj Machin','Netwayaj Piscine',
      'Sèvis Mènaj Chak Semèn','Netwayaj Vitrin/Vit',
    ],
    videographer: [
      'Maryaj/Wedding','Evènman Kiltirèl','Videyo Mizik','Reklam Biznis',
      'Film/Kout Metraj','Livestream','Dokimantè','Videyo Edikasyon',
      'Pòtre/Portrait Video','Drone/Aerial',
    ],
    designer: [
      'Logo & Branding','Flyer/Afich','Meni Restoran','Kalandriye',
      'Dikora Enteryè','Wèb Design','Sosyal Medya','Mòd/Fashion',
      'Anvlopèl/Papye Tèt Lèt','3D/Rendering',
    ],
    photographer: [
      'Maryaj/Wedding','Pòtre/Portrait','Evènman','Pwodwi/Komèsyal',
      'Foto Pwofesyonèl','Natiralèz/Nature','Aerial/Drone','Fashion/Mòd',
      'Ekòl/Gradiyasyon','Press/Nouvèl',
    ],
    mechanic: [
      'Reparasyon Motè','Fren (Freins)','Sistèm Elektrik','Transmisyon',
      'Klimatizasyon (AC)','Moto/Scooter','Pneu/Kawotchou','Karoserik',
      'Dyagnostik Elektwonik','Entretyen Jeneral',
    ],
    musician: [
      'Konpa','Rara','Rasin','Gospel/Legliz','Hip-Hop/Rap','R&B',
      'Zouk','Salsa/Merengue','Pop','Reggae','Klasik/Orchès','DJ',
      'Animasyon Fèt','Sèvis Mariaj','Studio/Anrejistreman',
    ],
  },
  business_directory: [
    'Jere Anplwaye','Rekritman','Kontabilite','Vant & Maketing','IT/Enfòmatik',
    'Lojistik','Sèvis Kliyan','Finans','Dwa (Legal)','Operasyon','Estrateji',
  ],
  tourism: [
    'Tou Kiltirèl','Tou Plaj','Eko-Touris','Tou Gastronomik','Tou Biznis',
    'Tou Relijye','Planifikasyon Vwayaj','Rezèvasyon Otèl','Transpò Touristik',
    'Gid Entèpretasyon','Fotografi Touristik','Espò Dlo',
  ],
  creator_economy: [
    'Penti/Painting','Eskiltè','Atizana Ayisyen','Tapè/Weaving','Bwati/Pottery',
    'Jwèlri/Bijou','Brodri','Papye Mache','Desen Nimerik','Gravir',
  ],
};

function getSpecialtiesForProfession(profession) {
  const meta = PROFESSION_METADATA[profession];
  const cat = meta?.category;
  if (!cat) return [];
  if (cat === 'services_on_demand') {
    return SPECIALTIES_BY_CATEGORY.services_on_demand[profession] ||
           SPECIALTIES_BY_CATEGORY.services_on_demand.construction;
  }
  return SPECIALTIES_BY_CATEGORY[cat] || [];
}

const inputCls  = 'w-full p-3 rounded bg-[#0d1b35] border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition';
const selectCls = 'w-full p-3 rounded bg-[#0d1b35] border border-gray-600 text-white focus:border-yellow-400 outline-none transition';

function Step4_ProfessionalDetails({
  profession,
  metadata,
  onMetadataChange,
  requiredFields,
  optionalFields,
  onSubmit,
  loading,
}) {
  const profData  = PROFESSION_METADATA[profession];
  const fieldTypes = profData?.fieldTypes || {};

  const filteredRequired = requiredFields.filter(f => !SKIP_FIELDS.has(f));
  const filteredOptional = optionalFields.filter(f => !SKIP_FIELDS.has(f));

  const specialtyOptions = useMemo(() => getSpecialtiesForProfession(profession), [profession]);
  const selectedSpecialties = useMemo(() => {
    const s = metadata.specialties;
    if (Array.isArray(s)) return s;
    if (typeof s === 'string' && s) return s.split(',').map(x => x.trim());
    return [];
  }, [metadata.specialties]);

  const toggleSpecialty = useCallback((opt) => {
    const next = selectedSpecialties.includes(opt)
      ? selectedSpecialties.filter(s => s !== opt)
      : [...selectedSpecialties, opt];
    onMetadataChange('specialties', next);
  }, [selectedSpecialties, onMetadataChange]);

  const handlePhotoChange = useCallback((file, preview) => {
    onMetadataChange('profilePhoto', preview);
  }, [onMetadataChange]);

  const renderField = useCallback((fieldName, isRequired) => {
    const fieldType = fieldTypes[fieldName] || 'text';
    const value     = metadata[fieldName] ?? '';
    const label     = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');

    const handleChange = (e) => onMetadataChange(fieldName, e.target.value);

    if (fieldType === 'textarea') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={`${label}...`}
            className={inputCls}
            rows="3"
          />
        </div>
      );
    }

    if (fieldType === 'select') {
      const options = FIELD_OPTIONS[fieldName] || [];
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <select value={value} onChange={handleChange} className={selectCls}>
            <option value="">Chwazi...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldType === 'checkbox') {
      return (
        <div key={fieldName} className="flex items-center gap-2">
          <input
            type="checkbox"
            id={fieldName}
            checked={value === true || value === 'true'}
            onChange={(e) => onMetadataChange(fieldName, e.target.checked)}
            className="w-4 h-4 accent-yellow-400"
          />
          <label htmlFor={fieldName} className="text-sm text-gray-300">{label}</label>
        </div>
      );
    }

    if (fieldType === 'url') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <input
            type="url"
            value={value}
            onChange={handleChange}
            placeholder="https://..."
            className={inputCls}
          />
        </div>
      );
    }

    if (fieldType === 'location') return null;

    return (
      <div key={fieldName}>
        <label className="block text-sm font-medium mb-1 text-gray-300">
          {label} {isRequired && <span className="text-red-400">*</span>}
        </label>
        <input
          type={fieldType === 'number' ? 'number' : 'text'}
          value={value}
          onChange={handleChange}
          placeholder={label}
          className={inputCls}
        />
      </div>
    );
  }, [fieldTypes, metadata, onMetadataChange]);

  const allRequiredFilled = filteredRequired.every(f => metadata[f]);

  return (
    <div className="w-full space-y-6">

      {/* Photo Upload */}
      <div className="bg-gray-800/30 p-4 rounded-lg">
        <h3 className="text-sm font-bold text-yellow-400 mb-3">Foto Pwofil</h3>
        <AvatarUpload
          onPhotoChange={handlePhotoChange}
          initialPhoto={metadata.profilePhoto}
          userName={metadata.fullName || 'User'}
        />
        <p className="text-xs text-gray-400 text-center mt-2">
          Foto a pral montre sou pwofil ou
        </p>
      </div>

      {/* Experience Years — standard for all professions */}
      <div className="bg-gray-800/20 p-4 rounded-lg space-y-2">
        <h3 className="text-sm font-bold text-yellow-400 mb-2">Eksperyans</h3>
        <select
          value={metadata.yearsExperience || ''}
          onChange={(e) => onMetadataChange('yearsExperience', e.target.value)}
          className={selectCls}
        >
          <option value="">Konbien tan eksperyans ou genyen?</option>
          {EXP_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Required profession fields */}
      {filteredRequired.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-yellow-400 mb-3">Jaden Obligatwa</h3>
          <div className="space-y-4">
            {filteredRequired.map(f => renderField(f, true))}
          </div>
        </div>
      )}

      {/* Optional profession fields */}
      {filteredOptional.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3">Jaden Opsyonèl</h3>
          <div className="space-y-4">
            {filteredOptional.map(f => renderField(f, false))}
          </div>
        </div>
      )}

      {/* Specialties — multi-select checkboxes */}
      {specialtyOptions.length > 0 && (
        <div className="bg-gray-800/20 p-4 rounded-lg">
          <h3 className="text-sm font-bold text-yellow-400 mb-1">Espesyalite / Konpetans</h3>
          <p className="text-xs text-gray-400 mb-3">
            Chwazi tout sa ou konn fè — sa ap pèmèt kliyan jwenn ou nan rechèch
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {specialtyOptions.map(opt => {
              const checked = selectedSpecialties.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleSpecialty(opt)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all border ${
                    checked
                      ? 'bg-yellow-400/15 border-yellow-400 text-yellow-300'
                      : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:border-yellow-400/50'
                  }`}
                >
                  <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border text-[10px] ${
                    checked ? 'bg-yellow-400 border-yellow-400 text-black' : 'border-gray-500'
                  }`}>
                    {checked ? '✓' : ''}
                  </span>
                  <span className="leading-tight">{opt}</span>
                </button>
              );
            })}
          </div>
          {selectedSpecialties.length > 0 && (
            <p className="text-xs text-yellow-400 mt-2">{selectedSpecialties.length} opsyon chwazi</p>
          )}
        </div>
      )}

      {/* Hourly Rate + Currency — standard for all professions */}
      <div className="bg-gray-800/20 p-4 rounded-lg">
        <h3 className="text-sm font-bold text-yellow-400 mb-3">Tari Orè (Opsyonèl)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={metadata.hourlyRate || ''}
            onChange={(e) => onMetadataChange('hourlyRate', e.target.value)}
            placeholder="0.00"
            className="flex-1 p-3 rounded bg-[#0d1b35] border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
          />
          <select
            value={metadata.currency || 'HTG'}
            onChange={(e) => onMetadataChange('currency', e.target.value)}
            className="w-24 p-3 rounded bg-[#0d1b35] border border-gray-600 text-white focus:border-yellow-400 outline-none transition"
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-1">Pa obligatwa — ou ka ajoute l pita</p>
      </div>

      <button
        onClick={onSubmit}
        disabled={!allRequiredFilled || loading}
        className={`w-full p-4 rounded font-bold transition ${
          allRequiredFilled && !loading
            ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
            : 'bg-gray-500 text-gray-300 cursor-not-allowed'
        }`}
      >
        {loading ? 'Y ap kreye kont...' : 'Kreye Kont'}
      </button>

      {!allRequiredFilled && filteredRequired.length > 0 && (
        <p className="text-xs text-center text-gray-400">
          Tanpri ranpli tout jaden obligatwa yo
        </p>
      )}
    </div>
  );
}

export default memo(Step4_ProfessionalDetails);
