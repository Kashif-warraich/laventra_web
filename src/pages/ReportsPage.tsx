import { useEffect, useState } from 'react'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, ErrorMsg, EmptyState } from './DashboardPage'

interface Report {
  id: number
  name: string
  format: string
  status: string
  file_size: number | null
  created_at: string
}

interface Lavaggio {
  id: number
  name: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
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
      const [repRes, lavRes] = await Promise.all([
        api.get('/reports', { params: { page: p } }),
        lavaggi.length > 0 ? Promise.resolve({ data: { data: lavaggi } }) : api.get('/lavvaggios'),
      ])
      setReports(repRes.data.data ?? [])
      setTotalPages(repRes.data.meta?.total_pages ?? 1)
      if (lavaggi.length === 0) setLavaggi(lavRes.data.data ?? [])
    } catch {
      setError('Failed to load reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this report?')) return
    try {
      await api.delete(`/reports/${id}`)
      load(page)
    } catch {
      setError('Failed to delete report.')
    }
  }

  const handleDownload = async (id: number) => {
    try {
      const res = await api.get(`/reports/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers['content-disposition']
      const filename = disposition?.match(/filename="?(.+)"?/)?.[1] ?? `report-${id}`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to download report.')
    }
  }

  const formatSize = (bytes: number | null) => {
    if (bytes == null) return '--'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  if (loading && reports.length === 0) return <Spinner />

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and download reports">
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue hover:bg-blue/90 text-white text-sm font-medium rounded-lg transition-colors">
          + New Report
        </button>
      </PageHeader>

      {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

      {showModal && <CreateReportModal lavaggi={lavaggi} onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(1) }} />}

      {reports.length === 0 ? (
        <EmptyState message="No reports generated yet" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ts border-b border-border">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Format</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Size</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-el/50 transition-colors">
                    <td className="px-5 py-3 text-tp font-medium">{r.name}</td>
                    <td className="px-5 py-3 text-ts uppercase">{r.format}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-ts">{formatSize(r.file_size)}</td>
                    <td className="px-5 py-3 text-ts">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 flex gap-2">
                      {r.status === 'ready' && (
                        <button onClick={() => handleDownload(r.id)} className="px-3 py-1 text-xs bg-el border border-border rounded text-teal hover:bg-teal/10 transition-colors">
                          Download
                        </button>
                      )}
                      <button onClick={() => handleDelete(r.id)} className="px-3 py-1 text-xs bg-el border border-border rounded text-red hover:bg-red/10 transition-colors">
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

function CreateReportModal({ lavaggi, onClose, onCreated }: { lavaggi: Lavaggio[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', format: 'pdf', lavvaggio_id: '', date_from: '', date_to: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, any> = { name: form.name, format: form.format }
      if (form.lavvaggio_id) payload.lavvaggio_id = form.lavvaggio_id
      if (form.date_from) payload.date_from = form.date_from
      if (form.date_to) payload.date_to = form.date_to
      await api.post('/reports', { report: payload })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] ?? 'Failed to create report.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-tp mb-4">New Report</h3>
        {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-ts mb-1">Report Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue" placeholder="Monthly report" />
          </div>
          <div>
            <label className="block text-sm text-ts mb-1">Format</label>
            <select value={form.format} onChange={e => set('format', e.target.value)} className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue">
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-ts mb-1">Lavaggio (optional)</label>
            <select value={form.lavvaggio_id} onChange={e => set('lavvaggio_id', e.target.value)} className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue">
              <option value="">All Lavaggi</option>
              {lavaggi.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ts mb-1">From</label>
              <input type="date" value={form.date_from} onChange={e => set('date_from', e.target.value)} className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue" />
            </div>
            <div>
              <label className="block text-sm text-ts mb-1">To</label>
              <input type="date" value={form.date_to} onChange={e => set('date_to', e.target.value)} className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp focus:outline-none focus:border-blue" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-el border border-border rounded-lg text-ts hover:text-tp transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue text-white rounded-lg hover:bg-blue/90 disabled:opacity-60 transition-colors">
              {saving ? 'Creating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
