import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Plus, Search } from 'lucide-react'
import { createResourceHooks } from '../lib/resource'
import { useToast } from '../components/ui/Toast'
import { ConditionFormDialog } from '../components/conditions/ConditionFormDialog'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { RowActions } from '../components/ui/RowActions'
import { usePageHeader } from '../lib/pageHeader'

const { useList, useCreate, useUpdate, useDelete } = createResourceHooks('conditions', '/conditions')

export const CATEGORY_LABELS = {
  Cardiovascular: 'Cardiovascular',
  Respiratory: 'Respiratorio',
  Neurological: 'Neurológico',
  Gastrointestinal: 'Gastrointestinal',
  Endocrine: 'Endocrino',
  Musculoskeletal: 'Musculoesquelético',
  Dermatological: 'Dermatológico',
  Psychiatric: 'Psiquiátrico',
  'Infectious Disease': 'Enf. Infecciosa',
  Oncological: 'Oncológico',
  Hematological: 'Hematológico',
  Renal: 'Renal',
  Ophthalmological: 'Oftalmológico',
  ENT: 'ORL',
  Gynecological: 'Ginecológico',
  Pediatric: 'Pediátrico',
  Emergency: 'Urgencia',
  Other: 'Otro',
}

export const SEVERITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
}

export function translateCategory(cat) {
  return CATEGORY_LABELS[cat] || cat
}

export function translateSeverity(sev) {
  return SEVERITY_LABELS[sev] || sev
}

function usageCount(condition) {
  return Number(condition.usage_count) || 0
}

export default function Conditions() {
  const navigate = useNavigate()
  const { data: conditions, isLoading } = useList()
  const createCondition = useCreate()
  const updateCondition = useUpdate()
  const deleteCondition = useDelete()
  const notify = useToast()

  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  usePageHeader({
    title: 'Diagnósticos',
    subtitle: 'Condiciones médicas registradas, diagnósticos e historial',
    action: (
      <Button onClick={() => setAddOpen(true)}>
        <Plus size={16} /> Agregar diagnóstico
      </Button>
    ),
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return conditions ?? []
    return (conditions ?? []).filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.icd_code?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term),
    )
  }, [conditions, search])

  async function handleAdd(payload) {
    try {
      await createCondition.mutateAsync(payload)
      notify('Diagnóstico agregado')
      setAddOpen(false)
    } catch (err) {
      notify(err.message || 'Error al guardar diagnóstico', 'error')
    }
  }

  async function handleEdit(payload) {
    if (!editTarget) return
    try {
      await updateCondition.mutateAsync({ id: editTarget.id, data: payload })
      notify('Diagnóstico actualizado')
      setEditTarget(null)
    } catch (err) {
      notify(err.message || 'Error al guardar diagnóstico', 'error')
    }
  }

  function requestDelete(condition) {
    const count = usageCount(condition)
    if (count > 0) {
      notify(
        `No se puede eliminar "${condition.name}": está referenciado en ${count} cita(s). Modifica esas citas primero.`,
        'error',
      )
      return
    }
    setDeleteTarget(condition)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCondition.mutateAsync(deleteTarget.id)
      notify('Diagnóstico eliminado')
      setDeleteTarget(null)
    } catch (err) {
      notify(err.message || 'Error al eliminar diagnóstico', 'error')
    }
  }

  return (
    <div>
      <div className="glass mb-4 flex flex-wrap items-center gap-3 rounded-[16px] p-3">
        <div className="flex min-w-56 flex-1 items-center gap-2 rounded-[10px] border border-glass-border bg-white/6 px-3 py-2">
          <Search size={15} className="text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción, código CIE o categoría…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-sm font-semibold text-muted hover:text-white">
            Clear
          </button>
        )}
      </div>

      <div className="glass rounded-[20px]">
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-3.75">
          <h2 className="text-[0.9rem] font-bold">
            Lista de diagnósticos{' '}
            <span className="ml-1.5 rounded-full bg-glass-2 px-2 py-0.5 font-mono text-xs text-glow-b">{filtered.length}</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-muted">Cargando…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No se encontraron diagnósticos"
            description={conditions?.length ? 'Prueba con otra búsqueda.' : 'Agrega tu primer diagnóstico para comenzar.'}
          />
        ) : (
          <>
            <div className="divide-y divide-glass-border sm:hidden">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 p-4 hover:bg-white/3 active:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/conditions/${c.id}`)}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <div className="truncate font-semibold text-text">{c.name}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {c.category && <Badge>{translateCategory(c.category)}</Badge>}
                      {c.severity && <Badge tone={c.severity.toLowerCase()}>{translateSeverity(c.severity)}</Badge>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                      {c.icd_code && <span className="font-mono">{c.icd_code}</span>}
                      <span>
                        {usageCount(c)} uso{usageCount(c) === 1 ? '' : 's'}
                      </span>
                    </div>
                  </button>
                  <RowActions onEdit={() => setEditTarget(c)} onDelete={() => requestDelete(c)} />
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border bg-white/3 text-left font-mono text-[0.68rem] uppercase tracking-wide text-muted-2">
                    <th className="px-5 py-2.5 font-semibold">Nombre</th>
                    <th className="px-5 py-2.5 font-semibold">Código CIE-10</th>
                    <th className="px-5 py-2.5 font-semibold">Categoría</th>
                    <th className="px-5 py-2.5 font-semibold">Gravedad</th>
                    <th className="px-5 py-2.5 font-semibold">Usos</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-glass-border last:border-none hover:bg-white/3">
                      <td className="px-5 py-3">
                        <Link to={`/conditions/${c.id}`} className="font-semibold text-text hover:text-glow-b">
                          {c.name}
                        </Link>
                        {c.description && <div className="max-w-72 truncate text-xs text-muted">{c.description}</div>}
                      </td>
                      <td className="px-5 py-3 font-mono text-muted">{c.icd_code || 'No establecida'}</td>
                      <td className="px-5 py-3">{c.category ? <Badge>{translateCategory(c.category)}</Badge> : <span className="text-muted-2">Sin categoría</span>}</td>
                      <td className="px-5 py-3">
                        {c.severity ? <Badge tone={c.severity.toLowerCase()}>{translateSeverity(c.severity)}</Badge> : <span className="text-muted-2">Not set</span>}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {usageCount(c)} uso{usageCount(c) === 1 ? '' : 's'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <RowActions className="flex justify-end gap-1" onEdit={() => setEditTarget(c)} onDelete={() => requestDelete(c)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ConditionFormDialog
        key={addOpen ? 'add' : 'add-closed'}
        open={addOpen}
        onOpenChange={setAddOpen}
        condition={null}
        onSubmit={handleAdd}
        saving={createCondition.isPending}
      />

      <ConditionFormDialog
        key={editTarget ? editTarget.id : 'edit-closed'}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        condition={editTarget}
        onSubmit={handleEdit}
        saving={updateCondition.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar diagnóstico"
        description={deleteTarget && `¿Eliminar "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        pending={deleteCondition.isPending}
      />
    </div>
  )
}
