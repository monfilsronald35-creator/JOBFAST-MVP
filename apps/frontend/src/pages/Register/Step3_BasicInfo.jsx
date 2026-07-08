import React, { useState, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const COUNTRY_DATA = [
  {
    code: 'ht', flag: '🇭🇹', phone: '+509',
    ht: 'Ayiti', en: 'Haiti', fr: 'Haïti', es: 'Haití',
    zones: { ht: ['Ouest','Nord','Nord-Est','Nord-Ouest','Artibonit','Sant','Sid-Es','Nip','Sid','Grandans'], en: ['West','North','Northeast','Northwest','Artibonite','Central','Southeast','Nippes','South','Grand\'Anse'], fr: ['Ouest','Nord','Nord-Est','Nord-Ouest','Artibonite','Centre','Sud-Est','Nippes','Sud','Grand\'Anse'], es: ['Oeste','Norte','Noreste','Noroeste','Artibonite','Central','Sureste','Nippes','Sur','Grand\'Anse'] },
  },
  {
    code: 'do', flag: '🇩🇴', phone: '+1',
    ht: 'Repiblik Dominikèn', en: 'Dominican Republic', fr: 'Rép. Dominicaine', es: 'Rep. Dominicana',
    zones: { ht: ['Santo Domingo','Santiago','La Altagracia','La Romana','San Pedro de Macorís','Puerto Plata','San Cristóbal','Duarte'], en: ['Santo Domingo','Santiago','La Altagracia','La Romana','San Pedro de Macorís','Puerto Plata','San Cristóbal','Duarte'], fr: ['Santo Domingo','Santiago','La Altagracia','La Romana','San Pedro de Macorís','Puerto Plata','San Cristóbal','Duarte'], es: ['Santo Domingo','Santiago','La Altagracia','La Romana','San Pedro de Macorís','Puerto Plata','San Cristóbal','Duarte'] },
  },
  {
    code: 'us', flag: '🇺🇸', phone: '+1',
    ht: 'Etazini', en: 'United States', fr: 'États-Unis', es: 'Estados Unidos',
    zones: { ht: ['New York','Florida','Texas','California','New Jersey','Massachusetts','Georgia','Illinois','Pennsylvania','Maryland'], en: ['New York','Florida','Texas','California','New Jersey','Massachusetts','Georgia','Illinois','Pennsylvania','Maryland'], fr: ['New York','Floride','Texas','Californie','New Jersey','Massachusetts','Géorgie','Illinois','Pennsylvanie','Maryland'], es: ['Nueva York','Florida','Texas','California','Nueva Jersey','Massachusetts','Georgia','Illinois','Pensilvania','Maryland'] },
  },
  {
    code: 'ca', flag: '🇨🇦', phone: '+1',
    ht: 'Kanada', en: 'Canada', fr: 'Canada', es: 'Canadá',
    zones: { ht: ['Ontario','Kebèk','Kolonbi Britanik','Alberta','Manitoba','Saskatchewan','Nouvèl-Ekòs','Nouvèl-Bronsvik'], en: ['Ontario','Quebec','British Columbia','Alberta','Manitoba','Saskatchewan','Nova Scotia','New Brunswick'], fr: ['Ontario','Québec','Colombie-Britannique','Alberta','Manitoba','Saskatchewan','Nouvelle-Écosse','Nouveau-Brunswick'], es: ['Ontario','Quebec','Columbia Británica','Alberta','Manitoba','Saskatchewan','Nueva Escocia','Nuevo Brunswick'] },
  },
  {
    code: 'fr', flag: '🇫🇷', phone: '+33',
    ht: 'Frans', en: 'France', fr: 'France', es: 'Francia',
    zones: { ht: ['Il-de-Frans','Ròn-Alp','PACA','Okitani','O-de-Frans','Nouvèl-Akiten','Gran-Es','Loire','Bretay','Nomandi'], en: ['Île-de-France','Auvergne-Rhône-Alpes','PACA','Occitanie','Hauts-de-France','Nouvelle-Aquitaine','Grand Est','Pays de la Loire','Bretagne','Normandie'], fr: ['Île-de-France','Auvergne-Rhône-Alpes','PACA','Occitanie','Hauts-de-France','Nouvelle-Aquitaine','Grand Est','Pays de la Loire','Bretagne','Normandie'], es: ['Île-de-France','Auvernia-Ródano-Alpes','PACA','Occitania','Altos de Francia','Nueva Aquitania','Gran Este','Países del Loira','Bretaña','Normandía'] },
  },
  {
    code: 'mx', flag: '🇲🇽', phone: '+52',
    ht: 'Meksik', en: 'Mexico', fr: 'Mexique', es: 'México',
    zones: { ht: ['Meksiko','Jalisco','Nuevo León','Puebla','Guanajuato','Veracruz','México','Chihuahua','Baja California','Sonora'], en: ['Mexico City','Jalisco','Nuevo León','Puebla','Guanajuato','Veracruz','State of Mexico','Chihuahua','Baja California','Sonora'], fr: ['Mexico','Jalisco','Nuevo León','Puebla','Guanajuato','Veracruz','État de Mexico','Chihuahua','Basse-Californie','Sonora'], es: ['Ciudad de México','Jalisco','Nuevo León','Puebla','Guanajuato','Veracruz','Estado de México','Chihuahua','Baja California','Sonora'] },
  },
  {
    code: 'br', flag: '🇧🇷', phone: '+55',
    ht: 'Brezil', en: 'Brazil', fr: 'Brésil', es: 'Brasil',
    zones: { ht: ['São Paulo','Rio de Janeiro','Minas Gerais','Bahia','Paraná','Rio Grande do Sul','Pernambuco','Ceará','Amazonas','Goiás'], en: ['São Paulo','Rio de Janeiro','Minas Gerais','Bahia','Paraná','Rio Grande do Sul','Pernambuco','Ceará','Amazonas','Goiás'], fr: ['São Paulo','Rio de Janeiro','Minas Gerais','Bahia','Paraná','Rio Grande do Sul','Pernambuco','Ceará','Amazonas','Goiás'], es: ['São Paulo','Río de Janeiro','Minas Gerais','Bahía','Paraná','Río Grande do Sul','Pernambuco','Ceará','Amazonas','Goiás'] },
  },
  {
    code: 'es', flag: '🇪🇸', phone: '+34',
    ht: 'Espay', en: 'Spain', fr: 'Espagne', es: 'España',
    zones: { ht: ['Madrid','Katalòn','Andalouzi','Valans','Pei Bask','Galice','Aragon','Kastilay-La Mancha','Kastilay-Leòn','Mursya'], en: ['Madrid','Catalonia','Andalusia','Valencia','Basque Country','Galicia','Aragon','Castilla-La Mancha','Castile and León','Murcia'], fr: ['Madrid','Catalogne','Andalousie','Valence','Pays Basque','Galice','Aragon','Castille-La Manche','Castille-et-León','Murcie'], es: ['Madrid','Cataluña','Andalucía','Comunidad Valenciana','País Vasco','Galicia','Aragón','Castilla-La Mancha','Castilla y León','Murcia'] },
  },
  {
    code: 'gb', flag: '🇬🇧', phone: '+44',
    ht: 'Wayòm Ini', en: 'United Kingdom', fr: 'Royaume-Uni', es: 'Reino Unido',
    zones: { ht: ['Anglitè','Ekòs','Pei de Gal','Irlann-Dinò','Lond','Manchestè','Bimingèm','Glasgow','Bristol','Leeds'], en: ['England','Scotland','Wales','Northern Ireland','London','Manchester','Birmingham','Glasgow','Bristol','Leeds'], fr: ['Angleterre','Écosse','Pays de Galles','Irlande du Nord','Londres','Manchester','Birmingham','Glasgow','Bristol','Leeds'], es: ['Inglaterra','Escocia','Gales','Irlanda del Norte','Londres','Mánchester','Birmingham','Glasgow','Bristol','Leeds'] },
  },
  {
    code: 'pt', flag: '🇵🇹', phone: '+351',
    ht: 'Pòtigal', en: 'Portugal', fr: 'Portugal', es: 'Portugal',
    zones: { ht: ['Lisbon','Pòto','Algav','Setúbal','Avèro','Braga','Koimb','Faro','Madè','Azò'], en: ['Lisbon','Porto','Algarve','Setúbal','Aveiro','Braga','Coimbra','Faro','Madeira','Azores'], fr: ['Lisbonne','Porto','Algarve','Setúbal','Aveiro','Braga','Coimbra','Faro','Madère','Açores'], es: ['Lisboa','Oporto','Algarve','Setúbal','Aveiro','Braga','Coimbra','Faro','Madeira','Azores'] },
  },
];

function getCountryLabel(country, lang) {
  const base = lang.split('-')[0];
  if (base === 'fr') return country.fr;
  if (base === 'en') return country.en;
  if (base === 'es') return country.es;
  return country.ht;
}

function getZones(country, lang) {
  const base = lang.split('-')[0];
  if (base === 'fr') return country.zones.fr;
  if (base === 'en') return country.zones.en;
  if (base === 'es') return country.zones.es;
  return country.zones.ht;
}

const inputCls = 'w-full p-3 rounded bg-[#0d1b35] border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition';
const selectCls = 'w-full p-3 rounded bg-[#0d1b35] border border-gray-600 text-white focus:border-yellow-400 outline-none transition';

function Step3_BasicInfo({ data, onNext, loading }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'ht';

  const [localData, setLocalData] = useState({
    fullName:        data.fullName || '',
    email:           data.email || '',
    phone:           data.phone || '',
    password:        data.password || '',
    confirmPassword: data.confirmPassword || '',
    country:         data.country || 'ht',
    zone:            data.zone || '',
    city:            data.city || '',
  });
  const [passwordMatch, setPasswordMatch] = useState(true);

  const selectedCountry = useMemo(
    () => COUNTRY_DATA.find(c => c.code === localData.country) || COUNTRY_DATA[0],
    [localData.country]
  );

  const zones = useMemo(() => getZones(selectedCountry, lang), [selectedCountry, lang]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setLocalData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'country') next.zone = '';
      return next;
    });

    if (name === 'confirmPassword' || name === 'password') {
      setLocalData(prev => {
        const pwd     = name === 'password' ? value : prev.password;
        const confirm = name === 'confirmPassword' ? value : prev.confirmPassword;
        setPasswordMatch(pwd === confirm);
        return { ...prev, [name]: value };
      });
    }
  }, []);

  const isValid =
    localData.fullName &&
    localData.email &&
    localData.phone &&
    localData.password &&
    localData.country &&
    localData.zone &&
    passwordMatch;

  const handleSubmit = () => {
    if (!isValid) return;
    const raw = localData.phone.trim();
    const prefix = selectedCountry.phone;
    const fullPhone = raw.startsWith('+') ? raw : `${prefix}${raw}`;
    onNext({ ...localData, phone: fullPhone });
  };

  return (
    <div className="w-full space-y-4">
      {/* Full Name */}
      <input
        type="text"
        name="fullName"
        placeholder="Non konplè"
        value={localData.fullName}
        onChange={handleChange}
        className={inputCls}
      />

      {/* Email */}
      <input
        type="email"
        name="email"
        placeholder="Imèl"
        value={localData.email}
        onChange={handleChange}
        className={inputCls}
      />

      {/* Phone */}
      <div className="flex gap-2">
        <span className="flex items-center px-3 rounded bg-[#0d1b35] border border-gray-600 text-yellow-400 text-sm font-bold whitespace-nowrap">
          {selectedCountry.flag} {selectedCountry.phone}
        </span>
        <input
          type="tel"
          name="phone"
          placeholder="Nimewo telefòn"
          value={localData.phone}
          onChange={handleChange}
          className={`flex-1 p-3 rounded bg-[#0d1b35] border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition`}
        />
      </div>

      {/* Country */}
      <select
        name="country"
        value={localData.country}
        onChange={handleChange}
        className={selectCls}
      >
        {COUNTRY_DATA.map(c => (
          <option key={c.code} value={c.code}>
            {c.flag} {getCountryLabel(c, lang)}
          </option>
        ))}
      </select>

      {/* Zone / Region */}
      <select
        name="zone"
        value={localData.zone}
        onChange={handleChange}
        className={selectCls}
        disabled={!localData.country}
      >
        <option value="">Chwazi depatman / rejyon...</option>
        {zones.map(z => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>

      {/* City */}
      <input
        type="text"
        name="city"
        placeholder="Vil"
        value={localData.city}
        onChange={handleChange}
        className={inputCls}
      />

      {/* Password */}
      <input
        type="password"
        name="password"
        placeholder="Modpas"
        value={localData.password}
        onChange={handleChange}
        className={inputCls}
      />

      {/* Confirm Password */}
      <div>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Konfime modpas"
          value={localData.confirmPassword}
          onChange={handleChange}
          className={`w-full p-3 rounded bg-[#0d1b35] border ${
            passwordMatch ? 'border-gray-600' : 'border-red-500'
          } text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition`}
        />
        {!passwordMatch && (
          <p className="text-xs text-red-400 mt-1">Modpas yo pa menm</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className={`w-full p-4 rounded font-bold transition ${
          isValid && !loading
            ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
            : 'bg-gray-500 text-gray-300 cursor-not-allowed'
        }`}
      >
        {loading ? 'Ap trete...' : 'Pwochen'}
      </button>
    </div>
  );
}

export default memo(Step3_BasicInfo);
