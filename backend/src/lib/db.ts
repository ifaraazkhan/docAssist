import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

// Set search_path to dc1 for every new connection
pool.on('connect', (client) => {
  client.query('SET search_path TO dc1, public')
})

pool.on('error', (err) => {
  console.error('[db] unexpected pool error:', err.message)
})

/**
 * Execute a parameterized query. Always use $1, $2... placeholders.
 * NEVER interpolate user input into the SQL string.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params)
}

/**
 * Get a client from the pool for transactions.
 * Always release the client when done — use withTransaction() for safety.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}

/**
 * Run a callback inside a transaction with automatic commit/rollback/release.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Check if the database is reachable (for health endpoint).
 */
export async function pingDb(): Promise<boolean> {
  try {
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}

export default pool
