import { useEffect, useState } from 'react'
import api from '../lib/api'
import { getUser } from '../lib/auth'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, ErrorMsg, EmptyState } from './DashboardPage'

interface Device {
  id: number
  serial_number: string
  device_type: string
  status: string
  last_seen_at: string
  lavaggio?: { id: number; name: string }
  lavaggio_name?: string
}

interface Lavaggio {
  id: number
  name: string
}

export default function DevicesPage() {
  const user = getUser()
  const isSuperAdmin = user?.role === 'super_admin'

  const [devices, setDevices] = useState<Device[]>([])
  const [lavaggi, setLavaggi] = useState<Lavaggio[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterLavaggio, setFilterLavaggio] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, any> = { page: p }
      if (filterLavaggio) params.lavvaggio_id = filterLavaggio
      if (filterStatus) params.status = filterStatus

      const [devRes, lavRes] = await Promise.all([
        api.get('/devices', { params }),
        api.get('/lavvaggios'),
      ])
      setDevices(devRes.data.data ?? [])
      setTotalPages(devRes.data.meta?.total_pages ?? 1)
      setLavaggi(lavRes.data.data ?? [])
    } catch {
      setError('Failed to load devices.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page, filterLavaggio, filterStatus])

  const handleRevoke = async (id: number) => {
    if (!confirm('Revoke this device token?')) return
    try {
      await api.patch(`/devices/${id}/revoke`)
      load(page)
    } catch {
      setError('Failed to revoke token.')
    }
  }

  const handleRotate = async (id: number) => {
    if (!confirm('Rotate this device token?')) return
    try {
      await api.patch(`/devices/${id}/rotate_token`)
      load(page)
    } catch {
      setError('Failed to rotate token.')
    }
  }

  if (loading && devices.length === 0) return <Spinner />

  return (
    <div>
      <PageHeader title="Devices" subtitle="Manage connected devices" />

      {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterLavaggio}
          onChange={e => { setFilterLavaggio(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
        >
          <option value="">All Lavaggi</option>
          {lavaggi.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
        >
          <option value="">All Statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {devices.length === 0 ? (
        <EmptyState message="No devices found" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Serial Number</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last Seen</th>
                  <th className="px-5 py-3 font-medium">Lavaggio</th>
                  {isSuperAdmin && <th className="px-5 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-el/50 transition-colors">
                    <td className="px-5 py-3 text-tp font-mono">{d.serial_number}</td>
                    <td className="px-5 py-3 text-ts capitalize">{d.device_type?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3 text-ts">{d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : '--'}</td>
                    <td className="px-5 py-3 text-ts">{d.lavaggio?.name ?? d.lavaggio_name ?? '--'}</td>
                    {isSuperAdmin && (
                      <td className="px-5 py-3 flex gap-2">
                        <button onClick={() => handleRevoke(d.id)} className="px-3 py-1 text-xs bg-el border border-border rounded text-red hover:bg-red/10 transition-colors">
                          Revoke
                        </button>
                        <button onClick={() => handleRotate(d.id)} className="px-3 py-1 text-xs bg-el border border-border rounded text-amber hover:bg-amber/10 transition-colors">
                          Rotate
                        </button>
                      </td>
                    )}
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
