import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { getUser } from '../lib/auth'
import { useAlert } from '../context/AlertContext'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, ErrorMsg, EmptyState } from './DashboardPage'

interface Lavaggio {
  id: number
  name: string
  address: string
  city: string
  country: string
  status: string
  operational: boolean
  devices_count?: number
  today_washes_count?: number
}

export default function LavaggiPage() {
  const navigate = useNavigate()
  const user = getUser()
  const isAdmin = user?.role === 'admin'
  const { showAlert, showConfirm } = useAlert()

  const [lavaggi, setLavaggi] = useState<Lavaggio[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  const load = async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/lavvaggios', { params: { page: p } })
      setLavaggi(res.data.data ?? [])
      setTotalPages(res.data.meta?.total_pages ?? 1)
    } catch {
      setError('Failed to load lavaggi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  const handleDelete = (id: number) => {
    showConfirm({
      title: 'Delete Lavaggio',
      message: 'This will permanently delete this lavaggio and all linked data.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`/lavvaggios/${id}`)
          load(page)
          showAlert('success', 'Lavaggio deleted.')
        } catch {
          showAlert('error', 'Failed to delete lavaggio.')
        }
      },
    })
  }

  if (loading) return <Spinner />
  if (error) return <ErrorMsg msg={error} />

  return (
    <div>
      <PageHeader title="Lavaggi" subtitle="Manage your car wash locations">
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue hover:bg-blue/90 text-white text-sm font-medium rounded-lg transition-colors">
            + New Lavaggio
          </button>
        )}
      </PageHeader>

      {showModal && <CreateLavaggioModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(1); showAlert('success', 'Lavaggio created.') }} />}

      {lavaggi.length === 0 ? (
        <EmptyState message="No lavaggi found" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Operational</th>
                  <th className="px-5 py-3 font-medium">Devices</th>
                  <th className="px-5 py-3 font-medium">Today's Washes</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lavaggi.map(l => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-el/50 transition-colors">
                    <td className="px-5 py-3 text-tp font-medium">{l.name}</td>
                    <td className="px-5 py-3 text-ts">{l.city}</td>
                    <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-5 py-3"><StatusBadge status={l.operational ? 'active' : 'inactive'} /></td>
                    <td className="px-5 py-3 text-ts">{l.devices_count ?? '--'}</td>
                    <td className="px-5 py-3 text-ts">{l.today_washes_count ?? '--'}</td>
                    <td className="px-5 py-3 flex gap-2">
                      <button onClick={() => navigate(`/lavaggi/${l.id}`)} className="px-3 py-1 text-xs bg-el border border-border rounded text-bluel hover:bg-blue/10 transition-colors">
                        View
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(l.id)} className="px-3 py-1 text-xs bg-el border border-border rounded text-red hover:bg-red/10 transition-colors">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

/* ── Create Modal ── */

function CreateLavaggioModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', country: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/lavvaggios', { lavvaggio: form })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] ?? 'Failed to create lavaggio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-tp mb-4">New Lavaggio</h3>
        {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(['name', 'address', 'city', 'country'] as const).map(field => (
            <div key={field}>
              <label className="block text-sm text-ts mb-1 capitalize">{field}</label>
              <input
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                required
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp placeholder:text-tm focus:outline-none focus:border-blue"
                placeholder={field}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-el border border-border rounded-lg text-ts hover:text-tp transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-60 transition-colors">
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
