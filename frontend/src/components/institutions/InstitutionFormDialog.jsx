import { useState } from 'react'
import { isValidPhone, isValidEmail, isValidWebsite } from '../../lib/format'
import { useFieldValidation } from '../../lib/useFieldValidation'
import { Dialog } from '../ui/Dialog'
import { Field, TextInput, Select } from '../ui/Field'
import { Button } from '../ui/Button'

const INSTITUTION_TYPES = [
  { value: 'Hospital', label: 'Hospital' },
  { value: 'Clinic', label: 'Clínica' },
  { value: 'Laboratory', label: 'Laboratorio' },
  { value: 'Pharmacy', label: 'Farmacia' },
  { value: 'Diagnostic Center', label: 'Centro de Diagnóstico' },
  { value: 'Nursing Home', label: 'Residencia de Mayores' },
  { value: 'Consultorio', label: 'Consultorio' },
  { value: 'Other', label: 'Otro' },
]

const EMPTY_FORM = { name: '', type: '', address: '', phone: '', email: '', website: '' }

function toForm(institution) {
  if (!institution) return EMPTY_FORM
  return {
    name: institution.name || '',
    type: institution.type || '',
    address: institution.address || '',
    phone: institution.phone || '',
    email: institution.email || '',
    website: institution.website || '',
  }
}

function computeErrors(f) {
  const next = {}
  if (!f.name.trim()) next.name = 'El nombre de la institución es obligatorio'
  if (!isValidEmail(f.email.trim())) next.email = 'Por favor ingresa un correo electrónico válido'
  if (!isValidPhone(f.phone.trim())) next.phone = 'El teléfono solo puede contener números, +, espacios y guiones'
  if (!isValidWebsite(f.website.trim())) next.website = 'El sitio web debe comenzar con http:// o https://'
  return next
}

/** Shared add/edit form for institutions — used from the list page (add) and the detail page (edit). */
export function InstitutionFormDialog({ open, onOpenChange, institution, onSubmit, saving }) {
  const [form, setForm] = useState(() => toForm(institution))
  const [isCustomType, setIsCustomType] = useState(() => {
    if (!institution?.type) return false
    return !INSTITUTION_TYPES.some((t) => t.value === institution.type)
  })

  const { errors, touch, guardSubmit } = useFieldValidation(form, computeErrors)

  function handleSubmit(e) {
    e.preventDefault()
    if (guardSubmit()) return
    onSubmit({
      name: form.name.trim(),
      type: form.type?.trim() || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
    })
  }

  let submitLabel = institution ? 'Actualizar institución' : 'Guardar institución'
  if (saving) submitLabel = 'Guardando…'

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={institution ? 'Editar institución' : 'Agregar nueva institución'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="name" required error={errors.name}>
            <TextInput
              id="name"
              value={form.name}
              error={errors.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onBlur={() => touch('name')}
            />
          </Field>
          <Field
            label="Tipo"
            htmlFor="type"
            hint={
              isCustomType ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomType(false)
                    setForm((f) => ({ ...f, type: '' }))
                  }}
                  className="text-xs text-glow-b underline hover:opacity-80"
                >
                  ← Elegir de la lista
                </button>
              ) : null
            }
          >
            {isCustomType ? (
              <TextInput
                id="type"
                placeholder="Escribe el nuevo tipo de institución…"
                value={form.type}
                autoFocus
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              />
            ) : (
              <Select
                id="type"
                value={form.type}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '__custom__') {
                    setIsCustomType(true)
                    setForm((f) => ({ ...f, type: '' }))
                  } else {
                    setForm((f) => ({ ...f, type: val }))
                  }
                }}
              >
                <option value="">Selecciona el tipo…</option>
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
                <option value="__custom__" className="font-semibold text-glow-b">
                  + Agregar nuevo tipo al vuelo…
                </option>
              </Select>
            )}
          </Field>
        </div>

        <Field label="Dirección" htmlFor="address">
          <TextInput id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Teléfono" htmlFor="phone" error={errors.phone}>
            <TextInput
              id="phone"
              value={form.phone}
              error={errors.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              onBlur={() => touch('phone')}
            />
          </Field>
          <Field label="Correo electrónico" htmlFor="email" error={errors.email}>
            <TextInput
              id="email"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={() => touch('email')}
            />
          </Field>
        </div>

        <Field label="Sitio web" htmlFor="website" error={errors.website}>
          <TextInput
            id="website"
            placeholder="https://"
            value={form.website}
            error={errors.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            onBlur={() => touch('website')}
          />
        </Field>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
