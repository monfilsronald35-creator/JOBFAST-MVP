-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAZ 25 — Travel Platform (migration 021)
-- Prefix: trv_
-- Run manually in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Hotels ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_hotels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  country       TEXT NOT NULL DEFAULT 'HT',
  city          TEXT NOT NULL,
  address       TEXT NOT NULL,
  lat           NUMERIC(10,7),
  lng           NUMERIC(10,7),
  stars         INT NOT NULL DEFAULT 3 CHECK (stars BETWEEN 1 AND 5),
  amenities     JSONB NOT NULL DEFAULT '[]',
  images        JSONB NOT NULL DEFAULT '[]',
  check_in_time TEXT NOT NULL DEFAULT '14:00',
  check_out_time TEXT NOT NULL DEFAULT '12:00',
  currency      TEXT NOT NULL DEFAULT 'HTG',
  rating        NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count  INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trv_hotel_rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES trv_hotels(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'double',
  capacity        INT NOT NULL DEFAULT 2,
  price_per_night BIGINT NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'HTG',
  amenities       JSONB NOT NULL DEFAULT '[]',
  images          JSONB NOT NULL DEFAULT '[]',
  is_available    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Flights ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_flights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline          TEXT NOT NULL,
  flight_number    TEXT NOT NULL,
  origin           TEXT NOT NULL,
  destination      TEXT NOT NULL,
  departure_at     TIMESTAMPTZ NOT NULL,
  arrival_at       TIMESTAMPTZ NOT NULL,
  duration         INT NOT NULL DEFAULT 0,
  travel_class     TEXT NOT NULL DEFAULT 'economy',
  price            BIGINT NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'USD',
  seats_available  INT NOT NULL DEFAULT 0,
  baggage          TEXT NOT NULL DEFAULT '23kg',
  stops            INT NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Bus Companies & Routes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_bus_companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL,
  name       TEXT NOT NULL,
  country    TEXT NOT NULL DEFAULT 'HT',
  currency   TEXT NOT NULL DEFAULT 'HTG',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trv_bus_routes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES trv_bus_companies(id) ON DELETE CASCADE,
  origin       TEXT NOT NULL,
  destination  TEXT NOT NULL,
  departure_at TIMESTAMPTZ NOT NULL,
  arrival_at   TIMESTAMPTZ NOT NULL,
  price        BIGINT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'HTG',
  total_seats  INT NOT NULL DEFAULT 40,
  seats_left   INT NOT NULL DEFAULT 40,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Taxi ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_taxi_drivers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  vehicle     TEXT NOT NULL,
  plate       TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'HT',
  city        TEXT NOT NULL,
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  status      TEXT NOT NULL DEFAULT 'offline',
  rating      NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  rides       INT NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'HTG',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trv_taxi_rides (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id         UUID REFERENCES trv_taxi_drivers(id),
  passenger_id      UUID NOT NULL,
  origin            TEXT NOT NULL,
  destination       TEXT NOT NULL,
  origin_lat        NUMERIC(10,7) NOT NULL,
  origin_lng        NUMERIC(10,7) NOT NULL,
  dest_lat          NUMERIC(10,7) NOT NULL,
  dest_lng          NUMERIC(10,7) NOT NULL,
  fare_estimate     BIGINT NOT NULL DEFAULT 0,
  fare_actual       BIGINT,
  currency          TEXT NOT NULL DEFAULT 'HTG',
  status            TEXT NOT NULL DEFAULT 'searching',
  driver_rating     NUMERIC(2,1),
  passenger_rating  NUMERIC(2,1),
  distance_km       NUMERIC(8,2),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tour Guides ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_tour_guides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  name         TEXT NOT NULL,
  bio          TEXT NOT NULL DEFAULT '',
  country      TEXT NOT NULL DEFAULT 'HT',
  city         TEXT NOT NULL,
  languages    JSONB NOT NULL DEFAULT '[]',
  specialties  JSONB NOT NULL DEFAULT '[]',
  price_per_day BIGINT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'HTG',
  rating       NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 0,
  images       JSONB NOT NULL DEFAULT '[]',
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Vacation Rentals ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_rentals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'apartment',
  description     TEXT NOT NULL DEFAULT '',
  country         TEXT NOT NULL DEFAULT 'HT',
  city            TEXT NOT NULL,
  address         TEXT NOT NULL,
  lat             NUMERIC(10,7),
  lng             NUMERIC(10,7),
  capacity        INT NOT NULL DEFAULT 2,
  bedrooms        INT NOT NULL DEFAULT 1,
  bathrooms       INT NOT NULL DEFAULT 1,
  price_per_night BIGINT NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'HTG',
  amenities       JSONB NOT NULL DEFAULT '[]',
  images          JSONB NOT NULL DEFAULT '[]',
  min_stay        INT NOT NULL DEFAULT 1,
  max_stay        INT NOT NULL DEFAULT 30,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Events ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'concert',
  description  TEXT NOT NULL DEFAULT '',
  country      TEXT NOT NULL DEFAULT 'HT',
  city         TEXT NOT NULL,
  venue        TEXT NOT NULL,
  lat          NUMERIC(10,7),
  lng          NUMERIC(10,7),
  start_at     TIMESTAMPTZ NOT NULL,
  end_at       TIMESTAMPTZ NOT NULL,
  price        BIGINT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'HTG',
  capacity     INT NOT NULL DEFAULT 100,
  tickets_sold INT NOT NULL DEFAULT 0,
  images       JSONB NOT NULL DEFAULT '[]',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Travel Insurance ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_insurance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  type          TEXT NOT NULL,
  coverage      BIGINT NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'USD',
  premium       BIGINT NOT NULL DEFAULT 0,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  destination   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  claim_details TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Universal Bookings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  category     TEXT NOT NULL,
  ref_id       UUID NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  total_amount BIGINT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'HTG',
  qr_code      TEXT NOT NULL,
  notes        TEXT,
  checkin_at   TIMESTAMPTZ,
  checkout_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trv_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  category   TEXT NOT NULL,
  ref_id     UUID NOT NULL,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trv_hotels_city     ON trv_hotels(city, country);
CREATE INDEX IF NOT EXISTS idx_trv_rooms_hotel     ON trv_hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_trv_flights_route   ON trv_flights(origin, destination);
CREATE INDEX IF NOT EXISTS idx_trv_bus_routes_co   ON trv_bus_routes(company_id);
CREATE INDEX IF NOT EXISTS idx_trv_rides_passenger ON trv_taxi_rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_trv_rides_driver    ON trv_taxi_rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_trv_bookings_user   ON trv_bookings(user_id, category);
CREATE INDEX IF NOT EXISTS idx_trv_reviews_ref     ON trv_reviews(ref_id, category);
CREATE INDEX IF NOT EXISTS idx_trv_rentals_city    ON trv_rentals(city, country);
CREATE INDEX IF NOT EXISTS idx_trv_events_city     ON trv_events(city, country, start_at);