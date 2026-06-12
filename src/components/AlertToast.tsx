import { T } from '../tokens'
import type { AlertType } from '../context/AlertContext'

const cfg: Record<AlertType, { color: string; bg: string; border: string; icon: string; label: string }> = {
  success: { color: T.teal,   bg: 'rgba(0,200,150,.1)',  border: 'rgba(0,200,150,.2)',  icon: '✓', label: 'Success' },
  error:   { color: T.red,    bg: 'rgba(255,77,106,.1)', border: 'rgba(255,77,106,.2)', icon: '✕', label: 'Error'   },
  warning: { color: T.amber,  bg: 'rgba(245,166,35,.1)', border: 'rgba(245,166,35,.2)', icon: '!', label: 'Warning' },
  info:    { color: T.blue,   bg: 'rgba(43,127,255,.1)', border: 'rgba(43,127,255,.2)', icon: 'i', label: 'Info'    },
}

export default function AlertToast({ type, message, onDismiss }: { type: AlertType; message: string; onDismiss: () => void }) {
  const c = cfg[type]
  return (
    <div style={{
      position:'fixed', top:20, right:20, zIndex:9999,
      minWidth:300, maxWidth:420,
      background:c.bg, border:`1px solid ${c.border}`, borderRadius:16,
      padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12,
      animation:'dropIn .4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      boxShadow:'0 12px 40px rgba(0,0,0,.5)', backdropFilter:'blur(12px)',
    }}>
      <div style={{
        width:32, height:32, borderRadius:'50%',
        background:`${c.color}22`, border:`1.5px solid ${c.color}55`,
        display:'flex', alignItems:'center', justifyContent:'center',
        color:c.color, fontWeight:700, fontSize:14, flexShrink:0,
      }}>{c.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ color:c.color, fontSize:11, fontWeight:700, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</div>
        <div style={{ color:T.tp, fontSize:13, lineHeight:1.5 }}>{message}</div>
      </div>
      <button onClick={onDismiss} style={{ background:'none', border:'none', color:T.ts, fontSize:18, cursor:'pointer', lineHeight:1, padding:2, marginTop:-2 }}>×</button>
      <div style={{ position:'absolute', bottom:0, left:0, height:2, background:c.color, borderRadius:'0 0 16px 16px', animation:'progressBar 3.5s linear forwards' }}/>
    </div>
  )
}
