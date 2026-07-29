import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, libsql } from '../src/db/client'
import { lbpPainDurationOptions, posUkkCenters, users } from '../src/db/schema'

const passwordHash = await hash('password', 12)

await db
  .insert(posUkkCenters)
  .values({
    name: 'Pos UKK Kapal Sanggat',
    code: 'UKK-KS-001',
    city: 'Jambi',
    cadreCount: 1,
    isActive: true,
  })
  .onConflictDoUpdate({
    target: posUkkCenters.name,
    set: { code: 'UKK-KS-001', isActive: true, cadreCount: 1 },
  })

const center = await db.query.posUkkCenters.findFirst({
  where: eq(posUkkCenters.name, 'Pos UKK Kapal Sanggat'),
})
if (!center) throw new Error('Pos UKK gagal dibuat')

await db
  .insert(users)
  .values({
    name: 'Administrator E-Pos UKK',
    email: 'admin@epos-ukk.test',
    passwordHash,
    role: 'administrator',
    isActive: true,
    phone: '081200000001',
    emailVerifiedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: users.email,
    set: { passwordHash, role: 'administrator', isActive: true },
  })

await db
  .insert(users)
  .values({
    name: 'Kader Kapal Sanggat',
    email: 'kader@epos-ukk.test',
    passwordHash,
    role: 'cadre',
    isActive: true,
    phone: '081200000002',
    posUkkCenterId: center.id,
    emailVerifiedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: users.email,
    set: {
      passwordHash,
      role: 'cadre',
      isActive: true,
      posUkkCenterId: center.id,
    },
  })

for (const [sortOrder, label] of [
  '> 3 hari',
  '> 1 minggu',
  '> 1 bulan',
].entries()) {
  await db
    .insert(lbpPainDurationOptions)
    .values({ label, sortOrder: sortOrder + 1, isActive: true })
    .onConflictDoUpdate({
      target: lbpPainDurationOptions.label,
      set: { sortOrder: sortOrder + 1, isActive: true },
    })
}

libsql.close()
console.log(
  'Seed selesai: akun Admin, Kader, Pos UKK, dan opsi durasi LBP tersedia.',
)
