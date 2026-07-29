import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export type CurrentUser = {
  id: number
  name: string
  email: string
  role: 'administrator' | 'cadre'
  isActive: boolean
  posUkkCenterId: number | null
}

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  remember: z.boolean().default(false),
})
export type LoginInput = z.infer<typeof loginSchema>

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await import('./auth.server')
    return currentUser()
  },
)

export const loginFn = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const { login } = await import('./auth.server')
    return login(data)
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const { logout } = await import('./auth.server')
  return logout()
})
