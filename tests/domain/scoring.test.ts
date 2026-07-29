import { describe, expect, it } from 'vitest'
import {
  calculateBmi,
  scoreLbp,
  scoreMsdRisk,
  scorePhysicalIndependence,
} from '../../src/domain/scoring'

describe('scoreLbp', () => {
  it('membatasi 20 jawaban ke rentang 0-3 dan mempertahankan ambang penelitian', () => {
    const result = scoreLbp([4, -1, ...Array(18).fill(2)])
    expect(result).toEqual({
      totalScore: 39,
      meanScore: 1.95,
      category: 'tidak_ada_keluhan',
    })
  })

  it('mengategorikan skor total tepat 30 sebagai ada keluhan', () => {
    expect(scoreLbp(Array(20).fill(1.5)).category).toBe('ada_keluhan')
  })
})

describe('scoreMsdRisk', () => {
  it('mengambil level tertinggi dari seluruh indikator', () => {
    const result = scoreMsdRisk({
      painScale: 4,
      stiffnessFrequency: 'jarang',
      abnormalSensationStatus: 'tidak',
      muscleFatigueStatus: 'ringan',
      postureScore: 8,
      repetitiveMotionPerHour: 20,
      exposureDurationHours: 1,
      strengthFlexibilityStatus: 'normal',
      inflammationSignStatus: 'tidak',
      environmentWorkloadStatus: 'aman',
    })
    expect(result.painLevel).toBe('medium')
    expect(result.postureLevel).toBe('high')
    expect(result.finalRiskCategory).toBe('high')
  })
})

describe('scorePhysicalIndependence', () => {
  it('menghasilkan kategori mandiri untuk skor minimal delapan', () => {
    expect(
      scorePhysicalIndependence([
        'independent',
        'independent',
        'independent',
        'assisted',
        'assisted',
      ]),
    ).toEqual({ score: 8, category: 'mandiri' })
  })

  it('menghasilkan ketergantungan untuk skor di bawah empat', () => {
    expect(
      scorePhysicalIndependence([
        'unable',
        'assisted',
        'unable',
        'assisted',
        'unable',
      ]).category,
    ).toBe('ketergantungan')
  })
})

describe('calculateBmi', () => {
  it('menghitung dan membulatkan BMI ke dua desimal', () => {
    expect(calculateBmi(170, 65)).toBe(22.49)
  })

  it('mengembalikan null untuk input tidak valid', () => {
    expect(calculateBmi(0, 65)).toBeNull()
    expect(calculateBmi(undefined, 65)).toBeNull()
  })
})
