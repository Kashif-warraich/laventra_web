import { useEffect, useState } from 'react'
import api from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import { PageHeader, Spinner, ErrorMsg, EmptyState } from './DashboardPage'

interface Lavaggio { id: number; name: string }

interface ActivationCode {
  id: number
  state: 'pending' | 'redeemed' | 'expired' | 'revoked'
  code_preview: string
  device_type: 'mini_pc' | 'camera'
  lavvaggio: { id: number; name: string }
  device: { id: number; serial_number: string } | null
  created_by: { id: number; email: string } | null
  expires_at: string
  redeemed_at: string | null
  revoked_at: string | null
  created_at: string
}

export default function ActivationCodesPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [lavaggi, setLavaggi] = useState<Lavaggio[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterLav, setFilterLav] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [genLav, setGenLav] = useState('')
  const [genType, setGenType] = useState<'mini_pc' | 'camera'>('mini_pc')
  const [genTtlDays, setGenTtlDays] = useState(7)
  const [generating, setGenerating] = useState(false)

  // Result modal — shows the plaintext code ONCE
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = async (p = page) => {
    setLoading(true); setError('')
    try {
      const params: Record<string, any> = { page: p }
      if (filterLav)   params.lavvaggio_id = filterLav
      if (filterState) params.state = filterState

      const [codesRes, lavRes] = await Promise.all([
        api.get('/activation_codes', { params }),
        api.get('/lavvaggios'),
      ])
      setCodes(codesRes.data.data ?? [])
      setTotalPages(codesRes.data.meta?.total_pages ?? 1)
      setLavaggi(lavRes.data.data ?? [])
    } catch {
      setError('Failed to load activation codes.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(page) }, [page, filterLav, filterState])

  const openModal = () => {
    setGenLav(lavaggi[0]?.id?.toString() ?? '')
    setGenType('mini_pc')
    setGenTtlDays(7)
    setModalOpen(true)
  }

  const generate = async () => {
    if (!genLav) return
    setGenerating(true); setError('')
    try {
      const res = await api.post('/activation_codes', {
        lavvaggio_id: Number(genLav),
        device_type:  genType,
        ttl_seconds:  genTtlDays * 86400,
      })
      const plaintext = res.data.data?.activation_code
      setModalOpen(false)
      if (plaintext) {
        setCreatedCode(plaintext)
        setCopied(false)
      }
      load(page)
    } catch (e: any) {
      setError(e?.response?.data?.errors?.[0] ?? 'Failed to generate code.')
    } finally {
      setGenerating(false)
    }
  }

  const revoke = async (id: number) => {
    if (!confirm('Revoke this activation code?')) return
    try {
      await api.delete(`/activation_codes/${id}`)
      load(page)
    } catch (e: any) {
      setError(e?.response?.data?.errors?.[0] ?? 'Failed to revoke.')
    }
  }

  const copyToClipboard = async () => {
    if (!createdCode) return
    try {
      await navigator.clipboard.writeText(createdCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (loading && codes.length === 0) return <Spinner />

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Activation Codes"
          subtitle="One-time codes that a lavvaggio owner enters on the edge device"
        />
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue text-white rounded-lg text-sm font-medium hover:bg-bluel transition-colors"
        >
          + Generate Code
        </button>
      </div>

      {error && <ErrorMsg msg={error} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterLav}
          onChange={e => { setFilterLav(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
        >
          <option value="">All Lavaggi</option>
          {lavaggi.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select
          value={filterState}
          onChange={e => { setFilterState(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
        >
          <option value="">Any state</option>
          <option value="pending">Pending</option>
          <option value="redeemed">Redeemed</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      {/* List */}
      {codes.length === 0 ? (
        <EmptyState message="No activation codes yet. Generate one to provision an edge device." />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-el text-ts">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Lavvaggio</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">State</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-left px-4 py-3 font-medium">Device</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-tp">
              {codes.map(c => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono">{c.code_preview}</td>
                  <td className="px-4 py-3">{c.lavvaggio.name}</td>
                  <td className="px-4 py-3 capitalize">{c.device_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.state} /></td>
                  <td className="px-4 py-3 text-ts">{new Date(c.expires_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ts">{c.device?.serial_number ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.state === 'pending' && (
                      <button
                        onClick={() => revoke(c.id)}
                        className="text-red hover:underline text-xs"
                      >Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Generate-code modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-tp mb-4">Generate activation code</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-ts mb-1">Lavvaggio</label>
                <select
                  value={genLav}
                  onChange={e => setGenLav(e.target.value)}
                  className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
                >
                  <option value="">— pick a lavvaggio —</option>
                  {lavaggi.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ts mb-1">Device type</label>
                <select
                  value={genType}
                  onChange={e => setGenType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
                >
                  <option value="mini_pc">Mini PC (detector)</option>
                  <option value="camera">Camera</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-ts mb-1">Valid for (days)</label>
                <input
                  type="number" min={1} max={30}
                  value={genTtlDays}
                  onChange={e => setGenTtlDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-full px-3 py-2 bg-el border border-border rounded-lg text-tp text-sm focus:outline-none focus:border-blue"
                />
                <p className="text-xs text-ts mt-1">After this the code self-expires if unused.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-ts hover:text-tp text-sm"
              >Cancel</button>
              <button
                onClick={generate}
                disabled={!genLav || generating}
                className="px-4 py-2 bg-blue text-white rounded-lg text-sm disabled:opacity-50"
              >{generating ? 'Generating…' : 'Generate'}</button>
            </div>
          </div>
        </div>
      )}

      {/* One-time code reveal modal */}
      {createdCode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-tp mb-2">Activation code created</h3>
            <p className="text-sm text-ts mb-4">
              <strong className="text-red">Copy this code now</strong> — for security it will not
              be shown again.
            </p>
            <div className="bg-el border border-border rounded-lg p-4 font-mono text-lg text-tp tracking-widest text-center break-all">
              {createdCode}
            </div>
            <p className="text-xs text-ts mt-3">
              Provide it to the lavvaggio owner. On the edge device, run:
              <code className="block mt-1 bg-el px-2 py-1 rounded text-tp">
                python main.py --activate {createdCode} --api-url &lt;your-backend&gt;
              </code>
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue text-white rounded-lg text-sm hover:bg-bluel"
              >{copied ? '✓ Copied' : 'Copy code'}</button>
              <button
                onClick={() => setCreatedCode(null)}
                className="px-4 py-2 text-ts hover:text-tp text-sm"
              >Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
