import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Dumbbell,
  FileChartColumn,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Network,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import type { CurrentUser } from '#/server/auth'
import { logoutFn } from '#/server/auth'
import { Button, cn } from './ui'

const groups = [
  {
    label: 'Ikhtisar',
    items: [{ title: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Data Pos UKK',
    items: [
      { title: 'Pasien', to: '/dashboard/artisans', icon: Users },
      { title: 'Pos UKK', to: '/dashboard/centers', icon: Network },
      {
        title: 'Pemeriksaan Kesehatan',
        to: '/dashboard/health-assessments',
        icon: Stethoscope,
      },
    ],
  },
  {
    label: 'Skrining & Asesmen',
    items: [
      {
        title: 'Skrining LBP',
        to: '/dashboard/lbp-screenings',
        icon: HeartPulse,
      },
      { title: 'Risiko MSD', to: '/dashboard/msd-assessments', icon: Activity },
      {
        title: 'Kemandirian Fisik',
        to: '/dashboard/physical-independence',
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: 'Program',
    items: [
      {
        title: 'Jadwal Kegiatan',
        to: '/dashboard/schedules',
        icon: CalendarDays,
      },
      {
        title: 'Konten Latihan',
        to: '/dashboard/exercise-content',
        icon: Dumbbell,
      },
      {
        title: 'Evaluasi Aplikasi',
        to: '/dashboard/evaluations',
        icon: FileChartColumn,
      },
    ],
  },
  {
    label: 'Administrasi',
    adminOnly: true,
    items: [
      { title: 'Pengguna', to: '/dashboard/users', icon: UserCog },
      { title: 'Audit Data', to: '/dashboard/audit-log', icon: ShieldCheck },
      {
        title: 'Opsi Durasi LBP',
        to: '/dashboard/lbp-options',
        icon: Settings2,
      },
    ],
  },
] as const

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser
  children: ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const logout = async () => {
    await logoutFn()
    await navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen && (
        <button
          aria-label="Tutup navigasi"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-200',
          collapsed ? 'w-[76px]' : 'w-[272px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">
            P
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-semibold">E-Pos UKK</div>
              <div className="truncate text-xs text-muted-foreground">
                Penelitian UMI
              </div>
            </div>
          )}
          <Button
            className="ml-auto lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {groups
            .filter(
              (group) =>
                !('adminOnly' in group) || user.role === 'administrator',
            )
            .map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = location.pathname === item.to
                    const Icon = item.icon
                    const content = (
                      <>
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </>
                    )
                    const className = cn(
                      'flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent',
                      collapsed && 'justify-center px-0',
                    )
                    return item.to === '/dashboard' ? (
                      <Link
                        key={item.to}
                        to="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className={className}
                        title={collapsed ? item.title : undefined}
                      >
                        {content}
                      </Link>
                    ) : (
                      <Link
                        key={item.to}
                        to="/dashboard/$resource"
                        params={{
                          resource: item.to.replace('/dashboard/', ''),
                        }}
                        search={{ q: '' }}
                        onClick={() => setMobileOpen(false)}
                        className={className}
                        title={collapsed ? item.title : undefined}
                      >
                        {content}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
        </nav>
        <div className="border-t p-3">
          <div
            className={cn(
              'mb-2 flex items-center gap-3 rounded-lg bg-muted/60 p-3',
              collapsed && 'justify-center p-2',
            )}
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {initials(user.name)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.name}</div>
                <div className="truncate text-xs capitalize text-muted-foreground">
                  {user.role === 'administrator' ? 'Administrator' : 'Kader'}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={cn('w-full', collapsed ? 'px-0' : 'justify-start')}
            onClick={logout}
          >
            <LogOut className="size-4" />
            {!collapsed && 'Keluar'}
          </Button>
        </div>
      </aside>
      <div
        className={cn(
          'transition-[margin] duration-200',
          collapsed ? 'lg:ml-[76px]' : 'lg:ml-[272px]',
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <ChevronRight className="size-5" />
            ) : (
              <ChevronLeft className="size-5" />
            )}
          </Button>
          <div className="ml-3 min-w-0">
            <p className="truncate text-sm font-medium">
              Dashboard Penelitian Pos UKK
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Sistem pemantauan kesehatan kerja terpadu
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
        </main>
        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
          E-Pos UKK · TanStack Start + Turso + Drizzle ORM
        </footer>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(
    () => setDark(document.documentElement.classList.contains('dark')),
    [],
  )
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('posukk-theme', next ? 'dark' : 'light')
    setDark(next)
  }
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Ubah tema">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
