import {
  Activity,
  CalendarClock,
  HeartPulse,
  Stethoscope,
  Users,
} from 'lucide-react'
import type { CurrentUser } from '#/server/auth'
import { AppShell } from './app-shell'
import { Badge, Card, CardContent, CardHeader, PageHeader } from './ui'

type DashboardData = {
  user: CurrentUser
  stats: {
    artisans: number
    healthAssessments: number
    lbpScreenings: number
    highRisk: number
  }
  recentArtisans: Array<{
    id: number
    name: string
    respondentNumber: string | null
    occupation: string
    center: string
    createdAt: Date | string
  }>
  riskDistribution: Array<{ name: string; value: number }>
  upcomingActivities: Array<{
    id: number
    title: string
    startsAt: Date | string
    location: string | null
    status: string
  }>
}

export function DashboardPage({ data }: { data: DashboardData }) {
  const cards = [
    {
      label: 'Total Pasien',
      value: data.stats.artisans,
      hint: 'Terdaftar di Pos UKK',
      icon: Users,
      tone: 'text-blue-600 bg-blue-500/10',
    },
    {
      label: 'Pemeriksaan Kesehatan',
      value: data.stats.healthAssessments,
      hint: 'Riwayat pemeriksaan',
      icon: Stethoscope,
      tone: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: 'Skrining LBP',
      value: data.stats.lbpScreenings,
      hint: 'Skrining tersimpan',
      icon: HeartPulse,
      tone: 'text-violet-600 bg-violet-500/10',
    },
    {
      label: 'Risiko Tinggi',
      value: data.stats.highRisk,
      hint: 'Perlu tindak lanjut',
      icon: Activity,
      tone: 'text-red-600 bg-red-500/10',
    },
  ]
  const maxRisk = Math.max(
    1,
    ...data.riskDistribution.map((entry) => entry.value),
  )

  return (
    <AppShell user={data.user}>
      <div className="space-y-6">
        <PageHeader
          title={`Selamat datang, ${data.user.name.split(' ')[0]}`}
          description="Ringkasan kondisi kesehatan kerja dan aktivitas Pos UKK hari ini."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, hint, icon: Icon, tone }) => (
            <Card key={label} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`grid size-11 place-items-center rounded-xl ${tone}`}
                >
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className="mt-1 text-2xl font-semibold">
                    {value.toLocaleString('id-ID')}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Pasien Terbaru</h2>
              <p className="text-sm text-muted-foreground">
                Data pasien yang baru ditambahkan.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-3 pr-4">Pasien</th>
                      <th className="py-3 pr-4">Responden</th>
                      <th className="py-3 pr-4">Pekerjaan</th>
                      <th className="py-3">Pos UKK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentArtisans.length ? (
                      data.recentArtisans.map((row) => (
                        <tr key={row.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{row.name}</td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {row.respondentNumber ?? '—'}
                          </td>
                          <td className="py-3 pr-4">{row.occupation}</td>
                          <td className="py-3">
                            <Badge tone="info">{row.center}</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 text-center text-muted-foreground"
                        >
                          Belum ada data pasien.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Distribusi Risiko MSD</h2>
              <p className="text-sm text-muted-foreground">
                Perbandingan kategori risiko terakhir.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {data.riskDistribution.length ? (
                data.riskDistribution.map((entry) => (
                  <div key={entry.name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{entry.name}</span>
                      <span className="font-semibold">{entry.value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${entry.name === 'Tinggi' ? 'bg-red-500' : entry.name === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{
                          width: `${Math.max(8, (entry.value / maxRisk) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid min-h-44 place-items-center text-sm text-muted-foreground">
                  Belum ada asesmen MSD.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" />
              <div>
                <h2 className="font-semibold">Agenda Mendatang</h2>
                <p className="text-sm text-muted-foreground">
                  Jadwal kegiatan Pos UKK terdekat.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.upcomingActivities.length ? (
                data.upcomingActivities.map((item) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium">{item.title}</h3>
                      <Badge tone="warning">{item.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {formatDate(item.startsAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.location ?? 'Lokasi belum ditentukan'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                  Belum ada agenda mendatang.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
