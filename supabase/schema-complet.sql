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
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
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

CREATE INDEX idx_projects_client_id ON projects(client_id);
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
-- RLS : accès lecture/écriture pour anon (app interne sans auth Supabase pour l'instant)
-- À resserrer quand Supabase Auth sera branché.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_all_anon" ON users
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "clients_all_anon" ON clients
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "projects_all_anon" ON projects
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cash_movements_all_anon" ON cash_movements
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "attendance_records_all_anon" ON attendance_records
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "app_settings_all_anon" ON app_settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- Données de démo (équivalent src/lib/seed.ts)

DO $$
DECLARE
  admin_id   uuid := gen_random_uuid();
  agent1_id  uuid := gen_random_uuid();
  agent2_id  uuid := gen_random_uuid();
  agent3_id  uuid := gen_random_uuid();
  agent4_id  uuid := gen_random_uuid();
  cli1_id    uuid := gen_random_uuid();
  cli2_id    uuid := gen_random_uuid();
  cli3_id    uuid := gen_random_uuid();
  proj1_id   uuid := gen_random_uuid();
  proj2_id   uuid := gen_random_uuid();
  proj3_id   uuid := gen_random_uuid();
  yr         int  := EXTRACT(YEAR FROM CURRENT_DATE)::int;
BEGIN
  INSERT INTO users (id, full_name, email, username, phone, role, password, status) VALUES
    (admin_id,  'Administrateur',      'admin@gestion-ops.cd',           'Admin',      '+243 900 000 001', 'admin',        'admin',    'actif'),
    (agent1_id, 'Jean Mukendi',        'jean.mukendi@gestion-ops.cd',    'jmukendi',   '+243 900 000 002', 'superviseur',  'agent123', 'actif'),
    (agent2_id, 'Marie Kabila',        'marie.kabila@gestion-ops.cd',    'mkabila',    '+243 900 000 003', 'agent',        'agent123', 'actif'),
    (agent3_id, 'Patrick Lumumba',     'patrick.lumumba@gestion-ops.cd', 'plumumba',   '+243 900 000 004', 'caissier',     'agent123', 'actif'),
    (agent4_id, 'Grace Tshisekedi',    'grace.tshisekedi@gestion-ops.cd','gtshisekedi','+243 900 000 005', 'agent',        'agent123', 'inactif');

  INSERT INTO clients (id, name, phone, email, address, notes, internal_ref, active, created_at) VALUES
    (cli1_id, 'Société Minière du Congo', '+243 810 111 001', 'contact@smc.cd', 'Avenue du Commerce, Lubumbashi', 'Client prioritaire', 'CLI-001', true, '2025-01-15T10:00:00Z'),
    (cli2_id, 'Bureau Kinshasa Logistics', '+243 820 222 002', 'info@kinlog.cd', 'Gombe, Kinshasa', NULL, 'CLI-002', true, '2025-02-20T10:00:00Z'),
    (cli3_id, 'Agro-RDC SARL', '+243 830 333 003', 'direction@agro-rdc.cd', 'Matadi, Bas-Congo', NULL, NULL, true, '2025-03-10T10:00:00Z'),
    (gen_random_uuid(), 'Hôtel du Fleuve', '+243 840 444 004', 'reservation@hotelfleuve.cd', NULL, NULL, NULL, true, '2025-04-05T10:00:00Z'),
    (gen_random_uuid(), 'Transports Express RDC', '+243 850 555 005', 'ops@texpress.cd', 'Limete, Kinshasa', 'Contrat annuel', NULL, false, '2025-05-01T10:00:00Z');

  INSERT INTO projects (id, name, code, description, client_id, manager_id, start_date, end_date, status, created_at, updated_at) VALUES
    (proj1_id, 'Rénovation entrepôt Gombe', format('PROJ-%s-0001', yr), 'Travaux de rénovation et sécurisation', cli1_id, agent1_id, '2025-06-01', '2025-12-31', 'actif', '2025-06-01T08:00:00Z', '2025-06-01T08:00:00Z'),
    (proj2_id, 'Installation réseau Lubumbashi', format('PROJ-%s-0002', yr), 'Déploiement fibre optique', cli2_id, agent2_id, '2025-04-15', '2025-09-30', 'actif', '2025-04-15T08:00:00Z', '2025-04-15T08:00:00Z'),
    (proj3_id, 'Audit logistique Matadi', format('PROJ-%s-0003', yr), 'Audit terminé avec succès', cli3_id, agent1_id, '2025-01-10', '2025-03-30', 'termine', '2025-01-10T08:00:00Z', '2025-03-30T08:00:00Z');

  INSERT INTO cash_movements (project_id, type, amount, description, date, agent_id, source, beneficiary) VALUES
    (proj1_id, 'entree', 15000, 'Acompte client', '2025-06-05', agent3_id, 'Société Minière du Congo', NULL),
    (proj1_id, 'sortie', 4200, 'Achat matériaux', '2025-06-10', agent3_id, NULL, 'Quincaillerie Gombe'),
    (proj1_id, 'entree', 8500, 'Deuxième tranche', '2025-07-01', admin_id, 'Virement bancaire', NULL),
    (proj2_id, 'entree', 28000, 'Budget projet', '2025-05-01', agent3_id, 'Bureau Kinshasa Logistics', NULL),
    (proj2_id, 'sortie', 11200, 'Équipement réseau', '2025-05-20', agent3_id, NULL, 'Tech Supply RDC');

  -- Présences : 20 jours × 4 agents
  FOR day IN 1..20 LOOP
    FOR i IN 0..3 LOOP
      INSERT INTO attendance_records (agent_id, project_id, date, status, notes)
      VALUES (
        CASE i WHEN 0 THEN agent1_id WHEN 1 THEN agent2_id WHEN 2 THEN agent3_id ELSE agent4_id END,
        CASE WHEN i % 2 = 0 THEN proj1_id ELSE NULL END,
        ('2025-05-' || lpad(day::text, 2, '0'))::date,
        (ARRAY['present','present','present','absent','retard','present','malade','present']::attendance_status[])[1 + ((day + i) % 8)],
        CASE WHEN day % 7 = 0 THEN 'Note de suivi' ELSE NULL END
      );
    END LOOP;
  END LOOP;
END $$;
