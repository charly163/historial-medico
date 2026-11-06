import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { usePatients, useAppointments, useInstitutions, useDoctors } from '../../lib/queries'
import { useFieldValidation } from '../../lib/useFieldValidation'
import { Dialog } from '../ui/Dialog'
import { Field, TextInput, Select } from '../ui/Field'
import { Button, IconButton } from '../ui/Button'

export const TEST_TYPES = [
  { value: 'Blood', label: 'Sangre (Análisis de sangre)' },
  { value: 'Urine', label: 'Orina' },
  { value: 'X-Ray', label: 'Radiografía (Rayos X)' },
  { value: 'MRI', label: 'Resonancia magnética (RMN)' },
  { value: 'CT', label: 'Tomografía computarizada (TAC)' },
  { value: 'Ultrasound', label: 'Ecografía / Ultrasonido' },
  { value: 'ECG', label: 'Electrocardiograma (ECG)' },
  { value: 'Pathology', label: 'Patología / Biopsia' },
  { value: 'Other', label: 'Otro' },
]

export const TEST_TYPE_LABELS = {
  blood: 'Sangre',
  urine: 'Orina',
  'x-ray': 'Radiografía',
  mri: 'Resonancia magnética',
  ct: 'Tomografía computarizada',
  ultrasound: 'Ecografía',
  ecg: 'Electrocardiograma',
  pathology: 'Patología',
  other: 'Otro',
}

export function translateTestType(type) {
  if (!type) return ''
  const lower = type.trim().toLowerCase()
  return TEST_TYPE_LABELS[lower] || type
}

const MAX_FILE_BYTES = 10 * 1024 * 1024

function today() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FIELDS = {
  patient_id: '',
  appointment_id: '',
  test_name: '',
  test_type: '',
  test_date: today(),
  institution_id: '',
  performed_by_id: '',
}

function toFields(report) {
  if (!report) return EMPTY_FIELDS
  return {
    patient_id: report.patient_id || '',
    appointment_id: report.appointment_id || '',
    test_name: report.test_name || '',
    test_type: report.test_type || '',
    test_date: report.test_date ? report.test_date.slice(0, 10) : today(),
    institution_id: report.institution_id || '',
    performed_by_id: report.performed_by?.id || report.performed_by_id || '',
  }
}

function toLabValues(report) {
  if (!report) return []
  return (report.lab_values ?? []).map((v) => ({
    _key: v.id ?? crypto.randomUUID(),
    parameter_name: v.parameter_name || '',
    value: v.value ?? '',
    unit: v.unit || '',
    reference_range: v.reference_range || '',
    status: v.status || 'Normal',
  }))
}

/** Flattens lab_values across every already-loaded report into "most recent unit +
 * reference_range typed for this parameter name" — powers the datalist autocomplete
 * below. */
function buildParameterSuggestions(reports) {
  const map = new Map()
  for (const report of reports ?? []) {
    for (const v of report.lab_values ?? []) {
      if (!v.parameter_name) continue
      const existing = map.get(v.parameter_name)
      if (!existing || new Date(report.test_date) > new Date(existing.test_date)) {
        map.set(v.parameter_name, { unit: v.unit || '', reference_range: v.reference_range || '', test_date: report.test_date })
      }
    }
  }
  return map
}

function LabValueRow({ row, onChange, onRemove, suggestions }) {
  function update(field, value) {
    const patch = { [field]: value }
    if (field === 'parameter_name') {
      const suggestion = suggestions.get(value)
      if (suggestion) {
        if (!row.unit) patch.unit = suggestion.unit
        if (!row.reference_range) patch.reference_range = suggestion.reference_range
      }
    }
    onChange({ ...row, ...patch })
  }

  return (
    <div className="grid grid-cols-2 gap-2 rounded-[10px] border border-glass-border p-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr_1.1fr_1fr_auto] sm:items-center">
      <TextInput
        list="lab-parameter-suggestions"
        placeholder="Parámetro (ej. Glucosa, Colesterol)"
        value={row.parameter_name}
        onChange={(e) => update('parameter_name', e.target.value)}
        className="col-span-2 sm:col-span-1"
      />
      <TextInput type="number" step="0.001" placeholder="Valor" value={row.value} onChange={(e) => update('value', e.target.value)} />
      <TextInput placeholder="Unidad" value={row.unit} onChange={(e) => update('unit', e.target.value)} />
      <TextInput placeholder="Rango de referencia" value={row.reference_range} onChange={(e) => update('reference_range', e.target.value)} />
      <Select value={row.status} onChange={(e) => update('status', e.target.value)}>
        <option value="Normal">Normal</option>
        <option value="High">Alto (High)</option>
        <option value="Low">Bajo (Low)</option>
        <option value="Critical">Crítico (Critical)</option>
      </Select>
      <IconButton label="Eliminar valor de laboratorio" type="button" onClick={onRemove} className="justify-self-end">
        <X size={14} />
      </IconButton>
    </div>
  )
}

function computeErrors(f) {
  const next = {}
  if (!f.patient_id) next.patient_id = 'Por favor selecciona un paciente'
  if (!f.test_name.trim()) next.test_name = 'El nombre de la prueba es obligatorio'
  if (!f.test_type) next.test_type = 'Por favor selecciona un tipo de prueba'
  if (!f.test_date) next.test_date = 'Por favor selecciona la fecha de la prueba'
  return next
}

/** Shared add/edit form for lab reports — used from the list page (add + edit) and the detail page (edit). */
export function LabReportFormDialog({ open, onOpenChange, report, reports, onSubmit, saving }) {
  const [fields, setFields] = useState(() => toFields(report))
  const [labValues, setLabValues] = useState(() => toLabValues(report))
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(undefined)
  const { data: patients } = usePatients()
  const { data: appointments } = useAppointments()
  const { data: institutions } = useInstitutions()
  const { data: doctors } = useDoctors()

  const suggestions = useMemo(() => buildParameterSuggestions(reports), [reports])

  const patientAppointments = useMemo(
    () => (appointments ?? []).filter((a) => a.patient_id === fields.patient_id).sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)),
    [appointments, fields.patient_id],
  )

  const { errors: fieldErrors, touch, guardSubmit } = useFieldValidation(fields, computeErrors)
  const errors = { ...fieldErrors, file: fileError }

  function handleFileChange(e) {
    const picked = e.target.files?.[0] || null
    setFile(picked)
    if (picked && picked.size > MAX_FILE_BYTES) {
      setFileError('El archivo debe tener menos de 10 MB')
    } else {
      setFileError(undefined)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (guardSubmit()) return
    if (file && file.size > MAX_FILE_BYTES) {
      setFileError('El archivo debe tener menos de 10 MB')
      return
    }

    const payload = {
      fields: {
        patient_id: fields.patient_id,
        appointment_id: fields.appointment_id || null,
        test_name: fields.test_name.trim(),
        test_type: fields.test_type,
        test_date: fields.test_date,
        institution_id: fields.institution_id || null,
        performed_by_id: fields.performed_by_id || null,
      },
      labValues: labValues
        .filter((v) => v.parameter_name.trim())
        .map((v) => ({
          parameter_name: v.parameter_name.trim(),
          value: v.value === '' ? null : Number(v.value),
          unit: v.unit.trim() || null,
          reference_range: v.reference_range.trim() || null,
          status: v.status || 'Normal',
        })),
      file,
    }

    onSubmit(payload)
  }

  let submitLabel = report ? 'Actualizar informe' : 'Guardar informe'
  if (saving) submitLabel = 'Guardando…'

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={report ? 'Editar informe de laboratorio' : 'Agregar informe de laboratorio'}>
      <datalist id="lab-parameter-suggestions">
        {Array.from(suggestions.keys()).map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Paciente" htmlFor="patient_id" required error={errors.patient_id}>
            <Select
              id="patient_id"
              value={fields.patient_id}
              error={errors.patient_id}
              onChange={(e) => {
                setFields((f) => ({ ...f, patient_id: e.target.value, appointment_id: '' }))
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
          <Field label="Cita (opcional)" htmlFor="appointment_id">
            <Select
              id="appointment_id"
              value={fields.appointment_id}
              onChange={(e) => setFields((f) => ({ ...f, appointment_id: e.target.value }))}
              disabled={!fields.patient_id}
            >
              <option value="">No vinculada</option>
              {patientAppointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.appointment_date?.slice(0, 10)}
                  {a.type ? ` - ${a.type}` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Nombre de prueba" htmlFor="test_name" required error={errors.test_name}>
          <TextInput
            id="test_name"
            value={fields.test_name}
            error={errors.test_name}
            onChange={(e) => setFields((f) => ({ ...f, test_name: e.target.value }))}
            onBlur={() => touch('test_name')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de prueba" htmlFor="test_type" required error={errors.test_type}>
            <Select
              id="test_type"
              value={fields.test_type}
              error={errors.test_type}
              onChange={(e) => {
                setFields((f) => ({ ...f, test_type: e.target.value }))
                touch('test_type')
              }}
            >
              <option value="">Seleccionar tipo de prueba…</option>
              {TEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha de la prueba" htmlFor="test_date" required error={errors.test_date}>
            <TextInput
              id="test_date"
              type="date"
              value={fields.test_date}
              error={errors.test_date}
              onChange={(e) => setFields((f) => ({ ...f, test_date: e.target.value }))}
              onBlur={() => touch('test_date')}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Institución" htmlFor="institution_id">
            <Select id="institution_id" value={fields.institution_id} onChange={(e) => setFields((f) => ({ ...f, institution_id: e.target.value }))}>
              <option value="">No especificado</option>
              {(institutions ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Realizado por" htmlFor="performed_by_id">
            <Select id="performed_by_id" value={fields.performed_by_id} onChange={(e) => setFields((f) => ({ ...f, performed_by_id: e.target.value }))}>
              <option value="">No especificado</option>
              {(doctors ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.first_name} {d.last_name}
                  {d.specialty ? ` - ${d.specialty}` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {!report && (
          <Field label="Informe PDF (opcional)" htmlFor="pdfFile" error={errors.file}>
            <input
              id="pdfFile"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full rounded-[10px] border border-glass-border bg-white/6 px-3 py-2.5 text-sm text-text file:mr-3 file:rounded-[8px] file:border-0 file:bg-glass-2 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text"
            />
          </Field>
        )}
        {report?.pdf_file_path && (
          <p className="text-xs text-muted">Este informe tiene un archivo PDF adjunto. Para reemplazarlo, elimínalo y vuelve a crearlo.</p>
        )}

        <Field label="Valores de laboratorio (Lab Values)" htmlFor="lab_values">
          <div className="flex flex-col gap-2">
            {labValues.map((row, i) => (
              <LabValueRow
                key={row._key}
                row={row}
                suggestions={suggestions}
                onChange={(next) => setLabValues((rows) => rows.map((r, idx) => (idx === i ? next : r)))}
                onRemove={() => setLabValues((rows) => rows.filter((_, idx) => idx !== i))}
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLabValues((rows) => [...rows, { _key: crypto.randomUUID(), parameter_name: '', value: '', unit: '', reference_range: '', status: 'Normal' }])}
              className="self-start"
            >
              + Agregar valor de laboratorio (Lab Value)
            </Button>
          </div>
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
