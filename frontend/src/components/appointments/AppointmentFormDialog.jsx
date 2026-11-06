import { useState } from 'react'
import { usePatients, useDoctors, useInstitutions } from '../../lib/queries'
import { toDatetimeLocal } from '../../lib/format'
import { useFieldValidation } from '../../lib/useFieldValidation'
import { Dialog } from '../ui/Dialog'
import { Field, TextInput, Select, Textarea } from '../ui/Field'
import { Button } from '../ui/Button'

export const APPOINTMENT_TYPES = [
  { value: 'Consultation', label: 'Consulta' },
  { value: 'Follow-up', label: 'Seguimiento' },
  { value: 'Emergency', label: 'Urgencia' },
  { value: 'Routine Check-up', label: 'Control de rutina' },
  { value: 'Specialist Referral', label: 'Derivación a especialista' },
  { value: 'Diagnostic', label: 'Diagnóstico' },
  { value: 'Treatment', label: 'Tratamiento' },
  { value: 'Other', label: 'Otro' },
]

const EMPTY_FORM = {
  patient_id: '',
  doctor_id: '',
  institution_id: '',
  appointment_date: '',
  type: '',
  status: 'scheduled',
  notes: '',
  diagnosis: '',
}

function toForm(appointment) {
  if (!appointment) return EMPTY_FORM
  return {
    patient_id: appointment.patient_id || '',
    doctor_id: appointment.doctor_id || '',
    institution_id: appointment.institution_id || '',
    appointment_date: toDatetimeLocal(appointment.appointment_date),
    type: appointment.type || '',
    status: appointment.status || 'scheduled',
    notes: appointment.notes || '',
    diagnosis: appointment.diagnosis || '',
  }
}

/** Shared add/edit form for appointments — used from the list page (add) and the detail page (edit).
 * PUT has no server-side defaults or required-field checks (unlike POST), so payload always
 * includes patient_id/appointment_date/status in full to avoid a 500 from a null NOT NULL column. */
export function AppointmentFormDialog({ open, onOpenChange, appointment, onSubmit, saving }) {
  const [form, setForm] = useState(() => toForm(appointment))
  const [isCustomType, setIsCustomType] = useState(() => {
    if (!appointment?.type) return false
    return !APPOINTMENT_TYPES.some((t) => t.value === appointment.type || t.label.toLowerCase() === appointment.type.toLowerCase())
  })
  const { data: patients } = usePatients()
  const { data: doctors } = useDoctors()
  const { data: institutions } = useInstitutions()

  function computeErrors(f) {
    const next = {}
    if (!f.patient_id) next.patient_id = 'Por favor selecciona un paciente'
    if (!f.appointment_date) next.appointment_date = 'Por favor selecciona fecha y hora'
    if (f.appointment_date && !appointment && f.status === 'scheduled') {
      if (new Date(f.appointment_date) < new Date()) {
        next.appointment_date = 'No se puede agendar una cita en el pasado'
      }
    }
    return next
  }

  const { errors, touch, guardSubmit } = useFieldValidation(form, computeErrors)

  function handleSubmit(e) {
    e.preventDefault()
    if (guardSubmit()) return
    onSubmit({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id || null,
      institution_id: form.institution_id || null,
      appointment_date: new Date(form.appointment_date).toISOString(),
      type: form.type?.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
      diagnosis: form.diagnosis.trim() || null,
    })
  }

  let submitLabel = appointment ? 'Actualizar cita' : 'Guardar cita'
  if (saving) submitLabel = 'Guardando…'

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={appointment ? 'Editar cita' : 'Agendar cita'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Paciente" htmlFor="patient_id" required error={errors.patient_id}>
          <Select
            id="patient_id"
            value={form.patient_id}
            error={errors.patient_id}
            onChange={(e) => {
              setForm((f) => ({ ...f, patient_id: e.target.value }))
              touch('patient_id')
            }}
          >
            <option value="">Selecciona un paciente…</option>
            {(patients ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Médico" htmlFor="doctor_id">
            <Select id="doctor_id" value={form.doctor_id} onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))}>
              <option value="">No especificado</option>
              {(doctors ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.first_name} {d.last_name}
                  {d.specialty ? ` - ${d.specialty}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Institución" htmlFor="institution_id">
            <Select id="institution_id" value={form.institution_id} onChange={(e) => setForm((f) => ({ ...f, institution_id: e.target.value }))}>
              <option value="">No especificado</option>
              {(institutions ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.type ? ` (${i.type})` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha y hora" htmlFor="appointment_date" required error={errors.appointment_date}>
            <TextInput
              id="appointment_date"
              type="datetime-local"
              value={form.appointment_date}
              error={errors.appointment_date}
              onChange={(e) => setForm((f) => ({ ...f, appointment_date: e.target.value }))}
              onBlur={() => touch('appointment_date')}
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
                placeholder="Escribe el tipo de cita…"
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
                {APPOINTMENT_TYPES.map((t) => (
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

        <Field label="Estado" htmlFor="status">
          <Select id="status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="scheduled">Programada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </Select>
        </Field>

        <Field label="Notas" htmlFor="notes">
          <Textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Cualquier nota adicional o indicación…" />
        </Field>

        {form.status === 'completed' && (
          <Field label="Diagnóstico" htmlFor="diagnosis">
            <Textarea id="diagnosis" value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} />
          </Field>
        )}

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
