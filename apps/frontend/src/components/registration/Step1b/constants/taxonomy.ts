import type { GlobalCategory } from '../types/business';

// ─── Global Business Taxonomy — hierarchical, database-ready ─────────────────
// Primary industries → business types → services
// Designed to grow: this local seed gets replaced by API taxonomy once backend
// provides /taxonomy/categories endpoint.

export const GLOBAL_TAXONOMY: GlobalCategory[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // HOSPITALITY & TOURISM
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hotel', parentId: 'hospitality', code: 'HOSP-001',
    names: { en: 'Hotel & Resort', ht: 'Otèl & Resort', es: 'Hotel y Resort', fr: 'Hôtel & Resort', pt: 'Hotel e Resort' },
    industry: 'Hospitality & Tourism', industryCode: 'HOSP',
    services: ['accommodation', 'room_service', 'concierge', 'conference', 'pool', 'spa', 'restaurant'],
    products: ['rooms', 'suites', 'packages'],
    countries: [],
    capabilities: { booking: true, ecommerce: true, remoteService: false },
    aliases: ['hotel', 'resort', 'lodge', 'inn', 'motel', 'hostel', 'bed_breakfast', 'bnb', 'otèl'],
    emoji: '🏨', color: 'sky', tier: 'primary', demandScore: 95,
  },
  {
    id: 'restaurant', parentId: 'hospitality', code: 'HOSP-002',
    names: { en: 'Restaurant & Dining', ht: 'Restoran & Repa', es: 'Restaurante', fr: 'Restaurant', pt: 'Restaurante' },
    industry: 'Hospitality & Tourism', industryCode: 'HOSP',
    services: ['dining', 'takeout', 'delivery', 'catering', 'private_events'],
    products: ['food', 'beverages'],
    countries: [],
    capabilities: { booking: true, delivery: true },
    aliases: ['restaurant', 'restoran', 'dining', 'eatery', 'bistro', 'brasserie', 'cafeteria', 'buffet', 'manje'],
    emoji: '🍽️', color: 'orange', tier: 'primary', demandScore: 98,
  },
  {
    id: 'bar_nightlife', parentId: 'hospitality', code: 'HOSP-003',
    names: { en: 'Bar & Nightlife', ht: 'Ba & Diskotèk', es: 'Bar y Discoteca', fr: 'Bar & Discothèque' },
    industry: 'Hospitality & Tourism', industryCode: 'HOSP',
    services: ['drinks', 'live_music', 'events', 'vip'],
    products: ['cocktails', 'beer', 'spirits'],
    countries: [],
    capabilities: { booking: true },
    aliases: ['bar', 'club', 'nightclub', 'lounge', 'pub', 'ba', 'diskotèk', 'discoteca'],
    emoji: '🍸', color: 'purple', tier: 'secondary', demandScore: 80,
  },
  {
    id: 'tour_agency', parentId: 'hospitality', code: 'HOSP-004',
    names: { en: 'Tour & Travel Agency', ht: 'Ajans Touris', es: 'Agencia de Viajes', fr: "Agence de Voyage" },
    industry: 'Hospitality & Tourism', industryCode: 'HOSP',
    services: ['tours', 'excursions', 'transfers', 'packages', 'visa_assistance'],
    products: ['tour_packages', 'tickets'],
    countries: [],
    capabilities: { booking: true, ecommerce: true },
    aliases: ['tour', 'travel', 'excursion', 'tourism', 'turismo', 'tourisme', 'touris'],
    emoji: '✈️', color: 'blue', tier: 'primary', demandScore: 88,
  },
  {
    id: 'vacation_rental', parentId: 'hospitality', code: 'HOSP-005',
    names: { en: 'Vacation Rental', ht: 'Lokasyon Vakans', es: 'Alquiler Vacacional', fr: 'Location Vacances' },
    industry: 'Hospitality & Tourism', industryCode: 'HOSP',
    services: ['rental', 'cleaning', 'concierge'],
    products: ['apartments', 'villas', 'houses'],
    countries: [],
    capabilities: { booking: true, ecommerce: true },
    aliases: ['airbnb', 'vacation_rental', 'villa', 'apartment_rental', 'lokasyon', 'alquiler'],
    emoji: '🏖️', color: 'teal', tier: 'secondary', demandScore: 85,
  },
  {
    id: 'event_venue', parentId: 'hospitality', code: 'HOSP-006',
    names: { en: 'Event Venue & Planning', ht: 'Sal & Planifikasyon Evènman', es: 'Salón de Eventos', fr: "Salle d'événements" },
    industry: 'Hospitality & Tourism', industryCode: 'HOSP',
    services: ['wedding', 'conference', 'birthday', 'catering', 'decoration', 'photography'],
    products: ['venues', 'packages'],
    countries: [],
    capabilities: { booking: true },
    aliases: ['event', 'wedding', 'banquet', 'conference_room', 'party_hall', 'evènman', 'mariage'],
    emoji: '🎪', color: 'pink', tier: 'secondary', demandScore: 82,
  },
  {
    id: 'spa_wellness', parentId: 'hospitality', code: 'HOSP-007',
    names: { en: 'Spa & Wellness', ht: 'Spa & Byennèt', es: 'Spa y Bienestar', fr: 'Spa & Bien-être' },
    industry: 'Hospitality & Tourism', industryCode: 'HOSP',
    services: ['massage', 'facial', 'sauna', 'yoga', 'meditation', 'beauty'],
    products: ['packages', 'memberships'],
    countries: [],
    capabilities: { booking: true },
    aliases: ['spa', 'wellness', 'massage', 'sauna', 'beauty', 'byennèt', 'bienestar'],
    emoji: '🧘', color: 'green', tier: 'secondary', demandScore: 78,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTHCARE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hospital_clinic', parentId: 'healthcare', code: 'HLTH-001',
    names: { en: 'Hospital & Clinic', ht: 'Lopital & Klinik', es: 'Hospital y Clínica', fr: 'Hôpital & Clinique' },
    industry: 'Healthcare', industryCode: 'HLTH',
    services: ['emergency', 'surgery', 'consultation', 'hospitalization', 'lab', 'imaging'],
    products: [],
    countries: [],
    requirements: { licenses: ['medical_license', 'ministry_of_health'] },
    capabilities: { booking: true, emergency24h: true },
    aliases: ['hospital', 'clinic', 'medical_center', 'lopital', 'klinik', 'clinica', 'hôpital'],
    emoji: '🏥', color: 'red', tier: 'primary', demandScore: 97,
  },
  {
    id: 'pharmacy', parentId: 'healthcare', code: 'HLTH-002',
    names: { en: 'Pharmacy & Drugstore', ht: 'Famasi', es: 'Farmacia', fr: 'Pharmacie' },
    industry: 'Healthcare', industryCode: 'HLTH',
    services: ['prescription', 'otc', 'delivery', 'consultation'],
    products: ['medications', 'health_products', 'cosmetics'],
    countries: [],
    requirements: { licenses: ['pharmacy_license'] },
    capabilities: { delivery: true, ecommerce: true },
    aliases: ['pharmacy', 'drugstore', 'famasi', 'farmacia', 'pharmacie'],
    emoji: '💊', color: 'green', tier: 'primary', demandScore: 95,
  },
  {
    id: 'dental', parentId: 'healthcare', code: 'HLTH-003',
    names: { en: 'Dental Clinic', ht: 'Klinik Dantis', es: 'Clínica Dental', fr: 'Cabinet Dentaire' },
    industry: 'Healthcare', industryCode: 'HLTH',
    services: ['cleaning', 'filling', 'extraction', 'orthodontics', 'implants', 'whitening'],
    products: [],
    countries: [],
    requirements: { licenses: ['dental_license'] },
    capabilities: { booking: true },
    aliases: ['dentist', 'dental', 'dantis', 'dentista', 'dentiste'],
    emoji: '🦷', color: 'cyan', tier: 'secondary', demandScore: 88,
  },
  {
    id: 'laboratory', parentId: 'healthcare', code: 'HLTH-004',
    names: { en: 'Medical Laboratory', ht: 'Laboratwa Medikal', es: 'Laboratorio Médico', fr: 'Laboratoire Médical' },
    industry: 'Healthcare', industryCode: 'HLTH',
    services: ['blood_test', 'urine_test', 'imaging', 'biopsy', 'covid_test', 'results'],
    products: ['test_kits'],
    countries: [],
    requirements: { licenses: ['lab_license'] },
    capabilities: { booking: true, delivery: true },
    aliases: ['lab', 'laboratory', 'laboratwa', 'laboratorio'],
    emoji: '🔬', color: 'blue', tier: 'secondary', demandScore: 85,
  },
  {
    id: 'veterinary', parentId: 'healthcare', code: 'HLTH-005',
    names: { en: 'Veterinary & Animal Care', ht: 'Veterinè & Swen Bèt', es: 'Veterinaria', fr: 'Vétérinaire' },
    industry: 'Healthcare', industryCode: 'HLTH',
    services: ['consultation', 'vaccination', 'surgery', 'grooming', 'boarding'],
    products: ['pet_food', 'medications'],
    countries: [],
    capabilities: { booking: true },
    aliases: ['vet', 'veterinarian', 'veterinè', 'veterinaria', 'animal_care'],
    emoji: '🐾', color: 'amber', tier: 'secondary', demandScore: 75,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTION & REAL ESTATE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'general_contractor', parentId: 'construction', code: 'CNST-001',
    names: { en: 'General Contractor', ht: 'Kontraktè Jeneral', es: 'Contratista General', fr: 'Entrepreneur Général' },
    industry: 'Construction & Real Estate', industryCode: 'CNST',
    services: ['residential', 'commercial', 'renovation', 'new_build', 'project_management'],
    products: [],
    countries: [],
    requirements: { licenses: ['contractor_license'] },
    capabilities: { homeService: true },
    aliases: ['contractor', 'builder', 'construction', 'kontraktè', 'costruzione', 'bâtiment', 'konstriksyon'],
    emoji: '🏗️', color: 'yellow', tier: 'primary', demandScore: 92,
  },
  {
    id: 'architecture', parentId: 'construction', code: 'CNST-002',
    names: { en: 'Architecture & Design', ht: 'Achitekti & Dizayn', es: 'Arquitectura y Diseño', fr: 'Architecture & Design' },
    industry: 'Construction & Real Estate', industryCode: 'CNST',
    services: ['architectural_plans', '3d_design', 'interior_design', 'urban_planning'],
    products: ['blueprints', 'designs'],
    countries: [],
    requirements: { licenses: ['architecture_license'] },
    capabilities: { remoteService: true },
    aliases: ['architect', 'architecture', 'design', 'achitèk', 'arquitecto'],
    emoji: '📐', color: 'indigo', tier: 'secondary', demandScore: 82,
  },
  {
    id: 'real_estate', parentId: 'construction', code: 'CNST-003',
    names: { en: 'Real Estate Agency', ht: 'Ajans Imobilye', es: 'Inmobiliaria', fr: 'Agence Immobilière' },
    industry: 'Construction & Real Estate', industryCode: 'CNST',
    services: ['buy', 'sell', 'rent', 'property_management', 'valuation'],
    products: ['properties', 'land'],
    countries: [],
    capabilities: { booking: true, remoteService: true },
    aliases: ['real_estate', 'property', 'imobilye', 'inmobiliaria', 'immobilier'],
    emoji: '🏠', color: 'green', tier: 'primary', demandScore: 90,
  },
  {
    id: 'construction_materials', parentId: 'construction', code: 'CNST-004',
    names: { en: 'Construction Materials', ht: 'Materyèl Konstriksyon', es: 'Materiales de Construcción', fr: 'Matériaux de Construction' },
    industry: 'Construction & Real Estate', industryCode: 'CNST',
    services: ['delivery', 'wholesale', 'retail'],
    products: ['cement', 'steel', 'wood', 'plumbing', 'electrical', 'tiles', 'paint'],
    countries: [],
    capabilities: { delivery: true, ecommerce: true },
    aliases: ['hardware', 'materials', 'cement', 'quincaillerie', 'materyèl', 'ferretería'],
    emoji: '🧱', color: 'stone', tier: 'secondary', demandScore: 88,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNOLOGY & DIGITAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'software_development', parentId: 'technology', code: 'TECH-001',
    names: { en: 'Software Development', ht: 'Devlopman Lojisyèl', es: 'Desarrollo de Software', fr: 'Développement Logiciel' },
    industry: 'Technology & Digital', industryCode: 'TECH',
    services: ['web_development', 'mobile_app', 'api', 'saas', 'custom_software', 'consulting'],
    products: ['software', 'apps', 'platforms'],
    countries: [],
    capabilities: { remoteService: true, ecommerce: true, subscription: true },
    aliases: ['software', 'developer', 'dev', 'tech', 'app', 'web', 'mobile', 'teknoloji'],
    emoji: '💻', color: 'violet', tier: 'primary', demandScore: 95,
  },
  {
    id: 'it_services', parentId: 'technology', code: 'TECH-002',
    names: { en: 'IT Services & Support', ht: 'Sèvis & Sipò Enfòmatik', es: 'Servicios de TI', fr: "Services Informatiques" },
    industry: 'Technology & Digital', industryCode: 'TECH',
    services: ['network', 'repair', 'installation', 'cloud', 'backup', 'security', 'helpdesk'],
    products: ['hardware', 'licenses'],
    countries: [],
    capabilities: { remoteService: true, homeService: true, emergency24h: true },
    aliases: ['it', 'tech_support', 'computer', 'network', 'informatique', 'informatik'],
    emoji: '🖥️', color: 'blue', tier: 'secondary', demandScore: 88,
  },
  {
    id: 'digital_marketing', parentId: 'technology', code: 'TECH-003',
    names: { en: 'Digital Marketing & SEO', ht: 'Maketing Dijital', es: 'Marketing Digital', fr: 'Marketing Digital' },
    industry: 'Technology & Digital', industryCode: 'TECH',
    services: ['social_media', 'seo', 'ads', 'content', 'email_marketing', 'branding'],
    products: ['reports', 'campaigns'],
    countries: [],
    capabilities: { remoteService: true },
    aliases: ['marketing', 'seo', 'social_media', 'digital', 'ads', 'maketing'],
    emoji: '📱', color: 'pink', tier: 'secondary', demandScore: 90,
  },
  {
    id: 'telecommunications', parentId: 'technology', code: 'TECH-004',
    names: { en: 'Telecommunications', ht: 'Telekominikasyon', es: 'Telecomunicaciones', fr: 'Télécommunications' },
    industry: 'Technology & Digital', industryCode: 'TECH',
    services: ['internet', 'mobile', 'cable', 'voip', 'satellite'],
    products: ['plans', 'devices', 'sim'],
    countries: [],
    capabilities: { ecommerce: true, subscription: true },
    aliases: ['telecom', 'internet', 'cable', 'wifi', 'telekominikasyon'],
    emoji: '📡', color: 'cyan', tier: 'primary', demandScore: 92,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSPORTATION & LOGISTICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'taxi_rideshare', parentId: 'transport', code: 'TRNS-001',
    names: { en: 'Taxi & Rideshare', ht: 'Taksi & Transport', es: 'Taxi y Transporte', fr: 'Taxi & Transport' },
    industry: 'Transportation & Logistics', industryCode: 'TRNS',
    services: ['local_ride', 'airport_transfer', 'long_distance', 'luxury'],
    products: [],
    countries: [],
    capabilities: { booking: true },
    aliases: ['taxi', 'uber', 'rideshare', 'transport', 'chauffeur', 'taksi', 'chofer'],
    emoji: '🚕', color: 'yellow', tier: 'primary', demandScore: 96,
  },
  {
    id: 'logistics_courier', parentId: 'transport', code: 'TRNS-002',
    names: { en: 'Logistics & Courier', ht: 'Lojistik & Kourye', es: 'Logística y Mensajería', fr: 'Logistique & Coursier' },
    industry: 'Transportation & Logistics', industryCode: 'TRNS',
    services: ['delivery', 'freight', 'warehousing', 'customs', 'tracking'],
    products: [],
    countries: [],
    capabilities: { delivery: true, ecommerce: true, internationalShipping: true },
    aliases: ['courier', 'delivery', 'freight', 'logistics', 'shipping', 'kourye', 'livraison'],
    emoji: '📦', color: 'orange', tier: 'primary', demandScore: 94,
  },
  {
    id: 'bus_transport', parentId: 'transport', code: 'TRNS-003',
    names: { en: 'Bus & Public Transport', ht: 'Bis & Transpò Piblik', es: 'Autobús y Transporte Público', fr: 'Bus & Transport Public' },
    industry: 'Transportation & Logistics', industryCode: 'TRNS',
    services: ['routes', 'charter', 'school_bus', 'intercity'],
    products: ['tickets', 'passes'],
    countries: [],
    capabilities: { booking: true, ecommerce: true },
    aliases: ['bus', 'minibus', 'tapap', 'camioneta', 'autobus', 'coach'],
    emoji: '🚌', color: 'green', tier: 'secondary', demandScore: 85,
  },
  {
    id: 'shipping_maritime', parentId: 'transport', code: 'TRNS-004',
    names: { en: 'Shipping & Maritime', ht: 'Transpò Maritim', es: 'Transporte Marítimo', fr: 'Transport Maritime' },
    industry: 'Transportation & Logistics', industryCode: 'TRNS',
    services: ['cargo', 'container', 'fishing', 'ferry', 'customs'],
    products: ['shipping_containers'],
    countries: [],
    capabilities: { internationalShipping: true },
    aliases: ['shipping', 'maritime', 'cargo', 'container', 'ferry', 'bateau', 'bato'],
    emoji: '🚢', color: 'blue', tier: 'secondary', demandScore: 78,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCE & BANKING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bank_financial', parentId: 'finance', code: 'FIN-001',
    names: { en: 'Bank & Financial Institution', ht: 'Bank & Enstitisyon Finansyè', es: 'Banco e Institución Financiera', fr: 'Banque & Institution Financière' },
    industry: 'Finance & Banking', industryCode: 'FIN',
    services: ['accounts', 'loans', 'credit_cards', 'wire_transfer', 'investment'],
    products: ['accounts', 'credit', 'loans'],
    countries: [],
    requirements: { licenses: ['banking_license', 'central_bank'] },
    capabilities: { ecommerce: true, remoteService: true },
    aliases: ['bank', 'banking', 'bank', 'banque', 'banco'],
    emoji: '🏦', color: 'blue', tier: 'primary', demandScore: 92,
  },
  {
    id: 'money_transfer', parentId: 'finance', code: 'FIN-002',
    names: { en: 'Money Transfer & Exchange', ht: 'Transfere Lajan & Echanj', es: 'Transferencia de Dinero', fr: 'Transfert & Change' },
    industry: 'Finance & Banking', industryCode: 'FIN',
    services: ['international_transfer', 'currency_exchange', 'mobile_money', 'remittance'],
    products: [],
    countries: [],
    requirements: { licenses: ['money_service_license'] },
    capabilities: { ecommerce: true, remoteService: true },
    aliases: ['remittance', 'money_transfer', 'exchange', 'western_union', 'moneygram', 'transfere', 'wiring'],
    emoji: '💸', color: 'green', tier: 'primary', demandScore: 96,
  },
  {
    id: 'insurance', parentId: 'finance', code: 'FIN-003',
    names: { en: 'Insurance', ht: 'Asirans', es: 'Seguro', fr: 'Assurance' },
    industry: 'Finance & Banking', industryCode: 'FIN',
    services: ['health_insurance', 'life_insurance', 'property', 'auto', 'business'],
    products: ['policies'],
    countries: [],
    requirements: { licenses: ['insurance_license'] },
    capabilities: { remoteService: true },
    aliases: ['insurance', 'asirans', 'seguro', 'assurance'],
    emoji: '🛡️', color: 'indigo', tier: 'primary', demandScore: 88,
  },
  {
    id: 'microfinance', parentId: 'finance', code: 'FIN-004',
    names: { en: 'Microfinance & Credit Union', ht: 'Mikwofinans & Kès Popilè', es: 'Microfinanzas', fr: 'Microfinance & Caisse Populaire' },
    industry: 'Finance & Banking', industryCode: 'FIN',
    services: ['microloan', 'savings', 'group_lending', 'financial_literacy'],
    products: ['loan_products'],
    countries: ['HT', 'DO', 'JM'],
    requirements: { licenses: ['microfinance_license'] },
    capabilities: { remoteService: true },
    aliases: ['microfinance', 'credit_union', 'microcredit', 'kès', 'sol'],
    emoji: '🤝', color: 'emerald', tier: 'secondary', demandScore: 85,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EDUCATION & TRAINING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'school_university', parentId: 'education', code: 'EDU-001',
    names: { en: 'School & University', ht: 'Lekòl & Inivèsite', es: 'Escuela y Universidad', fr: 'École & Université' },
    industry: 'Education & Training', industryCode: 'EDU',
    services: ['k12', 'higher_education', 'vocational', 'certification', 'online_learning'],
    products: ['degrees', 'diplomas', 'certificates'],
    countries: [],
    requirements: { licenses: ['ministry_of_education'] },
    capabilities: { subscription: true, remoteService: true },
    aliases: ['school', 'university', 'college', 'academy', 'lekòl', 'inivèsite', 'escuela'],
    emoji: '🎓', color: 'blue', tier: 'primary', demandScore: 90,
  },
  {
    id: 'training_center', parentId: 'education', code: 'EDU-002',
    names: { en: 'Training Center & Vocational', ht: 'Sant Fòmasyon', es: 'Centro de Capacitación', fr: 'Centre de Formation' },
    industry: 'Education & Training', industryCode: 'EDU',
    services: ['professional_training', 'skill_development', 'certification', 'workshops'],
    products: ['courses', 'certifications'],
    countries: [],
    capabilities: { booking: true, remoteService: true, ecommerce: true },
    aliases: ['training', 'vocational', 'institute', 'fòmasyon', 'capacitación'],
    emoji: '📚', color: 'violet', tier: 'secondary', demandScore: 88,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RETAIL & COMMERCE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'supermarket', parentId: 'retail', code: 'RTIL-001',
    names: { en: 'Supermarket & Grocery', ht: 'Sipèmakèt & Komès', es: 'Supermercado', fr: 'Supermarché' },
    industry: 'Retail & Commerce', industryCode: 'RTIL',
    services: ['retail', 'delivery', 'wholesale', 'catering_supplies'],
    products: ['food', 'beverages', 'household', 'fresh_produce'],
    countries: [],
    capabilities: { delivery: true, ecommerce: true },
    aliases: ['supermarket', 'grocery', 'market', 'sipèmakèt', 'makèt', 'supermercado', 'épicerie'],
    emoji: '🛒', color: 'green', tier: 'primary', demandScore: 97,
  },
  {
    id: 'fashion_clothing', parentId: 'retail', code: 'RTIL-002',
    names: { en: 'Fashion & Clothing', ht: 'Mòd & Rad', es: 'Moda y Ropa', fr: 'Mode & Vêtements' },
    industry: 'Retail & Commerce', industryCode: 'RTIL',
    services: ['retail', 'tailoring', 'rental', 'online_store'],
    products: ['clothing', 'accessories', 'shoes', 'bags'],
    countries: [],
    capabilities: { ecommerce: true, delivery: true },
    aliases: ['fashion', 'clothing', 'boutique', 'rad', 'ropa', 'vêtements', 'moda'],
    emoji: '👗', color: 'pink', tier: 'primary', demandScore: 90,
  },
  {
    id: 'electronics', parentId: 'retail', code: 'RTIL-003',
    names: { en: 'Electronics & Technology Store', ht: 'Elektwonik & Teknoloji', es: 'Electrónica y Tecnología', fr: 'Électronique & Technologie' },
    industry: 'Retail & Commerce', industryCode: 'RTIL',
    services: ['retail', 'repair', 'import', 'warranty'],
    products: ['phones', 'computers', 'appliances', 'accessories'],
    countries: [],
    capabilities: { ecommerce: true, delivery: true },
    aliases: ['electronics', 'technology', 'phone', 'computer', 'elektwonik', 'electrónica'],
    emoji: '📱', color: 'blue', tier: 'primary', demandScore: 92,
  },
  {
    id: 'auto_parts', parentId: 'retail', code: 'RTIL-004',
    names: { en: 'Auto Parts & Garage', ht: 'Pyes Auto & Garaj', es: 'Autopartes y Taller', fr: 'Pièces Auto & Garage' },
    industry: 'Retail & Commerce', industryCode: 'RTIL',
    services: ['repair', 'maintenance', 'parts_sale', 'diagnostic'],
    products: ['auto_parts', 'tires', 'batteries', 'accessories'],
    countries: [],
    capabilities: { delivery: true, homeService: true },
    aliases: ['auto', 'mechanic', 'garage', 'car_repair', 'pyes', 'taller', 'garagiste'],
    emoji: '🔧', color: 'gray', tier: 'primary', demandScore: 88,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFESSIONAL SERVICES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'legal_services', parentId: 'professional', code: 'PROF-001',
    names: { en: 'Legal Services & Law Firm', ht: 'Sèvis Legal & Kabinè Avoka', es: 'Servicios Legales', fr: 'Services Juridiques' },
    industry: 'Professional Services', industryCode: 'PROF',
    services: ['legal_consultation', 'contract', 'litigation', 'notary', 'immigration'],
    products: ['legal_documents'],
    countries: [],
    requirements: { licenses: ['bar_license'] },
    capabilities: { remoteService: true, booking: true },
    aliases: ['lawyer', 'attorney', 'legal', 'notary', 'avoka', 'abogado', 'avocat'],
    emoji: '⚖️', color: 'slate', tier: 'primary', demandScore: 85,
  },
  {
    id: 'accounting', parentId: 'professional', code: 'PROF-002',
    names: { en: 'Accounting & Tax Services', ht: 'Kontabilite & Sèvis Fiskal', es: 'Contabilidad y Servicios Fiscales', fr: 'Comptabilité & Fiscalité' },
    industry: 'Professional Services', industryCode: 'PROF',
    services: ['bookkeeping', 'tax_filing', 'audit', 'payroll', 'financial_statements'],
    products: ['reports'],
    countries: [],
    requirements: { licenses: ['cpa_license'] },
    capabilities: { remoteService: true },
    aliases: ['accounting', 'accountant', 'cpa', 'tax', 'kontabilite', 'contador', 'comptable'],
    emoji: '📊', color: 'emerald', tier: 'secondary', demandScore: 88,
  },
  {
    id: 'security_services', parentId: 'professional', code: 'PROF-003',
    names: { en: 'Security Services', ht: 'Sèvis Sekirite', es: 'Servicios de Seguridad', fr: 'Services de Sécurité' },
    industry: 'Professional Services', industryCode: 'PROF',
    services: ['guarding', 'surveillance', 'alarm', 'investigation', 'cybersecurity'],
    products: ['security_systems', 'cameras'],
    countries: [],
    requirements: { licenses: ['security_license'] },
    capabilities: { homeService: true, emergency24h: true },
    aliases: ['security', 'guard', 'surveillance', 'sekirite', 'seguridad', 'sécurité'],
    emoji: '🔒', color: 'red', tier: 'secondary', demandScore: 82,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONAL SERVICES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hair_beauty', parentId: 'personal', code: 'PERS-001',
    names: { en: 'Hair & Beauty Salon', ht: 'Salon Bote & Kwafiè', es: 'Salón de Belleza y Peluquería', fr: 'Salon de Beauté & Coiffure' },
    industry: 'Personal Services', industryCode: 'PERS',
    services: ['haircut', 'coloring', 'makeup', 'nails', 'braiding', 'lashes'],
    products: ['hair_products', 'beauty_products'],
    countries: [],
    capabilities: { booking: true, homeService: true },
    aliases: ['salon', 'beauty', 'hair', 'nails', 'barbershop', 'kwafiè', 'peluquería', 'coiffure'],
    emoji: '💇', color: 'rose', tier: 'primary', demandScore: 95,
  },
  {
    id: 'cleaning', parentId: 'personal', code: 'PERS-002',
    names: { en: 'Cleaning & Maintenance', ht: 'Netwayaj & Antretyen', es: 'Limpieza y Mantenimiento', fr: 'Nettoyage & Entretien' },
    industry: 'Personal Services', industryCode: 'PERS',
    services: ['residential_cleaning', 'commercial_cleaning', 'laundry', 'pest_control', 'pool'],
    products: ['cleaning_supplies'],
    countries: [],
    capabilities: { booking: true, homeService: true, subscription: true },
    aliases: ['cleaning', 'laundry', 'housekeeping', 'netwayaj', 'limpieza', 'ménage'],
    emoji: '🧹', color: 'blue', tier: 'primary', demandScore: 92,
  },
  {
    id: 'fitness_gym', parentId: 'personal', code: 'PERS-003',
    names: { en: 'Gym & Fitness Center', ht: 'Jim & Sant Fizik', es: 'Gimnasio y Centro de Fitness', fr: 'Salle de Gym & Fitness' },
    industry: 'Personal Services', industryCode: 'PERS',
    services: ['gym', 'personal_training', 'classes', 'nutrition'],
    products: ['memberships', 'supplements'],
    countries: [],
    capabilities: { booking: true, subscription: true },
    aliases: ['gym', 'fitness', 'workout', 'training', 'jim', 'gimnasio', 'salle_de_sport'],
    emoji: '💪', color: 'orange', tier: 'secondary', demandScore: 85,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AGRICULTURE & FOOD PRODUCTION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'farming', parentId: 'agriculture', code: 'AGRI-001',
    names: { en: 'Farming & Agriculture', ht: 'Agrikilti & Jaden', es: 'Agricultura y Granja', fr: 'Agriculture & Ferme' },
    industry: 'Agriculture & Food Production', industryCode: 'AGRI',
    services: ['crop_production', 'livestock', 'organic', 'agro_processing', 'export'],
    products: ['crops', 'vegetables', 'fruits', 'meat', 'dairy'],
    countries: [],
    capabilities: { delivery: true, ecommerce: true },
    aliases: ['farm', 'agriculture', 'crop', 'livestock', 'jaden', 'agrikilti', 'granja'],
    emoji: '🌾', color: 'lime', tier: 'primary', demandScore: 88,
  },
  {
    id: 'fishing', parentId: 'agriculture', code: 'AGRI-002',
    names: { en: 'Fishing & Aquaculture', ht: 'Lapèch & Akwakilti', es: 'Pesca y Acuicultura', fr: 'Pêche & Aquaculture' },
    industry: 'Agriculture & Food Production', industryCode: 'AGRI',
    services: ['fishing', 'processing', 'export', 'wholesale'],
    products: ['fish', 'seafood', 'shrimp'],
    countries: ['HT', 'DO', 'JM', 'CU'],
    capabilities: { delivery: true },
    aliases: ['fishing', 'fish', 'seafood', 'lapèch', 'pesca', 'aquaculture'],
    emoji: '🎣', color: 'cyan', tier: 'secondary', demandScore: 78,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MANUFACTURING & INDUSTRY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'factory_manufacturing', parentId: 'manufacturing', code: 'MFGT-001',
    names: { en: 'Factory & Manufacturing', ht: 'Faktori & Manifakti', es: 'Fábrica y Manufactura', fr: 'Usine & Manufacture' },
    industry: 'Manufacturing & Industry', industryCode: 'MFGT',
    services: ['production', 'assembly', 'packaging', 'export', 'oem'],
    products: ['manufactured_goods'],
    countries: [],
    capabilities: { ecommerce: true, internationalShipping: true },
    aliases: ['factory', 'manufacturing', 'production', 'assembly', 'faktori', 'fábrica', 'usine'],
    emoji: '🏭', color: 'gray', tier: 'primary', demandScore: 82,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENERGY & UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'energy_solar', parentId: 'energy', code: 'ENRG-001',
    names: { en: 'Energy & Solar', ht: 'Enèji & Solè', es: 'Energía y Solar', fr: 'Énergie & Solaire' },
    industry: 'Energy & Utilities', industryCode: 'ENRG',
    services: ['solar_installation', 'generator', 'electricity', 'energy_audit', 'maintenance'],
    products: ['solar_panels', 'batteries', 'generators'],
    countries: [],
    capabilities: { homeService: true, ecommerce: true },
    aliases: ['solar', 'energy', 'electricity', 'generator', 'enèji', 'energía', 'énergie'],
    emoji: '☀️', color: 'yellow', tier: 'primary', demandScore: 90,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA & ENTERTAINMENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'photography_video', parentId: 'media', code: 'MEDI-001',
    names: { en: 'Photography & Videography', ht: 'Fotografi & Videografi', es: 'Fotografía y Videografía', fr: 'Photographie & Vidéographie' },
    industry: 'Media & Entertainment', industryCode: 'MEDI',
    services: ['wedding_photo', 'commercial', 'portrait', 'video_production', 'editing'],
    products: ['photos', 'videos', 'prints'],
    countries: [],
    capabilities: { booking: true, remoteService: true },
    aliases: ['photographer', 'videographer', 'photography', 'video', 'fotograf', 'fotografo'],
    emoji: '📸', color: 'violet', tier: 'secondary', demandScore: 85,
  },
  {
    id: 'music_entertainment', parentId: 'media', code: 'MEDI-002',
    names: { en: 'Music & Entertainment', ht: 'Mizik & Divètisman', es: 'Música y Entretenimiento', fr: 'Musique & Divertissement' },
    industry: 'Media & Entertainment', industryCode: 'MEDI',
    services: ['performance', 'recording', 'production', 'dj', 'events'],
    products: ['music', 'recordings'],
    countries: [],
    capabilities: { booking: true, ecommerce: true },
    aliases: ['music', 'musician', 'band', 'dj', 'mizisyen', 'músico', 'musicien'],
    emoji: '🎵', color: 'purple', tier: 'secondary', demandScore: 80,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NGO & GOVERNMENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ngo_nonprofit', parentId: 'government', code: 'GOV-001',
    names: { en: 'NGO & Non-profit', ht: 'ONG & Bi Non-Likratif', es: 'ONG y Sin Fines de Lucro', fr: 'ONG & Association' },
    industry: 'Government & NGO', industryCode: 'GOV',
    services: ['humanitarian', 'development', 'education', 'healthcare', 'advocacy'],
    products: [],
    countries: [],
    capabilities: { remoteService: true },
    aliases: ['ngo', 'nonprofit', 'charity', 'foundation', 'ong', 'association', 'fondasyon'],
    emoji: '🌍', color: 'teal', tier: 'secondary', demandScore: 75,
  },
];

// Index by id for O(1) lookup
export const TAXONOMY_BY_ID: Record<string, GlobalCategory> =
  Object.fromEntries(GLOBAL_TAXONOMY.map(c => [c.id, c]));

// Index by industry code
export const TAXONOMY_BY_INDUSTRY: Record<string, GlobalCategory[]> =
  GLOBAL_TAXONOMY.reduce<Record<string, GlobalCategory[]>>((acc, c) => {
    if (!acc[c.industryCode]) acc[c.industryCode] = [];
    acc[c.industryCode]!.push(c);
    return acc;
  }, {});

// All alias tokens → category id (for fast classification)
export const ALIAS_INDEX: Record<string, string> = Object.fromEntries(
  GLOBAL_TAXONOMY.flatMap(c => c.aliases.map(a => [a, c.id]))
);

export const TOP_CATEGORIES: GlobalCategory[] = [...GLOBAL_TAXONOMY]
  .sort((a, b) => b.demandScore - a.demandScore)
  .slice(0, 12);

export const INDUSTRIES = [
  { code: 'HOSP', name: 'Hospitality & Tourism', emoji: '🏨' },
  { code: 'HLTH', name: 'Healthcare', emoji: '🏥' },
  { code: 'CNST', name: 'Construction & Real Estate', emoji: '🏗️' },
  { code: 'TECH', name: 'Technology & Digital', emoji: '💻' },
  { code: 'TRNS', name: 'Transportation & Logistics', emoji: '🚕' },
  { code: 'FIN',  name: 'Finance & Banking', emoji: '🏦' },
  { code: 'EDU',  name: 'Education & Training', emoji: '🎓' },
  { code: 'RTIL', name: 'Retail & Commerce', emoji: '🛒' },
  { code: 'PROF', name: 'Professional Services', emoji: '⚖️' },
  { code: 'PERS', name: 'Personal Services', emoji: '💇' },
  { code: 'AGRI', name: 'Agriculture & Food', emoji: '🌾' },
  { code: 'MFGT', name: 'Manufacturing & Industry', emoji: '🏭' },
  { code: 'ENRG', name: 'Energy & Utilities', emoji: '☀️' },
  { code: 'MEDI', name: 'Media & Entertainment', emoji: '📸' },
  { code: 'GOV',  name: 'Government & NGO', emoji: '🌍' },
];
