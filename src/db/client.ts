import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

try {
  process.loadEnvFile('.env')
} catch {
  // Production runtimes provide environment variables directly.
}

const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN || undefined

export const libsql = createClient({ url, authToken })
export const db = drizzle(libsql, { schema })
