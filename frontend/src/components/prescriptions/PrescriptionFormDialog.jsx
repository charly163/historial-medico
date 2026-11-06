import { useMemo, useState } from 'react'
import { useAppointments, useMedications } from '../../lib/queries'
import { formatDate } from '../../lib/format'
import { useFieldValidation } from '../../lib/useFieldValidation'
import { Dialog } from '../ui/Dialog'
import { Field, TextInput, Select, Textarea } from '../ui/Field'
import { Button } from '../ui/Button'

export const FREQUENCIES = [
  { value: 'Una vez al día', label: 'Una vez al día (cada 24 hs)' },
  { value: 'Dos veces al día', label: 'Dos veces al día (cada 12 hs)' },
  { value: 'Tres veces al día', label: 'Tres veces al día (cada 8 hs)' },
  { value: 'Cuatro veces al día', label: 'Cuatro veces al día (cada 6 hs)' },
  { value: 'Cada 4 horas', label: 'Cada 4 horas' },
  { value: 'Cada 6 horas', label: 'Cada 6 horas' },
  { value: 'Cada 8 horas', label: 'Cada 8 horas' },
  { value: 'Cada 12 horas', label: 'Cada 12 horas' },
  { value: 'Según sea necesario', label: 'Según sea necesario (a demanda)' },
  { value: 'Antes de las comidas', label: 'Antes de las comidas' },
  { value: 'Después de las comidas', label: 'Después de las comidas' },
  { value: 'Al acostarse', label: 'Al acostarse (antes de dormir)' },
]

export const FREQUENCY_TRANSLATIONS = {
  'once daily': 'Una vez al día',
  'twice daily': 'Dos veces al día',
  'three times daily': 'Tres veces al día',
  'four times daily': 'Cuatro veces al día',
  'every 4 hours': 'Cada 4 horas',
  'every 6 hours': 'Cada 6 horas',
  'every 8 hours': 'Cada 8 horas',
  'every 12 hours': 'Cada 12 horas',
  'as needed': 'Según sea necesario',
  'before meals': 'Antes de las comidas',
  'after meals': 'Después de las comidas',
  'at bedtime': 'Al acostarse',
}

export function normalizeFrequency(freq) {
  if (!freq) return ''
  const lower = freq.trim().toLowerCase()
  return FREQUENCY_TRANSLATIONS[lower] || freq
}

const EMPTY_FORM = {
  appointment_id: '',
  medication_id: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
  status: 'active',
}

function toForm(prescription) {
  if (!prescription) return EMPTY_FORM
  return {
    appointment_id: prescription.appointment_id || '',
    medication_id: prescription.medication_id || '',
    dosage: prescription.dosage || '',
    frequency: normalizeFrequency(prescription.frequency) || '',
    duration: prescription.duration || '',
    instructions: prescription.instructions || '',
    status: prescription.status || 'active',
  }
}

function computeErrors(f) {
  const next = {}
  if (!f.appointment_id) next.appointment_id = 'Por favor selecciona una cita'
  if (!f.medication_id) next.medication_id = 'Por favor selecciona un medicamento'
  if (!f.dosage.trim()) next.dosage = 'La dosis es obligatoria'
  if (!f.frequency) next.frequency = 'Por favor selecciona una frecuencia'
  if (!f.duration.trim()) next.duration = 'La duración es obligatoria'
  return next
}

/** Shared add/edit form for prescriptions — used from the list page (add) and the detail page (edit). */
export function PrescriptionFormDialog({ open, onOpenChange, prescription, onSubmit, saving }) {
  const [form, setForm] = useState(() => toForm(prescription))
  const { data: appointments } = useAppointments()
  const { data: medications } = useMedications()

  const sortedAppointments = useMemo(
    () => [...(appointments ?? [])].sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)),
    [appointments],
  )

  const selectedAppointment = (appointments ?? []).find((a) => a.id === form.appointment_id)

  const { errors, touch, guardSubmit } = useFieldValidation(form, computeErrors)

  function handleSubmit(e) {
    e.preventDefault()
    if (guardSubmit()) return
    onSubmit({
      appointment_id: form.appointment_id,
      medication_id: form.medication_id,
      dosage: form.dosage.trim(),
      frequency: form.frequency,
      duration: form.duration.trim(),
      instructions: form.instructions.trim() || null,
      status: form.status,
    })
  }

  let submitLabel = prescription ? 'Actualizar receta' : 'Guardar receta'
  if (saving) submitLabel = 'Guardando…'

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={prescription ? 'Editar receta' : 'Agregar receta'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Cita / Turno" htmlFor="appointment_id" required error={errors.appointment_id}>
          <Select
            id="appointment_id"
            value={form.appointment_id}
            error={errors.appointment_id}
            onChange={(e) => {
              setForm((f) => ({ ...f, appointment_id: e.target.value }))
              touch('appointment_id')
            }}
          >
            <option value="">Seleccionar cita</option>
            {sortedAppointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.patient_first_name} {a.patient_last_name} - {formatDate(a.appointment_date)}
                {a.type ? ` (${a.type})` : ''}
              </option>
            ))}
          </Select>
        </Field>

        {selectedAppointment && (
          <div className="rounded-[10px] bg-glass-2 p-3 text-xs text-muted">
            <span className="font-semibold text-text">Paciente:</span> {selectedAppointment.patient_first_name} {selectedAppointment.patient_last_name}
            {selectedAppointment.doctor_first_name && (
              <>
                {' '}
                • <span className="font-semibold text-text">Médico:</span> Dr. {selectedAppointment.doctor_first_name} {selectedAppointment.doctor_last_name}
              </>
            )}
          </div>
        )}

        <Field label="Medicamento" htmlFor="medication_id" required error={errors.medication_id}>
          <Select
            id="medication_id"
            value={form.medication_id}
            error={errors.medication_id}
            onChange={(e) => {
              setForm((f) => ({ ...f, medication_id: e.target.value }))
              touch('medication_id')
            }}
          >
            <option value="">Seleccionar medicamento</option>
            {(medications ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.generic_name ? ` (${m.generic_name})` : ''}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Dosis" htmlFor="dosage" required error={errors.dosage}>
            <TextInput
              id="dosage"
              placeholder="ej. 500 mg, 1 comprimido"
              value={form.dosage}
              error={errors.dosage}
              onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
              onBlur={() => touch('dosage')}
            />
          </Field>
          <Field label="Frecuencia" htmlFor="frequency" required error={errors.frequency}>
            <Select
              id="frequency"
              value={form.frequency}
              error={errors.frequency}
              onChange={(e) => {
                setForm((f) => ({ ...f, frequency: e.target.value }))
                touch('frequency')
              }}
            >
              <option value="">Seleccionar frecuencia…</option>
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Duración" htmlFor="duration" required error={errors.duration}>
            <TextInput
              id="duration"
              placeholder="ej. 7 días, 1 mes"
              value={form.duration}
              error={errors.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              onBlur={() => touch('duration')}
            />
          </Field>
          <Field label="Estado" htmlFor="status">
            <Select id="status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Activa</option>
              <option value="completed">Completada</option>
              <option value="discontinued">Discontinuada</option>
            </Select>
          </Field>
        </div>

        <Field label="Instrucciones especiales" htmlFor="instructions">
          <Textarea
            id="instructions"
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            placeholder="Instrucciones específicas de administración para el paciente…"
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
