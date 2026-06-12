import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAlert } from '../context/AlertContext'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, ErrorMsg, EmptyState } from './DashboardPage'

interface Lavaggio { id: number; name: string }

interface License {
  id: number
  code: string
  lavvaggio_id: number
  lavvaggio: { id: number; name: string }
  status: 'active' | 'inactive'
  expires_at: string
  last_seen_at: string | null
  configured: boolean
  created_at: string
}

const DURATION_OPTIONS = [
  { label: '30 days',  value: 30 },
  { label: '90 days',  value: 90 },
  { label: '180 days', value: 180 },
  { label: '365 days', value: 365 },
]

export default function LicensesPage() {
  const { showAlert, showConfirm } = useAlert()
  const [licenses, setLicenses] = useState<License[]>([])
  const [lavaggi, setLavaggi] = useState<Lavaggio[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createLav, setCreateLav] = useState('')
  const [createDuration, setCreateDuration] = useState(30)
  const [creating, setCreating] = useState(false)

  // Renew modal
  const [renewId, setRenewId] = useState<number | null>(null)
  const [renewDuration, setRenewDuration] = useState(30)
  const [renewing, setRenewing] = useState(false)

  // Copy feedback
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const load = async (p = page) => {
    setLoading(true); setError('')
    try {
      const [licRes, lavRes] = await Promise.all([
        api.get('/licenses', { params: { page: p } }),
        api.get('/lavvaggios'),
      ])
      setLicenses(licRes.data.data ?? [])
      setTotalPages(licRes.data.meta?.total_pages ?? 1)
      setLavaggi(lavRes.data.data ?? [])
    } catch {
      setError('Failed to load licenses.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(page) }, [page])

  /* ---------- Create ---------- */
  const openCreate = () => {
    setCreateLav(lavaggi[0]?.id?.toString() ?? '')
    setCreateDuration(30)
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!createLav) return
    setCreating(true); setError('')
    try {
      await api.post('/licenses', {
        lavvaggio_id: Number(createLav),
        duration_days: createDuration,
      })
      setCreateOpen(false)
      showAlert('success', 'License created.')
      load(page)
    } catch (e: any) {
      setError(e?.response?.data?.errors?.[0] ?? 'Failed to create license.')
    } finally {
      setCreating(false)
    }
  }

  /* ---------- Toggle status ---------- */
  const toggleStatus = (lic: License) => {
    const next = lic.status === 'active' ? 'inactive' : 'active'
    const action = next === 'active' ? 'Activate' : 'Deactivate'
    showConfirm({
      title: `${action} License`,
      message: `Are you sure you want to ${action.toLowerCase()} this license?`,
      confirmLabel: action,
      confirmColor: next === 'active' ? undefined : '#FF4D6A',
      onConfirm: async () => {
        try {
          await api.patch(`/licenses/${lic.id}`, { status: next })
          showAlert('success', `License ${next === 'active' ? 'activated' : 'deactivated'}.`)
          load(page)
        } catch (e: any) {
          showAlert('error', e?.response?.data?.errors?.[0] ?? 'Failed to update license.')
        }
      },
    })
  }

  /* ---------- Renew ---------- */
  const openRenew = (id: number) => {
    setRenewId(id)
    setRenewDuration(30)
  }

  const handleRenew = async () => {
    if (renewId === null) return
    setRenewing(true); setError('')
    try {
      await api.post(`/licenses/${renewId}/renew`, { duration_days: renewDuration })
      setRenewId(null)
      showAlert('success', 'License renewed.')
      load(page)
    } catch (e: any) {
      setError(e?.response?.data?.errors?.[0] ?? 'Failed to renew license.')
    } finally {
      setRenewing(false)
    }
  }

  /* ---------- Copy code ---------- */
  const copyCode = async (lic: License) => {
    try {
      await navigator.clipboard.writeText(lic.code)
      setCopiedId(lic.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* ignore */ }
  }

  if (loading && licenses.length === 0) return <Spinner />

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Licenses"
          subtitle="Manage device licenses and their expiration"
        />
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue text-white rounded-lg text-sm font-medium hover:bg-bluel transition-colors"
        >
          + Create License
        </button>
      </div>

      {error && <ErrorMsg msg={error} />}

      {licenses.length === 0 ? (
        <EmptyState message="No licenses yet. Create one to license a device." />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-el text-ts">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Lavvaggio</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-left px-4 py-3 font-medium">Configured</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-tp">
              {licenses.map(lic => (
                <tr key={lic.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{lic.code}</td>
                  <td className="px-4 py-3">{lic.lavvaggio?.name ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={lic.status} /></td>
                  <td className="px-4 py-3 text-ts">{new Date(lic.expires_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {lic.configured ? (
                      <span className="inline-flex items-center gap-1 text-teal text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-teal inline-block" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-red inline-block" />
                        {lic.last_seen_at ? 'Stale' : 'Never'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ts">{new Date(lic.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleStatus(lic)}
                        className={`text-xs hover:underline ${lic.status === 'active' ? 'text-red' : 'text-teal'}`}
                      >
                        {lic.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => openRenew(lic.id)}
                        className="text-xs text-blue hover:underline"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => copyCode(lic)}
                        className="text-xs text-ts hover:text-tp"
                      >
                        {copiedId === lic.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create license modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-tp mb-4">Create license</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-ts mb-1">Lavvaggio</label>
                <select
                  value={createLav}
                  onChange={e => setCreateLav(e.target.value)}
                  className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
                >
                  <option value="">— pick a lavvaggio —</option>
                  {lavaggi.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ts mb-1">Duration</label>
                <select
                  value={createDuration}
                  onChange={e => setCreateDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
                >
                  {DURATION_OPTIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 text-ts hover:text-tp text-sm"
              >Cancel</button>
              <button
                onClick={handleCreate}
                disabled={!createLav || creating}
                className="px-4 py-2 bg-blue text-white rounded-lg text-sm disabled:opacity-50"
              >{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Renew license modal */}
      {renewId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-tp mb-4">Renew license</h3>
            <div>
              <label className="block text-xs text-ts mb-1">Extend by</label>
              <select
                value={renewDuration}
                onChange={e => setRenewDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
              >
                {DURATION_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setRenewId(null)}
                className="px-4 py-2 text-ts hover:text-tp text-sm"
              >Cancel</button>
              <button
                onClick={handleRenew}
                disabled={renewing}
                className="px-4 py-2 bg-blue text-white rounded-lg text-sm disabled:opacity-50"
              >{renewing ? 'Renewing...' : 'Renew'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
