# Supabase — Gestion Opérations

## Appliquer le schéma

### Option A — SQL Editor (recommandé)

1. Ouvrez le [SQL Editor](https://supabase.com/dashboard/project/wbygqildzanazvhkibrp/sql/new)
2. Collez tout le fichier `schema-complet.sql`
3. Cliquez **Run**

### Option B — Ligne de commande

1. **Settings → Database → Database password** dans le dashboard Supabase
2. Ajoutez dans `.env` : `SUPABASE_DB_PASSWORD=votre_mot_de_passe`
3. Exécutez : `npm run db:migrate`

## Compte démo (après seed)

| Utilisateur | Mot de passe |
|-------------|--------------|
| Admin       | admin        |
| jmukendi    | agent123     |
