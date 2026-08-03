-- =============================================================
-- FAZ 21 — Global Localization & Country Intelligence Platform
-- Migration: 034_localization_platform.sql
-- Run manually in Supabase SQL Editor
-- =============================================================

-- Master country configuration
CREATE TABLE IF NOT EXISTS loc_countries (
  code              text        PRIMARY KEY,  -- ISO 3166-1 alpha-2
  name              text        NOT NULL,
  native_name       text        NOT NULL,
  flag              text        NOT NULL,     -- emoji
  currency          text        NOT NULL,
  languages         text[]      NOT NULL DEFAULT '{}',
  primary_language  text        NOT NULL,
  time_zone         text        NOT NULL,
  calling_code      text        NOT NULL,
  emergency_numbers jsonb       NOT NULL DEFAULT '{}',
  banks             text[]      DEFAULT '{}',
  wallets           text[]      DEFAULT '{}',
  telecom_providers text[]      DEFAULT '{}',
  payment_methods   text[]      DEFAULT '{}',
  tax_rate          numeric(5,2) DEFAULT 0,
  vat_rate          numeric(5,2) DEFAULT 0,
  date_format       text        DEFAULT 'DD/MM/YYYY',
  time_format       text        DEFAULT '24h',
  number_format     jsonb       NOT NULL DEFAULT '{"decimalSeparator":".",
                                "thousandSeparator":",","currencyPosition":"before"}',
  address_format    text[]      DEFAULT '{}',
  min_age           int         DEFAULT 18,
  government_apis   boolean     DEFAULT false,
  legal_notes       text,
  active            boolean     DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Per-country feature activation (overrides global feature flags)
CREATE TABLE IF NOT EXISTS loc_country_features (
  country     text        PRIMARY KEY REFERENCES loc_countries(code) ON DELETE CASCADE,
  wallet      boolean     DEFAULT false,
  telecom     boolean     DEFAULT false,
  travel      boolean     DEFAULT false,
  marketplace boolean     DEFAULT false,
  healthcare  boolean     DEFAULT false,
  government  boolean     DEFAULT false,
  ai          boolean     DEFAULT true,
  enterprise  boolean     DEFAULT false,
  maps        boolean     DEFAULT true,
  updated_at  timestamptz DEFAULT now()
);

-- Persisted country context per user
CREATE TABLE IF NOT EXISTS loc_user_context (
  user_id        uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  country        text        NOT NULL REFERENCES loc_countries(code),
  region         text,
  state          text,
  city           text,
  time_zone      text,
  language       text        NOT NULL,
  preferred_lang text,
  detected_from  text        NOT NULL DEFAULT 'default',
  confirmed_at   timestamptz,
  updated_at     timestamptz DEFAULT now()
);

-- Cross-border detection log
CREATE TABLE IF NOT EXISTS loc_cross_border_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_country text        NOT NULL,
  to_country   text        NOT NULL,
  detected_at  timestamptz NOT NULL DEFAULT now(),
  confirmed    boolean     DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_loc_user_context_country ON loc_user_context(country);
CREATE INDEX IF NOT EXISTS idx_loc_cross_border_user    ON loc_cross_border_events(user_id, detected_at);

-- =============================================================
-- SEED: Country Configurations
-- =============================================================

INSERT INTO loc_countries (code, name, native_name, flag, currency, languages, primary_language,
  time_zone, calling_code, emergency_numbers, banks, wallets, telecom_providers, payment_methods,
  tax_rate, vat_rate, date_format, time_format, number_format, address_format, min_age, government_apis)
VALUES
-- Haiti
('HT','Haiti','Ayiti','🇭🇹','HTG',ARRAY['ht','fr'],'ht',
 'America/Port-au-Prince','+509',
 '{"police":"114","fire":"115","ambulance":"116","general":"114"}',
 ARRAY['BNC','Sogebank','Unibank','BPH','Sogebel'],
 ARRAY['MonCash','NatCash','Lajan Rapid','Flash'],
 ARRAY['Digicel','Natcom'],
 ARRAY['moncash','natcash','cash','bank_transfer'],
 0,10,'DD/MM/YYYY','24h',
 '{"decimalSeparator":".","thousandSeparator":",","currencyPosition":"before"}',
 ARRAY['street','city','department','country'],18,true),

-- Dominican Republic
('DO','Dominican Republic','República Dominicana','🇩🇴','DOP',ARRAY['es'],'es',
 'America/Santo_Domingo','+1-809',
 '{"police":"911","fire":"911","ambulance":"911","general":"911"}',
 ARRAY['Banco Popular','Banreservas','BancoSantaDomingo','BHD León'],
 ARRAY['Tpago','TuenvioMoney'],
 ARRAY['Claro','Altice','Viva'],
 ARRAY['card','bank_transfer','tpago','cash'],
 25,18,'DD/MM/YYYY','12h',
 '{"decimalSeparator":".","thousandSeparator":",","currencyPosition":"before"}',
 ARRAY['street','sector','city','province','country'],18,false),

-- United States
('US','United States','United States','🇺🇸','USD',ARRAY['en','es'],'en',
 'America/New_York','+1',
 '{"police":"911","fire":"911","ambulance":"911","general":"911"}',
 ARRAY['Chase','Bank of America','Wells Fargo','Citibank','Capital One'],
 ARRAY['PayPal','Venmo','CashApp','Zelle'],
 ARRAY['AT&T','Verizon','T-Mobile'],
 ARRAY['card','apple_pay','google_pay','paypal','bank_transfer'],
 0,0,'MM/DD/YYYY','12h',
 '{"decimalSeparator":".","thousandSeparator":",","currencyPosition":"before"}',
 ARRAY['street','city','state','zip','country'],18,false),

-- France
('FR','France','France','🇫🇷','EUR',ARRAY['fr'],'fr',
 'Europe/Paris','+33',
 '{"police":"17","fire":"18","ambulance":"15","general":"112"}',
 ARRAY['BNP Paribas','Crédit Agricole','Société Générale','La Banque Postale'],
 ARRAY['Lydia','PayLib'],
 ARRAY['Orange','SFR','Bouygues'],
 ARRAY['card','bank_transfer','paypal'],
 0,20,'DD/MM/YYYY','24h',
 '{"decimalSeparator":",","thousandSeparator":" ","currencyPosition":"after"}',
 ARRAY['street','city','postal_code','country'],18,false),

-- Canada
('CA','Canada','Canada','🇨🇦','CAD',ARRAY['en','fr'],'en',
 'America/Toronto','+1',
 '{"police":"911","fire":"911","ambulance":"911","general":"911"}',
 ARRAY['RBC','TD Bank','BMO','Scotiabank','CIBC'],
 ARRAY['Interac'],
 ARRAY['Bell','Rogers','Telus'],
 ARRAY['card','interac','apple_pay','google_pay'],
 0,5,'DD/MM/YYYY','12h',
 '{"decimalSeparator":".","thousandSeparator":",","currencyPosition":"before"}',
 ARRAY['street','city','province','postal_code','country'],18,false),

-- Brazil
('BR','Brazil','Brasil','🇧🇷','BRL',ARRAY['pt'],'pt',
 'America/Sao_Paulo','+55',
 '{"police":"190","fire":"193","ambulance":"192","general":"190"}',
 ARRAY['Itaú','Bradesco','Caixa','Banco do Brasil','Santander'],
 ARRAY['PIX','PicPay','Mercado Pago'],
 ARRAY['Vivo','Claro','TIM','Oi'],
 ARRAY['card','pix','boleto','bank_transfer'],
 0,12,'DD/MM/YYYY','24h',
 '{"decimalSeparator":",","thousandSeparator":".","currencyPosition":"before"}',
 ARRAY['street','district','city','state','cep','country'],18,false),

-- Germany
('DE','Germany','Deutschland','🇩🇪','EUR',ARRAY['de'],'de',
 'Europe/Berlin','+49',
 '{"police":"110","fire":"112","ambulance":"112","general":"112"}',
 ARRAY['Deutsche Bank','Commerzbank','Sparkasse','DKB'],
 ARRAY['N26','PayPal'],
 ARRAY['Deutsche Telekom','Vodafone','o2'],
 ARRAY['card','bank_transfer','paypal','sepa'],
 0,19,'DD.MM.YYYY','24h',
 '{"decimalSeparator":",","thousandSeparator":".","currencyPosition":"after"}',
 ARRAY['street','postal_code','city','country'],18,false),

-- United Arab Emirates
('AE','United Arab Emirates','الإمارات العربية المتحدة','🇦🇪','AED',ARRAY['ar','en'],'ar',
 'Asia/Dubai','+971',
 '{"police":"999","fire":"997","ambulance":"998","general":"999"}',
 ARRAY['Emirates NBD','Abu Dhabi Commercial Bank','Dubai Islamic Bank'],
 ARRAY['Apple Pay','Google Pay'],
 ARRAY['Etisalat','du'],
 ARRAY['card','apple_pay','bank_transfer'],
 5,5,'DD/MM/YYYY','12h',
 '{"decimalSeparator":".","thousandSeparator":",","currencyPosition":"after"}',
 ARRAY['flat','building','street','area','emirate','country'],21,false),

-- Mexico
('MX','Mexico','México','🇲🇽','MXN',ARRAY['es'],'es',
 'America/Mexico_City','+52',
 '{"police":"911","fire":"911","ambulance":"911","general":"911"}',
 ARRAY['BBVA','Banorte','Santander','HSBC','Banamex'],
 ARRAY['SPEI','Mercado Pago','PayPal'],
 ARRAY['Telcel','Movistar','AT&T México'],
 ARRAY['card','spei','oxxo','paypal'],
 0,16,'DD/MM/YYYY','12h',
 '{"decimalSeparator":".","thousandSeparator":",","currencyPosition":"before"}',
 ARRAY['street','colonia','city','state','cp','country'],18,false),

-- Colombia
('CO','Colombia','Colombia','🇨🇴','COP',ARRAY['es'],'es',
 'America/Bogota','+57',
 '{"police":"112","fire":"119","ambulance":"125","general":"123"}',
 ARRAY['Bancolombia','Davivienda','BBVA','Banco de Bogotá'],
 ARRAY['Nequi','Daviplata','PSE'],
 ARRAY['Claro','Movistar','Tigo'],
 ARRAY['card','nequi','pse','bank_transfer'],
 0,19,'DD/MM/YYYY','12h',
 '{"decimalSeparator":",","thousandSeparator":".","currencyPosition":"before"}',
 ARRAY['street','barrio','city','department','country'],18,false),

-- United Kingdom
('GB','United Kingdom','United Kingdom','🇬🇧','GBP',ARRAY['en'],'en',
 'Europe/London','+44',
 '{"police":"999","fire":"999","ambulance":"999","general":"999"}',
 ARRAY['Barclays','HSBC','Lloyds','NatWest','Santander UK'],
 ARRAY['PayPal','Revolut','Monzo'],
 ARRAY['EE','O2','Vodafone UK','Three'],
 ARRAY['card','bank_transfer','paypal','open_banking'],
 0,20,'DD/MM/YYYY','24h',
 '{"decimalSeparator":".","thousandSeparator":",","currencyPosition":"before"}',
 ARRAY['house','street','city','postcode','country'],18,false)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- SEED: Country Features
-- =============================================================

INSERT INTO loc_country_features (country, wallet, telecom, travel, marketplace, healthcare, government, ai, enterprise, maps)
VALUES
('HT', true,  true,  true,  true,  true,  true,  true, false, true),
('DO', true,  true,  true,  true,  false, false, true, false, true),
('US', true,  false, true,  true,  true,  false, true, true,  true),
('FR', true,  false, true,  true,  true,  false, true, true,  true),
('CA', true,  false, true,  true,  true,  false, true, true,  true),
('BR', true,  true,  true,  true,  false, false, true, false, true),
('DE', true,  false, true,  true,  true,  false, true, true,  true),
('AE', true,  false, true,  true,  false, false, true, true,  true),
('MX', true,  true,  true,  true,  false, false, true, false, true),
('CO', true,  true,  true,  true,  false, false, true, false, true),
('GB', true,  false, true,  true,  true,  false, true, true,  true)
ON CONFLICT (country) DO NOTHING;

COMMENT ON TABLE loc_countries          IS 'FAZ 21: Master country configuration for Global Localization Platform';
COMMENT ON TABLE loc_country_features   IS 'FAZ 21: Per-country feature activation flags';
COMMENT ON TABLE loc_user_context       IS 'FAZ 21: Persisted country context per user';
COMMENT ON TABLE loc_cross_border_events IS 'FAZ 21: Cross-border detection log';