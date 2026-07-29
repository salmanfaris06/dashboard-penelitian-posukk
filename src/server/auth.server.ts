import { randomUUID } from 'node:crypto'
import { compare } from 'bcryptjs'
import { and, eq, gt } from 'drizzle-orm'
import {
  getRequestHeader,
  setResponseHeader,
} from '@tanstack/react-start/server'
import { createSessionToken, hashSessionToken } from '#/domain/session'
import { db } from '#/db/client'
import { sessions, users } from '#/db/schema'
import type { CurrentUser, LoginInput } from './auth'

const COOKIE_NAME = 'posukk_session'
const DAY_SECONDS = 60 * 60 * 24

function cookieToken(): string | null {
  const header = getRequestHeader('cookie')
  if (!header) return null
  for (const part of header.split(/;\s*/)) {
    const separator = part.indexOf('=')
    if (separator > -1 && part.slice(0, separator) === COOKIE_NAME) {
      return decodeURIComponent(part.slice(separator + 1))
    }
  }
  return null
}

function writeSessionCookie(token: string, maxAge: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  setResponseHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`,
  )
}

function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  setResponseHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
  )
}

export async function currentUser(): Promise<CurrentUser | null> {
  const token = cookieToken()
  if (!token) return null
  const records = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      posUkkCenterId: users.posUkkCenterId,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1)
  const record = records.at(0)
  return record?.isActive ? record : null
}

export async function login(data: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, data.email.toLowerCase()),
  })
  const passwordMatches = user
    ? await compare(data.password, user.passwordHash)
    : false
  if (!user || !passwordMatches || !user.isActive) {
    return {
      ok: false as const,
      error: 'Email, kata sandi, atau status akun tidak valid.',
    }
  }
  await db.delete(sessions).where(eq(sessions.userId, user.id))
  const rawToken = createSessionToken()
  const maxAge = (data.remember ? 30 : 1) * DAY_SECONDS
  await db.insert(sessions).values({
    id: randomUUID(),
    userId: user.id,
    tokenHash: hashSessionToken(rawToken),
    expiresAt: new Date(Date.now() + maxAge * 1000),
  })
  writeSessionCookie(rawToken, maxAge)
  return {
    ok: true as const,
    user: { id: user.id, name: user.name, role: user.role },
  }
}

export async function logout() {
  const token = cookieToken()
  if (token)
    await db
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashSessionToken(token)))
  clearSessionCookie()
  return { ok: true }
}
