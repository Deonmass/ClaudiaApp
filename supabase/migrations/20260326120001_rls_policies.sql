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
