import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardPage } from '#/components/dashboard-page'
import { getCurrentUserFn } from '#/server/auth'
import { getDashboardFn } from '#/server/data'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const user = await getCurrentUserFn()
    if (!user) throw redirect({ to: '/login' })
    return getDashboardFn()
  },
  component: DashboardRoute,
})

function DashboardRoute() {
  return <DashboardPage data={Route.useLoaderData()} />
}
