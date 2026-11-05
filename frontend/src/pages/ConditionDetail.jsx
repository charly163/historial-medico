import { useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, HeartPulse, Pencil, Trash2, CalendarDays } from 'lucide-react'
import { createResourceHooks } from '../lib/resource'
import { translateCategory, translateSeverity } from './Conditions'
import { formatDate, formatDateTime } from '../lib/format'
import { useToast } from '../components/ui/Toast'
import { usePageHeader } from '../lib/pageHeader'
import { ConditionFormDialog } from '../components/conditions/ConditionFormDialog'
import { IconButton } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const { useOne, useUpdate, useDelete } = createResourceHooks('conditions', '/conditions')

export default function ConditionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const notify = useToast()
  const { data: condition, isLoading } = useOne(id)
  const updateCondition = useUpdate()
  const deleteCondition = useDelete()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleUpdate(payload) {
    try {
      await updateCondition.mutateAsync({ id, data: payload })
      notify('Diagnóstico actualizado')
      setEditOpen(false)
    } catch (err) {
      notify(err.message || 'Error al guardar diagnóstico', 'error')
    }
  }

  function requestDelete() {
    const count = Number(condition?.usage_count) || 0
    if (count > 0) {
      notify(`No se puede eliminar: está referenciado en ${count} cita(s). Modifica esas citas primero.`, 'error')
      return
    }
    setDeleteOpen(true)
  }

  async function handleDelete() {
    try {
      await deleteCondition.mutateAsync(id)
      notify('Diagnóstico eliminado')
      navigate('/conditions')
    } catch (err) {
      notify(err.message || 'Error al eliminar diagnóstico', 'error')
    }
  }

  usePageHeader({
    title: condition?.name,
    icon: condition && (
      <span className="glow-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white">
        <HeartPulse size={15} />
      </span>
    ),
    action: (
      <div className="flex gap-2">
        <IconButton label="Editar diagnóstico" onClick={() => setEditOpen(true)} className="border border-glass-border">
          <Pencil size={15} />
        </IconButton>
        <IconButton label="Eliminar diagnóstico" onClick={requestDelete} className="border border-glass-border">
          <Trash2 size={15} />
        </IconButton>
      </div>
    ),
  })

  if (isLoading) return <div className="text-sm text-muted">Loading…</div>
  if (!condition) return <div className="text-sm text-muted">Diagnóstico no encontrado.</div>

  const appointments = condition.recent_appointments ?? []

  return (
    <div>
      <button
        onClick={() => (location.key === 'default' ? navigate('/conditions') : navigate(-1))}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-white"
      >
        <ArrowLeft size={15} /> Volver
      </button>

      <div className="glass mb-4 rounded-[20px] p-6">
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="font-semibold text-muted">Categoría</dt>
          <dd className="col-span-2">{condition.category ? <Badge>{translateCategory(condition.category)}</Badge> : 'Sin categoría'}</dd>

          <dt className="font-semibold text-muted">Gravedad</dt>
          <dd className="col-span-2">
            {condition.severity ? <Badge tone={condition.severity.toLowerCase()}>{translateSeverity(condition.severity)}</Badge> : 'No establecida'}
          </dd>

          <dt className="font-semibold text-muted">Código CIE-10</dt>
          <dd className="col-span-2 font-mono">{condition.icd_code || 'No establecido'}</dd>

          {condition.description && (
            <>
              <dt className="font-semibold text-muted">Descripción</dt>
              <dd className="col-span-2 whitespace-pre-wrap">{condition.description}</dd>
            </>
          )}

          <dt className="font-semibold text-muted">Uso</dt>
          <dd className="col-span-2 text-muted">
            Referenciado en {Number(condition.usage_count) || 0} cita(s), coincidiendo por texto de diagnóstico
          </dd>

          {condition.created_at && (
            <>
              <dt className="font-semibold text-muted">Creado el</dt>
              <dd className="col-span-2 text-muted">{formatDateTime(condition.created_at)}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="glass rounded-[20px]">
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-3.75">
          <h2 className="text-[0.9rem] font-bold">
            Citas relacionadas{' '}
            <span className="ml-1.5 rounded-full bg-glass-2 px-2 py-0.5 font-mono text-xs text-glow-b">{appointments.length}</span>
          </h2>
        </div>
        {appointments.length ? (
          <div className="divide-y divide-glass-border">
            {appointments.map((a) => (
              <Link
                key={a.appointment_id}
                to={`/appointments/${a.appointment_id}`}
                className="flex items-start gap-3 px-5 py-3 text-sm text-text hover:bg-white/3 hover:text-glow-b"
              >
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <div className="font-medium">{a.patient_name}</div>
                  <div className="text-xs text-muted">{formatDate(a.appointment_date)}</div>
                  {a.diagnosis && <div className="mt-0.5 text-xs text-muted">{a.diagnosis}</div>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-muted">Ninguna cita hace referencia a este diagnóstico todavía.</p>
        )}
      </div>

      <ConditionFormDialog
        key={editOpen ? condition.id : 'closed'}
        open={editOpen}
        onOpenChange={setEditOpen}
        condition={condition}
        onSubmit={handleUpdate}
        saving={updateCondition.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar diagnóstico"
        description={`¿Eliminar "${condition.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        pending={deleteCondition.isPending}
      />
    </div>
  )
}
