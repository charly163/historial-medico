import { useState } from 'react'
import { useFieldValidation } from '../../lib/useFieldValidation'
import { Dialog } from '../ui/Dialog'
import { Field, TextInput, Select, Textarea } from '../ui/Field'
import { Button } from '../ui/Button'

export const CONDITION_CATEGORIES = [
  { value: 'Cardiovascular', label: 'Cardiovascular' },
  { value: 'Respiratoria', label: 'Respiratoria' },
  { value: 'Neurológica', label: 'Neurológica' },
  { value: 'Gastrointestinal', label: 'Gastrointestinal' },
  { value: 'Endocrina', label: 'Endocrina' },
  { value: 'Musculoesquelética', label: 'Musculoesquelética' },
  { value: 'Dermatológica', label: 'Dermatológica' },
  { value: 'Psiquiátrica', label: 'Psiquiátrica' },
  { value: 'Infecciosa', label: 'Enfermedades Infecciosas' },
  { value: 'Oncológica', label: 'Oncológica' },
  { value: 'Hematológica', label: 'Hematológica' },
  { value: 'Renal', label: 'Renal / Nefrológica' },
  { value: 'Oftalmológica', label: 'Oftalmológica' },
  { value: 'ORL', label: 'Otorrinolaringología (ORL)' },
  { value: 'Ginecológica', label: 'Ginecológica' },
  { value: 'Pediátrica', label: 'Pediátrica' },
  { value: 'Urgencias', label: 'Urgencias / Emergencias' },
  { value: 'Inmunológica', label: 'Inmunológica' },
  { value: 'Reumatológica', label: 'Reumatológica' },
  { value: 'Otra', label: 'Otra' },
]

const ICD_REGEX = /^[A-Z]\d{2}(\.\d+)?$/i

const EMPTY_FORM = { name: '', description: '', icd_code: '', category: '', severity: '' }

function toForm(condition) {
  if (!condition) return EMPTY_FORM
  return {
    name: condition.name || '',
    description: condition.description || '',
    icd_code: condition.icd_code || '',
    category: condition.category || '',
    severity: condition.severity || '',
  }
}

function computeErrors(f) {
  const next = {}
  if (!f.name.trim()) next.name = 'El nombre de la condición es obligatorio'
  if (f.icd_code.trim() && !ICD_REGEX.test(f.icd_code.trim())) {
    next.icd_code = 'El código CIE-10 debe tener el formato A12 o A12.34'
  }
  return next
}

/** Shared add/edit form for medical conditions — used from the list page (add) and the detail page (edit). */
export function ConditionFormDialog({ open, onOpenChange, condition, onSubmit, saving }) {
  const [form, setForm] = useState(() => toForm(condition))
  const [isCustomCategory, setIsCustomCategory] = useState(() => {
    if (!condition?.category) return false
    return !CONDITION_CATEGORIES.some(
      (c) => c.value.toLowerCase() === condition.category.toLowerCase() || c.label.toLowerCase() === condition.category.toLowerCase()
    )
  })

  const { errors, touch, guardSubmit } = useFieldValidation(form, computeErrors)

  function handleSubmit(e) {
    e.preventDefault()
    if (guardSubmit()) return
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      icd_code: form.icd_code.trim().toUpperCase() || null,
      category: form.category?.trim() || null,
      severity: form.severity || null,
    })
  }

  let submitLabel = condition ? 'Actualizar diagnóstico' : 'Guardar diagnóstico'
  if (saving) submitLabel = 'Guardando…'

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={condition ? 'Editar diagnóstico' : 'Agregar condición médica'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Nombre" htmlFor="name" required error={errors.name}>
          <TextInput
            id="name"
            value={form.name}
            error={errors.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onBlur={() => touch('name')}
          />
        </Field>

        <Field label="Descripción" htmlFor="description">
          <Textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Código CIE-10" htmlFor="icd_code" error={errors.icd_code}>
            <TextInput
              id="icd_code"
              placeholder="A12.34"
              value={form.icd_code}
              error={errors.icd_code}
              onChange={(e) => setForm((f) => ({ ...f, icd_code: e.target.value }))}
              onBlur={() => touch('icd_code')}
            />
          </Field>
          <Field
            label="Categoría"
            htmlFor="category"
            hint={
              isCustomCategory ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false)
                    setForm((f) => ({ ...f, category: '' }))
                  }}
                  className="text-xs text-glow-b underline hover:opacity-80"
                >
                  ← Elegir de la lista
                </button>
              ) : null
            }
          >
            {isCustomCategory ? (
              <TextInput
                id="category"
                placeholder="Escribe la nueva categoría médica…"
                value={form.category}
                autoFocus
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            ) : (
              <Select
                id="category"
                value={form.category}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '__custom__') {
                    setIsCustomCategory(true)
                    setForm((f) => ({ ...f, category: '' }))
                  } else {
                    setForm((f) => ({ ...f, category: val }))
                  }
                }}
              >
                <option value="">Seleccionar categoría…</option>
                {CONDITION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
                <option value="__custom__" className="font-semibold text-glow-b">
                  + Agregar nueva categoría al vuelo…
                </option>
              </Select>
            )}
          </Field>
        </div>

        <Field label="Gravedad" htmlFor="severity">
          <Select id="severity" value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}>
            <option value="">No establecida</option>
            <option value="Low">Baja</option>
            <option value="Medium">Media</option>
            <option value="High">Alta</option>
          </Select>
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
