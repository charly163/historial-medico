import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Stethoscope, Plus, Search } from 'lucide-react'
import { createResourceHooks } from '../lib/resource'
import { useToast } from '../components/ui/Toast'
import { DoctorFormDialog } from '../components/doctors/DoctorFormDialog'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { RowActions } from '../components/ui/RowActions'
import { usePageHeader } from '../lib/pageHeader'

const { useList, useCreate, useUpdate, useDelete } = createResourceHooks('doctors', '/doctors')

function institutionSummary(d) {
  const list = d.institutions ?? []
  if (!list.length) return 'Sin instituciones asignadas'
  return list.map((i) => i.name).join(', ')
}

export default function Doctors() {
  const navigate = useNavigate()
  const { data: doctors, isLoading } = useList()
  const createDoctor = useCreate()
  const updateDoctor = useUpdate()
  const deleteDoctor = useDelete()
  const notify = useToast()

  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  usePageHeader({
    title: 'Médicos',
    subtitle: 'Profesionales de la salud registrados',
    action: (
      <Button onClick={() => setAddOpen(true)}>
        <Plus size={16} /> Agregar médico
      </Button>
    ),
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return doctors ?? []
    return (doctors ?? []).filter(
      (d) =>
        d.first_name?.toLowerCase().includes(term) ||
        d.last_name?.toLowerCase().includes(term) ||
        d.specialty?.toLowerCase().includes(term) ||
        d.license_number?.toLowerCase().includes(term) ||
        d.phone?.includes(term) ||
        d.email?.toLowerCase().includes(term),
    )
  }, [doctors, search])

  async function handleAdd(payload) {
    try {
      await createDoctor.mutateAsync(payload)
      notify('Médico agregado')
      setAddOpen(false)
    } catch (err) {
      notify(err.message || 'Error al guardar médico', 'error')
    }
  }

  async function handleEdit(payload) {
    if (!editTarget) return
    try {
      await updateDoctor.mutateAsync({ id: editTarget.id, data: payload })
      notify('Médico actualizado')
      setEditTarget(null)
    } catch (err) {
      notify(err.message || 'Error al guardar médico', 'error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteDoctor.mutateAsync(deleteTarget.id)
      notify('Médico eliminado')
      setDeleteTarget(null)
    } catch (err) {
      notify(err.message || 'Error al eliminar médico', 'error')
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
            placeholder="Search by name, specialty, license, phone, or email…"
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
            Doctor list{' '}
            <span className="ml-1.5 rounded-full bg-glass-2 px-2 py-0.5 font-mono text-xs text-glow-b">{filtered.length}</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-muted">Cargando…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No se encontraron médicos"
            description={doctors?.length ? 'Prueba con otra búsqueda.' : 'Agrega tu primer médico para comenzar.'}
          />
        ) : (
          <>
            <div className="divide-y divide-glass-border sm:hidden">
              {filtered.map((d) => (
                <div key={d.id} className="relative flex items-start justify-between gap-3 p-4 hover:bg-white/3 active:bg-white/5">
                  <button
                    type="button"
                    onClick={() => navigate(`/doctors/${d.id}`)}
                    aria-label={`View Dr. ${d.first_name} ${d.last_name}`}
                    className="absolute inset-0 z-0"
                  />
                  <div className="pointer-events-none relative z-10 min-w-0 flex-1">
                    <div className="truncate font-semibold text-text">
                      Dr. {d.first_name} {d.last_name}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {d.specialty && <Badge>{d.specialty}</Badge>}
                      {d.license_number && <span className="font-mono text-xs text-muted">{d.license_number}</span>}
                    </div>
                    <div className="mt-1.5 flex flex-col gap-0.5 text-xs">
                      {d.phone && (
                        <a href={`tel:${d.phone}`} className="pointer-events-auto relative w-fit text-glow-b">
                          {d.phone}
                        </a>
                      )}
                      {d.email && (
                        <a href={`mailto:${d.email}`} className="pointer-events-auto relative w-fit truncate text-glow-b">
                          {d.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <RowActions className="relative z-10 flex shrink-0 gap-1" onEdit={() => setEditTarget(d)} onDelete={() => setDeleteTarget(d)} />
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border bg-white/3 text-left font-mono text-[0.68rem] uppercase tracking-wide text-muted-2">
                    <th className="px-5 py-2.5 font-semibold">Name</th>
                    <th className="px-5 py-2.5 font-semibold">Especialidad</th>
                    <th className="px-5 py-2.5 font-semibold">License</th>
                    <th className="px-5 py-2.5 font-semibold">Contacto</th>
                    <th className="px-5 py-2.5 font-semibold">Instituciones</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-b border-glass-border last:border-none hover:bg-white/3">
                      <td className="px-5 py-3">
                        <Link to={`/doctors/${d.id}`} className="font-semibold text-text hover:text-glow-b">
                          Dr. {d.first_name} {d.last_name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{d.specialty ? <Badge>{d.specialty}</Badge> : '-'}</td>
                      <td className="px-5 py-3 font-mono text-muted">{d.license_number || 'Not provided'}</td>
                      <td className="px-5 py-3">
                        {d.phone && (
                          <a href={`tel:${d.phone}`} className="block text-glow-b hover:underline">
                            {d.phone}
                          </a>
                        )}
                        {d.email && (
                          <a href={`mailto:${d.email}`} className="block text-glow-b hover:underline">
                            {d.email}
                          </a>
                        )}
                        {!d.phone && !d.email && <span className="text-muted-2">Not provided</span>}
                      </td>
                      <td className="max-w-56 truncate px-5 py-3 text-muted">{institutionSummary(d)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <RowActions className="flex justify-end gap-1" onEdit={() => setEditTarget(d)} onDelete={() => setDeleteTarget(d)} />
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

      <DoctorFormDialog
        key={addOpen ? 'add' : 'add-closed'}
        open={addOpen}
        onOpenChange={setAddOpen}
        doctor={null}
        onSubmit={handleAdd}
        saving={createDoctor.isPending}
      />

      <DoctorFormDialog
        key={editTarget ? editTarget.id : 'edit-closed'}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        doctor={editTarget}
        onSubmit={handleEdit}
        saving={updateDoctor.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar médico"
        description={deleteTarget && `Delete "Dr. ${deleteTarget.first_name} ${deleteTarget.last_name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        pending={deleteDoctor.isPending}
      />
    </div>
  )
}
