import { and, asc, count, desc, eq, gte, like, or } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/db/client'
import {
  activitySchedules,
  applicationEvaluations,
  artisans,
  exerciseContents,
  healthAssessments,
  healthDataAudits,
  lbpPainDurationOptions,
  lbpScreenings,
  msdRiskAssessments,
  physicalIndependenceAssessments,
  posUkkCenters,
  users,
} from '#/db/schema'

const resourceSchema = z.enum([
  'artisans',
  'centers',
  'users',
  'health-assessments',
  'lbp-screenings',
  'msd-assessments',
  'physical-independence',
  'schedules',
  'exercise-content',
  'evaluations',
  'audit-log',
  'lbp-options',
])

export type ResourceName = z.infer<typeof resourceSchema>
export type TableData = {
  title: string
  description: string
  columns: Array<{ key: string; label: string }>
  rows: Array<Record<string, string | number | boolean | null>>
}

async function authenticatedUser() {
  const { currentUser } = await import('./auth.server')
  const user = await currentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export const getDashboardFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await authenticatedUser()
    const centerFilter =
      user.role === 'cadre' && user.posUkkCenterId
        ? eq(artisans.posUkkCenterId, user.posUkkCenterId)
        : undefined
    const healthFilter =
      user.role === 'cadre' && user.posUkkCenterId
        ? eq(healthAssessments.posUkkCenterId, user.posUkkCenterId)
        : undefined
    const lbpFilter =
      user.role === 'cadre' && user.posUkkCenterId
        ? eq(lbpScreenings.posUkkCenterId, user.posUkkCenterId)
        : undefined
    const msdFilter =
      user.role === 'cadre' && user.posUkkCenterId
        ? eq(msdRiskAssessments.posUkkCenterId, user.posUkkCenterId)
        : undefined

    const [[artisanCount], [healthCount], [lbpCount], [highRiskCount]] =
      await Promise.all([
        db.select({ value: count() }).from(artisans).where(centerFilter),
        db
          .select({ value: count() })
          .from(healthAssessments)
          .where(healthFilter),
        db.select({ value: count() }).from(lbpScreenings).where(lbpFilter),
        db
          .select({ value: count() })
          .from(msdRiskAssessments)
          .where(
            and(msdFilter, eq(msdRiskAssessments.finalRiskCategory, 'high')),
          ),
      ])

    const recentArtisans = await db
      .select({
        id: artisans.id,
        name: artisans.name,
        respondentNumber: artisans.respondentNumber,
        occupation: artisans.occupation,
        center: posUkkCenters.name,
        createdAt: artisans.createdAt,
      })
      .from(artisans)
      .innerJoin(posUkkCenters, eq(artisans.posUkkCenterId, posUkkCenters.id))
      .where(centerFilter)
      .orderBy(desc(artisans.createdAt))
      .limit(6)

    const riskDistribution = await db
      .select({
        category: msdRiskAssessments.finalRiskCategory,
        value: count(),
      })
      .from(msdRiskAssessments)
      .where(msdFilter)
      .groupBy(msdRiskAssessments.finalRiskCategory)

    const scheduleFilter =
      user.role === 'cadre' && user.posUkkCenterId
        ? eq(activitySchedules.posUkkCenterId, user.posUkkCenterId)
        : undefined
    const upcomingActivities = await db
      .select({
        id: activitySchedules.id,
        title: activitySchedules.title,
        startsAt: activitySchedules.startsAt,
        location: activitySchedules.location,
        status: activitySchedules.status,
      })
      .from(activitySchedules)
      .where(and(scheduleFilter, gte(activitySchedules.startsAt, new Date())))
      .orderBy(asc(activitySchedules.startsAt))
      .limit(5)

    return {
      user,
      stats: {
        artisans: artisanCount.value,
        healthAssessments: healthCount.value,
        lbpScreenings: lbpCount.value,
        highRisk: highRiskCount.value,
      },
      recentArtisans,
      riskDistribution: riskDistribution.map((item) => ({
        name:
          item.category === 'high'
            ? 'Tinggi'
            : item.category === 'medium'
              ? 'Sedang'
              : 'Rendah',
        value: item.value,
      })),
      upcomingActivities,
    }
  },
)

export const listResourceFn = createServerFn({ method: 'GET' })
  .validator(
    z.object({ resource: resourceSchema, search: z.string().optional() }),
  )
  .handler(async ({ data }): Promise<TableData> => {
    const user = await authenticatedUser()
    const centerId = user.role === 'cadre' ? user.posUkkCenterId : null
    const search = `%${data.search?.trim() ?? ''}%`

    switch (data.resource) {
      case 'artisans': {
        const rows = await db
          .select({
            id: artisans.id,
            respondentNumber: artisans.respondentNumber,
            name: artisans.name,
            sex: artisans.sex,
            age: artisans.age,
            occupation: artisans.occupation,
            center: posUkkCenters.name,
          })
          .from(artisans)
          .innerJoin(
            posUkkCenters,
            eq(artisans.posUkkCenterId, posUkkCenters.id),
          )
          .where(
            and(
              centerId ? eq(artisans.posUkkCenterId, centerId) : undefined,
              data.search
                ? or(
                    like(artisans.name, search),
                    like(artisans.respondentNumber, search),
                  )
                : undefined,
            ),
          )
          .orderBy(asc(artisans.name))
          .limit(200)
        return table(
          'Data Pasien',
          'Data pasien/pengrajin binaan Pos UKK.',
          [
            ['respondentNumber', 'No. Responden'],
            ['name', 'Nama'],
            ['sex', 'Jenis Kelamin'],
            ['age', 'Usia'],
            ['occupation', 'Pekerjaan'],
            ['center', 'Pos UKK'],
          ],
          rows,
        )
      }
      case 'centers': {
        const rows = await db
          .select({
            id: posUkkCenters.id,
            code: posUkkCenters.code,
            name: posUkkCenters.name,
            leaderName: posUkkCenters.leaderName,
            district: posUkkCenters.district,
            city: posUkkCenters.city,
            cadreCount: posUkkCenters.cadreCount,
            isActive: posUkkCenters.isActive,
          })
          .from(posUkkCenters)
          .where(
            and(
              centerId ? eq(posUkkCenters.id, centerId) : undefined,
              data.search ? like(posUkkCenters.name, search) : undefined,
            ),
          )
          .orderBy(asc(posUkkCenters.name))
        return table(
          'Pos UKK',
          'Pusat layanan dan wilayah kerja.',
          [
            ['code', 'Kode'],
            ['name', 'Nama'],
            ['leaderName', 'Ketua'],
            ['district', 'Kecamatan'],
            ['city', 'Kota'],
            ['cadreCount', 'Kader'],
            ['isActive', 'Aktif'],
          ],
          rows,
        )
      }
      case 'users': {
        const rows = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            phone: users.phone,
            isActive: users.isActive,
            center: posUkkCenters.name,
          })
          .from(users)
          .leftJoin(posUkkCenters, eq(users.posUkkCenterId, posUkkCenters.id))
          .where(
            user.role === 'administrator'
              ? data.search
                ? or(like(users.name, search), like(users.email, search))
                : undefined
              : eq(users.id, user.id),
          )
          .orderBy(asc(users.name))
        return table(
          'Pengguna',
          'Manajemen Administrator dan Kader.',
          [
            ['name', 'Nama'],
            ['email', 'Email'],
            ['role', 'Role'],
            ['phone', 'Telepon'],
            ['center', 'Pos UKK'],
            ['isActive', 'Aktif'],
          ],
          rows,
        )
      }
      case 'health-assessments': {
        const rows = await db
          .select({
            id: healthAssessments.id,
            assessedAt: healthAssessments.assessedAt,
            artisan: artisans.name,
            bloodPressure: healthAssessments.bloodPressure,
            bmi: healthAssessments.bmi,
            complaint: healthAssessments.currentComplaint,
            therapyPlan: healthAssessments.therapyPlan,
          })
          .from(healthAssessments)
          .innerJoin(artisans, eq(healthAssessments.artisanId, artisans.id))
          .where(
            centerId
              ? eq(healthAssessments.posUkkCenterId, centerId)
              : undefined,
          )
          .orderBy(desc(healthAssessments.assessedAt))
          .limit(200)
        return table(
          'Pemeriksaan Kesehatan',
          'Riwayat pemeriksaan klinis pasien.',
          [
            ['assessedAt', 'Tanggal'],
            ['artisan', 'Pasien'],
            ['bloodPressure', 'Tekanan Darah'],
            ['bmi', 'BMI'],
            ['complaint', 'Keluhan'],
            ['therapyPlan', 'Rencana Terapi'],
          ],
          rows,
        )
      }
      case 'lbp-screenings': {
        const rows = await db
          .select({
            id: lbpScreenings.id,
            screenedAt: lbpScreenings.screenedAt,
            artisan: artisans.name,
            totalScore: lbpScreenings.totalScore,
            meanScore: lbpScreenings.meanScore,
            category: lbpScreenings.category,
          })
          .from(lbpScreenings)
          .innerJoin(artisans, eq(lbpScreenings.artisanId, artisans.id))
          .where(
            centerId ? eq(lbpScreenings.posUkkCenterId, centerId) : undefined,
          )
          .orderBy(desc(lbpScreenings.screenedAt))
          .limit(200)
        return table(
          'Skrining LBP',
          'Skrining keluhan nyeri punggung bawah.',
          [
            ['screenedAt', 'Tanggal'],
            ['artisan', 'Pasien'],
            ['totalScore', 'Skor Total'],
            ['meanScore', 'Rerata'],
            ['category', 'Kategori'],
          ],
          rows,
        )
      }
      case 'msd-assessments': {
        const rows = await db
          .select({
            id: msdRiskAssessments.id,
            screenedAt: msdRiskAssessments.screenedAt,
            artisan: artisans.name,
            painScale: msdRiskAssessments.painScale,
            postureMethod: msdRiskAssessments.postureMethod,
            postureScore: msdRiskAssessments.postureScore,
            finalRiskCategory: msdRiskAssessments.finalRiskCategory,
          })
          .from(msdRiskAssessments)
          .innerJoin(artisans, eq(msdRiskAssessments.artisanId, artisans.id))
          .where(
            centerId
              ? eq(msdRiskAssessments.posUkkCenterId, centerId)
              : undefined,
          )
          .orderBy(desc(msdRiskAssessments.screenedAt))
          .limit(200)
        return table(
          'Risiko MSD',
          'Penilaian risiko musculoskeletal disorders.',
          [
            ['screenedAt', 'Tanggal'],
            ['artisan', 'Pasien'],
            ['painScale', 'Skala Nyeri'],
            ['postureMethod', 'Metode'],
            ['postureScore', 'Skor Postur'],
            ['finalRiskCategory', 'Risiko Akhir'],
          ],
          rows,
        )
      }
      case 'physical-independence': {
        const rows = await db
          .select({
            id: physicalIndependenceAssessments.id,
            assessedAt: physicalIndependenceAssessments.assessedAt,
            artisan: artisans.name,
            score: physicalIndependenceAssessments.score,
            category: physicalIndependenceAssessments.category,
            notes: physicalIndependenceAssessments.notes,
          })
          .from(physicalIndependenceAssessments)
          .innerJoin(
            artisans,
            eq(physicalIndependenceAssessments.artisanId, artisans.id),
          )
          .where(
            centerId
              ? eq(physicalIndependenceAssessments.posUkkCenterId, centerId)
              : undefined,
          )
          .orderBy(desc(physicalIndependenceAssessments.assessedAt))
          .limit(200)
        return table(
          'Kemandirian Fisik',
          'Penilaian kemampuan aktivitas fisik pasien.',
          [
            ['assessedAt', 'Tanggal'],
            ['artisan', 'Pasien'],
            ['score', 'Skor'],
            ['category', 'Kategori'],
            ['notes', 'Catatan'],
          ],
          rows,
        )
      }
      case 'schedules': {
        const rows = await db
          .select({
            id: activitySchedules.id,
            title: activitySchedules.title,
            startsAt: activitySchedules.startsAt,
            endsAt: activitySchedules.endsAt,
            location: activitySchedules.location,
            status: activitySchedules.status,
            center: posUkkCenters.name,
          })
          .from(activitySchedules)
          .innerJoin(
            posUkkCenters,
            eq(activitySchedules.posUkkCenterId, posUkkCenters.id),
          )
          .where(
            centerId
              ? eq(activitySchedules.posUkkCenterId, centerId)
              : undefined,
          )
          .orderBy(desc(activitySchedules.startsAt))
          .limit(200)
        return table(
          'Jadwal Kegiatan',
          'Agenda layanan dan aktivitas Pos UKK.',
          [
            ['title', 'Kegiatan'],
            ['startsAt', 'Mulai'],
            ['endsAt', 'Selesai'],
            ['location', 'Lokasi'],
            ['status', 'Status'],
            ['center', 'Pos UKK'],
          ],
          rows,
        )
      }
      case 'exercise-content': {
        const rows = await db
          .select({
            id: exerciseContents.id,
            title: exerciseContents.title,
            bodyArea: exerciseContents.bodyArea,
            category: exerciseContents.category,
            status: exerciseContents.status,
            publishedAt: exerciseContents.publishedAt,
          })
          .from(exerciseContents)
          .where(
            user.role === 'cadre'
              ? eq(exerciseContents.status, 'published')
              : undefined,
          )
          .orderBy(desc(exerciseContents.createdAt))
          .limit(200)
        return table(
          'Konten Latihan',
          'Materi latihan fisik dan edukasi ergonomi.',
          [
            ['title', 'Judul'],
            ['bodyArea', 'Area Tubuh'],
            ['category', 'Kategori'],
            ['status', 'Status'],
            ['publishedAt', 'Terbit'],
          ],
          rows,
        )
      }
      case 'evaluations': {
        const rows = await db
          .select({
            id: applicationEvaluations.id,
            submittedAt: applicationEvaluations.submittedAt,
            respondent: users.name,
            totalScore: applicationEvaluations.totalScore,
            averageScore: applicationEvaluations.averageScore,
            notes: applicationEvaluations.notes,
          })
          .from(applicationEvaluations)
          .innerJoin(
            users,
            eq(applicationEvaluations.respondentUserId, users.id),
          )
          .where(
            user.role === 'cadre'
              ? eq(applicationEvaluations.respondentUserId, user.id)
              : undefined,
          )
          .orderBy(desc(applicationEvaluations.submittedAt))
          .limit(200)
        return table(
          'Evaluasi Aplikasi',
          'Hasil evaluasi penggunaan sistem oleh pengguna.',
          [
            ['submittedAt', 'Tanggal'],
            ['respondent', 'Responden'],
            ['totalScore', 'Total'],
            ['averageScore', 'Rerata'],
            ['notes', 'Catatan'],
          ],
          rows,
        )
      }
      case 'audit-log': {
        const rows = await db
          .select({
            id: healthDataAudits.id,
            occurredAt: healthDataAudits.occurredAt,
            actor: users.name,
            event: healthDataAudits.event,
            auditableType: healthDataAudits.auditableType,
            auditableId: healthDataAudits.auditableId,
          })
          .from(healthDataAudits)
          .leftJoin(users, eq(healthDataAudits.actorUserId, users.id))
          .where(
            centerId
              ? eq(healthDataAudits.posUkkCenterId, centerId)
              : undefined,
          )
          .orderBy(desc(healthDataAudits.occurredAt))
          .limit(200)
        return table(
          'Audit Data Kesehatan',
          'Jejak perubahan data kesehatan sensitif.',
          [
            ['occurredAt', 'Waktu'],
            ['actor', 'Aktor'],
            ['event', 'Peristiwa'],
            ['auditableType', 'Entitas'],
            ['auditableId', 'ID'],
          ],
          rows,
        )
      }
      case 'lbp-options': {
        const rows = await db
          .select({
            id: lbpPainDurationOptions.id,
            label: lbpPainDurationOptions.label,
            sortOrder: lbpPainDurationOptions.sortOrder,
            isActive: lbpPainDurationOptions.isActive,
          })
          .from(lbpPainDurationOptions)
          .orderBy(asc(lbpPainDurationOptions.sortOrder))
        return table(
          'Opsi Durasi LBP',
          'Konfigurasi pilihan durasi keluhan LBP.',
          [
            ['label', 'Label'],
            ['sortOrder', 'Urutan'],
            ['isActive', 'Aktif'],
          ],
          rows,
        )
      }
    }
  })

function table(
  title: string,
  description: string,
  columns: Array<[string, string]>,
  rows: Array<Record<string, unknown>>,
): TableData {
  return {
    title,
    description,
    columns: columns.map(([key, label]) => ({ key, label })),
    rows: rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, serialize(value)]),
      ),
    ),
  }
}

function serialize(value: unknown): string | number | boolean | null {
  if (value instanceof Date) return value.toISOString()
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  )
    return value
  return value === undefined ? null : String(value)
}
