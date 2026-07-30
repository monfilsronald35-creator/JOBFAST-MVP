-- JOBFAST FAZ 16: Global Commerce Engine
-- Run manually in Supabase SQL Editor

-- ─── Stores ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_stores (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        NOT NULL,
  name         TEXT        NOT NULL,
  slug         TEXT        NOT NULL UNIQUE,
  description  TEXT,
  logo_url     TEXT,
  banner_url   TEXT,
  type         TEXT        NOT NULL DEFAULT 'individual',
  status       TEXT        NOT NULL DEFAULT 'active',
  country      TEXT,
  city         TEXT,
  address      TEXT,
  lat          NUMERIC(10,7),
  lng          NUMERIC(10,7),
  rating       NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INT          NOT NULL DEFAULT 0,
  verified     BOOLEAN      NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_stores_owner   ON mp_stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_mp_stores_country ON mp_stores(country);

-- ─── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_products (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID        REFERENCES mp_stores(id) ON DELETE SET NULL,
  seller_id           UUID        NOT NULL,
  title               TEXT        NOT NULL,
  description         TEXT        NOT NULL,
  type                TEXT        NOT NULL DEFAULT 'physical',
  status              TEXT        NOT NULL DEFAULT 'draft',
  category            TEXT        NOT NULL,
  subcategory         TEXT,
  tags                TEXT[]      NOT NULL DEFAULT '{}',
  country             TEXT,
  city                TEXT,
  lat                 NUMERIC(10,7),
  lng                 NUMERIC(10,7),
  radius_km           INT,
  currency            TEXT        NOT NULL DEFAULT 'HTG',
  base_price          BIGINT      NOT NULL DEFAULT 0,
  is_price_negotiable BOOLEAN     NOT NULL DEFAULT false,
  languages           TEXT[]      NOT NULL DEFAULT '{}',
  is_international    BOOLEAN     NOT NULL DEFAULT false,
  is_featured         BOOLEAN     NOT NULL DEFAULT false,
  is_sponsored        BOOLEAN     NOT NULL DEFAULT false,
  views_count         INT         NOT NULL DEFAULT 0,
  orders_count        INT         NOT NULL DEFAULT 0,
  rating              NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count        INT          NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_products_seller   ON mp_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_mp_products_store    ON mp_products(store_id);
CREATE INDEX IF NOT EXISTS idx_mp_products_status   ON mp_products(status);
CREATE INDEX IF NOT EXISTS idx_mp_products_type     ON mp_products(type);
CREATE INDEX IF NOT EXISTS idx_mp_products_category ON mp_products(category);
CREATE INDEX IF NOT EXISTS idx_mp_products_country  ON mp_products(country);
CREATE INDEX IF NOT EXISTS idx_mp_products_tags     ON mp_products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_mp_products_price    ON mp_products(base_price);

-- ─── Product Variants ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_product_variants (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID        NOT NULL REFERENCES mp_products(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  attributes     JSONB       NOT NULL DEFAULT '{}',
  price_modifier BIGINT      NOT NULL DEFAULT 0,
  sku            TEXT,
  stock_qty      INT         NOT NULL DEFAULT 0,
  is_available   BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_variants_product ON mp_product_variants(product_id);

-- ─── Product Media ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_product_media (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID        NOT NULL REFERENCES mp_products(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL DEFAULT 'image',
  url           TEXT        NOT NULL,
  thumbnail_url TEXT,
  caption       TEXT,
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_media_product ON mp_product_media(product_id);

-- ─── Warehouses ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_warehouses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID        NOT NULL,
  name       TEXT        NOT NULL,
  country    TEXT        NOT NULL,
  city       TEXT        NOT NULL,
  address    TEXT,
  lat        NUMERIC(10,7),
  lng        NUMERIC(10,7),
  capacity   INT,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_warehouses_owner ON mp_warehouses(owner_id);

-- ─── Inventory ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_inventory (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID        NOT NULL REFERENCES mp_products(id) ON DELETE CASCADE,
  variant_id      UUID        REFERENCES mp_product_variants(id) ON DELETE CASCADE,
  warehouse_id    UUID        REFERENCES mp_warehouses(id) ON DELETE SET NULL,
  qty_available   INT         NOT NULL DEFAULT 0,
  qty_reserved    INT         NOT NULL DEFAULT 0,
  qty_sold        INT         NOT NULL DEFAULT 0,
  serial_numbers  TEXT[]      NOT NULL DEFAULT '{}',
  barcode         TEXT,
  qr_code         TEXT,
  expiration_date DATE,
  batch_number    TEXT,
  supplier_id     UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, variant_id, warehouse_id)
);
CREATE INDEX IF NOT EXISTS idx_mp_inventory_product ON mp_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_mp_inventory_variant ON mp_inventory(variant_id);

-- ─── Coupons ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_coupons (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        UUID,
  code             TEXT        NOT NULL UNIQUE,
  type             TEXT        NOT NULL DEFAULT 'percent_off',
  value            BIGINT      NOT NULL DEFAULT 0,
  currency         TEXT,
  min_order_amount BIGINT,
  max_discount     BIGINT,
  usage_limit      INT,
  used_count       INT         NOT NULL DEFAULT 0,
  product_ids      UUID[]      NOT NULL DEFAULT '{}',
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until      TIMESTAMPTZ,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_coupons_code   ON mp_coupons(code);
CREATE INDEX IF NOT EXISTS idx_mp_coupons_seller ON mp_coupons(seller_id);

-- ─── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID        NOT NULL,
  store_id         UUID        REFERENCES mp_stores(id) ON DELETE SET NULL,
  seller_id        UUID        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending_payment',
  type             TEXT        NOT NULL DEFAULT 'purchase',
  total_amount     BIGINT      NOT NULL DEFAULT 0,
  subtotal_amount  BIGINT      NOT NULL DEFAULT 0,
  shipping_amount  BIGINT      NOT NULL DEFAULT 0,
  discount_amount  BIGINT      NOT NULL DEFAULT 0,
  tax_amount       BIGINT      NOT NULL DEFAULT 0,
  currency         TEXT        NOT NULL DEFAULT 'HTG',
  coupon_id        UUID        REFERENCES mp_coupons(id) ON DELETE SET NULL,
  coupon_code      TEXT,
  escrow_id        UUID,
  payment_ref      TEXT,
  shipping_address JSONB,
  billing_address  JSONB,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mp_orders_buyer  ON mp_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_seller ON mp_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_status ON mp_orders(status);
CREATE INDEX IF NOT EXISTS idx_mp_orders_store  ON mp_orders(store_id);

-- ─── Order Items ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_order_items (
  id               UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID   NOT NULL REFERENCES mp_orders(id) ON DELETE CASCADE,
  product_id       UUID   NOT NULL REFERENCES mp_products(id) ON DELETE RESTRICT,
  variant_id       UUID   REFERENCES mp_product_variants(id) ON DELETE SET NULL,
  quantity         INT    NOT NULL DEFAULT 1,
  unit_price       BIGINT NOT NULL,
  total_price      BIGINT NOT NULL,
  currency         TEXT   NOT NULL DEFAULT 'HTG',
  title_snapshot   TEXT   NOT NULL,
  variant_snapshot JSONB
);
CREATE INDEX IF NOT EXISTS idx_mp_items_order   ON mp_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_items_product ON mp_order_items(product_id);

-- ─── Order Tracking ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_order_tracking (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID        NOT NULL REFERENCES mp_orders(id) ON DELETE CASCADE,
  carrier           TEXT        NOT NULL,
  tracking_number   TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'in_transit',
  estimated_delivery TIMESTAMPTZ,
  events            JSONB       NOT NULL DEFAULT '[]',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_tracking_order ON mp_order_tracking(order_id);

-- ─── Coupon Usage ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_coupon_usage (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id        UUID        NOT NULL REFERENCES mp_coupons(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL,
  order_id         UUID        REFERENCES mp_orders(id) ON DELETE SET NULL,
  discount_applied BIGINT      NOT NULL DEFAULT 0,
  used_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_coupon_usage_coupon ON mp_coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_mp_coupon_usage_user   ON mp_coupon_usage(user_id);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_reviews (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID        NOT NULL REFERENCES mp_products(id) ON DELETE CASCADE,
  order_id             UUID        REFERENCES mp_orders(id) ON DELETE SET NULL,
  reviewer_id          UUID        NOT NULL,
  seller_id            UUID        NOT NULL,
  rating               SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                TEXT,
  body                 TEXT        NOT NULL,
  pros                 TEXT[]      NOT NULL DEFAULT '{}',
  cons                 TEXT[]      NOT NULL DEFAULT '{}',
  media_urls           TEXT[]      NOT NULL DEFAULT '{}',
  is_verified_purchase BOOLEAN     NOT NULL DEFAULT false,
  is_spam              BOOLEAN     NOT NULL DEFAULT false,
  helpful_count        INT         NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_reviews_product  ON mp_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_mp_reviews_reviewer ON mp_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_mp_reviews_seller   ON mp_reviews(seller_id);

-- ─── Favorites ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_favorites (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   UUID        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_mp_favorites_user ON mp_favorites(user_id);

-- ─── Returns ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_returns (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID        NOT NULL REFERENCES mp_orders(id) ON DELETE CASCADE,
  order_item_id    UUID        REFERENCES mp_order_items(id) ON DELETE SET NULL,
  buyer_id         UUID        NOT NULL,
  seller_id        UUID        NOT NULL,
  reason           TEXT        NOT NULL,
  description      TEXT,
  status           TEXT        NOT NULL DEFAULT 'requested',
  evidence_urls    TEXT[]      NOT NULL DEFAULT '{}',
  refund_amount    BIGINT,
  resolution_notes TEXT,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mp_returns_order  ON mp_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_returns_buyer  ON mp_returns(buyer_id);
CREATE INDEX IF NOT EXISTS idx_mp_returns_seller ON mp_returns(seller_id);

-- ─── Disputes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_disputes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID        NOT NULL REFERENCES mp_orders(id) ON DELETE CASCADE,
  buyer_id         UUID        NOT NULL,
  seller_id        UUID        NOT NULL,
  mediator_id      UUID,
  type             TEXT        NOT NULL DEFAULT 'other',
  status           TEXT        NOT NULL DEFAULT 'open',
  buyer_claim      TEXT        NOT NULL,
  seller_response  TEXT,
  evidence_buyer   TEXT[]      NOT NULL DEFAULT '{}',
  evidence_seller  TEXT[]      NOT NULL DEFAULT '{}',
  ai_assessment    JSONB,
  resolution       TEXT,
  resolution_type  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mp_disputes_order  ON mp_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_disputes_buyer  ON mp_disputes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_mp_disputes_seller ON mp_disputes(seller_id);
CREATE INDEX IF NOT EXISTS idx_mp_disputes_status ON mp_disputes(status);

-- ─── Auctions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_auctions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID        NOT NULL REFERENCES mp_products(id) ON DELETE CASCADE,
  seller_id     UUID        NOT NULL,
  start_price   BIGINT      NOT NULL DEFAULT 0,
  reserve_price BIGINT,
  current_bid   BIGINT      NOT NULL DEFAULT 0,
  winner_id     UUID,
  bid_count     INT         NOT NULL DEFAULT 0,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'upcoming',
  currency      TEXT        NOT NULL DEFAULT 'HTG',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_auctions_seller  ON mp_auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_mp_auctions_status  ON mp_auctions(status);
CREATE INDEX IF NOT EXISTS idx_mp_auctions_end_at  ON mp_auctions(end_at);

-- ─── Auction Bids ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_auction_bids (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id   UUID        NOT NULL REFERENCES mp_auctions(id) ON DELETE CASCADE,
  bidder_id    UUID        NOT NULL,
  amount       BIGINT      NOT NULL,
  currency     TEXT        NOT NULL DEFAULT 'HTG',
  is_winning   BOOLEAN     NOT NULL DEFAULT false,
  is_auto_bid  BOOLEAN     NOT NULL DEFAULT false,
  max_auto_bid BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_bids_auction ON mp_auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_mp_bids_bidder  ON mp_auction_bids(bidder_id);

-- ─── Subscription Plans ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_subscription_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        REFERENCES mp_products(id) ON DELETE SET NULL,
  seller_id   UUID        NOT NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  interval    TEXT        NOT NULL DEFAULT 'monthly',
  price       BIGINT      NOT NULL DEFAULT 0,
  currency    TEXT        NOT NULL DEFAULT 'HTG',
  trial_days  INT         NOT NULL DEFAULT 0,
  features    TEXT[]      NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_plans_seller ON mp_subscription_plans(seller_id);

-- ─── Subscriptions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_subscriptions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id              UUID        NOT NULL REFERENCES mp_subscription_plans(id) ON DELETE RESTRICT,
  subscriber_id        UUID        NOT NULL,
  seller_id            UUID        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,
  trial_end            TIMESTAMPTZ,
  payment_ref          TEXT,
  cancel_at            TIMESTAMPTZ,
  cancelled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_subs_subscriber ON mp_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_mp_subs_seller      ON mp_subscriptions(seller_id);
CREATE INDEX IF NOT EXISTS idx_mp_subs_status      ON mp_subscriptions(status);

-- ─── Digital Deliveries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_digital_deliveries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID        NOT NULL REFERENCES mp_orders(id) ON DELETE CASCADE,
  order_item_id  UUID        REFERENCES mp_order_items(id) ON DELETE SET NULL,
  buyer_id       UUID        NOT NULL,
  product_id     UUID        NOT NULL REFERENCES mp_products(id) ON DELETE RESTRICT,
  download_url   TEXT        NOT NULL,
  license_key    TEXT,
  download_count INT         NOT NULL DEFAULT 0,
  max_downloads  INT,
  expires_at     TIMESTAMPTZ,
  delivered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_digital_buyer   ON mp_digital_deliveries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_mp_digital_product ON mp_digital_deliveries(product_id);

-- ─── AI Scores / Recommendations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_ai_scores (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  product_id  UUID        NOT NULL REFERENCES mp_products(id) ON DELETE CASCADE,
  score       NUMERIC(5,4) NOT NULL DEFAULT 0,
  reasons     TEXT[]      NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_mp_ai_scores_user ON mp_ai_scores(user_id);

-- ─── Shipping Quotes Cache ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_shipping_quotes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_country  TEXT        NOT NULL,
  from_city     TEXT        NOT NULL,
  to_country    TEXT        NOT NULL,
  to_city       TEXT        NOT NULL,
  carrier       TEXT        NOT NULL,
  service_name  TEXT        NOT NULL,
  price         BIGINT      NOT NULL DEFAULT 0,
  currency      TEXT        NOT NULL DEFAULT 'HTG',
  estimated_days INT        NOT NULL DEFAULT 1,
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mp_shipping_route
  ON mp_shipping_quotes(from_country, to_country);

-- ─── RPC: Increment product views ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_mp_product_views(p_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE mp_products SET views_count = views_count + 1 WHERE id = p_id;
END;
$$;

-- ─── RPC: Place auction bid ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mp_place_bid(
  p_auction_id UUID, p_bidder_id UUID, p_amount BIGINT, p_currency TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) LANGUAGE plpgsql AS $$
DECLARE
  v_auction mp_auctions%ROWTYPE;
BEGIN
  SELECT * INTO v_auction FROM mp_auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND                    THEN RETURN QUERY SELECT false, 'Auction not found'; RETURN; END IF;
  IF v_auction.status <> 'active' THEN RETURN QUERY SELECT false, 'Auction not active'; RETURN; END IF;
  IF NOW() > v_auction.end_at     THEN RETURN QUERY SELECT false, 'Auction ended'; RETURN; END IF;
  IF p_amount <= v_auction.current_bid THEN RETURN QUERY SELECT false, 'Bid too low'; RETURN; END IF;

  UPDATE mp_auction_bids SET is_winning = false WHERE auction_id = p_auction_id;
  INSERT INTO mp_auction_bids(auction_id, bidder_id, amount, currency, is_winning)
    VALUES (p_auction_id, p_bidder_id, p_amount, p_currency, true);
  UPDATE mp_auctions SET current_bid = p_amount, bid_count = bid_count + 1 WHERE id = p_auction_id;
  RETURN QUERY SELECT true, 'Bid accepted';
END;
$$;
