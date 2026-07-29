import { describe, expect, it } from 'vitest'
import { getTableName } from 'drizzle-orm'
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
  sessions,
  users,
} from '../../src/db/schema'

const tables = [
  posUkkCenters,
  users,
  sessions,
  artisans,
  healthAssessments,
  lbpPainDurationOptions,
  activitySchedules,
  exerciseContents,
  lbpScreenings,
  msdRiskAssessments,
  physicalIndependenceAssessments,
  applicationEvaluations,
  healthDataAudits,
]

describe('Drizzle schema contract', () => {
  it('memetakan seluruh tabel domain Laravel dan session auth', () => {
    expect(tables.map(getTableName)).toEqual([
      'pos_ukk_centers',
      'users',
      'sessions',
      'artisans',
      'health_assessments',
      'lbp_pain_duration_options',
      'activity_schedules',
      'exercise_contents',
      'lbp_screenings',
      'msd_risk_assessments',
      'physical_independence_assessments',
      'application_evaluations',
      'health_data_audits',
    ])
  })

  it('menyediakan kolom tenant dan ownership yang diperlukan', () => {
    expect(users.posUkkCenterId).toBeDefined()
    expect(artisans.posUkkCenterId).toBeDefined()
    expect(artisans.cadreId).toBeDefined()
    expect(healthAssessments.artisanId).toBeDefined()
    expect(lbpScreenings.item20Score).toBeDefined()
    expect(msdRiskAssessments.finalRiskCategory).toBeDefined()
    expect(healthDataAudits.changedFields).toBeDefined()
  })
})
