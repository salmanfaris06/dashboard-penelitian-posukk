import { useState } from 'react'
import {
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import type { CurrentUser } from '#/server/auth'
import type { ResourceName, TableData } from '#/server/data'
import { canMutateResource } from '#/domain/resource-config'
import type { FormOptions } from '#/domain/resource-config'
import { deleteResourceFn, getResourceRecordFn } from '#/server/mutations'
import { AppShell } from './app-shell'
import { ResourceForm } from './resource-form'
import { Badge, Button, Card, CardContent, Input, PageHeader } from './ui'

export function ResourcePage({
  user,
  resource,
  data,
  options,
  search,
  onSearch,
  onRefresh,
}: {
  user: CurrentUser
  resource: ResourceName
  data: TableData
  options: FormOptions
  search: string
  onSearch: (value: string) => void
  onRefresh: () => Promise<void>
}) {
  const editable = canMutateResource(resource, user.role)
  const [form, setForm] = useState<{
    id?: number
    values?: Record<string, string>
  } | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const edit = async (id: number) => {
    if (resource === 'audit-log') return
    setBusyId(id)
    setError('')
    try {
      const values = await getResourceRecordFn({ data: { resource, id } })
      setForm({ id, values })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Data gagal dimuat.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: number) => {
    if (resource === 'audit-log') return
    setBusyId(id)
    setError('')
    try {
      await deleteResourceFn({ data: { resource, id } })
      await onRefresh()
      setDeleteId(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Data gagal dihapus.')
    } finally {
      setBusyId(null)
    }
  }

  const exportCsv = () => {
    const escape = (value: unknown) =>
      `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = [
      data.columns.map((column) => escape(column.label)).join(','),
      ...data.rows.map((row) =>
        data.columns.map((column) => escape(row[column.key])).join(','),
      ),
    ].join('\n')
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${resource}-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <PageHeader
          title={data.title}
          description={data.description}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCsv}>
                <Download className="size-4" />
                Ekspor
              </Button>
              {editable && (
                <Button onClick={() => setForm({})}>
                  <Plus className="size-4" />
                  Tambah Data
                </Button>
              )}
            </div>
          }
        />
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(event) => onSearch(event.target.value)}
                  placeholder={`Cari ${data.title.toLowerCase()}...`}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {data.rows.length} data ditampilkan
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/45">
                  <tr>
                    {data.columns.map((column) => (
                      <th
                        key={column.key}
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {column.label}
                      </th>
                    ))}
                    {editable && (
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length ? (
                    data.rows.map((row, index) => {
                      const id = Number(row.id)
                      return (
                        <tr
                          key={String(row.id ?? index)}
                          className="border-t transition-colors hover:bg-muted/30"
                        >
                          {data.columns.map((column) => (
                            <td
                              key={column.key}
                              className="max-w-xs whitespace-nowrap px-4 py-3"
                            >
                              {renderValue(row[column.key], column.key)}
                            </td>
                          ))}
                          {editable && (
                            <td className="whitespace-nowrap px-4 py-2 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => edit(id)}
                                disabled={busyId === id}
                                aria-label="Edit"
                              >
                                {busyId === id ? (
                                  <LoaderCircle className="size-4 animate-spin" />
                                ) : (
                                  <Pencil className="size-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600"
                                onClick={() => setDeleteId(id)}
                                disabled={busyId === id}
                                aria-label="Hapus"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={data.columns.length + (editable ? 1 : 0)}
                        className="px-4 py-16 text-center text-muted-foreground"
                      >
                        Belum ada data untuk ditampilkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      {form && resource !== 'audit-log' && (
        <ResourceForm
          resource={resource}
          options={options}
          recordId={form.id}
          initialValues={form.values}
          onClose={() => setForm(null)}
          onSaved={onRefresh}
        />
      )}
      {deleteId !== null && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">Hapus data?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tindakan ini permanen dan tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => remove(deleteId)}
                disabled={busyId === deleteId}
              >
                {busyId === deleteId && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
                Hapus Permanen
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function renderValue(value: string | number | boolean | null, key: string) {
  if (value === null || value === '')
    return <span className="text-muted-foreground">—</span>
  if (typeof value === 'boolean')
    return (
      <Badge tone={value ? 'success' : 'neutral'}>
        {value ? 'Aktif' : 'Tidak aktif'}
      </Badge>
    )
  if (
    key.toLowerCase().includes('status') ||
    key.toLowerCase().includes('category') ||
    key === 'role'
  ) {
    const text = String(value).replaceAll('_', ' ')
    const tone = /high|tinggi|cancel|inactive/.test(String(value))
      ? 'danger'
      : /medium|scheduled|draft/.test(String(value))
        ? 'warning'
        : 'info'
    return <Badge tone={tone}>{text}</Badge>
  }
  if (
    (key.endsWith('At') || key.includes('Date')) &&
    typeof value === 'string'
  ) {
    const date = new Date(value)
    if (!Number.isNaN(date.valueOf()))
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        ...(value.includes('T') ? { timeStyle: 'short' as const } : {}),
      }).format(date)
  }
  return String(value)
}
