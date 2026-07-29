import { describe, expect, it } from 'vitest'
import {
  canManageUsers,
  canReadCenter,
  scopeCenterId,
} from '../../src/domain/authorization'

const admin = { id: 1, role: 'administrator' as const, posUkkCenterId: null }
const cadre = { id: 2, role: 'cadre' as const, posUkkCenterId: 7 }

describe('authorization', () => {
  it('hanya administrator yang dapat mengelola pengguna', () => {
    expect(canManageUsers(admin)).toBe(true)
    expect(canManageUsers(cadre)).toBe(false)
  })

  it('kader hanya dapat membaca pusatnya sendiri', () => {
    expect(canReadCenter(cadre, 7)).toBe(true)
    expect(canReadCenter(cadre, 8)).toBe(false)
    expect(canReadCenter(admin, 8)).toBe(true)
  })

  it('memberikan scope null untuk admin dan center id untuk kader', () => {
    expect(scopeCenterId(admin)).toBeNull()
    expect(scopeCenterId(cadre)).toBe(7)
  })
})
