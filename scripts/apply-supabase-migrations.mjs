/**
 * Applique les migrations SQL sur le projet Supabase distant.
 * Requiert SUPABASE_DB_PASSWORD dans .env (mot de passe DB du dashboard Supabase).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  try {
    const raw = readFileSync(join(root, '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      const key = t.slice(0, i).trim()
      const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    /* .env optionnel si vars déjà exportées */
  }
}

loadEnv()

const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

const password = process.env.SUPABASE_DB_PASSWORD
if (!projectRef) {
  console.error('❌ Projet Supabase introuvable (VITE_SUPABASE_URL ou SUPABASE_PROJECT_REF).')
  process.exit(1)
}
if (!password) {
  console.error(
    '❌ Ajoutez SUPABASE_DB_PASSWORD dans .env (Settings → Database → Database password).',
  )
  process.exit(1)
}

const encodedPassword = encodeURIComponent(password)

const connectionCandidates = process.env.SUPABASE_DB_URL
  ? [process.env.SUPABASE_DB_URL]
  : [
      `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    ]

const migrationsDir = join(root, 'supabase', 'migrations')
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

async function connectClient() {
  let lastErr
  for (const connectionString of connectionCandidates) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
    try {
      await client.connect()
      console.log(`✓ Connecté à Supabase (${projectRef})`)
      return client
    } catch (err) {
      lastErr = err
      await client.end().catch(() => {})
    }
  }
  throw lastErr
}

async function main() {
  const client = await connectClient()

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  for (const file of files) {
    const { rows } = await client.query(
      'SELECT 1 FROM _migrations WHERE name = $1',
      [file],
    )
    if (rows.length > 0) {
      console.log(`⊘ ${file} (déjà appliquée)`)
      continue
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    console.log(`→ ${file}…`)
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`✓ ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)
  console.log('\nTables public :', tables.rows.map((r) => r.table_name).join(', '))
  await client.end()
}

main().catch((err) => {
  console.error('❌ Erreur migration:', err.message)
  if (err.message?.includes('password authentication failed')) {
    console.error('   Vérifiez SUPABASE_DB_PASSWORD dans .env')
  }
  if (
    err.message?.includes('Tenant or user not found') ||
    err.message?.includes('ENOTFOUND')
  ) {
    console.error(
      '   Copiez SUPABASE_DB_URL depuis Dashboard → Settings → Database → Connection string (Session).',
    )
  }
  process.exit(1)
})
