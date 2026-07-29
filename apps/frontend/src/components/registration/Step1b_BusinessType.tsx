import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Hotel, UtensilsCrossed, Wine, Plane, Hospital, Stethoscope, Pill, FlaskConical,
  Scale, Calculator, Megaphone, Cpu, Laptop, HardHat, DraftingCompass, Building,
  Truck, Home, CarTaxiFront, Route, School2, University, GraduationCap,
  ShoppingCart, Store, Landmark, Globe2, Search, X, ChevronRight, Sparkles,
  ShieldCheck, Star, Users, BadgeCheck, MapPin, Languages, CalendarDays, Video,
  Image as ImageIcon, Building2, Globe, MessageCircle, Phone, Mail, Link2, Clock3,
  Eye, MousePointer2, DollarSign, TrendingUp, ThermometerSnowflake, Wifi, BadgeInfo,
  FileCheck2, BadgePercent, Factory, BriefcaseBusiness, PackageSearch, BusFront,
  Ship, PlaneTakeoff, ShoppingBag, Zap, Camera, Earth, Shield, Award, BookMarked,
  ClipboardList, MapPinned, Navigation, LineChart, Gauge, PieChart,
} from 'lucide-react';

const BG = '#050B18';
const CARD = '#0d1526';
const BORDER = '#1F2937';
const FALLBACK_IMAGE = '/assets/fallback-business.webp';

const VERIFICATION_LEVELS: Record<string, string> = {
  basic: 'Basic',
  verified: 'Verified',
  premium: 'Premium',
  enterprise: 'Enterprise',
  government_verified: 'Government Verified',
  international_verified: 'International Verified',
  iso_certified: 'ISO Certified',
  ai_trusted: 'AI Trusted',
  elite: 'JOBFAST Elite',
};

const CURRENCIES = ['USD', 'EUR', 'DOP', 'HTG', 'MXN', 'CAD', 'GBP', 'JPY', 'BTC', 'ETH', 'USDT'];
const TRANSLATIONS = ['English', 'Español', 'Français', 'Kreyòl', 'Português', 'Deutsch', 'Italiano', '中文', 'العربية'];

const AI_SUGGESTIONS = [
  { id: 'hotel-punta-cana', label: 'I own a hotel in Punta Cana', desc: 'Hotel + Hospitality + Tourism + Premium Business', picks: ['hotel', 'tour_agency', 'restaurant'] },
  { id: 'restaurant-ai',    label: 'I run a restaurant',           desc: 'Food service + delivery + catering suggestions',    picks: ['restaurant', 'delivery', 'catering', 'bakery', 'coffee_shop'] },
  { id: 'construction-ai',  label: 'We build houses and apartments',desc: 'Construction + engineering + supplier + architecture',picks: ['contractor', 'engineering_firm', 'supplier', 'architecture'] },
];

interface BusinessItem {
  id: string; label: string; industry: string; categoryPath?: string[];
  verificationLevel: string; companySize: string; trustScore: number; securityScore: number;
  customerSatisfaction: number; employeeRating: number; responseTime: string; deliveryTime: string;
  businessScore: number; countrySupport: string[]; employees: string; foundedYear: number;
  services: string[]; products: string[]; remoteAvailable: boolean; liveStatus: string;
  verifiedDocuments: boolean; languages: string[]; paymentMethods: string[]; currencies: string[];
  locationType: string; country: string; state: string; province: string; city: string;
  district: string; neighborhood: string; timezone: string; gps: { lat: number; lng: number };
  website: string; phone: string; whatsapp: string; email: string;
  socialMedia: Record<string, string>; branches: number; openingHours: string;
  certificates: string[]; licenses: string[]; awards: string[]; reviews: number;
  jobs: number; rating: number; revenue: string; galleryCount: number; videoCount: number;
  tour360: boolean; logo: string; cover: string; preview: string; accent: string; glow: string;
  topRecs: string[];
}

interface CategoryGroup { id: string; label: string; popular: boolean; icon: LucideIcon; items: BusinessItem[]; }

interface FlatBusiness extends BusinessItem {
  categoryId: string; categoryLabel: string; categoryIcon: LucideIcon;
  icon: LucideIcon; searchable: string;
}

const CATEGORIES: CategoryGroup[] = [
  {
    id: 'hospitality', label: 'Hospitality', popular: true, icon: Hotel,
    items: [
      { id: 'hotel', label: 'Hotel', industry: 'hospitality', categoryPath: ['Hospitality', 'Hotel'], verificationLevel: 'premium', companySize: 'medium', trustScore: 95, securityScore: 94, customerSatisfaction: 91, employeeRating: 88, responseTime: '12 min', deliveryTime: 'N/A', businessScore: 93, countrySupport: ['DR', 'US', 'CA', 'FR', 'global'], employees: '50-250', foundedYear: 2012, services: ['Rooms', 'Events', 'Restaurant'], products: [], remoteAvailable: false, liveStatus: 'open', verifiedDocuments: true, languages: ['en', 'es', 'fr', 'kreyol'], paymentMethods: ['card', 'cash', 'transfer'], currencies: ['USD', 'EUR', 'DOP'], locationType: 'on-site', country: 'Dominican Republic', state: 'La Altagracia', province: 'La Altagracia', city: 'Punta Cana', district: 'Bávaro', neighborhood: 'Tourist Zone', timezone: 'America/Santo_Domingo', gps: { lat: 18.5601, lng: -68.3725 }, website: 'https://example.com', phone: '+1 809 000 0000', whatsapp: '+1 809 000 0000', email: 'info@example.com', socialMedia: { instagram: '', facebook: '', tiktok: '', linkedin: '' }, branches: 3, openingHours: '24/7', certificates: ['ISO Certified', 'AI Trusted'], licenses: ['Tourism License'], awards: ['Best Resort'], reviews: 1240, jobs: 18, rating: 4.8, revenue: '$$$$', galleryCount: 12, videoCount: 4, tour360: true, logo: '/assets/business/hotel-logo.webp', cover: '/assets/business/hotel-cover.webp', preview: '/assets/business/hotel.webp', accent: '#FACC15', glow: 'rgba(250,204,21,0.16)', topRecs: ['tour_agency', 'restaurant', 'coffee_shop', 'delivery'] },
      { id: 'restaurant', label: 'Restaurant', industry: 'hospitality', categoryPath: ['Hospitality', 'Restaurant'], verificationLevel: 'verified', companySize: 'small', trustScore: 88, securityScore: 82, customerSatisfaction: 90, employeeRating: 84, responseTime: '25 min', deliveryTime: '30-45 min', businessScore: 87, countrySupport: ['DR', 'US', 'global'], employees: '10-50', foundedYear: 2018, services: ['Dine-in', 'Takeout', 'Delivery'], products: ['Meals', 'Drinks'], remoteAvailable: false, liveStatus: 'busy', verifiedDocuments: true, languages: ['en', 'es'], paymentMethods: ['card', 'cash'], currencies: ['USD', 'DOP'], locationType: 'on-site', country: 'Dominican Republic', state: 'La Altagracia', province: 'La Altagracia', city: 'Punta Cana', district: 'Bávaro', neighborhood: 'Commercial Area', timezone: 'America/Santo_Domingo', gps: { lat: 18.582, lng: -68.404 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '10:00-23:00', certificates: ['Food Safety'], licenses: ['Health Permit'], awards: ['Top Rated'], reviews: 860, jobs: 6, rating: 4.6, revenue: '$$$', galleryCount: 25, videoCount: 6, tour360: false, logo: '/assets/business/restaurant-logo.webp', cover: '/assets/business/restaurant-cover.webp', preview: '/assets/business/restaurant.webp', accent: '#FB7185', glow: 'rgba(251,113,133,0.16)', topRecs: ['food_delivery', 'chef', 'catering', 'bakery', 'coffee_shop', 'hotel_partnership'] },
      { id: 'bar', label: 'Bar', industry: 'hospitality', categoryPath: ['Hospitality', 'Bar'], verificationLevel: 'verified', companySize: 'small', trustScore: 80, securityScore: 78, customerSatisfaction: 82, employeeRating: 79, responseTime: '30 min', deliveryTime: 'N/A', businessScore: 79, countrySupport: ['DR', 'global'], employees: '5-30', foundedYear: 2019, services: ['Drinks', 'Events', 'Nightlife'], products: ['Cocktails'], remoteAvailable: false, liveStatus: 'open', verifiedDocuments: true, languages: ['en', 'es'], paymentMethods: ['card', 'cash'], currencies: ['USD', 'DOP'], locationType: 'on-site', country: 'Dominican Republic', state: 'La Altagracia', province: 'La Altagracia', city: 'Punta Cana', district: 'Bávaro', neighborhood: 'Downtown', timezone: 'America/Santo_Domingo', gps: { lat: 18.57, lng: -68.38 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '5:00-2:00', certificates: [], licenses: ['Alcohol License'], awards: [], reviews: 320, jobs: 4, rating: 4.3, revenue: '$$', galleryCount: 8, videoCount: 2, tour360: false, logo: '/assets/business/bar-logo.webp', cover: '/assets/business/bar-cover.webp', preview: '/assets/business/bar.webp', accent: '#F472B6', glow: 'rgba(244,114,182,0.16)', topRecs: ['restaurant', 'coffee_shop', 'hotel_partnership'] },
      { id: 'tour_agency', label: 'Tour Agency', industry: 'tourism', categoryPath: ['Hospitality', 'Tour Agency'], verificationLevel: 'premium', companySize: 'small', trustScore: 90, securityScore: 88, customerSatisfaction: 92, employeeRating: 89, responseTime: '14 min', deliveryTime: 'N/A', businessScore: 91, countrySupport: ['DR', 'US', 'CA', 'global'], employees: '5-25', foundedYear: 2015, services: ['Tours', 'Transfers', 'Guides'], products: ['Excursions'], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['card', 'transfer'], currencies: ['USD', 'EUR', 'DOP'], locationType: 'hybrid', country: 'Dominican Republic', state: 'La Altagracia', province: 'La Altagracia', city: 'Punta Cana', district: 'Tourist Area', neighborhood: 'Bávaro', timezone: 'America/Santo_Domingo', gps: { lat: 18.6, lng: -68.42 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 2, openingHours: '8:00-18:00', certificates: ['AI Trusted'], licenses: ['Tour Operator License'], awards: ['Best Tour Service'], reviews: 540, jobs: 9, rating: 4.7, revenue: '$$$', galleryCount: 18, videoCount: 5, tour360: true, logo: '/assets/business/tour-logo.webp', cover: '/assets/business/tour-cover.webp', preview: '/assets/business/tourism.webp', accent: '#F59E0B', glow: 'rgba(245,158,11,0.16)', topRecs: ['hotel', 'restaurant', 'delivery', 'coffee_shop'] },
    ],
  },
  {
    id: 'professional_services', label: 'Professional Services', popular: true, icon: Scale,
    items: [
      { id: 'lawyer', label: 'Lawyer', industry: 'professional_services', categoryPath: ['Professional Services', 'Lawyer'], verificationLevel: 'verified', companySize: 'solo', trustScore: 82, securityScore: 84, customerSatisfaction: 79, employeeRating: 81, responseTime: '3 h', deliveryTime: 'N/A', businessScore: 82, countrySupport: ['global'], employees: '1-10', foundedYear: 2016, services: ['Legal advice', 'Contracts', 'Disputes'], products: [], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['card', 'transfer'], currencies: ['USD', 'EUR'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Distrito Nacional', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Piantini', neighborhood: 'Business District', timezone: 'America/Santo_Domingo', gps: { lat: 18.47, lng: -69.94 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '9:00-17:00', certificates: ['AI Trusted'], licenses: ['Bar License'], awards: [], reviews: 210, jobs: 2, rating: 4.5, revenue: '$$$', galleryCount: 4, videoCount: 1, tour360: false, logo: '/assets/business/lawyer-logo.webp', cover: '/assets/business/lawyer-cover.webp', preview: '/assets/business/lawyer.webp', accent: '#A78BFA', glow: 'rgba(167,139,250,0.16)', topRecs: ['accounting', 'consulting', 'insurance'] },
      { id: 'accounting', label: 'Accounting', industry: 'professional_services', categoryPath: ['Professional Services', 'Accounting'], verificationLevel: 'verified', companySize: 'small', trustScore: 83, securityScore: 85, customerSatisfaction: 82, employeeRating: 80, responseTime: '2 h', deliveryTime: 'N/A', businessScore: 83, countrySupport: ['global'], employees: '2-20', foundedYear: 2017, services: ['Bookkeeping', 'Taxes', 'Payroll'], products: [], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'fr'], paymentMethods: ['card', 'transfer'], currencies: ['USD', 'EUR'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Distrito Nacional', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Naco', neighborhood: 'Office Zone', timezone: 'America/Santo_Domingo', gps: { lat: 18.49, lng: -69.93 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '8:00-18:00', certificates: ['ISO Certified'], licenses: [], awards: [], reviews: 160, jobs: 1, rating: 4.4, revenue: '$$', galleryCount: 3, videoCount: 0, tour360: false, logo: '/assets/business/accounting-logo.webp', cover: '/assets/business/accounting-cover.webp', preview: '/assets/business/accounting.webp', accent: '#60A5FA', glow: 'rgba(96,165,250,0.16)', topRecs: ['tax_consulting', 'consulting', 'bank'] },
      { id: 'marketing_agency', label: 'Marketing Agency', industry: 'professional_services', categoryPath: ['Professional Services', 'Marketing Agency'], verificationLevel: 'verified', companySize: 'small', trustScore: 81, securityScore: 77, customerSatisfaction: 80, employeeRating: 83, responseTime: '40 min', deliveryTime: 'N/A', businessScore: 80, countrySupport: ['global'], employees: '2-25', foundedYear: 2020, services: ['Ads', 'Social media', 'Branding'], products: [], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: false, languages: ['en', 'es'], paymentMethods: ['card', 'transfer'], currencies: ['USD', 'EUR'], locationType: 'remote', country: 'Dominican Republic', state: 'Santo Domingo', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Ensanche Piantini', neighborhood: 'Creative Hub', timezone: 'America/Santo_Domingo', gps: { lat: 18.48, lng: -69.93 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '9:00-18:00', certificates: ['AI Trusted'], licenses: [], awards: [], reviews: 89, jobs: 3, rating: 4.2, revenue: '$$', galleryCount: 7, videoCount: 2, tour360: false, logo: '/assets/business/marketing-logo.webp', cover: '/assets/business/marketing-cover.webp', preview: '/assets/business/marketing-agency.webp', accent: '#F97316', glow: 'rgba(249,115,22,0.16)', topRecs: ['social_media', 'content_creator', 'photography', 'printing'] },
      { id: 'it_company', label: 'IT Company', industry: 'professional_services', categoryPath: ['Professional Services', 'IT Company'], verificationLevel: 'premium', companySize: 'medium', trustScore: 92, securityScore: 94, customerSatisfaction: 89, employeeRating: 91, responseTime: '18 min', deliveryTime: 'N/A', businessScore: 92, countrySupport: ['global'], employees: '10-100', foundedYear: 2014, services: ['IT support', 'Infrastructure', 'Security'], products: ['Software'], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['card', 'transfer', 'invoice'], currencies: ['USD', 'EUR', 'USDT'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Distrito Nacional', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Downtown', neighborhood: 'Tech District', timezone: 'America/Santo_Domingo', gps: { lat: 18.48, lng: -69.92 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 2, openingHours: '24/7', certificates: ['ISO Certified', 'AI Trusted'], licenses: [], awards: ['Best Tech Support'], reviews: 402, jobs: 14, rating: 4.7, revenue: '$$$$', galleryCount: 20, videoCount: 4, tour360: true, logo: '/assets/business/it-logo.webp', cover: '/assets/business/it-cover.webp', preview: '/assets/business/it-company.webp', accent: '#22C55E', glow: 'rgba(34,197,94,0.16)', topRecs: ['software_company', 'cybersecurity', 'data_center', 'ai_company'] },
      { id: 'software_company', label: 'Software Company', industry: 'professional_services', categoryPath: ['Professional Services', 'Software Company'], verificationLevel: 'premium', companySize: 'medium', trustScore: 94, securityScore: 95, customerSatisfaction: 91, employeeRating: 92, responseTime: '10 min', deliveryTime: 'N/A', businessScore: 94, countrySupport: ['global'], employees: '10-200', foundedYear: 2013, services: ['Apps', 'SaaS', 'Integrations'], products: ['Software'], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['card', 'invoice'], currencies: ['USD', 'EUR', 'USDT'], locationType: 'remote', country: 'Dominican Republic', state: 'Distrito Nacional', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Piantini', neighborhood: 'Startup Hub', timezone: 'America/Santo_Domingo', gps: { lat: 18.47, lng: -69.94 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '24/7', certificates: ['ISO Certified', 'AI Trusted'], licenses: [], awards: ['Top Startup'], reviews: 520, jobs: 24, rating: 4.8, revenue: '$$$$', galleryCount: 24, videoCount: 6, tour360: true, logo: '/assets/business/software-logo.webp', cover: '/assets/business/software-cover.webp', preview: '/assets/business/software-company.webp', accent: '#38BDF8', glow: 'rgba(56,189,248,0.16)', topRecs: ['ai_company', 'cybersecurity', 'fintech', 'blockchain'] },
    ],
  },
  {
    id: 'construction', label: 'Construction', popular: true, icon: HardHat,
    items: [
      { id: 'contractor', label: 'Contractor', industry: 'construction', categoryPath: ['Construction', 'Contractor'], verificationLevel: 'verified', companySize: 'small', trustScore: 87, securityScore: 84, customerSatisfaction: 85, employeeRating: 82, responseTime: '1 h', deliveryTime: 'N/A', businessScore: 86, countrySupport: ['global'], employees: '5-50', foundedYear: 2011, services: ['Renovation', 'Building', 'Repair'], products: [], remoteAvailable: false, liveStatus: 'busy', verifiedDocuments: true, languages: ['en', 'es'], paymentMethods: ['card', 'transfer', 'cash'], currencies: ['USD', 'DOP'], locationType: 'on-site', country: 'Dominican Republic', state: 'La Altagracia', province: 'La Altagracia', city: 'Punta Cana', district: 'Construction Zone', neighborhood: 'Bávaro', timezone: 'America/Santo_Domingo', gps: { lat: 18.56, lng: -68.37 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 2, openingHours: '7:00-18:00', certificates: ['AI Trusted'], licenses: ['Building Permit'], awards: [], reviews: 301, jobs: 11, rating: 4.5, revenue: '$$$', galleryCount: 15, videoCount: 3, tour360: false, logo: '/assets/business/contractor-logo.webp', cover: '/assets/business/contractor-cover.webp', preview: '/assets/business/contractor.webp', accent: '#FACC15', glow: 'rgba(250,204,21,0.16)', topRecs: ['engineering_firm', 'supplier', 'architecture', 'real_estate_developer'] },
      { id: 'engineering_firm', label: 'Engineering Firm', industry: 'construction', categoryPath: ['Construction', 'Engineering Firm'], verificationLevel: 'premium', companySize: 'medium', trustScore: 91, securityScore: 92, customerSatisfaction: 88, employeeRating: 90, responseTime: '40 min', deliveryTime: 'N/A', businessScore: 91, countrySupport: ['global'], employees: '10-100', foundedYear: 2008, services: ['Structural design', 'Project management', 'Consulting'], products: [], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'fr', 'es'], paymentMethods: ['invoice', 'transfer'], currencies: ['USD', 'EUR'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Distrito Nacional', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Downtown', neighborhood: 'Office Center', timezone: 'America/Santo_Domingo', gps: { lat: 18.47, lng: -69.93 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '8:00-17:00', certificates: ['ISO Certified'], licenses: [], awards: [], reviews: 120, jobs: 4, rating: 4.6, revenue: '$$$$', galleryCount: 6, videoCount: 1, tour360: false, logo: '/assets/business/engineering-logo.webp', cover: '/assets/business/engineering-cover.webp', preview: '/assets/business/engineering-firm.webp', accent: '#94A3B8', glow: 'rgba(148,163,184,0.16)', topRecs: ['contractor', 'supplier', 'architecture'] },
      { id: 'architecture', label: 'Architecture', industry: 'construction', categoryPath: ['Construction', 'Architecture'], verificationLevel: 'verified', companySize: 'small', trustScore: 84, securityScore: 81, customerSatisfaction: 83, employeeRating: 80, responseTime: '2 h', deliveryTime: 'N/A', businessScore: 84, countrySupport: ['global'], employees: '2-20', foundedYear: 2017, services: ['Planning', 'Design', 'Interiors'], products: [], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'es'], paymentMethods: ['card', 'invoice'], currencies: ['USD', 'EUR'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Distrito Nacional', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Gazcue', neighborhood: 'Design Quarter', timezone: 'America/Santo_Domingo', gps: { lat: 18.47, lng: -69.91 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '9:00-18:00', certificates: ['AI Trusted'], licenses: [], awards: [], reviews: 90, jobs: 2, rating: 4.4, revenue: '$$', galleryCount: 5, videoCount: 1, tour360: false, logo: '/assets/business/architecture-logo.webp', cover: '/assets/business/architecture-cover.webp', preview: '/assets/business/architecture.webp', accent: '#A78BFA', glow: 'rgba(167,139,250,0.16)', topRecs: ['contractor', 'supplier', 'real_estate_developer'] },
      { id: 'supplier', label: 'Supplier', industry: 'construction', categoryPath: ['Construction', 'Supplier'], verificationLevel: 'basic', companySize: 'small', trustScore: 76, securityScore: 74, customerSatisfaction: 75, employeeRating: 76, responseTime: '3 h', deliveryTime: '1-3 days', businessScore: 76, countrySupport: ['global'], employees: '1-30', foundedYear: 2010, services: ['Materials', 'Tools', 'Wholesale'], products: [], remoteAvailable: true, liveStatus: 'open', verifiedDocuments: false, languages: ['en', 'es'], paymentMethods: ['card', 'transfer', 'cash'], currencies: ['USD', 'DOP'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Santiago', province: 'Santiago', city: 'Santiago', district: 'Industrial Area', neighborhood: 'Warehouse Zone', timezone: 'America/Santo_Domingo', gps: { lat: 19.45, lng: -70.69 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 4, openingHours: '8:00-18:00', certificates: [], licenses: [], awards: [], reviews: 48, jobs: 2, rating: 4.1, revenue: '$$', galleryCount: 3, videoCount: 0, tour360: false, logo: '/assets/business/supplier-logo.webp', cover: '/assets/business/supplier-cover.webp', preview: '/assets/business/supplier.webp', accent: '#F97316', glow: 'rgba(249,115,22,0.16)', topRecs: ['contractor', 'engineering_firm', 'warehouse'] },
      { id: 'real_estate_developer', label: 'Real Estate Developer', industry: 'construction', categoryPath: ['Construction', 'Real Estate Developer'], verificationLevel: 'premium', companySize: 'medium', trustScore: 90, securityScore: 89, customerSatisfaction: 86, employeeRating: 88, responseTime: '55 min', deliveryTime: 'N/A', businessScore: 89, countrySupport: ['global'], employees: '10-100', foundedYear: 2007, services: ['Development', 'Sales', 'Planning'], products: ['Projects'], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['invoice', 'transfer'], currencies: ['USD', 'EUR'], locationType: 'hybrid', country: 'Dominican Republic', state: 'La Altagracia', province: 'La Altagracia', city: 'Punta Cana', district: 'Real Estate District', neighborhood: 'Bávaro', timezone: 'America/Santo_Domingo', gps: { lat: 18.58, lng: -68.38 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 2, openingHours: '8:00-17:00', certificates: ['AI Trusted'], licenses: ['Development License'], awards: ['Top Developer'], reviews: 264, jobs: 7, rating: 4.6, revenue: '$$$$', galleryCount: 11, videoCount: 2, tour360: true, logo: '/assets/business/developer-logo.webp', cover: '/assets/business/developer-cover.webp', preview: '/assets/business/real-estate-developer.webp', accent: '#22C55E', glow: 'rgba(34,197,94,0.16)', topRecs: ['contractor', 'architecture', 'supplier'] },
    ],
  },
  {
    id: 'transport', label: 'Transport', popular: true, icon: Truck,
    items: [
      { id: 'taxi_company', label: 'Taxi Company', industry: 'transport', categoryPath: ['Transport', 'Taxi Company'], verificationLevel: 'verified', companySize: 'small', trustScore: 85, securityScore: 82, customerSatisfaction: 84, employeeRating: 80, responseTime: '20 min', deliveryTime: 'N/A', businessScore: 84, countrySupport: ['global'], employees: '1-50', foundedYear: 2018, services: ['Ride service', 'Airport transfer'], products: [], remoteAvailable: false, liveStatus: 'open', verifiedDocuments: true, languages: ['en', 'es'], paymentMethods: ['card', 'cash'], currencies: ['USD', 'DOP'], locationType: 'on-site', country: 'Dominican Republic', state: 'La Altagracia', province: 'La Altagracia', city: 'Punta Cana', district: 'Transportation Zone', neighborhood: 'Airport Area', timezone: 'America/Santo_Domingo', gps: { lat: 18.56, lng: -68.35 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 3, openingHours: '24/7', certificates: [], licenses: ['Transport Permit'], awards: [], reviews: 420, jobs: 10, rating: 4.4, revenue: '$$', galleryCount: 5, videoCount: 1, tour360: false, logo: '/assets/business/taxi-logo.webp', cover: '/assets/business/taxi-cover.webp', preview: '/assets/business/taxi-company.webp', accent: '#FACC15', glow: 'rgba(250,204,21,0.16)', topRecs: ['delivery', 'logistics', 'tour_agency'] },
      { id: 'logistics', label: 'Logistics', industry: 'transport', categoryPath: ['Transport', 'Logistics'], verificationLevel: 'premium', companySize: 'medium', trustScore: 89, securityScore: 90, customerSatisfaction: 87, employeeRating: 88, responseTime: '35 min', deliveryTime: '1-2 days', businessScore: 89, countrySupport: ['global'], employees: '10-100', foundedYear: 2009, services: ['Shipping', 'Warehousing', 'Fulfillment'], products: [], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['card', 'invoice', 'transfer'], currencies: ['USD', 'EUR', 'USDT'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Santo Domingo', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Industrial Zone', neighborhood: 'Cargo Area', timezone: 'America/Santo_Domingo', gps: { lat: 18.5, lng: -69.9 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 5, openingHours: '8:00-18:00', certificates: ['ISO Certified'], licenses: [], awards: [], reviews: 210, jobs: 8, rating: 4.5, revenue: '$$$$', galleryCount: 9, videoCount: 2, tour360: false, logo: '/assets/business/logistics-logo.webp', cover: '/assets/business/logistics-cover.webp', preview: '/assets/business/logistics.webp', accent: '#60A5FA', glow: 'rgba(96,165,250,0.16)', topRecs: ['courier', 'warehouse', 'shipping_company'] },
      { id: 'delivery', label: 'Delivery', industry: 'transport', categoryPath: ['Transport', 'Delivery'], verificationLevel: 'verified', companySize: 'small', trustScore: 82, securityScore: 79, customerSatisfaction: 83, employeeRating: 78, responseTime: '12 min', deliveryTime: '30-60 min', businessScore: 82, countrySupport: ['global'], employees: '2-30', foundedYear: 2020, services: ['Courier', 'Last mile', 'Express'], products: [], remoteAvailable: false, liveStatus: 'busy', verifiedDocuments: true, languages: ['en', 'es'], paymentMethods: ['card', 'cash'], currencies: ['USD', 'DOP'], locationType: 'on-site', country: 'Dominican Republic', state: 'Santo Domingo', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Metro', neighborhood: 'Central', timezone: 'America/Santo_Domingo', gps: { lat: 18.48, lng: -69.93 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 2, openingHours: '8:00-20:00', certificates: [], licenses: [], awards: [], reviews: 74, jobs: 5, rating: 4.2, revenue: '$$', galleryCount: 4, videoCount: 1, tour360: false, logo: '/assets/business/delivery-logo.webp', cover: '/assets/business/delivery-cover.webp', preview: '/assets/business/delivery.webp', accent: '#34D399', glow: 'rgba(52,211,153,0.16)', topRecs: ['courier', 'warehouse', 'ecommerce'] },
    ],
  },
  {
    id: 'education', label: 'Education', popular: false, icon: School2,
    items: [
      { id: 'school', label: 'School', industry: 'education', categoryPath: ['Education', 'School'], verificationLevel: 'verified', companySize: 'small', trustScore: 87, securityScore: 85, customerSatisfaction: 86, employeeRating: 84, responseTime: '1 h', deliveryTime: 'N/A', businessScore: 86, countrySupport: ['global'], employees: '10-100', foundedYear: 2000, services: ['Primary', 'Secondary', 'Classes'], products: [], remoteAvailable: true, liveStatus: 'open', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['card', 'transfer', 'invoice'], currencies: ['USD', 'DOP'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Distrito Nacional', province: 'Santo Domingo', city: 'Santo Domingo', district: 'School Zone', neighborhood: 'Residential', timezone: 'America/Santo_Domingo', gps: { lat: 18.46, lng: -69.92 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 2, openingHours: '7:00-15:00', certificates: ['Government Verified'], licenses: ['Education License'], awards: [], reviews: 140, jobs: 12, rating: 4.3, revenue: '$$$', galleryCount: 10, videoCount: 2, tour360: false, logo: '/assets/business/school-logo.webp', cover: '/assets/business/school-cover.webp', preview: '/assets/business/school.webp', accent: '#A78BFA', glow: 'rgba(167,139,250,0.16)', topRecs: ['training_center', 'university'] },
      { id: 'university', label: 'University', industry: 'education', categoryPath: ['Education', 'University'], verificationLevel: 'enterprise', companySize: 'enterprise', trustScore: 96, securityScore: 95, customerSatisfaction: 94, employeeRating: 93, responseTime: '20 min', deliveryTime: 'N/A', businessScore: 95, countrySupport: ['global'], employees: '100+', foundedYear: 1980, services: ['Degrees', 'Research', 'Training'], products: [], remoteAvailable: true, liveStatus: 'open', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['card', 'invoice'], currencies: ['USD', 'EUR'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Santo Domingo', province: 'Santo Domingo', city: 'Santo Domingo', district: 'University Zone', neighborhood: 'Campus Area', timezone: 'America/Santo_Domingo', gps: { lat: 18.47, lng: -69.95 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 4, openingHours: '7:00-22:00', certificates: ['ISO Certified', 'Government Verified'], licenses: [], awards: ['Top University'], reviews: 980, jobs: 36, rating: 4.9, revenue: '$$$$', galleryCount: 40, videoCount: 8, tour360: true, logo: '/assets/business/university-logo.webp', cover: '/assets/business/university-cover.webp', preview: '/assets/business/university.webp', accent: '#60A5FA', glow: 'rgba(96,165,250,0.16)', topRecs: ['research_center', 'laboratory', 'training_center'] },
      { id: 'training_center', label: 'Training Center', industry: 'education', categoryPath: ['Education', 'Training Center'], verificationLevel: 'verified', companySize: 'small', trustScore: 83, securityScore: 82, customerSatisfaction: 85, employeeRating: 80, responseTime: '2 h', deliveryTime: 'N/A', businessScore: 83, countrySupport: ['global'], employees: '2-25', foundedYear: 2017, services: ['Courses', 'Certificates', 'Workshops'], products: [], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: false, languages: ['en', 'es'], paymentMethods: ['card', 'transfer'], currencies: ['USD', 'DOP'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Santiago', province: 'Santiago', city: 'Santiago', district: 'Training District', neighborhood: 'Centro', timezone: 'America/Santo_Domingo', gps: { lat: 19.45, lng: -70.68 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 1, openingHours: '8:00-20:00', certificates: ['AI Trusted'], licenses: [], awards: [], reviews: 64, jobs: 3, rating: 4.1, revenue: '$$', galleryCount: 6, videoCount: 1, tour360: false, logo: '/assets/business/training-logo.webp', cover: '/assets/business/training-cover.webp', preview: '/assets/business/training-center.webp', accent: '#F97316', glow: 'rgba(249,115,22,0.16)', topRecs: ['school', 'university', 'consulting'] },
    ],
  },
  {
    id: 'finance', label: 'Finance', popular: true, icon: Landmark,
    items: [
      { id: 'bank', label: 'Bank / Finans', industry: 'finance', categoryPath: ['Finance', 'Bank'], verificationLevel: 'enterprise', companySize: 'enterprise', trustScore: 98, securityScore: 97, customerSatisfaction: 93, employeeRating: 95, responseTime: '5 min', deliveryTime: 'N/A', businessScore: 97, countrySupport: ['global'], employees: '100+', foundedYear: 1991, services: ['Accounts', 'Loans', 'Investments'], products: ['Cards', 'Loans'], remoteAvailable: true, liveStatus: 'online', verifiedDocuments: true, languages: ['en', 'es', 'fr'], paymentMethods: ['card', 'transfer', 'invoice'], currencies: ['USD', 'EUR', 'CAD', 'GBP'], locationType: 'hybrid', country: 'Dominican Republic', state: 'Distrito Nacional', province: 'Santo Domingo', city: 'Santo Domingo', district: 'Financial District', neighborhood: 'Naco', timezone: 'America/Santo_Domingo', gps: { lat: 18.49, lng: -69.93 }, website: '', phone: '', whatsapp: '', email: '', socialMedia: {}, branches: 12, openingHours: '8:00-17:00', certificates: ['Government Verified', 'ISO Certified'], licenses: ['Bank License'], awards: ['Trusted Bank'], reviews: 2400, jobs: 120, rating: 4.9, revenue: '$$$$', galleryCount: 16, videoCount: 3, tour360: true, logo: '/assets/business/bank-logo.webp', cover: '/assets/business/bank-cover.webp', preview: '/assets/business/bank.webp', accent: '#60A5FA', glow: 'rgba(96,165,250,0.16)', topRecs: ['insurance', 'fintech', 'consulting'] },
    ],
  },
];

function flattenBusinesses(): FlatBusiness[] {
  return CATEGORIES.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      categoryId:    group.id,
      categoryLabel: group.label,
      categoryIcon:  group.icon,
      icon:          group.icon,
      searchable: [
        item.label, item.id, item.industry, item.companySize, item.verificationLevel,
        group.label,
        ...(item.services ?? []),
        ...(item.products ?? []),
        ...(item.languages ?? []),
        ...(item.topRecs ?? []),
        ...(item.categoryPath ?? []),
      ].join(' ').toLowerCase(),
    }))
  );
}

function Header() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,.42)] backdrop-blur-[28px]">
      <div className="absolute inset-0">
        <motion.div className="absolute inset-0"
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle at top, #1e293b, transparent 40%)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,.10),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(96,165,250,.10),transparent_22%)]" />
      </div>
      <div className="relative px-5 py-6 text-center md:px-8 md:py-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-white/45">AI BUSINESS SETUP WIZARD</p>
        <h1 className="mt-2 text-[24px] font-black tracking-tight text-white md:text-[30px]">Detect and build your business profile</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/72 md:text-[15px]">AI can detect your business type, then help you build a complete global profile.</p>
      </div>
    </section>
  );
}

function AIRecommendations({ onPick }: { onPick: (picks: string[]) => void }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
        <Sparkles size={14} />AI smart detection
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {AI_SUGGESTIONS.map((item) => (
          <button key={item.id} type="button" onClick={() => onPick(item.picks)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/5">
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="mt-1 text-xs text-white/50">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchBar({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"><Search size={16} /></span>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search business type..."
        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-xl transition focus:border-white/20 focus:ring-2 focus:ring-white/10" />
      {query && (
        <button type="button" onClick={() => setQuery('')} aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/45 transition hover:bg-white/5 hover:text-white/80">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

interface MetricPillProps { icon: LucideIcon; label: string; value: number | string; accent: string; }
function MetricPill({ icon: Icon, label, value, accent }: MetricPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75">
      <Icon size={12} style={{ color: accent }} />{label}: {value}
    </span>
  );
}

interface BusinessCardProps {
  biz: FlatBusiness;
  hovered: string | null;
  onHover: (id: string) => void;
  onLeave: () => void;
  onSelect: (biz: FlatBusiness) => void;
}

function BusinessCard({ biz, hovered, onHover, onLeave, onSelect }: BusinessCardProps) {
  const Icon = biz.icon;
  const isHovered = hovered === biz.id;
  return (
    <motion.button type="button" aria-label={`Select ${biz.label}`} onClick={() => onSelect(biz)}
      onMouseEnter={() => onHover(biz.id)} onMouseLeave={onLeave}
      onTouchStart={() => onHover(biz.id)} onTouchEnd={onLeave}
      whileHover={{ y: -8, scale: 1.025, rotateX: 2 }} whileTap={{ scale: 0.98 }}
      className="group relative w-full overflow-hidden rounded-[28px] border text-left outline-none"
      style={{
        borderColor: isHovered ? `${biz.accent}66` : BORDER,
        background:  isHovered ? `${biz.accent}0A` : CARD,
        boxShadow:   isHovered ? '0 0 0 3px rgba(255,255,255,0.04), 0 22px 70px rgba(0,0,0,.35)' : '0 18px 52px rgba(0,0,0,.22)',
        transformStyle: 'preserve-3d',
      }}>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 30% 20%, ${biz.glow}, transparent 38%)` }} />
      <div className="grid gap-4 p-4 md:grid-cols-[190px_1fr_auto] md:items-center md:p-5">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
          <img src={biz.cover || biz.preview} alt={biz.label}
            className="h-[150px] w-full object-cover md:h-[180px]" loading="lazy" decoding="async"
            onError={(e) => { if ((e.currentTarget as HTMLImageElement).src !== FALLBACK_IMAGE) (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }} />
          {biz.logo ? (
            <div className="absolute left-3 top-3 h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-1.5">
              <img src={biz.logo} alt={`${biz.label} logo`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.32))]" />
        </div>
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold tracking-[0.24em] text-white/70">
            <Icon size={12} style={{ color: biz.accent }} />
            {biz.categoryPath?.join(' • ') || biz.categoryLabel}
          </div>
          <p className="text-[20px] font-black tracking-tight text-white md:text-[24px]" style={{ color: isHovered ? biz.accent : '#F8FAFC' }}>{biz.label}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <MetricPill icon={ShieldCheck} label="Trust" value={biz.trustScore} accent={biz.accent} />
            <MetricPill icon={Gauge} label="Security" value={biz.securityScore} accent={biz.accent} />
            <MetricPill icon={Star} label="Score" value={biz.businessScore} accent={biz.accent} />
            <MetricPill icon={Users} label="Size" value={biz.companySize} accent={biz.accent} />
            <MetricPill icon={Globe} label="Countries" value={biz.countrySupport.length} accent={biz.accent} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75">
              <ShieldCheck size={12} style={{ color: biz.accent }} />
              {VERIFICATION_LEVELS[biz.verificationLevel] ?? biz.verificationLevel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75">
              <Star size={12} style={{ color: biz.accent }} />★ {biz.rating}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75">
              <Clock3 size={12} style={{ color: biz.accent }} />{biz.liveStatus}
            </span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Live availability</p>
              <p className="mt-1 text-sm font-semibold text-white">{biz.liveStatus}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Translation-ready</p>
              <p className="mt-1 text-sm font-semibold text-white">{TRANSLATIONS.slice(0, 4).join(', ')} + more</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end md:self-stretch">
          <motion.div animate={isHovered ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 0.72 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5"
            style={{ color: isHovered ? biz.accent : '#94A3B8' }}>
            <ChevronRight size={18} />
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
}

function PopularStrip({ businesses }: { businesses: FlatBusiness[] }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">Most popular right now</p>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {businesses.slice(0, 4).map((biz) => {
          const Icon = biz.icon;
          return (
            <div key={biz.id} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                <Icon size={18} />
              </div>
              <p className="mt-2 text-xs font-semibold text-white/75">{biz.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryPanel({ biz }: { biz?: FlatBusiness }) {
  if (!biz) return null;
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
        <BriefcaseBusiness size={14} />Virtual business profile
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <Info label="Website" value={biz.website || '—'} icon={Link2} />
        <Info label="Phone" value={biz.phone || '—'} icon={Phone} />
        <Info label="WhatsApp" value={biz.whatsapp || '—'} icon={MessageCircle} />
        <Info label="Email" value={biz.email || '—'} icon={Mail} />
        <Info label="City" value={biz.city} icon={MapPin} />
        <Info label="Timezone" value={biz.timezone} icon={Globe} />
        <Info label="Employees" value={biz.employees} icon={Users} />
        <Info label="Branches" value={biz.branches} icon={Building2} />
        <Info label="Opening Hours" value={biz.openingHours} icon={Clock3} />
        <Info label="Currencies" value={biz.currencies.join(', ')} icon={DollarSign} />
        <Info label="Languages" value={biz.languages.join(', ')} icon={Languages} />
        <Info label="Reviews" value={biz.reviews} icon={Star} />
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
        <Icon size={12} />{label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white/90">{String(value)}</p>
    </div>
  );
}

interface Step1bBusinessTypeProps { onSelect?: (biz: FlatBusiness) => void; }

export default function Step1b_BusinessType({ onSelect }: Step1bBusinessTypeProps) {
  const [hovered,     setHovered]     = useState<string | null>(null);
  const [query,       setQuery]       = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBiz,  setSelectedBiz]  = useState<FlatBusiness | null>(null);

  const allBusinesses = useMemo(() => flattenBusinesses(), []);
  const filtered      = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBusinesses;
    return allBusinesses.filter((biz) => biz.searchable.includes(q));
  }, [allBusinesses, query]);

  const popular = useMemo(() =>
    allBusinesses.filter((b) => ['hotel', 'restaurant', 'contractor', 'taxi_company'].includes(b.id)),
    [allBusinesses]
  );

  const handlePick    = (picks: string[]) => setSelectedTags(picks);
  const handleSelect  = (biz: FlatBusiness) => { setSelectedBiz(biz); onSelect?.(biz); };

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] px-4 py-6 md:px-6 md:py-8" style={{ background: BG, color: '#fff' }}>
      <motion.div className="pointer-events-none absolute inset-0"
        animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle at top, #1e293b, transparent 42%)' }} />
      <div className="relative mx-auto w-full max-w-6xl space-y-5">
        <Header />
        <AIRecommendations onPick={handlePick} />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
            <SearchBar query={query} setQuery={setQuery} />

            {selectedTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-medium text-white/80">
                    <Star size={12} className="text-yellow-300" />{tag}
                  </span>
                ))}
              </div>
            )}

            {!query.trim() && (
              <div className="mt-5 space-y-5">
                <PopularStrip businesses={popular} />
                {CATEGORIES.map((group) => (
                  <section key={group.id}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">{group.label}</p>
                      {group.popular && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200">Trending</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {group.items.map((item, index) => {
                        const flatBiz: FlatBusiness = { ...item, categoryId: group.id, categoryLabel: group.label, categoryIcon: group.icon, icon: group.icon, searchable: '' };
                        return (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.03, ease: 'easeOut' }}>
                            <BusinessCard biz={flatBiz} hovered={hovered} onHover={setHovered} onLeave={() => setHovered(null)} onSelect={handleSelect} />
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {query.trim() && (
              <div className="mt-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">Search results</p>
                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-white/50">No results found.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filtered.map((biz, index) => (
                      <motion.div key={biz.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.02, ease: 'easeOut' }}>
                        <BusinessCard biz={biz} hovered={hovered} onHover={setHovered} onLeave={() => setHovered(null)} onSelect={handleSelect} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <SummaryPanel biz={selectedBiz ?? allBusinesses[0]} />
        </div>
      </div>
    </div>
  );
}