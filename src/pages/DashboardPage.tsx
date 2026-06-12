import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../tokens'
import BarChart from '../components/BarChart'
import { ICar, ICamera, IAi, IEvents } from '../components/Icons'
import api from '../lib/api'

const weekData = [{l:'M',v:52},{l:'T',v:68},{l:'W',v:45},{l:'T',v:71},{l:'F',v:80},{l:'S',v:44},{l:'S',v:36}]
const hourData = [{l:'6',v:8},{l:'8',v:22},{l:'10',v:41},{l:'12',v:35},{l:'14',v:28},{l:'16',v:45},{l:'18',v:38},{l:'20',v:15}]

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
      <p className="text-ts text-sm">{message}</p>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [lavaggi, setLavaggi]   = useState<any[]>([])
  const [devices, setDevices]   = useState<any[]>([])
  const [events, setEvents]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/lavvaggios'),
      api.get('/devices'),
      api.get('/car_wash_events', { params: { per_page: 6 } }),
    ]).then(([lRes, dRes, eRes]) => {
      setLavaggi(lRes.data?.data ?? [])
      setDevices(dRes.data?.data ?? [])
      setEvents(eRes.data?.data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const onlineDevices = devices.filter((d: any) => d.status === 'active').length
  const totalDevices  = devices.length
  const todayWashes   = lavaggi.reduce((a: number, l: any) => a + (l.today_washes ?? 0), 0)
  const openErrors    = events.filter((e: any) => e.status === 1).length

  const kpis = [
    { label:"Today's Events",    value: loading ? '…' : String(todayWashes),                sub:'+12% vs yesterday',   color:T.blue,  Icon:ICar,    trend:12 },
    { label:'Active Devices',    value: loading ? '…' : `${onlineDevices}/${totalDevices}`, sub:'Device status',        color:T.teal,  Icon:ICamera, trend:0  },
    { label:'Avg AI Confidence', value:'96.4%',                                              sub:'Model v2.1',           color:T.amber, Icon:IAi,     trend:2  },
    { label:'Open Errors',       value: loading ? '…' : String(openErrors),                 sub:'Needs action',         color:T.red,   Icon:IEvents, trend:-1 },
  ]

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>
      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background:T.bgCard, borderRadius:18, padding:'20px', border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${k.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <k.Icon s={20} c={k.color}/>
              </div>
              {k.trend !== 0 && (
                <div style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:20, background:k.trend>0 ? `${T.teal}18` : `${T.red}18`, color:k.trend>0 ? T.teal : T.red }}>
                  {k.trend>0 ? '+' : ''}{k.trend}%
                </div>
              )}
            </div>
            <div style={{ fontSize:30, fontWeight:800, color:k.color, marginBottom:4 }}>{k.value}</div>
            <div style={{ fontSize:13, fontWeight:600, color:T.tp, marginBottom:3 }}>{k.label}</div>
            <div style={{ fontSize:12, color:T.ts }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:T.bgCard, borderRadius:18, padding:'20px', border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.tp, marginBottom:4 }}>Events This Week</div>
          <div style={{ fontSize:12, color:T.ts, marginBottom:16 }}>Mon — Sun · All locations</div>
          <BarChart data={weekData} color={T.blue} height={80}/>
        </div>
        <div style={{ background:T.bgCard, borderRadius:18, padding:'20px', border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.tp, marginBottom:4 }}>Today by Hour</div>
          <div style={{ fontSize:12, color:T.ts, marginBottom:16 }}>Hourly activity</div>
          <BarChart data={hourData} color={T.teal} height={80}/>
        </div>
      </div>

      {/* devices + recent events */}
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16 }}>
        {/* device status */}
        <div style={{ background:T.bgCard, borderRadius:18, padding:'20px', border:`1px solid ${T.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.tp }}>Device Status</div>
            <button onClick={() => navigate('/devices')} style={{ background:'none', border:'none', color:T.blue, fontSize:12, fontWeight:600, cursor:'pointer' }}>View all</button>
          </div>
          {devices.slice(0, 7).map((d: any, i: number) => {
            const isAI = d.device_type === 'mini_pc'
            const online = d.status === 'active'
            const dc = online ? (isAI ? T.purple : T.blue) : T.red
            return (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop:i>0 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`${dc}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {isAI ? <IAi s={14} c={dc}/> : <ICamera s={14} c={dc}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.tp, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name ?? d.serial_number}</div>
                  <div style={{ fontSize:11, color:T.ts }}>{d.lavvaggio?.name ?? '—'}</div>
                </div>
                <div style={{ width:7, height:7, borderRadius:'50%', background:online ? T.teal : T.red, boxShadow:online ? `0 0 6px ${T.teal}` : undefined }}/>
              </div>
            )
          })}
          {!loading && devices.length === 0 && <div style={{ fontSize:12, color:T.ts, textAlign:'center', padding:'20px 0' }}>No devices</div>}
        </div>

        {/* recent events */}
        <div style={{ background:T.bgCard, borderRadius:18, padding:'20px', border:`1px solid ${T.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.tp }}>Recent Events</div>
            <button onClick={() => navigate('/events')} style={{ background:'none', border:'none', color:T.blue, fontSize:12, fontWeight:600, cursor:'pointer' }}>View all</button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Plate','Time','Location','Confidence','Status'].map(h => (
                <th key={h} style={{ textAlign:'left', fontSize:10, color:T.ts, fontWeight:700, padding:'0 8px 10px', textTransform:'uppercase', letterSpacing:'0.4px' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {events.map((e: any) => {
                const conf = e.confidence ? +(e.confidence * 100).toFixed(1) : null
                const statusColor = e.status === 0 ? T.teal : e.status === 1 ? T.red : T.amber
                const statusLabel = e.status === 0 ? 'success' : e.status === 1 ? 'error' : 'processing'
                const startedAt = e.started_at ? new Date(e.started_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'
                return (
                  <tr key={e.id} style={{ borderTop:`1px solid ${T.border}` }}>
                    <td style={{ padding:'9px 8px', fontSize:14, fontWeight:700, color:T.tp, fontFamily:'monospace' }}>{e.plate_number ?? '—'}</td>
                    <td style={{ padding:'9px 8px', fontSize:12, color:T.ts }}>{startedAt}</td>
                    <td style={{ padding:'9px 8px', fontSize:12, color:T.ts }}>{e.lavvaggio?.name ?? '—'}</td>
                    <td style={{ padding:'9px 8px' }}>
                      {conf != null ? (
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ height:3, width:36, background:T.bgEl, borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${conf}%`, background:conf>90?T.teal:conf>70?T.amber:T.red, borderRadius:2 }}/>
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:conf>90?T.teal:conf>70?T.amber:T.red }}>{conf}%</span>
                        </div>
                      ) : <span style={{ fontSize:11, color:T.ts }}>—</span>}
                    </td>
                    <td style={{ padding:'9px 8px' }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, textTransform:'uppercase', background:`${statusColor}18`, color:statusColor, border:`1px solid ${statusColor}33` }}>{statusLabel}</span>
                    </td>
                  </tr>
                )
              })}
              {!loading && events.length === 0 && (
                <tr><td colSpan={5} style={{ padding:'30px', textAlign:'center', color:T.ts, fontSize:13 }}>No recent events</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
