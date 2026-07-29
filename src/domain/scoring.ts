export type RiskLevel = 'low' | 'medium' | 'high'
export type LbpCategory = 'ada_keluhan' | 'tidak_ada_keluhan'
export type IndependenceStatus = 'independent' | 'assisted' | 'unable'
export type IndependenceCategory =
  'mandiri' | 'perlu_bantuan' | 'ketergantungan'

export function scoreLbp(values: readonly number[]): {
  totalScore: number
  meanScore: number
  category: LbpCategory
} {
  const normalized = Array.from({ length: 20 }, (_, index) =>
    Math.max(0, Math.min(3, Math.trunc(Number(values[index] ?? 0)))),
  )
  const totalScore = normalized.reduce((sum, value) => sum + value, 0)

  return {
    totalScore,
    meanScore: Math.round((totalScore / 20) * 100) / 100,
    category: totalScore <= 30 ? 'ada_keluhan' : 'tidak_ada_keluhan',
  }
}

export type MsdRiskInput = {
  painScale?: number | null
  stiffnessFrequency?: string | null
  abnormalSensationStatus?: string | null
  muscleFatigueStatus?: string | null
  postureScore?: number | null
  repetitiveMotionPerHour?: number | null
  exposureDurationHours?: number | null
  strengthFlexibilityStatus?: string | null
  inflammationSignStatus?: string | null
  environmentWorkloadStatus?: string | null
}

type MsdResult = {
  painLevel: RiskLevel | null
  stiffnessLevel: RiskLevel | null
  abnormalSensationLevel: RiskLevel | null
  muscleFatigueLevel: RiskLevel | null
  postureLevel: RiskLevel | null
  repetitiveMotionLevel: RiskLevel | null
  exposureDurationLevel: RiskLevel | null
  strengthFlexibilityLevel: RiskLevel | null
  inflammationSignLevel: RiskLevel | null
  environmentWorkloadLevel: RiskLevel | null
  finalRiskCategory: RiskLevel | null
}

const mappedLevel = (
  value: string | null | undefined,
  map: Record<string, RiskLevel>,
) => (value ? (map[value] ?? null) : null)

export function scoreMsdRisk(input: MsdRiskInput): MsdResult {
  const painLevel =
    input.painScale == null
      ? null
      : input.painScale <= 3
        ? 'low'
        : input.painScale <= 6
          ? 'medium'
          : 'high'
  const postureLevel =
    input.postureScore == null
      ? null
      : input.postureScore < 5
        ? 'low'
        : input.postureScore <= 7
          ? 'medium'
          : 'high'
  const repetitiveMotionLevel =
    input.repetitiveMotionPerHour == null
      ? null
      : input.repetitiveMotionPerHour < 30
        ? 'low'
        : input.repetitiveMotionPerHour <= 60
          ? 'medium'
          : 'high'
  const exposureDurationLevel =
    input.exposureDurationHours == null
      ? null
      : input.exposureDurationHours < 2
        ? 'low'
        : input.exposureDurationHours <= 4
          ? 'medium'
          : 'high'

  const levels = {
    painLevel,
    stiffnessLevel: mappedLevel(input.stiffnessFrequency, {
      jarang: 'low',
      kadang: 'medium',
      sering: 'high',
    }),
    abnormalSensationLevel: mappedLevel(input.abnormalSensationStatus, {
      tidak: 'low',
      ada_ringan: 'medium',
      ada_berat: 'high',
      ada_berat_menetap: 'high',
    }),
    muscleFatigueLevel: mappedLevel(input.muscleFatigueStatus, {
      ringan: 'low',
      sedang: 'medium',
      berat: 'high',
    }),
    postureLevel,
    repetitiveMotionLevel,
    exposureDurationLevel,
    strengthFlexibilityLevel: mappedLevel(input.strengthFlexibilityStatus, {
      normal: 'low',
      sedikit_berkurang: 'medium',
      sedang: 'medium',
      berkurang: 'high',
      berkurang_signifikan: 'high',
    }),
    inflammationSignLevel: mappedLevel(input.inflammationSignStatus, {
      tidak: 'low',
      ada_ringan: 'medium',
      ada_jelas: 'high',
    }),
    environmentWorkloadLevel: mappedLevel(input.environmentWorkloadStatus, {
      aman: 'low',
      kurang_aman: 'medium',
      tidak_aman: 'high',
    }),
  } satisfies Omit<MsdResult, 'finalRiskCategory'>

  const rank: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }
  const finalRiskCategory = Object.values(levels).reduce<RiskLevel | null>(
    (highest, level) =>
      level && (!highest || rank[level] > rank[highest]) ? level : highest,
    null,
  )

  return { ...levels, finalRiskCategory }
}

export function scorePhysicalIndependence(
  statuses: readonly IndependenceStatus[],
): {
  score: number
  category: IndependenceCategory
} {
  const values: Record<IndependenceStatus, number> = {
    independent: 2,
    assisted: 1,
    unable: 0,
  }
  const score = Array.from(
    { length: 5 },
    (_, index) => values[statuses[index] ?? 'unable'],
  ).reduce((sum, value) => sum + value, 0)

  return {
    score,
    category:
      score >= 8 ? 'mandiri' : score >= 4 ? 'perlu_bantuan' : 'ketergantungan',
  }
}

export function calculateBmi(
  heightCm?: number | null,
  weightKg?: number | null,
): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 100) / 100
}
