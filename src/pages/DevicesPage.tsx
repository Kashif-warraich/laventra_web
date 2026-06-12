import { useEffect, useState } from 'react'
import api from '../lib/api'
import { getUser } from '../lib/auth'
import { useAlert } from '../context/AlertContext'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, EmptyState } from './DashboardPage'

interface Device {
  id: number
  name?: string
  serial_number: string
  device_type: string
  status: string
  last_seen_at: string
  ip_address?: string
  firmware_version?: string
  stream_url?: string
  kind?: string
  lavaggio?: { id: number; name: string }
  lavaggio_name?: string
}

interface Lavaggio {
  id: number
  name: string
}

export default function DevicesPage() {
  const user = getUser()
  const isAdmin = user?.role === 'admin'
  const { showAlert, showConfirm } = useAlert()

  const [devices, setDevices] = useState<Device[]>([])
  const [lavaggi, setLavaggi] = useState<Lavaggio[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterLavaggio, setFilterLavaggio] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)

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

  const handleRevoke = (id: number) => {
    showConfirm({
      title: 'Revoke Device Token',
      message: 'The device will no longer be able to connect.',
      confirmLabel: 'Revoke',
      onConfirm: async () => {
        try {
          await api.patch(`/devices/${id}/revoke`)
          load(page)
          showAlert('success', 'Token revoked.')
        } catch {
          showAlert('error', 'Failed to revoke token.')
        }
      },
    })
  }

  const handleRotate = (id: number) => {
    showConfirm({
      title: 'Rotate Token',
      message: 'A new token will be generated. The device must re-authenticate.',
      confirmLabel: 'Rotate',
      confirmColor: '#F5A623',
      onConfirm: async () => {
        try {
          await api.patch(`/devices/${id}/rotate_token`)
          load(page)
          showAlert('success', 'Token rotated.')
        } catch {
          showAlert('error', 'Failed to rotate token.')
        }
      },
    })
  }

  const handleDelete = (id: number) => {
    showConfirm({
      title: 'Delete Device',
      message: 'This will permanently delete the device and all its data.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`/devices/${id}`)
          load(page)
          showAlert('success', 'Device deleted.')
        } catch {
          showAlert('error', 'Failed to delete device.')
        }
      },
    })
  }

  if (loading && devices.length === 0) return <Spinner />

  return (
    <div>
      <PageHeader title="Devices" subtitle="Manage connected devices">
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue hover:bg-blue/90 text-white text-sm font-medium rounded-lg transition-colors">
            + New Device
          </button>
        )}
      </PageHeader>

      {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

      {showCreateModal && <DeviceFormModal lavaggi={lavaggi} onClose={() => setShowCreateModal(false)} onSaved={() => { setShowCreateModal(false); load(page); showAlert('success', 'Device created.') }} />}
      {editingDevice && <DeviceFormModal device={editingDevice} lavaggi={lavaggi} onClose={() => setEditingDevice(null)} onSaved={() => { setEditingDevice(null); load(page); showAlert('success', 'Device updated.') }} />}

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
                  {isAdmin && <th className="px-5 py-3 font-medium">Actions</th>}
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
                    {isAdmin && (
                      <td className="px-5 py-3 flex gap-1">
                        <button onClick={() => setEditingDevice(d)} className="p-1.5 rounded-lg transition-colors text-bluel hover:bg-blue/10" title="Edit">
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg transition-colors text-red hover:bg-red/10" title="Delete">
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={() => handleRevoke(d.id)} className="p-1.5 rounded-lg transition-colors text-amber hover:bg-amber/10" title="Revoke">
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M4.93 4.93l14.14 14.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        </button>
                        <button onClick={() => handleRotate(d.id)} className="p-1.5 rounded-lg transition-colors text-ts hover:bg-el" title="Rotate">
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

/* ── Device Form Modal (Create / Edit) ── */

function DeviceFormModal({ device, lavaggi, onClose, onSaved }: { device?: Device; lavaggi: Lavaggio[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    lavvaggio_id: device?.lavaggio?.id?.toString() ?? '',
    name: device?.name ?? '',
    serial_number: device?.serial_number ?? '',
    device_type: device?.device_type ?? 'mini_pc',
    ip_address: device?.ip_address ?? '',
    stream_url: device?.stream_url ?? '',
    kind: device?.kind ?? '',
    firmware_version: device?.firmware_version ?? '',
    status: device?.status ?? 'active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        device: {
          ...form,
          lavvaggio_id: form.lavvaggio_id ? Number(form.lavvaggio_id) : undefined,
        },
      }
      if (device) {
        await api.patch(`/devices/${device.id}`, body)
      } else {
        await api.post('/devices', body)
      }
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] ?? `Failed to ${device ? 'update' : 'create'} device.`)
    } finally {
      setSaving(false)
    }
  }

  const isCamera = form.device_type === 'camera'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-tp mb-4">{device ? 'Edit Device' : 'New Device'}</h3>
        {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ts mb-1">Lavaggio</label>
              <select
                value={form.lavvaggio_id}
                onChange={e => set('lavvaggio_id', e.target.value)}
                required
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
              >
                <option value="">Select lavaggio...</option>
                {lavaggi.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ts mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
                placeholder="Device name"
              />
            </div>
            <div>
              <label className="block text-xs text-ts mb-1">Serial Number</label>
              <input
                value={form.serial_number}
                onChange={e => set('serial_number', e.target.value)}
                required
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
                placeholder="Serial number"
              />
            </div>
            <div>
              <label className="block text-xs text-ts mb-1">Device Type</label>
              <select
                value={form.device_type}
                onChange={e => set('device_type', e.target.value)}
                required
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
              >
                <option value="mini_pc">Mini PC</option>
                <option value="camera">Camera</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-ts mb-1">IP Address</label>
              <input
                value={form.ip_address}
                onChange={e => set('ip_address', e.target.value)}
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
                placeholder="IP address"
              />
            </div>
            <div>
              <label className="block text-xs text-ts mb-1">Firmware Version</label>
              <input
                value={form.firmware_version}
                onChange={e => set('firmware_version', e.target.value)}
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
                placeholder="Firmware version"
              />
            </div>
            <div>
              <label className="block text-xs text-ts mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
              >
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
            {isCamera && (
              <>
                <div>
                  <label className="block text-xs text-ts mb-1">Stream URL</label>
                  <input
                    value={form.stream_url}
                    onChange={e => set('stream_url', e.target.value)}
                    className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
                    placeholder="Stream URL"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ts mb-1">Kind</label>
                  <select
                    value={form.kind}
                    onChange={e => set('kind', e.target.value)}
                    className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue text-sm"
                  >
                    <option value="">Select kind...</option>
                    <option value="rtsp">RTSP</option>
                    <option value="mjpeg">MJPEG</option>
                    <option value="webcam">Webcam</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-el border border-border rounded-lg text-ts hover:text-tp transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-60 transition-colors">
              {saving ? (device ? 'Saving...' : 'Creating...') : (device ? 'Save Changes' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
