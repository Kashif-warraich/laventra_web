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

interface OwnerUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
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
                      <button onClick={() => navigate(`/lavaggi/${l.id}`)} className="p-1.5 rounded-lg transition-colors text-bluel hover:bg-blue/10" title="View">
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(l.id)} className="p-1.5 rounded-lg transition-colors text-red hover:bg-red/10" title="Delete">
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
  const [form, setForm] = useState({
    name: '', address: '', city: '', country: '', zip_code: '', phone: '', email: '', website: '', description: '', status: 'active' as string, operational: true,
  })
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<number[]>([])
  const [owners, setOwners] = useState<OwnerUser[]>([])
  const [loadingOwners, setLoadingOwners] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ownerError, setOwnerError] = useState('')

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const res = await api.get('/users', { params: { per_page: 200 } })
        const all = (res.data.data ?? []).filter((u: OwnerUser) => u.role === 'owner')
        setOwners(all)
      } catch {
        // silently fail
      } finally {
        setLoadingOwners(false)
      }
    }
    fetchOwners()
  }, [])

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const toggleOwner = (id: number) => {
    setOwnerError('')
    setSelectedOwnerIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedOwnerIds.length === 0) {
      setOwnerError('Please select at least one owner.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.post('/lavvaggios', { lavvaggio: { ...form, partner_ids: selectedOwnerIds } })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] ?? 'Failed to create lavaggio.')
    } finally {
      setSaving(false)
    }
  }

  const requiredFields = ['name', 'address', 'city', 'country'] as const
  const optionalTextFields = ['zip_code', 'phone', 'email', 'website'] as const

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-tp mb-4">New Lavaggio</h3>
        {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {requiredFields.map(field => (
              <div key={field}>
                <label className="block text-xs text-ts mb-1 capitalize">{field.replace(/_/g, ' ')}</label>
                <input
                  value={form[field]}
                  onChange={e => set(field, e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
                  placeholder={field.replace(/_/g, ' ')}
                />
              </div>
            ))}
            {optionalTextFields.map(field => (
              <div key={field}>
                <label className="block text-xs text-ts mb-1 capitalize">{field.replace(/_/g, ' ')}</label>
                <input
                  value={form[field]}
                  onChange={e => set(field, e.target.value)}
                  className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
                  placeholder={field.replace(/_/g, ' ')}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-ts mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                checked={form.operational}
                onChange={e => set('operational', e.target.checked)}
                className="accent-blue"
                id="create-operational"
              />
              <label htmlFor="create-operational" className="text-sm text-tp">Operational</label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-ts mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
              placeholder="Description"
            />
          </div>

          <div>
            <label className="block text-xs text-ts mb-1">Owners</label>
            {ownerError && <div className="text-red text-xs mb-1">{ownerError}</div>}
            {loadingOwners ? (
              <div className="flex items-center gap-2 text-ts text-sm py-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Loading owners...
              </div>
            ) : owners.length === 0 ? (
              <div className="text-ts text-sm py-2">No owner users found.</div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                {owners.map(o => (
                  <label key={o.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-el/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOwnerIds.includes(o.id)}
                      onChange={() => toggleOwner(o.id)}
                      className="accent-blue"
                    />
                    <span className="text-sm text-tp">{o.first_name} {o.last_name}</span>
                    <span className="text-xs text-ts">({o.email})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

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
