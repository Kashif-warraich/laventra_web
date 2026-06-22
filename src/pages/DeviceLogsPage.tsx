import { useEffect, useState } from 'react'
import api from '../lib/api'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, EmptyState } from './DashboardPage'

interface DeviceLog {
  id: number
  event_type: string
  message: string
  created_at: string
  device?: { serial_number: string }
  device_serial?: string
  lavvaggio?: { name: string }
  lavvaggio_name?: string
}

interface Lavaggio {
  id: number
  name: string
}

export default function DeviceLogsPage() {
  const [logs, setLogs] = useState<DeviceLog[]>([])
  const [lavaggi, setLavaggi] = useState<Lavaggio[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterLavaggio, setFilterLavaggio] = useState('')
  const [filterType, setFilterType] = useState('')

  const load = async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, any> = { page: p }
      if (filterLavaggio) params.lavvaggio_id = filterLavaggio
      if (filterType) params.event_type = filterType

      const [logRes, lavRes] = await Promise.all([
        api.get('/device_logs', { params }),
        lavaggi.length > 0 ? Promise.resolve({ data: { data: lavaggi } }) : api.get('/lavvaggios'),
      ])
      setLogs(logRes.data.data ?? [])
      setTotalPages(logRes.data.meta?.total_pages ?? 1)
      if (lavaggi.length === 0) setLavaggi(lavRes.data.data ?? [])
    } catch {
      setError('Failed to load device logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page, filterLavaggio, filterType])

  if (loading && logs.length === 0) return <Spinner />

  return (
    <div>
      <PageHeader title="Device Logs" subtitle="Device connectivity and event logs" />

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
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
        >
          <option value="">All Event Types</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {logs.length === 0 ? (
        <EmptyState message="No device logs found" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Device</th>
                  <th className="px-5 py-3 font-medium">Lavaggio</th>
                  <th className="px-5 py-3 font-medium">Event Type</th>
                  <th className="px-5 py-3 font-medium">Message</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-el/50 transition-colors">
                    <td className="px-5 py-3 text-tp font-mono">{log.device?.serial_number ?? log.device_serial ?? '--'}</td>
                    <td className="px-5 py-3 text-ts">{log.lavvaggio?.name ?? log.lavvaggio_name ?? '--'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        log.event_type === 'online' ? 'bg-teal/20 text-teal' : log.event_type === 'offline' ? 'bg-red/20 text-red' : 'bg-tm/30 text-ts'
                      }`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ts max-w-xs truncate">{log.message ?? '--'}</td>
                    <td className="px-5 py-3 text-ts">{new Date(log.created_at).toLocaleString()}</td>
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
