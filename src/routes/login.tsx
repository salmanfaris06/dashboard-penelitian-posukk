import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '#/components/login-page'
import { getCurrentUserFn } from '#/server/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) throw redirect({ to: '/dashboard' })
  },
  component: LoginPage,
})
