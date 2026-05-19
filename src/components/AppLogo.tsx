interface AppLogoProps { size?: number; showBg?: boolean; id?: string }

export default function AppLogo({ size = 40, showBg = true, id = 'wl' }: AppLogoProps) {
  const gM = `${id}-m`, gBg = `${id}-bg`, gD = `${id}-d`, gC = `${id}-c`
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <linearGradient id={gBg} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#0D1F38"/><stop offset="100%" stopColor="#060E1C"/></linearGradient>
        <linearGradient id={gM} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2B7FFF"/><stop offset="60%" stopColor="#00D4AA"/><stop offset="100%" stopColor="#00C896"/></linearGradient>
        <linearGradient id={gD} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5BBAFF"/><stop offset="100%" stopColor="#2B7FFF"/></linearGradient>
        <linearGradient id={gC} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C8D8EE"/><stop offset="100%" stopColor="#8AAAC8"/></linearGradient>
      </defs>
      {showBg && <rect width="200" height="200" rx="44" fill={`url(#${gBg})`}/>}
      <path d="M100 18 L162 52 L162 148 L100 182 L38 148 L38 52 Z" stroke={`url(#${gM})`} strokeWidth="7" fill="none" strokeLinejoin="round"/>
      {[0,1,2].map(i => <rect key={i} x="34" y={72+i*20} width="20" height="13" rx="6.5" fill={`url(#${gM})`} opacity={1-i*.15}/>)}
      {[0,1,2].map(i => <rect key={i} x="146" y={72+i*20} width="20" height="13" rx="6.5" fill={`url(#${gM})`} opacity={1-i*.15}/>)}
      {[{x:72,y:24,s:.7},{x:84,y:16,s:.85},{x:96,y:22,s:.65},{x:100,y:12,s:1},{x:104,y:22,s:.65},{x:116,y:16,s:.85},{x:128,y:24,s:.7},{x:88,y:32,s:.55},{x:100,y:28,s:.6},{x:112,y:32,s:.55}].map((d,i) => (
        <ellipse key={i} cx={d.x} cy={d.y} rx={d.s*4} ry={d.s*5.5} fill={`url(#${gD})`} opacity=".9"/>
      ))}
      <path d="M62 138 L62 118 Q62 108 72 108 L128 108 Q138 108 138 118 L138 138 Z" fill={`url(#${gC})`}/>
      <path d="M78 108 L84 90 Q86 86 100 86 Q114 86 116 90 L122 108 Z" fill={`url(#${gC})`}/>
      <path d="M86 107 L91 91 Q92 88 100 88 Q108 88 109 91 L114 107 Z" fill="#0A1830" opacity=".7"/>
      <ellipse cx="76" cy="126" rx="8" ry="5" fill="#D0E8FF" opacity=".9"/>
      <ellipse cx="124" cy="126" rx="8" ry="5" fill="#D0E8FF" opacity=".9"/>
      <ellipse cx="76" cy="126" rx="4" ry="2.5" fill="white"/>
      <ellipse cx="124" cy="126" rx="4" ry="2.5" fill="white"/>
      <rect x="88" y="119" width="24" height="12" rx="4" fill="#0A1830" opacity=".5"/>
      {[0,1,2].map(i => <rect key={i} x={91+i*7} y={121} width="4" height="8" rx="2" fill="#162236" opacity=".8"/>)}
      <rect x="64" y="134" width="72" height="8" rx="4" fill="#A8C0D8"/>
      <rect x="84" y="136" width="32" height="10" rx="3" fill="#00C896"/>
      {[0,1,2].map(i => <rect key={i} x={87+i*9} y={138} width="6" height="6" rx="1.5" fill="#060E1C" opacity=".45"/>)}
      <circle cx="78" cy="142" r="10" fill="#0A1520"/><circle cx="78" cy="142" r="5" fill="#162236"/>
      <circle cx="122" cy="142" r="10" fill="#0A1520"/><circle cx="122" cy="142" r="5" fill="#162236"/>
      <line x1="44" y1="120" x2="156" y2="120" stroke="#00C896" strokeWidth="2.5" strokeDasharray="8,5" opacity=".85"/>
    </svg>
  )
}
