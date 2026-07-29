import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

const id = () => integer('id').primaryKey({ autoIncrement: true })
const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
const boolean = (name: string) =>
  integer(name, { mode: 'boolean' }).notNull().default(false)

export const posUkkCenters = sqliteTable(
  'pos_ukk_centers',
  {
    id: id(),
    name: text('name').notNull().unique(),
    code: text('code').unique(),
    leaderName: text('leader_name'),
    contactPhone: text('contact_phone'),
    address: text('address'),
    district: text('district'),
    city: text('city').notNull().default('Jambi'),
    cadreCount: integer('cadre_count').notNull().default(0),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    establishedAt: text('established_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('centers_active_district_idx').on(table.isActive, table.district),
  ],
)

export const users = sqliteTable(
  'users',
  {
    id: id(),
    posUkkCenterId: integer('pos_ukk_center_id').references(
      () => posUkkCenters.id,
      { onDelete: 'cascade' },
    ),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp_ms' }),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['administrator', 'cadre'] })
      .notNull()
      .default('cadre'),
    isActive: integer('is_active', { mode: 'boolean' })
      .notNull()
      .default(false),
    phone: text('phone'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('users_role_active_center_idx').on(
      table.role,
      table.isActive,
      table.posUkkCenterId,
    ),
  ],
)

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('sessions_user_expires_idx').on(table.userId, table.expiresAt),
  ],
)

export const artisans = sqliteTable(
  'artisans',
  {
    id: id(),
    posUkkCenterId: integer('pos_ukk_center_id')
      .notNull()
      .references(() => posUkkCenters.id, { onDelete: 'cascade' }),
    cadreId: integer('cadre_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    respondentNumber: text('respondent_number'),
    identityNumber: text('identity_number'),
    name: text('name').notNull(),
    birthDate: text('birth_date'),
    age: integer('age'),
    sex: text('sex'),
    educationLevel: text('education_level'),
    monthlyIncome: real('monthly_income'),
    workTenureYears: real('work_tenure_years'),
    workHoursPerDay: real('work_hours_per_day'),
    restHoursPerDay: real('rest_hours_per_day'),
    occupation: text('occupation').notNull().default('Pasien Batik'),
    address: text('address'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('artisans_center_respondent_uidx').on(
      table.posUkkCenterId,
      table.respondentNumber,
    ),
    index('artisans_center_name_idx').on(table.posUkkCenterId, table.name),
    index('artisans_cadre_created_idx').on(table.cadreId, table.createdAt),
  ],
)

export const healthAssessments = sqliteTable(
  'health_assessments',
  {
    id: id(),
    posUkkCenterId: integer('pos_ukk_center_id')
      .notNull()
      .references(() => posUkkCenters.id, { onDelete: 'cascade' }),
    artisanId: integer('artisan_id')
      .notNull()
      .references(() => artisans.id, { onDelete: 'cascade' }),
    cadreId: integer('cadre_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    assessedAt: text('assessed_at').notNull(),
    heightCm: real('height_cm'),
    weightKg: real('weight_kg'),
    bmi: real('bmi'),
    bloodPressure: text('blood_pressure'),
    cholesterolMgDl: real('cholesterol_mg_dl'),
    bloodGlucoseMgDl: real('blood_glucose_mg_dl'),
    uricAcidMgDl: real('uric_acid_mg_dl'),
    hasHypertension: boolean('has_hypertension'),
    hasDiabetes: boolean('has_diabetes'),
    hasGout: boolean('has_gout'),
    hasHypercholesterolemia: boolean('has_hypercholesterolemia'),
    otherDiseases: text('other_diseases'),
    usesMedication: boolean('uses_medication'),
    medicationNotes: text('medication_notes'),
    complaintDuration: text('complaint_duration'),
    currentComplaint: text('current_complaint'),
    aggravatedByWalking: boolean('aggravated_by_walking'),
    aggravatedBySitting: boolean('aggravated_by_sitting'),
    aggravatedByActivity: boolean('aggravated_by_activity'),
    painLocation: text('pain_location'),
    painType: text('pain_type'),
    hasJointStiffness: boolean('has_joint_stiffness'),
    rangeOfMotion: text('range_of_motion'),
    hasSwelling: boolean('has_swelling'),
    palpationStatus: text('palpation_status'),
    sitToStandResult: text('sit_to_stand_result'),
    therapyPlan: text('therapy_plan'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('health_center_assessed_idx').on(
      table.posUkkCenterId,
      table.assessedAt,
    ),
    index('health_artisan_assessed_idx').on(table.artisanId, table.assessedAt),
    index('health_cadre_assessed_idx').on(table.cadreId, table.assessedAt),
  ],
)

export const lbpPainDurationOptions = sqliteTable(
  'lbp_pain_duration_options',
  {
    id: id(),
    label: text('label').notNull().unique(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('lbp_duration_active_sort_idx').on(table.isActive, table.sortOrder),
  ],
)

export const activitySchedules = sqliteTable(
  'activity_schedules',
  {
    id: id(),
    posUkkCenterId: integer('pos_ukk_center_id')
      .notNull()
      .references(() => posUkkCenters.id, { onDelete: 'cascade' }),
    createdByUserId: integer('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    startsAt: integer('starts_at', { mode: 'timestamp_ms' }).notNull(),
    endsAt: integer('ends_at', { mode: 'timestamp_ms' }),
    location: text('location'),
    status: text('status', { enum: ['scheduled', 'completed', 'cancelled'] })
      .notNull()
      .default('scheduled'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('schedules_center_starts_idx').on(
      table.posUkkCenterId,
      table.startsAt,
    ),
    index('schedules_status_starts_idx').on(table.status, table.startsAt),
    index('schedules_creator_idx').on(table.createdByUserId),
  ],
)

export const exerciseContents = sqliteTable(
  'exercise_contents',
  {
    id: id(),
    authorUserId: integer('author_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    bodyArea: text('body_area'),
    category: text('category'),
    summary: text('summary'),
    instructions: text('instructions').notNull(),
    mediaUrl: text('media_url'),
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('exercise_status_published_idx').on(table.status, table.publishedAt),
    index('exercise_body_category_idx').on(table.bodyArea, table.category),
    index('exercise_author_idx').on(table.authorUserId),
  ],
)

export const lbpScreenings = sqliteTable(
  'lbp_screenings',
  {
    id: id(),
    posUkkCenterId: integer('pos_ukk_center_id')
      .notNull()
      .references(() => posUkkCenters.id, { onDelete: 'cascade' }),
    artisanId: integer('artisan_id')
      .notNull()
      .references(() => artisans.id, { onDelete: 'cascade' }),
    cadreId: integer('cadre_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    lbpPainDurationOptionId: integer('lbp_pain_duration_option_id').references(
      () => lbpPainDurationOptions.id,
      { onDelete: 'set null' },
    ),
    screenedAt: text('screened_at').notNull(),
    item01Score: integer('item_01_score'),
    item02Score: integer('item_02_score'),
    item03Score: integer('item_03_score'),
    item04Score: integer('item_04_score'),
    item05Score: integer('item_05_score'),
    item06Score: integer('item_06_score'),
    item07Score: integer('item_07_score'),
    item08Score: integer('item_08_score'),
    item09Score: integer('item_09_score'),
    item10Score: integer('item_10_score'),
    item11Score: integer('item_11_score'),
    item12Score: integer('item_12_score'),
    item13Score: integer('item_13_score'),
    item14Score: integer('item_14_score'),
    item15Score: integer('item_15_score'),
    item16Score: integer('item_16_score'),
    item17Score: integer('item_17_score'),
    item18Score: integer('item_18_score'),
    item19Score: integer('item_19_score'),
    item20Score: integer('item_20_score'),
    totalScore: integer('total_score'),
    meanScore: real('mean_score'),
    category: text('category', { enum: ['ada_keluhan', 'tidak_ada_keluhan'] }),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('lbp_center_screened_idx').on(table.posUkkCenterId, table.screenedAt),
    index('lbp_artisan_screened_idx').on(table.artisanId, table.screenedAt),
    index('lbp_cadre_screened_idx').on(table.cadreId, table.screenedAt),
    index('lbp_category_screened_idx').on(table.category, table.screenedAt),
  ],
)

export const msdRiskAssessments = sqliteTable(
  'msd_risk_assessments',
  {
    id: id(),
    posUkkCenterId: integer('pos_ukk_center_id')
      .notNull()
      .references(() => posUkkCenters.id, { onDelete: 'cascade' }),
    artisanId: integer('artisan_id')
      .notNull()
      .references(() => artisans.id, { onDelete: 'cascade' }),
    cadreId: integer('cadre_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    screenedAt: text('screened_at').notNull(),
    painScale: integer('pain_scale'),
    painLevel: text('pain_level'),
    painLocation: text('pain_location'),
    stiffnessFrequency: text('stiffness_frequency'),
    stiffnessLevel: text('stiffness_level'),
    abnormalSensationStatus: text('abnormal_sensation_status'),
    abnormalSensationLevel: text('abnormal_sensation_level'),
    muscleFatigueStatus: text('muscle_fatigue_status'),
    muscleFatigueLevel: text('muscle_fatigue_level'),
    postureMethod: text('posture_method'),
    postureScore: real('posture_score'),
    postureLevel: text('posture_level'),
    repetitiveMotionPerHour: integer('repetitive_motion_per_hour'),
    repetitiveMotionLevel: text('repetitive_motion_level'),
    exposureDurationHours: real('exposure_duration_hours'),
    exposureDurationLevel: text('exposure_duration_level'),
    strengthFlexibilityStatus: text('strength_flexibility_status'),
    strengthFlexibilityLevel: text('strength_flexibility_level'),
    inflammationSignStatus: text('inflammation_sign_status'),
    inflammationSignLevel: text('inflammation_sign_level'),
    environmentWorkloadStatus: text('environment_workload_status'),
    environmentWorkloadLevel: text('environment_workload_level'),
    finalRiskCategory: text('final_risk_category', {
      enum: ['low', 'medium', 'high'],
    }),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('msd_center_screened_idx').on(table.posUkkCenterId, table.screenedAt),
    index('msd_artisan_screened_idx').on(table.artisanId, table.screenedAt),
    index('msd_cadre_screened_idx').on(table.cadreId, table.screenedAt),
    index('msd_risk_screened_idx').on(
      table.finalRiskCategory,
      table.screenedAt,
    ),
  ],
)

export const physicalIndependenceAssessments = sqliteTable(
  'physical_independence_assessments',
  {
    id: id(),
    posUkkCenterId: integer('pos_ukk_center_id')
      .notNull()
      .references(() => posUkkCenters.id, { onDelete: 'cascade' }),
    artisanId: integer('artisan_id')
      .notNull()
      .references(() => artisans.id, { onDelete: 'cascade' }),
    cadreId: integer('cadre_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    assessedAt: text('assessed_at').notNull(),
    walkingStatus: text('walking_status').notNull(),
    sittingStatus: text('sitting_status').notNull(),
    standingStatus: text('standing_status').notNull(),
    workActivityStatus: text('work_activity_status').notNull(),
    sitToStandStatus: text('sit_to_stand_status').notNull(),
    score: integer('score').notNull().default(0),
    category: text('category', {
      enum: ['mandiri', 'perlu_bantuan', 'ketergantungan'],
    }).notNull(),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('pia_center_assessed_idx').on(table.posUkkCenterId, table.assessedAt),
    index('pia_artisan_assessed_idx').on(table.artisanId, table.assessedAt),
    index('pia_cadre_assessed_idx').on(table.cadreId, table.assessedAt),
    index('pia_category_assessed_idx').on(table.category, table.assessedAt),
  ],
)

export const applicationEvaluations = sqliteTable(
  'application_evaluations',
  {
    id: id(),
    respondentUserId: integer('respondent_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    posUkkCenterId: integer('pos_ukk_center_id').references(
      () => posUkkCenters.id,
      { onDelete: 'set null' },
    ),
    submittedAt: text('submitted_at').notNull(),
    answers: text('answers', { mode: 'json' })
      .$type<Record<string, number>>()
      .notNull(),
    totalScore: integer('total_score').notNull(),
    averageScore: real('average_score').notNull(),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('evaluation_center_submitted_idx').on(
      table.posUkkCenterId,
      table.submittedAt,
    ),
  ],
)

export const healthDataAudits = sqliteTable(
  'health_data_audits',
  {
    id: id(),
    posUkkCenterId: integer('pos_ukk_center_id').references(
      () => posUkkCenters.id,
      { onDelete: 'set null' },
    ),
    actorUserId: integer('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    actorType: text('actor_type').notNull().default('user'),
    event: text('event').notNull(),
    auditableType: text('auditable_type').notNull(),
    auditableId: integer('auditable_id').notNull(),
    changedFields: text('changed_fields', { mode: 'json' }).$type<
      Record<string, unknown>
    >(),
    occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('audits_center_occurred_idx').on(
      table.posUkkCenterId,
      table.occurredAt,
    ),
    index('audits_target_idx').on(table.auditableType, table.auditableId),
    index('audits_actor_occurred_idx').on(table.actorUserId, table.occurredAt),
    index('audits_event_occurred_idx').on(table.event, table.occurredAt),
  ],
)

export const usersRelations = relations(users, ({ one, many }) => ({
  center: one(posUkkCenters, {
    fields: [users.posUkkCenterId],
    references: [posUkkCenters.id],
  }),
  sessions: many(sessions),
  artisans: many(artisans),
}))

export const centersRelations = relations(posUkkCenters, ({ many }) => ({
  users: many(users),
  artisans: many(artisans),
  healthAssessments: many(healthAssessments),
}))

export const artisansRelations = relations(artisans, ({ one, many }) => ({
  center: one(posUkkCenters, {
    fields: [artisans.posUkkCenterId],
    references: [posUkkCenters.id],
  }),
  cadre: one(users, { fields: [artisans.cadreId], references: [users.id] }),
  healthAssessments: many(healthAssessments),
  lbpScreenings: many(lbpScreenings),
  msdRiskAssessments: many(msdRiskAssessments),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Artisan = typeof artisans.$inferSelect
export type PosUkkCenter = typeof posUkkCenters.$inferSelect
