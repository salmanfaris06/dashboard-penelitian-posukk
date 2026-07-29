import {
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { z } from 'zod'
import { ResourcePage } from '#/components/resource-page'
import { getCurrentUserFn } from '#/server/auth'
import { listResourceFn } from '#/server/data'
import type { ResourceName } from '#/server/data'
import { getFormOptionsFn } from '#/server/mutations'

const resources: ResourceName[] = [
  'artisans',
  'centers',
  'users',
  'health-assessments',
  'lbp-screenings',
  'msd-assessments',
  'physical-independence',
  'schedules',
  'exercise-content',
  'evaluations',
  'audit-log',
  'lbp-options',
]

export const Route = createFileRoute('/dashboard_/$resource')({
  validateSearch: z.object({ q: z.string().catch('') }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ params, deps }) => {
    const user = await getCurrentUserFn()
    if (!user) throw redirect({ to: '/login' })
    if (!resources.includes(params.resource as ResourceName)) throw notFound()
    const [data, options] = await Promise.all([
      listResourceFn({
        data: { resource: params.resource as ResourceName, search: deps.q },
      }),
      getFormOptionsFn(),
    ])
    return { user, data, options }
  },
  component: ResourceRoute,
})

function ResourceRoute() {
  const { user, data, options } = Route.useLoaderData()
  const { resource } = Route.useParams()
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  return (
    <ResourcePage
      user={user}
      resource={resource as ResourceName}
      data={data}
      options={options}
      search={q}
      onSearch={(value) => navigate({ search: { q: value }, replace: true })}
      onRefresh={() => router.invalidate()}
    />
  )
}
