import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import { PageHeader, Spinner, ErrorMsg, EmptyState } from './DashboardPage'

interface Partner {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface Lavaggio {
  id: number
  name: string
  address: string
  city: string
  country: string
  status: string
  operational: boolean
  partners?: Partner[]
}

interface UserRow {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
}

interface Device {
  id: number
  serial_number: string
  device_type: string
  status: string
  last_seen_at: string
}

interface CarWashEvent {
  id: number
  plate_number: string
  event_type: string
  status: string
  started_at: string
  confidence: number | null
}

export default function LavaggioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [lavaggio, setLavaggio] = useState<Lavaggio | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [events, setEvents] = useState<CarWashEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', country: '' })
  const [allOwners, setAllOwners] = useState<UserRow[]>([])
  const [partnerIds, setPartnerIds] = useState<number[]>([])
  const [savingPartners, setSavingPartners] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [lavRes, devRes, evtRes, usrRes] = await Promise.all([
          api.get(`/lavvaggios/${id}`),
          api.get('/devices', { params: { lavvaggio_id: id } }),
          api.get('/car_wash_events', { params: { lavvaggio_id: id, per_page: 10 } }),
          api.get('/users', { params: { per_page: 200 } }),
        ])
        const l = lavRes.data.data
        setLavaggio(l)
        setForm({ name: l.name, address: l.address ?? '', city: l.city ?? '', country: l.country ?? '' })
        setPartnerIds((l.partners ?? []).map((p: Partner) => p.id))
        setDevices(devRes.data.data ?? [])
        setEvents(evtRes.data.data ?? [])
        const owners = (usrRes.data.data ?? []).filter((u: UserRow) => u.role === 'owner')
        setAllOwners(owners)
      } catch {
        setError('Failed to load lavaggio details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.patch(`/lavvaggios/${id}`, { lavvaggio: form })
      setLavaggio(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] ?? 'Failed to update.')
    } finally {
      setSaving(false)
    }
  }

  const togglePartner = (uid: number) => {
    setPartnerIds(ids => ids.includes(uid) ? ids.filter(x => x !== uid) : [...ids, uid])
  }

  const handleSavePartners = async () => {
    setSavingPartners(true)
    setError('')
    try {
      const res = await api.patch(`/lavvaggios/${id}`, { lavvaggio: { partner_ids: partnerIds } })
      setLavaggio(res.data.data)
      setPartnerIds((res.data.data.partners ?? []).map((p: Partner) => p.id))
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] ?? 'Failed to update partners.')
    } finally {
      setSavingPartners(false)
    }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  if (loading) return <Spinner />
  if (error && !lavaggio) return <ErrorMsg msg={error} />

  return (
    <div>
      <PageHeader title={lavaggio?.name ?? 'Lavaggio'} subtitle="Edit lavaggio details">
        <button onClick={() => navigate('/lavaggi')} className="px-4 py-2 bg-el border border-border text-ts text-sm rounded-lg hover:text-tp transition-colors">
          Back to Lavaggi
        </button>
      </PageHeader>

      {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

      {/* Edit form */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="text-sm font-medium text-tp mb-4">Edit Details</h3>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['name', 'address', 'city', 'country'] as const).map(field => (
            <div key={field}>
              <label className="block text-sm text-ts mb-1 capitalize">{field}</label>
              <input
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue"
              />
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue text-white text-sm rounded-lg hover:bg-blue/90 disabled:opacity-60 transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Partners */}
      <div className="bg-card border border-border rounded-xl mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-tp">Partners ({partnerIds.length})</h3>
          <button
            onClick={handleSavePartners}
            disabled={savingPartners}
            className="px-4 py-1.5 bg-blue text-white text-xs rounded-lg hover:bg-blue/90 disabled:opacity-60 transition-colors"
          >
            {savingPartners ? 'Saving...' : 'Save Partners'}
          </button>
        </div>
        {allOwners.length === 0 ? (
          <EmptyState message="No owner users to assign" />
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allOwners.map(u => {
              const checked = partnerIds.includes(u.id)
              return (
                <label
                  key={u.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    checked ? 'border-blue bg-blue/10' : 'border-border bg-el hover:bg-el/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePartner(u.id)}
                    className="accent-blue"
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-tp truncate">{u.first_name} {u.last_name}</div>
                    <div className="text-xs text-ts truncate">{u.email}</div>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Linked Devices */}
      <div className="bg-card border border-border rounded-xl mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-tp">Linked Devices ({devices.length})</h3>
        </div>
        {devices.length === 0 ? (
          <EmptyState message="No devices linked" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Serial Number</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-el/50">
                    <td className="px-5 py-3 text-tp font-mono">{d.serial_number}</td>
                    <td className="px-5 py-3 text-ts capitalize">{d.device_type?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3 text-ts">{d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Events */}
      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-tp">Recent Events</h3>
        </div>
        {events.length === 0 ? (
          <EmptyState message="No events found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Plate</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} className="border-b border-border/50 hover:bg-el/50">
                    <td className="px-5 py-3 text-tp font-mono">{ev.plate_number ?? '--'}</td>
                    <td className="px-5 py-3 text-ts capitalize">{ev.event_type?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3"><StatusBadge status={ev.status} /></td>
                    <td className="px-5 py-3 text-ts">{ev.started_at ? new Date(ev.started_at).toLocaleString() : '--'}</td>
                    <td className="px-5 py-3 text-ts">{ev.confidence != null ? `${(ev.confidence * 100).toFixed(0)}%` : '--'}</td>
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
