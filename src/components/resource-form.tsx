import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import type { ResourceName } from '#/server/data'
import { resourceFields } from '#/domain/resource-config'
import type { FormOptions } from '#/domain/resource-config'
import { mutateResourceFn } from '#/server/mutations'
import { Button, Input, cn } from './ui'

export function ResourceForm({
  resource,
  options,
  recordId,
  initialValues,
  onClose,
  onSaved,
}: {
  resource: ResourceName
  options: FormOptions
  recordId?: number
  initialValues?: Record<string, string>
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const fields = resourceFields[resource] ?? []
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const defaults = Object.fromEntries(
      fields.map((field) => {
        if (field.type === 'checkbox') return [field.name, 'true']
        if (field.type === 'date' && /At$/.test(field.name))
          return [field.name, today]
        if (field.options?.length)
          return [field.name, field.options[0]?.value ?? '']
        if (field.optionSource && options[field.optionSource][0])
          return [field.name, String(options[field.optionSource][0].value)]
        if (field.name === 'city') return [field.name, 'Jambi']
        return [field.name, '']
      }),
    )
    setValues({
      ...defaults,
      ...initialValues,
      ...(recordId ? { password: '' } : {}),
    })
  }, [fields, initialValues, options, recordId])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await mutateResourceFn({
        data: {
          resource: resource as Exclude<ResourceName, 'audit-log'>,
          id: recordId,
          values,
        },
      })
      await onSaved()
      onClose()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Data gagal disimpan.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold">
              {recordId ? 'Edit' : 'Tambah'} Data
            </h2>
            <p className="text-sm text-muted-foreground">
              Lengkapi data di bawah ini lalu simpan.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <form onSubmit={submit}>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            {fields.map((field) => {
              const fieldOptions = field.optionSource
                ? options[field.optionSource].map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  }))
                : field.options
              return (
                <label
                  key={field.name}
                  className={cn('space-y-2', field.full && 'sm:col-span-2')}
                >
                  <span className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </span>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                      value={values[field.name] ?? ''}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      required={field.required}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={values[field.name] ?? ''}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      required={field.required}
                    >
                      <option value="">Pilih...</option>
                      {fieldOptions?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <span className="flex h-10 items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={values[field.name] === 'true'}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [field.name]: event.target.checked
                              ? 'true'
                              : 'false',
                          }))
                        }
                      />{' '}
                      Aktif
                    </span>
                  ) : (
                    <Input
                      type={field.type ?? 'text'}
                      value={values[field.name] ?? ''}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      required={
                        field.required &&
                        !(recordId && field.type === 'password')
                      }
                      placeholder={field.placeholder}
                      step={field.type === 'number' ? 'any' : undefined}
                    />
                  )}
                </label>
              )
            })}
            {error && (
              <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400 sm:col-span-2">
                {error}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {pending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
