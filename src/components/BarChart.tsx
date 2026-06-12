import { T } from '../tokens'

interface BarDatum { l: string; v: number }

export default function BarChart({ data, color = T.blue, height = 80 }: { data: BarDatum[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.v), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, height:'100%' }}>
          <div style={{ flex:1, width:'100%', display:'flex', alignItems:'flex-end', borderRadius:4, overflow:'hidden', background:`${color}14` }}>
            <div style={{
              width:'100%',
              background:`linear-gradient(180deg,${color} 0%,${color}88 100%)`,
              borderRadius:4,
              height:`${(d.v/max)*100}%`,
              minHeight:3,
              transition:'height .4s ease',
              animation:`slideUp .4s ease ${i*.03}s forwards`,
            }}/>
          </div>
          <span style={{ fontSize:9, color:T.tm, whiteSpace:'nowrap' }}>{d.l}</span>
        </div>
      ))}
    </div>
  )
}
