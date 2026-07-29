import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LoaderCircle, LockKeyhole } from 'lucide-react'
import { loginFn } from '#/server/auth'
import { Button, Card, CardContent, CardHeader, Input } from './ui'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@epos-ukk.test')
  const [password, setPassword] = useState('password')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const result = await loginFn({ data: { email, password, remember } })
      if (!result.ok) return setError(result.error)
      await navigate({ to: '/dashboard' })
    } catch {
      setError('Tidak dapat terhubung ke server. Silakan coba kembali.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-muted/35 lg:grid-cols-[1.1fr_.9fr]">
      <div className="relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,.35),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(59,130,246,.28),transparent_35%)]" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-white font-bold text-zinc-950">
            P
          </div>
          <div>
            <div className="text-lg font-semibold">E-Pos UKK</div>
            <div className="text-sm text-white/60">
              Dashboard Penelitian UMI
            </div>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="text-4xl font-semibold leading-tight">
            Pemantauan kesehatan kerja yang lebih terukur dan terintegrasi.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-white/65">
            Kelola pasien, pemeriksaan kesehatan, skrining LBP, risiko MSD, dan
            program latihan dalam satu sistem.
          </p>
        </div>
        <p className="relative text-sm text-white/45">
          TanStack Start · Turso · Drizzle ORM
        </p>
      </div>
      <div className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
              P
            </div>
            <h1 className="text-xl font-semibold">E-Pos UKK</h1>
          </div>
          <Card>
            <CardHeader className="items-center text-center">
              <div className="mb-2 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                <LockKeyhole className="size-5" />
              </div>
              <h1 className="text-xl font-semibold">Selamat datang kembali</h1>
              <p className="text-sm text-muted-foreground">
                Masuk untuk melanjutkan ke dashboard.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Alamat email</span>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Kata sandi</span>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="size-4 rounded border"
                  />
                  Ingat saya selama 30 hari
                </label>
                {error && (
                  <div
                    role="alert"
                    className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400"
                  >
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending && <LoaderCircle className="size-4 animate-spin" />}
                  {pending ? 'Memproses...' : 'Masuk'}
                </Button>
              </form>
              <div className="mt-5 rounded-lg bg-muted/65 p-3 text-xs text-muted-foreground">
                <p>
                  <strong>Admin:</strong> admin@epos-ukk.test
                </p>
                <p>
                  <strong>Kader:</strong> kader@epos-ukk.test
                </p>
                <p>
                  <strong>Password:</strong> password
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
