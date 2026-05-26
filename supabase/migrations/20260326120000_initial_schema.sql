-- Schéma initial — aligné sur src/types/index.ts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'caissier', 'superviseur');
CREATE TYPE user_status AS ENUM ('actif', 'inactif');
CREATE TYPE project_status AS ENUM ('actif', 'termine', 'en_pause');
CREATE TYPE cash_type AS ENUM ('entree', 'sortie');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'retard', 'malade');
CREATE TYPE currency_code AS ENUM ('USD');

-- users
CREATE TABLE users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  email       text NOT NULL,
  username    text NOT NULL,
  phone       text NOT NULL DEFAULT '',
  role        user_role NOT NULL,
  password    text NOT NULL,
  status      user_status NOT NULL DEFAULT 'actif',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_username_unique UNIQUE (username)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- clients
CREATE TABLE clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  phone         text NOT NULL DEFAULT '',
  email         text NOT NULL DEFAULT '',
  address       text,
  notes         text,
  internal_ref  text,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_active ON clients(active);
CREATE INDEX idx_clients_name ON clients(name);

-- projects
CREATE TABLE projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  code          text NOT NULL,
  description   text,
  manager_id    uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  start_date    date NOT NULL,
  end_date      date,
  status        project_status NOT NULL DEFAULT 'actif',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_code_unique UNIQUE (code),
  CONSTRAINT projects_dates_check CHECK (
    end_date IS NULL OR end_date >= start_date
  )
);

CREATE INDEX idx_projects_manager_id ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_start_date ON projects(start_date);

-- cash_movements
CREATE TABLE cash_movements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type          cash_type NOT NULL,
  amount        numeric(14, 2) NOT NULL CHECK (amount > 0),
  description   text NOT NULL,
  date          date NOT NULL,
  agent_id      uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  source        text,
  beneficiary   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_movements_project_id ON cash_movements(project_id);
CREATE INDEX idx_cash_movements_agent_id ON cash_movements(agent_id);
CREATE INDEX idx_cash_movements_date ON cash_movements(date);
CREATE INDEX idx_cash_movements_type ON cash_movements(type);

-- attendance_records
CREATE TABLE attendance_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id  uuid REFERENCES projects(id) ON DELETE SET NULL,
  date        date NOT NULL,
  status      attendance_status NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_agent_date_unique UNIQUE (agent_id, date)
);

CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_project_id ON attendance_records(project_id);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- app_settings (singleton)
CREATE TABLE app_settings (
  id            smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name  text NOT NULL,
  logo          text,
  address       text NOT NULL DEFAULT '',
  phone         text NOT NULL DEFAULT '',
  currency      currency_code NOT NULL DEFAULT 'USD',
  work_start    time NOT NULL DEFAULT '08:00',
  work_end      time NOT NULL DEFAULT '17:00',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_settings (id, company_name, address, phone)
VALUES (
  1,
  'Gestion Opérations — Kinshasa',
  'Gombe, Kinshasa, RDC',
  '+243 000 000 000'
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER cash_movements_updated_at
  BEFORE UPDATE ON cash_movements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER attendance_records_updated_at
  BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
