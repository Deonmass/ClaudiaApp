-- Données de démo (équivalent src/lib/seed.ts)

DO $$
DECLARE
  admin_id   uuid := gen_random_uuid();
  agent1_id  uuid := gen_random_uuid();
  agent2_id  uuid := gen_random_uuid();
  agent3_id  uuid := gen_random_uuid();
  agent4_id  uuid := gen_random_uuid();
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

  INSERT INTO clients (name, phone, email, address, notes, internal_ref, active, created_at) VALUES
    ('Société Minière du Congo', '+243 810 111 001', 'contact@smc.cd', 'Avenue du Commerce, Lubumbashi', 'Client prioritaire', 'CLI-001', true, '2025-01-15T10:00:00Z'),
    ('Bureau Kinshasa Logistics', '+243 820 222 002', 'info@kinlog.cd', 'Gombe, Kinshasa', NULL, 'CLI-002', true, '2025-02-20T10:00:00Z'),
    ('Agro-RDC SARL', '+243 830 333 003', 'direction@agro-rdc.cd', 'Matadi, Bas-Congo', NULL, NULL, true, '2025-03-10T10:00:00Z'),
    ('Hôtel du Fleuve', '+243 840 444 004', 'reservation@hotelfleuve.cd', NULL, NULL, NULL, true, '2025-04-05T10:00:00Z'),
    ('Transports Express RDC', '+243 850 555 005', 'ops@texpress.cd', 'Limete, Kinshasa', 'Contrat annuel', NULL, false, '2025-05-01T10:00:00Z');

  INSERT INTO projects (id, name, code, description, manager_id, start_date, end_date, status, created_at, updated_at) VALUES
    (proj1_id, 'Rénovation entrepôt Gombe', format('PROJ-%s-0001', yr), 'Travaux de rénovation et sécurisation', agent1_id, '2025-06-01', '2025-12-31', 'actif', '2025-06-01T08:00:00Z', '2025-06-01T08:00:00Z'),
    (proj2_id, 'Installation réseau Lubumbashi', format('PROJ-%s-0002', yr), 'Déploiement fibre optique', agent2_id, '2025-04-15', '2025-09-30', 'actif', '2025-04-15T08:00:00Z', '2025-04-15T08:00:00Z'),
    (proj3_id, 'Audit logistique Matadi', format('PROJ-%s-0003', yr), 'Audit terminé avec succès', agent1_id, '2025-01-10', '2025-03-30', 'termine', '2025-01-10T08:00:00Z', '2025-03-30T08:00:00Z');

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
