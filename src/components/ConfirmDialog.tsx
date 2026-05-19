import { T } from '../tokens'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  confirmColor?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', confirmColor = T.red, onConfirm, onCancel }: Props) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:5000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:T.bgCard, borderRadius:24, padding:32, border:`1px solid ${T.borderL}`, boxShadow:'0 40px 80px rgba(0,0,0,.6)', maxWidth:400, width:'100%', animation:'dropIn .3s ease forwards' }}>
        <div style={{ fontSize:20, fontWeight:800, color:T.tp, marginBottom:10 }}>{title}</div>
        <div style={{ fontSize:14, color:T.ts, lineHeight:1.6, marginBottom:28 }}>{message}</div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onCancel} style={{ flex:1, background:T.bgEl, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px', color:T.ts, fontSize:14, fontWeight:700, cursor:'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, background:`${confirmColor}22`, border:`1px solid ${confirmColor}44`, borderRadius:12, padding:'12px', color:confirmColor, fontSize:14, fontWeight:700, cursor:'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
