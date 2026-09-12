// Thin Postgres connection pool wrapper (ESM).
//
// Configuration comes entirely from environment variables so the same code
// runs unchanged in Docker Compose, WSL, or bare metal. In docker-compose.yml
// PGHOST is set to the Compose service name "postgres" (not "localhost") so
// the app resolves the database through the internal Docker network.

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.POSTGRES_DB || process.env.PGDATABASE,
  user: process.env.POSTGRES_USER || process.env.PGUSER,
  password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD,
  // Keep the pool small; this is a placeholder dev app, not a production service.
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  // Prevents an idle client's background error from crashing the whole process.
  console.error('[db] unexpected error on idle client', err);
});

export async function checkDbConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() AS now, current_database() AS db');
    return { ok: true, now: result.rows[0].now, database: result.rows[0].db };
  } finally {
    client.release();
  }
}

export default pool;
