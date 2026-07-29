import { hash } from 'bcryptjs'
import { and, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import {
  calculateBmi,
  scoreLbp,
  scoreMsdRisk,
  scorePhysicalIndependence,
} from '#/domain/scoring'
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

const mutableResource = z.enum([
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
  'lbp-options',
])
const mutationInput = z.object({
  resource: mutableResource,
  id: z.number().int().positive().optional(),
  values: z.record(z.string(), z.string()),
})

async function actor() {
  const { currentUser } = await import('./auth.server')
  const user = await currentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export const getFormOptionsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await actor()
    const centerFilter =
      user.role === 'cadre' && user.posUkkCenterId
        ? eq(posUkkCenters.id, user.posUkkCenterId)
        : undefined
    const artisanFilter =
      user.role === 'cadre' && user.posUkkCenterId
        ? eq(artisans.posUkkCenterId, user.posUkkCenterId)
        : undefined
    const [centerRows, artisanRows, durationRows] = await Promise.all([
      db
        .select({ value: posUkkCenters.id, label: posUkkCenters.name })
        .from(posUkkCenters)
        .where(centerFilter)
        .orderBy(posUkkCenters.name),
      db
        .select({
          value: artisans.id,
          label: artisans.name,
          centerId: artisans.posUkkCenterId,
        })
        .from(artisans)
        .where(artisanFilter)
        .orderBy(artisans.name),
      db
        .select({
          value: lbpPainDurationOptions.id,
          label: lbpPainDurationOptions.label,
        })
        .from(lbpPainDurationOptions)
        .where(eq(lbpPainDurationOptions.isActive, true))
        .orderBy(lbpPainDurationOptions.sortOrder),
    ])
    return {
      centers: centerRows,
      artisans: artisanRows,
      durations: durationRows,
    }
  },
)

export const mutateResourceFn = createServerFn({ method: 'POST' })
  .validator(mutationInput)
  .handler(async ({ data }) => {
    const user = await actor()
    const v = data.values
    const isAdmin = user.role === 'administrator'
    const now = new Date()

    if (['centers', 'users', 'lbp-options'].includes(data.resource) && !isAdmin)
      throw new Error('FORBIDDEN')

    let centerId: number | null =
      user.role === 'cadre' ? user.posUkkCenterId : integer(v.posUkkCenterId)
    if (user.role === 'cadre' && !centerId)
      throw new Error('Kader belum terhubung ke Pos UKK.')

    switch (data.resource) {
      case 'centers': {
        const values = {
          name: required(v.name, 'Nama Pos UKK'),
          code: nullable(v.code),
          leaderName: nullable(v.leaderName),
          contactPhone: nullable(v.contactPhone),
          address: nullable(v.address),
          district: nullable(v.district),
          city: v.city || 'Jambi',
          cadreCount: integer(v.cadreCount) ?? 0,
          isActive: boolean(v.isActive, true),
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(posUkkCenters)
            .set(values)
            .where(eq(posUkkCenters.id, data.id))
        else await db.insert(posUkkCenters).values(values)
        break
      }
      case 'users': {
        const base = {
          name: required(v.name, 'Nama'),
          email: required(v.email, 'Email').toLowerCase(),
          role:
            v.role === 'administrator'
              ? ('administrator' as const)
              : ('cadre' as const),
          isActive: boolean(v.isActive, true),
          phone: nullable(v.phone),
          posUkkCenterId: v.role === 'administrator' ? null : centerId,
          updatedAt: now,
        }
        if (data.id) {
          const passwordHash = v.password
            ? await hash(v.password, 12)
            : undefined
          await db
            .update(users)
            .set({ ...base, ...(passwordHash ? { passwordHash } : {}) })
            .where(eq(users.id, data.id))
        } else {
          await db.insert(users).values({
            ...base,
            passwordHash: await hash(required(v.password, 'Kata sandi'), 12),
            emailVerifiedAt: now,
          })
        }
        break
      }
      case 'artisans': {
        const values = {
          posUkkCenterId: requiredId(centerId, 'Pos UKK'),
          cadreId: user.role === 'cadre' ? user.id : integer(v.cadreId),
          respondentNumber: nullable(v.respondentNumber),
          identityNumber: nullable(v.identityNumber),
          name: required(v.name, 'Nama pasien'),
          birthDate: nullable(v.birthDate),
          age: integer(v.age),
          sex: nullable(v.sex),
          educationLevel: nullable(v.educationLevel),
          monthlyIncome: number(v.monthlyIncome),
          workTenureYears: number(v.workTenureYears),
          workHoursPerDay: number(v.workHoursPerDay),
          restHoursPerDay: number(v.restHoursPerDay),
          occupation: v.occupation || 'Pengrajin Batik',
          address: nullable(v.address),
          notes: nullable(v.notes),
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(artisans)
            .set(values)
            .where(
              scoped(
                artisans.id,
                artisans.posUkkCenterId,
                data.id,
                user.posUkkCenterId,
                isAdmin,
              ),
            )
        else await db.insert(artisans).values(values)
        break
      }
      case 'health-assessments': {
        const artisan = await getArtisan(
          requiredId(integer(v.artisanId), 'Pasien'),
          user.posUkkCenterId,
          isAdmin,
        )
        centerId = artisan.posUkkCenterId
        const height = number(v.heightCm),
          weight = number(v.weightKg)
        const values = {
          posUkkCenterId: centerId,
          artisanId: artisan.id,
          cadreId: user.role === 'cadre' ? user.id : integer(v.cadreId),
          assessedAt: required(v.assessedAt, 'Tanggal'),
          heightCm: height,
          weightKg: weight,
          bmi: calculateBmi(height, weight),
          bloodPressure: nullable(v.bloodPressure),
          cholesterolMgDl: number(v.cholesterolMgDl),
          bloodGlucoseMgDl: number(v.bloodGlucoseMgDl),
          uricAcidMgDl: number(v.uricAcidMgDl),
          currentComplaint: nullable(v.currentComplaint),
          complaintDuration: nullable(v.complaintDuration),
          painLocation: nullable(v.painLocation),
          painType: nullable(v.painType),
          therapyPlan: nullable(v.therapyPlan),
          notes: nullable(v.notes),
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(healthAssessments)
            .set(values)
            .where(
              scoped(
                healthAssessments.id,
                healthAssessments.posUkkCenterId,
                data.id,
                user.posUkkCenterId,
                isAdmin,
              ),
            )
        else await db.insert(healthAssessments).values(values)
        await audit(
          user.id,
          centerId,
          data.id ? 'updated' : 'created',
          'health_assessments',
          data.id ?? 0,
          v,
        )
        break
      }
      case 'lbp-screenings': {
        const artisan = await getArtisan(
          requiredId(integer(v.artisanId), 'Pasien'),
          user.posUkkCenterId,
          isAdmin,
        )
        centerId = artisan.posUkkCenterId
        const scores = (v.scores || '')
          .split(/[\s,;]+/)
          .filter(Boolean)
          .map(Number)
        const result = scoreLbp(scores)
        const items = Object.fromEntries(
          Array.from({ length: 20 }, (_, index) => [
            `item${String(index + 1).padStart(2, '0')}Score`,
            Math.max(0, Math.min(3, Math.trunc(scores[index] ?? 0))),
          ]),
        )
        const values = {
          posUkkCenterId: centerId,
          artisanId: artisan.id,
          cadreId: user.role === 'cadre' ? user.id : integer(v.cadreId),
          lbpPainDurationOptionId: integer(v.lbpPainDurationOptionId),
          screenedAt: required(v.screenedAt, 'Tanggal'),
          ...items,
          totalScore: result.totalScore,
          meanScore: result.meanScore,
          category: result.category,
          notes: nullable(v.notes),
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(lbpScreenings)
            .set(values)
            .where(
              scoped(
                lbpScreenings.id,
                lbpScreenings.posUkkCenterId,
                data.id,
                user.posUkkCenterId,
                isAdmin,
              ),
            )
        else await db.insert(lbpScreenings).values(values)
        await audit(
          user.id,
          centerId,
          data.id ? 'updated' : 'created',
          'lbp_screenings',
          data.id ?? 0,
          v,
        )
        break
      }
      case 'msd-assessments': {
        const artisan = await getArtisan(
          requiredId(integer(v.artisanId), 'Pasien'),
          user.posUkkCenterId,
          isAdmin,
        )
        centerId = artisan.posUkkCenterId
        const scoringInput = {
          painScale: integer(v.painScale),
          stiffnessFrequency: nullable(v.stiffnessFrequency),
          abnormalSensationStatus: nullable(v.abnormalSensationStatus),
          muscleFatigueStatus: nullable(v.muscleFatigueStatus),
          postureScore: number(v.postureScore),
          repetitiveMotionPerHour: integer(v.repetitiveMotionPerHour),
          exposureDurationHours: number(v.exposureDurationHours),
          strengthFlexibilityStatus: nullable(v.strengthFlexibilityStatus),
          inflammationSignStatus: nullable(v.inflammationSignStatus),
          environmentWorkloadStatus: nullable(v.environmentWorkloadStatus),
        }
        const scores = scoreMsdRisk(scoringInput)
        const values = {
          posUkkCenterId: centerId,
          artisanId: artisan.id,
          cadreId: user.role === 'cadre' ? user.id : integer(v.cadreId),
          screenedAt: required(v.screenedAt, 'Tanggal'),
          ...scoringInput,
          ...scores,
          painLocation: nullable(v.painLocation),
          postureMethod: nullable(v.postureMethod),
          notes: nullable(v.notes),
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(msdRiskAssessments)
            .set(values)
            .where(
              scoped(
                msdRiskAssessments.id,
                msdRiskAssessments.posUkkCenterId,
                data.id,
                user.posUkkCenterId,
                isAdmin,
              ),
            )
        else await db.insert(msdRiskAssessments).values(values)
        await audit(
          user.id,
          centerId,
          data.id ? 'updated' : 'created',
          'msd_risk_assessments',
          data.id ?? 0,
          v,
        )
        break
      }
      case 'physical-independence': {
        const artisan = await getArtisan(
          requiredId(integer(v.artisanId), 'Pasien'),
          user.posUkkCenterId,
          isAdmin,
        )
        centerId = artisan.posUkkCenterId
        const statuses = [
          v.walkingStatus,
          v.sittingStatus,
          v.standingStatus,
          v.workActivityStatus,
          v.sitToStandStatus,
        ].map((value) =>
          value === 'independent' || value === 'assisted' ? value : 'unable',
        )
        const result = scorePhysicalIndependence(statuses)
        const values = {
          posUkkCenterId: centerId,
          artisanId: artisan.id,
          cadreId: user.role === 'cadre' ? user.id : integer(v.cadreId),
          assessedAt: required(v.assessedAt, 'Tanggal'),
          walkingStatus: statuses[0],
          sittingStatus: statuses[1],
          standingStatus: statuses[2],
          workActivityStatus: statuses[3],
          sitToStandStatus: statuses[4],
          score: result.score,
          category: result.category,
          notes: nullable(v.notes),
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(physicalIndependenceAssessments)
            .set(values)
            .where(
              scoped(
                physicalIndependenceAssessments.id,
                physicalIndependenceAssessments.posUkkCenterId,
                data.id,
                user.posUkkCenterId,
                isAdmin,
              ),
            )
        else await db.insert(physicalIndependenceAssessments).values(values)
        await audit(
          user.id,
          centerId,
          data.id ? 'updated' : 'created',
          'physical_independence_assessments',
          data.id ?? 0,
          v,
        )
        break
      }
      case 'schedules': {
        const scheduleStatus: 'scheduled' | 'completed' | 'cancelled' =
          v.status === 'completed' || v.status === 'cancelled'
            ? v.status
            : 'scheduled'
        const values = {
          posUkkCenterId: requiredId(centerId, 'Pos UKK'),
          createdByUserId: user.id,
          title: required(v.title, 'Judul'),
          description: nullable(v.description),
          startsAt: validDate(v.startsAt, 'Waktu mulai'),
          endsAt: v.endsAt ? validDate(v.endsAt, 'Waktu selesai') : null,
          location: nullable(v.location),
          status: scheduleStatus,
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(activitySchedules)
            .set(values)
            .where(
              scoped(
                activitySchedules.id,
                activitySchedules.posUkkCenterId,
                data.id,
                user.posUkkCenterId,
                isAdmin,
              ),
            )
        else await db.insert(activitySchedules).values(values)
        break
      }
      case 'exercise-content': {
        const values = {
          authorUserId: user.id,
          title: required(v.title, 'Judul'),
          bodyArea: nullable(v.bodyArea),
          category: nullable(v.category),
          summary: nullable(v.summary),
          instructions: required(v.instructions, 'Instruksi'),
          mediaUrl: nullable(v.mediaUrl),
          status:
            v.status === 'published'
              ? ('published' as const)
              : ('draft' as const),
          publishedAt: v.status === 'published' ? now : null,
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(exerciseContents)
            .set(values)
            .where(eq(exerciseContents.id, data.id))
        else await db.insert(exerciseContents).values(values)
        break
      }
      case 'evaluations': {
        const answerValues = (v.answers || '')
          .split(/[\s,;]+/)
          .filter(Boolean)
          .map((value) => Math.max(1, Math.min(5, Number(value))))
        if (!answerValues.length)
          throw new Error('Jawaban evaluasi wajib diisi.')
        const answers = Object.fromEntries(
          answerValues.map((value, index) => [`item_${index + 1}`, value]),
        )
        const totalScore = answerValues.reduce((sum, value) => sum + value, 0)
        const values = {
          respondentUserId: user.id,
          posUkkCenterId: user.posUkkCenterId,
          submittedAt: v.submittedAt || new Date().toISOString().slice(0, 10),
          answers,
          totalScore,
          averageScore:
            Math.round((totalScore / answerValues.length) * 100) / 100,
          notes: nullable(v.notes),
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(applicationEvaluations)
            .set(values)
            .where(
              and(
                eq(applicationEvaluations.id, data.id),
                isAdmin
                  ? undefined
                  : eq(applicationEvaluations.respondentUserId, user.id),
              ),
            )
        else
          await db
            .insert(applicationEvaluations)
            .values(values)
            .onConflictDoUpdate({
              target: applicationEvaluations.respondentUserId,
              set: values,
            })
        break
      }
      case 'lbp-options': {
        const values = {
          label: required(v.label, 'Label'),
          sortOrder: integer(v.sortOrder) ?? 0,
          isActive: boolean(v.isActive, true),
          updatedAt: now,
        }
        if (data.id)
          await db
            .update(lbpPainDurationOptions)
            .set(values)
            .where(eq(lbpPainDurationOptions.id, data.id))
        else await db.insert(lbpPainDurationOptions).values(values)
        break
      }
    }
    return { ok: true }
  })

export const getResourceRecordFn = createServerFn({ method: 'GET' })
  .validator(
    z.object({ resource: mutableResource, id: z.number().int().positive() }),
  )
  .handler(async ({ data }) => {
    const user = await actor()
    let record: Record<string, unknown> | undefined
    switch (data.resource) {
      case 'centers':
        record = await db.query.posUkkCenters.findFirst({
          where: eq(posUkkCenters.id, data.id),
        })
        break
      case 'users':
        record = await db.query.users.findFirst({
          where: eq(users.id, data.id),
        })
        break
      case 'artisans':
        record = await db.query.artisans.findFirst({
          where: eq(artisans.id, data.id),
        })
        break
      case 'health-assessments':
        record = await db.query.healthAssessments.findFirst({
          where: eq(healthAssessments.id, data.id),
        })
        break
      case 'lbp-screenings':
        record = await db.query.lbpScreenings.findFirst({
          where: eq(lbpScreenings.id, data.id),
        })
        break
      case 'msd-assessments':
        record = await db.query.msdRiskAssessments.findFirst({
          where: eq(msdRiskAssessments.id, data.id),
        })
        break
      case 'physical-independence':
        record = await db.query.physicalIndependenceAssessments.findFirst({
          where: eq(physicalIndependenceAssessments.id, data.id),
        })
        break
      case 'schedules':
        record = await db.query.activitySchedules.findFirst({
          where: eq(activitySchedules.id, data.id),
        })
        break
      case 'exercise-content':
        record = await db.query.exerciseContents.findFirst({
          where: eq(exerciseContents.id, data.id),
        })
        break
      case 'evaluations':
        record = await db.query.applicationEvaluations.findFirst({
          where: eq(applicationEvaluations.id, data.id),
        })
        break
      case 'lbp-options':
        record = await db.query.lbpPainDurationOptions.findFirst({
          where: eq(lbpPainDurationOptions.id, data.id),
        })
        break
    }
    if (!record) throw new Error('Data tidak ditemukan.')
    if (user.role === 'cadre') {
      const recordCenterId =
        typeof record.posUkkCenterId === 'number' ? record.posUkkCenterId : null
      const ownerId =
        typeof record.respondentUserId === 'number'
          ? record.respondentUserId
          : null
      if (recordCenterId !== null && recordCenterId !== user.posUkkCenterId)
        throw new Error('FORBIDDEN')
      if (data.resource === 'evaluations' && ownerId !== user.id)
        throw new Error('FORBIDDEN')
      if (['centers', 'users', 'lbp-options'].includes(data.resource))
        throw new Error('FORBIDDEN')
    }
    const values = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, formValue(value)]),
    )
    if (data.resource === 'lbp-screenings') {
      values.scores = Array.from(
        { length: 20 },
        (_, index) =>
          values[`item${String(index + 1).padStart(2, '0')}Score`] || '0',
      ).join(',')
    }
    if (
      data.resource === 'evaluations' &&
      record.answers &&
      typeof record.answers === 'object'
    ) {
      values.answers = Object.values(record.answers).join(',')
    }
    return values
  })

export const deleteResourceFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({ resource: mutableResource, id: z.number().int().positive() }),
  )
  .handler(async ({ data }) => {
    const user = await actor()
    const admin = user.role === 'administrator'
    if (['centers', 'users', 'lbp-options'].includes(data.resource) && !admin)
      throw new Error('FORBIDDEN')
    switch (data.resource) {
      case 'centers':
        await db.delete(posUkkCenters).where(eq(posUkkCenters.id, data.id))
        break
      case 'users':
        if (data.id === user.id)
          throw new Error('Tidak dapat menghapus akun sendiri.')
        await db.delete(users).where(eq(users.id, data.id))
        break
      case 'artisans':
        await db
          .delete(artisans)
          .where(
            scoped(
              artisans.id,
              artisans.posUkkCenterId,
              data.id,
              user.posUkkCenterId,
              admin,
            ),
          )
        break
      case 'health-assessments':
        await db
          .delete(healthAssessments)
          .where(
            scoped(
              healthAssessments.id,
              healthAssessments.posUkkCenterId,
              data.id,
              user.posUkkCenterId,
              admin,
            ),
          )
        break
      case 'lbp-screenings':
        await db
          .delete(lbpScreenings)
          .where(
            scoped(
              lbpScreenings.id,
              lbpScreenings.posUkkCenterId,
              data.id,
              user.posUkkCenterId,
              admin,
            ),
          )
        break
      case 'msd-assessments':
        await db
          .delete(msdRiskAssessments)
          .where(
            scoped(
              msdRiskAssessments.id,
              msdRiskAssessments.posUkkCenterId,
              data.id,
              user.posUkkCenterId,
              admin,
            ),
          )
        break
      case 'physical-independence':
        await db
          .delete(physicalIndependenceAssessments)
          .where(
            scoped(
              physicalIndependenceAssessments.id,
              physicalIndependenceAssessments.posUkkCenterId,
              data.id,
              user.posUkkCenterId,
              admin,
            ),
          )
        break
      case 'schedules':
        await db
          .delete(activitySchedules)
          .where(
            scoped(
              activitySchedules.id,
              activitySchedules.posUkkCenterId,
              data.id,
              user.posUkkCenterId,
              admin,
            ),
          )
        break
      case 'exercise-content':
        await db
          .delete(exerciseContents)
          .where(eq(exerciseContents.id, data.id))
        break
      case 'evaluations':
        await db
          .delete(applicationEvaluations)
          .where(
            and(
              eq(applicationEvaluations.id, data.id),
              admin
                ? undefined
                : eq(applicationEvaluations.respondentUserId, user.id),
            ),
          )
        break
      case 'lbp-options':
        await db
          .delete(lbpPainDurationOptions)
          .where(eq(lbpPainDurationOptions.id, data.id))
        break
    }
    return { ok: true }
  })

async function getArtisan(
  id: number,
  userCenterId: number | null,
  admin: boolean,
) {
  const rows = await db
    .select()
    .from(artisans)
    .where(
      and(
        eq(artisans.id, id),
        admin
          ? undefined
          : eq(artisans.posUkkCenterId, requiredId(userCenterId, 'Pos UKK')),
      ),
    )
    .limit(1)
  const record = rows.at(0)
  if (!record)
    throw new Error('Pasien tidak ditemukan atau di luar Pos UKK Anda.')
  return record
}

function scoped(
  idColumn: AnySQLiteColumn,
  centerColumn: AnySQLiteColumn,
  idValue: number,
  userCenterId: number | null,
  admin: boolean,
) {
  return and(
    eq(idColumn, idValue),
    admin ? undefined : eq(centerColumn, requiredId(userCenterId, 'Pos UKK')),
  )
}

async function audit(
  actorUserId: number,
  centerId: number,
  event: string,
  entity: string,
  entityId: number,
  fields: Record<string, string>,
) {
  await db.insert(healthDataAudits).values({
    posUkkCenterId: centerId,
    actorUserId,
    event,
    auditableType: entity,
    auditableId: entityId,
    changedFields: Object.fromEntries(
      Object.keys(fields).map((key) => [key, true]),
    ),
    occurredAt: new Date(),
  })
}

const formValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 16)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
const nullable = (value?: string) => value?.trim() || null
const integer = (value?: string) =>
  value?.trim() ? Math.trunc(Number(value)) : null
const number = (value?: string) => (value?.trim() ? Number(value) : null)
const boolean = (value: string | undefined, fallback = false) =>
  value === undefined || value === ''
    ? fallback
    : value === 'true' || value === '1' || value === 'on'
const required = (value: string | undefined, label: string) => {
  if (!value?.trim()) throw new Error(`${label} wajib diisi.`)
  return value.trim()
}
const requiredId = (value: number | null, label: string) => {
  if (!value || value < 1) throw new Error(`${label} wajib dipilih.`)
  return value
}
const validDate = (value: string | undefined, label: string) => {
  const date = new Date(required(value, label))
  if (Number.isNaN(date.valueOf())) throw new Error(`${label} tidak valid.`)
  return date
}
