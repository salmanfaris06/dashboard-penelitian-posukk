import { describe, expect, it } from 'vitest'
import { createSessionToken, hashSessionToken } from '../../src/domain/session'

describe('session token', () => {
  it('menghasilkan token acak dan hanya menyimpan hash SHA-256', () => {
    const first = createSessionToken()
    const second = createSessionToken()
    expect(first).not.toBe(second)
    expect(first.length).toBeGreaterThanOrEqual(40)
    expect(hashSessionToken(first)).toMatch(/^[a-f0-9]{64}$/)
    expect(hashSessionToken(first)).not.toContain(first)
  })
})
