export type UserRole = 'administrator' | 'cadre'

export type AuthorizationUser = {
  id: number
  role: UserRole
  posUkkCenterId: number | null
}

export const canManageUsers = (user: AuthorizationUser) =>
  user.role === 'administrator'

export const canReadCenter = (user: AuthorizationUser, centerId: number) =>
  user.role === 'administrator' || user.posUkkCenterId === centerId

export const scopeCenterId = (user: AuthorizationUser) =>
  user.role === 'cadre' ? user.posUkkCenterId : null

export const canManageGlobalConfiguration = (user: AuthorizationUser) =>
  user.role === 'administrator'

export const canDeleteUser = (actor: AuthorizationUser, subjectId: number) =>
  actor.role === 'administrator' && actor.id !== subjectId
