import { useEffect, useState } from 'react'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, ErrorMsg, EmptyState } from './DashboardPage'

interface UserRecord {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  lavaggi_count?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)

  const load = async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/users', { params: { page: p } })
      setUsers(res.data.data ?? [])
      setTotalPages(res.data.meta?.total_pages ?? 1)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return
    try {
      await api.delete(`/users/${id}`)
      load(page)
    } catch {
      setError('Failed to delete user.')
    }
  }

  const handleRoleUpdate = async (id: number, role: string) => {
    try {
      await api.patch(`/users/${id}`, { user: { role } })
      load(page)
      setEditingUser(null)
    } catch {
      setError('Failed to update role.')
    }
  }

  if (loading && users.length === 0) return <Spinner />

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage admin users">
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue hover:bg-blue/90 text-white text-sm font-medium rounded-lg transition-colors">
          + New User
        </button>
      </PageHeader>

      {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

      {showModal && <CreateUserModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(1) }} />}

      {users.length === 0 ? (
        <EmptyState message="No users found" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Lavaggi</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-el/50 transition-colors">
                    <td className="px-5 py-3 text-tp font-medium">{u.first_name} {u.last_name}</td>
                    <td className="px-5 py-3 text-ts">{u.email}</td>
                    <td className="px-5 py-3">
                      {editingUser?.id === u.id ? (
                        <select
                          value={editingUser.role}
                          onChange={e => handleRoleUpdate(u.id, e.target.value)}
                          onBlur={() => setEditingUser(null)}
                          autoFocus
                          className="px-2 py-1 bg-el border border-blue rounded text-tp text-xs focus:outline-none"
                        >
                          <option value="owner">owner</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span className="capitalize text-ts">{u.role?.replace(/_/g, ' ')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={u.status ?? 'active'} /></td>
                    <td className="px-5 py-3 text-ts">{u.lavaggi_count ?? '--'}</td>
                    <td className="px-5 py-3 flex gap-2">
                      <button onClick={() => setEditingUser(u)} className="px-3 py-1 text-xs bg-el border border-border rounded text-bluel hover:bg-blue/10 transition-colors">
                        Edit Role
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="px-3 py-1 text-xs bg-el border border-border rounded text-red hover:bg-red/10 transition-colors">
                        Delete
                      </button>
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

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'owner' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/signup', { user: form })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] ?? 'Failed to create user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-tp mb-4">New User</h3>
        {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ts mb-1">First Name</label>
              <input value={form.first_name} onChange={e => set('first_name', e.target.value)} required className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue" />
            </div>
            <div>
              <label className="block text-sm text-ts mb-1">Last Name</label>
              <input value={form.last_name} onChange={e => set('last_name', e.target.value)} required className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-ts mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue" />
          </div>
          <div>
            <label className="block text-sm text-ts mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue" />
          </div>
          <div>
            <label className="block text-sm text-ts mb-1">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue">
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-el border border-border rounded-lg text-ts hover:text-tp transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-60 transition-colors">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
