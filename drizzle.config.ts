import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile('.env')
} catch {
  // CI and Turso deployments provide environment variables directly.
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  strict: true,
  verbose: true,
})
