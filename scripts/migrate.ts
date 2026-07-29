import { migrate } from 'drizzle-orm/libsql/migrator'
import { db, libsql } from '../src/db/client'

await migrate(db, { migrationsFolder: './drizzle' })
libsql.close()
console.log('Migrasi Drizzle selesai.')
