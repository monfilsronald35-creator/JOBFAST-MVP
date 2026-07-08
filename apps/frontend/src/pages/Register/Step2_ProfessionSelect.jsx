import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ROLE_CONFIGS from '../../config/roleConfig';

// Sub-roles per registration category
// Each entry: { id, icon, ht, en, fr, es, profession }
const CATEGORY_ROLES = {
  worker: [
    { id: 'mason',          icon: '🧱', ht: 'Mason',           en: 'Mason',          fr: 'Maçon',           es: 'Albañil',            profession: 'construction' },
    { id: 'carpenter',      icon: '🪚', ht: 'Chapant',         en: 'Carpenter',      fr: 'Charpentier',     es: 'Carpintero',         profession: 'construction' },
    { id: 'electrician',    icon: '⚡', ht: 'Elektrisyen',     en: 'Electrician',    fr: 'Électricien',     es: 'Electricista',       profession: 'construction' },
    { id: 'painter',        icon: '🎨', ht: 'Pent',            en: 'Painter',        fr: 'Peintre',         es: 'Pintor',             profession: 'construction' },
    { id: 'welder',         icon: '🔥', ht: 'Soudè',           en: 'Welder',         fr: 'Soudeur',         es: 'Soldador',           profession: 'construction' },
    { id: 'plumber',        icon: '🔧', ht: 'Plonbye',         en: 'Plumber',        fr: 'Plombier',        es: 'Plomero',            profession: 'plumber' },
    { id: 'tiler',          icon: '🏗️', ht: 'Karla',           en: 'Tiler',          fr: 'Carreleur',       es: 'Colocador',          profession: 'construction' },
    { id: 'ironworker',     icon: '⚙️', ht: 'Travayè Fè',      en: 'Iron Worker',    fr: 'Ferrailleur',     es: 'Herrero',            profession: 'construction' },
    { id: 'roofer',         icon: '🏠', ht: 'Kouvè',           en: 'Roofer',         fr: 'Couvreur',        es: 'Techador',           profession: 'construction' },
    { id: 'general_worker', icon: '👷', ht: 'Travayè Jeneral', en: 'General Worker', fr: 'Ouvrier Général', es: 'Obrero General',     profession: 'construction' },
  ],
  service_provider: [
    { id: 'chef',           icon: '👨‍🍳', ht: 'Chef Kwizinye',  en: 'Chef / Cook',    fr: 'Chef Cuisinier',  es: 'Chef / Cocinero',    profession: 'chef' },
    { id: 'doctor',         icon: '👨‍⚕️', ht: 'Doktè',          en: 'Doctor',         fr: 'Médecin',         es: 'Médico',             profession: 'doctor' },
    { id: 'nurse',          icon: '👩‍⚕️', ht: 'Enfimyè',        en: 'Nurse',          fr: 'Infirmier(e)',    es: 'Enfermero(a)',       profession: 'nurse' },
    { id: 'lawyer',         icon: '⚖️', ht: 'Avoka',           en: 'Lawyer',         fr: 'Avocat',          es: 'Abogado',            profession: 'lawyer' },
    { id: 'taxi',           icon: '🚕', ht: 'Chofè Taksi',     en: 'Taxi Driver',    fr: 'Chauffeur Taxi',  es: 'Taxista',            profession: 'taxi' },
    { id: 'delivery',       icon: '📦', ht: 'Livrezon',         en: 'Delivery',       fr: 'Livreur',         es: 'Repartidor',         profession: 'delivery' },
    { id: 'cleaning',       icon: '🧹', ht: 'Netwayaj',         en: 'Cleaning',       fr: 'Nettoyage',       es: 'Limpieza',           profession: 'cleaning' },
    { id: 'videographer',   icon: '🎥', ht: 'Videograf',        en: 'Videographer',   fr: 'Vidéaste',        es: 'Videógrafo',         profession: 'videographer' },
    { id: 'designer',       icon: '✏️', ht: 'Desinyè',          en: 'Designer',       fr: 'Designer',        es: 'Diseñador',          profession: 'designer' },
    { id: 'photographer',   icon: '📷', ht: 'Fotograf',         en: 'Photographer',   fr: 'Photographe',     es: 'Fotógrafo',          profession: 'photographer' },
    { id: 'mechanic',       icon: '🔩', ht: 'Mekanisyen',       en: 'Mechanic',       fr: 'Mécanicien',      es: 'Mecánico',           profession: 'mechanic' },
    { id: 'musician',       icon: '🎵', ht: 'Mizisyen',         en: 'Musician',       fr: 'Musicien',        es: 'Músico',             profession: 'musician' },
  ],
  company: [
    { id: 'director',       icon: '👔', ht: 'Direktè',          en: 'Director',       fr: 'Directeur',       es: 'Director',           profession: 'company' },
    { id: 'manager',        icon: '📋', ht: 'Manadjè',          en: 'Manager',        fr: 'Gestionnaire',    es: 'Gerente',            profession: 'company' },
    { id: 'accountant',     icon: '📊', ht: 'Kontab',           en: 'Accountant',     fr: 'Comptable',       es: 'Contador',           profession: 'company' },
    { id: 'hr',             icon: '👥', ht: 'Responsab RH',     en: 'HR Specialist',  fr: 'Responsable RH',  es: 'Recursos Humanos',   profession: 'company' },
    { id: 'it',             icon: '💻', ht: 'Enfòmatisyen',     en: 'IT Specialist',  fr: 'Informaticien',   es: 'Especialista IT',    profession: 'company' },
    { id: 'receptionist',   icon: '📞', ht: 'Resepsyonis',      en: 'Receptionist',   fr: 'Réceptionniste',  es: 'Recepcionista',      profession: 'company' },
    { id: 'secretary',      icon: '📝', ht: 'Sekretè',          en: 'Secretary',      fr: 'Secrétaire',      es: 'Secretaria',         profession: 'company' },
    { id: 'salesperson',    icon: '💼', ht: 'Komèsyal',         en: 'Salesperson',    fr: 'Commercial',      es: 'Vendedor',           profession: 'company' },
  ],
  enterprise: [
    { id: 'entrepreneur',   icon: '🚀', ht: 'Antreprenè',       en: 'Entrepreneur',   fr: 'Entrepreneur',    es: 'Emprendedor',        profession: 'company' },
    { id: 'investor',       icon: '💰', ht: 'Envèstisè',        en: 'Investor',       fr: 'Investisseur',    es: 'Inversionista',      profession: 'company' },
    { id: 'supplier',       icon: '🏭', ht: 'Founitè',          en: 'Supplier',       fr: 'Fournisseur',     es: 'Proveedor',          profession: 'company' },
    { id: 'importer',       icon: '🚢', ht: 'Enpòtatè',         en: 'Importer',       fr: 'Importateur',     es: 'Importador',         profession: 'company' },
    { id: 'trader',         icon: '💱', ht: 'Komèsan',          en: 'Trader',         fr: 'Commerçant',      es: 'Comerciante',        profession: 'company' },
    { id: 'franchisor',     icon: '🏪', ht: 'Franchizè',        en: 'Franchisor',     fr: 'Franchiseur',     es: 'Franquiciador',      profession: 'company' },
  ],
  restaurant: [
    { id: 'head_chef',      icon: '👨‍🍳', ht: 'Chèf Kwizinye',  en: 'Head Chef',      fr: 'Chef Cuisinier',  es: 'Chef Principal',     profession: 'restaurant' },
    { id: 'sous_chef',      icon: '🍳', ht: 'Chèf Asistan',    en: 'Sous Chef',      fr: 'Sous-Chef',       es: 'Sous Chef',          profession: 'restaurant' },
    { id: 'waiter',         icon: '🍽️', ht: 'Gason Sèvis',     en: 'Waiter',         fr: 'Serveur',         es: 'Mesero',             profession: 'restaurant' },
    { id: 'rest_manager',   icon: '📋', ht: 'Jèran Restoran',  en: 'Restaurant Mgr', fr: 'Directeur Rest.', es: 'Gerente Restaurante', profession: 'restaurant' },
    { id: 'cashier',        icon: '💰', ht: 'Kesye',            en: 'Cashier',        fr: 'Caissier',        es: 'Cajero',             profession: 'restaurant' },
    { id: 'rest_delivery',  icon: '🛵', ht: 'Livrezon',         en: 'Delivery Driver',fr: 'Livreur',         es: 'Repartidor',         profession: 'restaurant' },
  ],
  hotel: [
    { id: 'receptionist',   icon: '📞', ht: 'Resepsyonis',      en: 'Receptionist',   fr: 'Réceptionniste',  es: 'Recepcionista',      profession: 'hotel' },
    { id: 'housekeeper',    icon: '🛏️', ht: 'Mènajè',           en: 'Housekeeper',    fr: 'Femme de Chambre',es: 'Camarera',           profession: 'hotel' },
    { id: 'concierge',      icon: '🎩', ht: 'Konsyèj',          en: 'Concierge',      fr: 'Concierge',       es: 'Conserje',           profession: 'hotel' },
    { id: 'hotel_manager',  icon: '📋', ht: 'Jèran Otèl',      en: 'Hotel Manager',  fr: 'Directeur Hôtel', es: 'Gerente de Hotel',   profession: 'hotel' },
    { id: 'maintenance',    icon: '🔧', ht: 'Antretyen',        en: 'Maintenance',    fr: 'Maintenance',     es: 'Mantenimiento',      profession: 'hotel' },
    { id: 'security',       icon: '🔒', ht: 'Sekirite',         en: 'Security',       fr: 'Sécurité',        es: 'Seguridad',          profession: 'hotel' },
  ],
  rental: [
    { id: 'landlord',       icon: '🏘️', ht: 'Pwopriyetè',      en: 'Landlord',       fr: 'Propriétaire',    es: 'Propietario',        profession: 'property' },
    { id: 'prop_agent',     icon: '🏠', ht: 'Ajan Imobilye',   en: 'Property Agent', fr: 'Agent Immobilier',es: 'Agente Inmobiliario', profession: 'property' },
    { id: 'prop_manager',   icon: '📋', ht: 'Jèran Pwopiete',  en: 'Property Mgr',   fr: 'Gestionnaire',    es: 'Administrador',      profession: 'property' },
    { id: 'maintenance',    icon: '🔧', ht: 'Antretyen',        en: 'Maintenance',    fr: 'Entretien',       es: 'Mantenimiento',      profession: 'property' },
  ],
  office: [
    { id: 'administrator',  icon: '🏛️', ht: 'Administratè',    en: 'Administrator',  fr: 'Administrateur',  es: 'Administrador',      profession: 'office' },
    { id: 'secretary',      icon: '📝', ht: 'Sekretè',          en: 'Secretary',      fr: 'Secrétaire',      es: 'Secretaria',         profession: 'office' },
    { id: 'it_officer',     icon: '💻', ht: 'Enfòmatisyen',     en: 'IT Officer',     fr: 'Informaticien',   es: 'Oficial IT',         profession: 'office' },
    { id: 'accountant',     icon: '📊', ht: 'Kontab',           en: 'Accountant',     fr: 'Comptable',       es: 'Contador',           profession: 'office' },
    { id: 'manager',        icon: '📋', ht: 'Manadjè',          en: 'Manager',        fr: 'Directeur',       es: 'Gerente',            profession: 'office' },
  ],
  hospital: [
    { id: 'hospital_doc',   icon: '👨‍⚕️', ht: 'Doktè',          en: 'Doctor',         fr: 'Médecin',         es: 'Médico',             profession: 'hospital' },
    { id: 'hospital_nurse', icon: '👩‍⚕️', ht: 'Enfimyè',        en: 'Nurse',          fr: 'Infirmier(e)',    es: 'Enfermero(a)',       profession: 'hospital' },
    { id: 'admin',          icon: '🏥', ht: 'Administratè',    en: 'Administrator',  fr: 'Administrateur',  es: 'Administrador',      profession: 'hospital' },
    { id: 'pharmacist',     icon: '💊', ht: 'Famasis',          en: 'Pharmacist',     fr: 'Pharmacien',      es: 'Farmacéutico',       profession: 'hospital' },
    { id: 'lab_tech',       icon: '🔬', ht: 'Teknisyen Lab',    en: 'Lab Technician', fr: 'Laborantin',      es: 'Técnico de Lab.',    profession: 'hospital' },
  ],
  clinic: [
    { id: 'clinic_doc',     icon: '👨‍⚕️', ht: 'Doktè',          en: 'Doctor',         fr: 'Médecin',         es: 'Médico',             profession: 'clinic' },
    { id: 'clinic_nurse',   icon: '👩‍⚕️', ht: 'Enfimyè',        en: 'Nurse',          fr: 'Infirmier(e)',    es: 'Enfermero(a)',       profession: 'clinic' },
    { id: 'clinic_recept',  icon: '📞', ht: 'Resepsyonis',      en: 'Receptionist',   fr: 'Réceptionniste',  es: 'Recepcionista',      profession: 'clinic' },
    { id: 'pharmacist',     icon: '💊', ht: 'Famasis',          en: 'Pharmacist',     fr: 'Pharmacien',      es: 'Farmacéutico',       profession: 'clinic' },
  ],
  tourism: [
    { id: 'guide',          icon: '🗺️', ht: 'Gid Touristik',   en: 'Tour Guide',     fr: 'Guide Touristique',es: 'Guía Turístico',    profession: 'guide' },
    { id: 'hotel_staff',    icon: '🏨', ht: 'Anplwaye Otèl',   en: 'Hotel Staff',    fr: 'Personnel Hôtelier',es: 'Personal de Hotel', profession: 'tourism_hotel' },
    { id: 'tourist_driver', icon: '🚌', ht: 'Chofè Touris',    en: 'Tourist Driver', fr: 'Chauffeur Tour.',  es: 'Conductor Turístico',profession: 'transport' },
    { id: 'resort_staff',   icon: '🏖️', ht: 'Anplwaye Resort', en: 'Resort Staff',   fr: 'Personnel Resort', es: 'Personal de Resort', profession: 'resort' },
    { id: 'activities',     icon: '🎯', ht: 'Animatè Aktivite', en: 'Activities',    fr: 'Animateur',        es: 'Animador',           profession: 'activity' },
    { id: 'rest_manager',   icon: '🍽️', ht: 'Jèran Restoran',  en: 'Restaurant Mgr',fr: 'Resp. Restaurant', es: 'Gerente Restaurante',profession: 'tourism_restaurant' },
  ],
};

function getLabel(role, lang) {
  const base = lang.split('-')[0];
  if (base === 'fr') return role.fr;
  if (base === 'en') return role.en;
  if (base === 'es') return role.es;
  return role.ht;
}

function Step2_ProfessionSelect({ role, selected, onSelect }) {
  const { i18n } = useTranslation();
  const roleConfig = role ? ROLE_CONFIGS[role] : null;

  const roles = useMemo(() => CATEGORY_ROLES[role] || [], [role]);

  return (
    <div className="w-full">
      <p className="text-sm text-gray-300 mb-4 text-center">
        Chwazi wòl ou nan <strong className="text-yellow-400">{roleConfig?.label || role}</strong>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {roles.map((r) => {
          const label = getLabel(r, i18n.language || 'ht');
          const isSelected = selected === `${role}:${r.id}`;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.profession, r.id)}
              className={`p-4 rounded-lg border-2 transition transform hover:scale-105 text-left ${
                isSelected
                  ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                  : 'border-gray-600 bg-gray-700/30 hover:border-yellow-400/50'
              }`}
            >
              <div className="text-2xl mb-2">{r.icon}</div>
              <div className="text-sm font-bold leading-tight">{label}</div>
            </button>
          );
        })}
      </div>
      {roles.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">
          Pa gen wòl disponib pou kategori sa a.
        </p>
      )}
    </div>
  );
}

export default memo(Step2_ProfessionSelect);
