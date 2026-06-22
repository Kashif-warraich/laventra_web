import { useEffect, useState } from 'react'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, EmptyState } from './DashboardPage'

interface CarWashEvent {
  id: number
  plate_number: string
  event_type: string
  status: string
  started_at: string
  duration: number | null
  confidence: number | null
  lavvaggio?: { id: number; name: string }
  lavvaggio_name?: string
}

interface Lavaggio {
  id: number
  name: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<CarWashEvent[]>([])
  const [lavaggi, setLavaggi] = useState<Lavaggio[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterLavaggio, setFilterLavaggio] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, any> = { page: p, per_page: 20 }
      if (filterLavaggio) params.lavvaggio_id = filterLavaggio
      if (filterStatus) params.status = filterStatus
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const [evtRes, lavRes] = await Promise.all([
        api.get('/car_wash_events', { params }),
        lavaggi.length > 0 ? Promise.resolve({ data: { data: lavaggi } }) : api.get('/lavvaggios'),
      ])
      setEvents(evtRes.data.data ?? [])
      setTotalPages(evtRes.data.meta?.total_pages ?? 1)
      if (lavaggi.length === 0) setLavaggi(lavRes.data.data ?? [])
    } catch {
      setError('Failed to load events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page, filterLavaggio, filterStatus, dateFrom, dateTo])

  if (loading && events.length === 0) return <Spinner />

  return (
    <div>
      <PageHeader title="Events" subtitle="Car wash event history" />

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
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="failed">Failed</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
          placeholder="To"
        />
      </div>

      {events.length === 0 ? (
        <EmptyState message="No events found" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Plate</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Lavaggio</th>
                  <th className="px-5 py-3 font-medium">Started At</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} className="border-b border-border/50 hover:bg-el/50 transition-colors">
                    <td className="px-5 py-3 text-tp font-mono">{ev.plate_number ?? '--'}</td>
                    <td className="px-5 py-3 text-ts capitalize">{ev.event_type?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3"><StatusBadge status={ev.status} /></td>
                    <td className="px-5 py-3 text-ts">{ev.lavvaggio?.name ?? ev.lavvaggio_name ?? '--'}</td>
                    <td className="px-5 py-3 text-ts">{ev.started_at ? new Date(ev.started_at).toLocaleString() : '--'}</td>
                    <td className="px-5 py-3 text-ts">{ev.duration != null ? `${ev.duration}s` : '--'}</td>
                    <td className="px-5 py-3 text-ts">{ev.confidence != null ? `${(ev.confidence * 100).toFixed(0)}%` : '--'}</td>
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
