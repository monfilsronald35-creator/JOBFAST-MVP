-- ============================================================
-- FAZ 23 — Enterprise Platform
-- Migration: 019_enterprise_platform.sql
-- Run manually in Supabase SQL Editor
-- Prefix: ent_
-- ============================================================

-- ── Organizations ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  legal_name    TEXT,
  parent_org_id UUID REFERENCES ent_organizations(id) ON DELETE SET NULL,
  type          TEXT NOT NULL DEFAULT 'company'
                  CHECK (type IN ('group','company','subsidiary','branch_entity','ngo','government')),
  country       TEXT NOT NULL DEFAULT 'HT',
  currency      TEXT NOT NULL DEFAULT 'HTG',
  timezone      TEXT NOT NULL DEFAULT 'America/Port-au-Prince',
  language      TEXT NOT NULL DEFAULT 'ht',
  logo_url      TEXT,
  website       TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  tax_id        TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','suspended','dissolved')),
  owner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ent_orgs_owner      ON ent_organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_ent_orgs_parent     ON ent_organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_ent_orgs_status     ON ent_organizations(status);

-- ── Branches ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'HT',
  city        TEXT NOT NULL DEFAULT '',
  address     TEXT,
  timezone    TEXT NOT NULL DEFAULT 'America/Port-au-Prince',
  language    TEXT NOT NULL DEFAULT 'ht',
  currency    TEXT NOT NULL DEFAULT 'HTG',
  manager_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone       TEXT,
  email       TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','closed','suspended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_ent_branches_org    ON ent_branches(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_branches_mgr    ON ent_branches(manager_id);

-- ── Departments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  branch_id   UUID REFERENCES ent_branches(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  parent_id   UUID REFERENCES ent_departments(id) ON DELETE SET NULL,
  head_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  budget      BIGINT DEFAULT 0,
  currency    TEXT DEFAULT 'HTG',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_ent_depts_org       ON ent_departments(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_depts_branch    ON ent_departments(branch_id);

-- ── Enterprise Roles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ent_roles_org       ON ent_roles(org_id);

-- ── Employees ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_employees (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  branch_id      UUID REFERENCES ent_branches(id) ON DELETE SET NULL,
  department_id  UUID REFERENCES ent_departments(id) ON DELETE SET NULL,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  employee_id    TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'full_time'
                   CHECK (type IN ('full_time','part_time','contractor','consultant','intern')),
  role_id        UUID NOT NULL REFERENCES ent_roles(id) ON DELETE RESTRICT,
  title          TEXT NOT NULL DEFAULT '',
  manager_id     UUID REFERENCES ent_employees(id) ON DELETE SET NULL,
  start_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date       DATE,
  salary         BIGINT,
  hourly_rate    BIGINT,
  currency       TEXT NOT NULL DEFAULT 'HTG',
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','on_leave','terminated','probation')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_ent_emps_org        ON ent_employees(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_emps_user       ON ent_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_ent_emps_dept       ON ent_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_ent_emps_branch     ON ent_employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_ent_emps_status     ON ent_employees(status);

-- ── Payroll ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_payroll (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES ent_employees(id) ON DELETE CASCADE,
  period       TEXT NOT NULL,
  gross_amount BIGINT NOT NULL DEFAULT 0,
  net_amount   BIGINT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'HTG',
  items        JSONB NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','pending_approval','approved','processing','paid','cancelled')),
  approved_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, employee_id, period)
);

CREATE INDEX IF NOT EXISTS idx_ent_payroll_org     ON ent_payroll(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_payroll_emp     ON ent_payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_ent_payroll_period  ON ent_payroll(period);
CREATE INDEX IF NOT EXISTS idx_ent_payroll_status  ON ent_payroll(status);

-- ── Invoices ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  branch_id           UUID REFERENCES ent_branches(id) ON DELETE SET NULL,
  type                TEXT NOT NULL DEFAULT 'invoice'
                        CHECK (type IN ('invoice','quote','purchase_order','credit_note','debit_note')),
  number              TEXT NOT NULL,
  client_name         TEXT NOT NULL DEFAULT '',
  client_email        TEXT,
  items               JSONB NOT NULL DEFAULT '[]',
  subtotal            BIGINT NOT NULL DEFAULT 0,
  tax_amount          BIGINT NOT NULL DEFAULT 0,
  tax_rate            NUMERIC(5,2) NOT NULL DEFAULT 0,
  total               BIGINT NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'HTG',
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','sent','viewed','paid','overdue','cancelled')),
  due_date            DATE,
  paid_at             TIMESTAMPTZ,
  notes               TEXT,
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_interval  TEXT CHECK (recurring_interval IN ('monthly','quarterly','annually')),
  created_by          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, number)
);

CREATE INDEX IF NOT EXISTS idx_ent_inv_org         ON ent_invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_inv_status      ON ent_invoices(status);
CREATE INDEX IF NOT EXISTS idx_ent_inv_type        ON ent_invoices(type);

-- ── Workflows ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_workflows (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL
               CHECK (type IN ('payroll_approval','invoice_approval','leave_request',
                               'expense_claim','hiring','procurement','general')),
  steps      JSONB NOT NULL DEFAULT '[]',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ent_workflow_instances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   UUID NOT NULL REFERENCES ent_workflows(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  current_step  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','cancelled')),
  submitted_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  completed_at  TIMESTAMPTZ,
  steps         JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ent_wf_org          ON ent_workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_wfi_org         ON ent_workflow_instances(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_wfi_entity      ON ent_workflow_instances(entity_id);
CREATE INDEX IF NOT EXISTS idx_ent_wfi_status      ON ent_workflow_instances(status);

-- ── Documents ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES ent_branches(id) ON DELETE SET NULL,
  department_id   UUID REFERENCES ent_departments(id) ON DELETE SET NULL,
  employee_id     UUID REFERENCES ent_employees(id) ON DELETE SET NULL,
  category        TEXT NOT NULL DEFAULT 'contract'
                    CHECK (category IN ('contract','invoice','employee_file','policy',
                                        'report','certificate','license','purchase_order','legal')),
  name            TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size       BIGINT NOT NULL DEFAULT 0,
  mime_type       TEXT NOT NULL DEFAULT 'application/octet-stream',
  version         INTEGER NOT NULL DEFAULT 1,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMPTZ,
  uploaded_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ent_docs_org        ON ent_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_docs_cat        ON ent_documents(category);
CREATE INDEX IF NOT EXISTS idx_ent_docs_emp        ON ent_documents(employee_id);

-- ── Audit Logs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT NOT NULL,
  before     JSONB,
  after      JSONB,
  ip         TEXT,
  device     TEXT,
  country    TEXT,
  branch_id  UUID REFERENCES ent_branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ent_audit_org       ON ent_audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_audit_user      ON ent_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ent_audit_entity    ON ent_audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_ent_audit_ts        ON ent_audit_logs(created_at DESC);

-- ── Security Settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ent_security_settings (
  org_id               UUID PRIMARY KEY REFERENCES ent_organizations(id) ON DELETE CASCADE,
  sso_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  sso_provider         TEXT,
  mfa_required         BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_method           TEXT NOT NULL DEFAULT 'totp'
                         CHECK (mfa_method IN ('totp','sms','email')),
  ip_whitelist         TEXT[] NOT NULL DEFAULT '{}',
  session_timeout_min  INTEGER NOT NULL DEFAULT 480,
  max_login_attempts   INTEGER NOT NULL DEFAULT 5,
  require_strong_pw    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ent_trusted_devices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES ent_organizations(id) ON DELETE CASCADE,
  device_id   TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT '',
  user_agent  TEXT NOT NULL DEFAULT '',
  ip          TEXT NOT NULL DEFAULT '',
  trusted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(user_id, org_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_ent_devices_user    ON ent_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_ent_devices_org     ON ent_trusted_devices(org_id);

-- ── Seed system roles for default orgs (example) ──────────────────────────────
-- Note: run after creating an organization, passing the real org_id

-- ── Updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ent_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_ent_orgs_updated ON ent_organizations;
CREATE TRIGGER trg_ent_orgs_updated
  BEFORE UPDATE ON ent_organizations
  FOR EACH ROW EXECUTE FUNCTION ent_set_updated_at();