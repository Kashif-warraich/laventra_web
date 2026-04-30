import { useEffect, useState } from 'react'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'

interface Lavaggio {
  id: number
  name: string
  city: string
  status: string
}

interface Device {
  id: number
  serial_number: string
  status: string
}

interface CarWashEvent {
  id: number
  plate_number: string
  event_type: string
  status: string
  started_at: string
  lavaggio_name?: string
  lavaggio?: { name: string }
}

interface SummaryCard {
  label: string
  value: number | string
  color: string
}

export default function DashboardPage() {
  const [cards, setCards] = useState<SummaryCard[]>([])
  const [events, setEvents] = useState<CarWashEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [lavRes, devRes, evtRes] = await Promise.all([
          api.get('/lavvaggios'),
          api.get('/devices'),
          api.get('/car_wash_events', { params: { per_page: 10 } }),
        ])

        const lavaggi: Lavaggio[] = lavRes.data.data ?? []
        const devices: Device[] = devRes.data.data ?? []
        const evts: CarWashEvent[] = evtRes.data.data ?? []

        const onlineDevices = devices.filter(d => d.status === 'online').length
        const todayEvents = evts.filter(e => {
          const d = new Date(e.started_at)
          const now = new Date()
          return d.toDateString() === now.toDateString()
        }).length

        setCards([
          { label: 'Total Lavaggi', value: lavaggi.length, color: 'text-bluel' },
          { label: 'Online Devices', value: onlineDevices, color: 'text-teal' },
          { label: "Today's Events", value: todayEvents, color: 'text-amber' },
          { label: 'Reports Generated', value: '--', color: 'text-purple' },
        ])
        setEvents(evts)
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorMsg msg={error} />

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your car wash operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-ts">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-tp">Recent Events</h3>
        </div>
        {events.length === 0 ? (
          <EmptyState message="No recent events" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Plate</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Lavaggio</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} className="border-b border-border/50 hover:bg-el/50 transition-colors">
                    <td className="px-5 py-3 text-tp font-mono">{ev.plate_number ?? '--'}</td>
                    <td className="px-5 py-3 text-ts capitalize">{ev.event_type?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3"><StatusBadge status={ev.status} /></td>
                    <td className="px-5 py-3 text-ts">{ev.lavaggio?.name ?? ev.lavaggio_name ?? '--'}</td>
                    <td className="px-5 py-3 text-ts">{ev.started_at ? new Date(ev.started_at).toLocaleString() : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Shared tiny components used across pages ── */

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-tp">{title}</h2>
        {subtitle && <p className="text-sm text-ts mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-red text-sm">{msg}</p>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-12 h-12 text-tm mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-ts text-sm">{message}</p>
    </div>
  )
}
