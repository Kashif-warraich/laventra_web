import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../tokens'
import AppLogo from '../components/AppLogo'
import { IEye, IEyeOff } from '../components/Icons'
import { saveAuth } from '../lib/auth'
import api from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [showP, setShowP] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]    = useState('')
  const [focused, setFocused] = useState<string | null>(null)
  const navigate = useNavigate()

  const handle = async () => {
    if (!email || !pass) { setError('Please enter your email and password'); return }
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/login', { user: { email, password: pass } })
      const d = res.data?.data ?? res.data
      if (d.user?.role !== 'admin') {
        setError('Access denied. Please use the mobile app.')
        return
      }
      saveAuth(d.token, d.user)
      navigate('/dashboard', { replace: true })
    } catch (e: any) {
        console.log('LOGIN ERROR FULL:', e)

        const status = e.response?.status
        const data = e.response?.data

        // Try to extract the most useful message
        const message =
            data?.error ||
            data?.message ||
            data?.errors?.join?.(', ') ||
            JSON.stringify(data) ||
            e.message ||
            'Unknown error'

        setError(`(${status}) ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width:'100%', height:'100vh', display:'flex', background:`linear-gradient(135deg,#060E1C 0%,#0A1628 100%)`, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle,${T.blue}25 0%,transparent 70%)`, top:-100, left:-100, animation:'floatOrb 8s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:`radial-gradient(circle,${T.purple}20 0%,transparent 70%)`, top:100, right:-80, animation:'floatOrb 10s ease-in-out 2s infinite' }}/>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle,${T.teal}15 0%,transparent 70%)`, bottom:60, left:'30%', animation:'floatOrb 12s ease-in-out 1s infinite' }}/>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.04 }} viewBox="0 0 1440 900" preserveAspectRatio="none">
          {[0,1,2,3,4,5,6,7,8,9].map(i => <line key={i} x1={i*160} y1="0" x2={i*160} y2="900" stroke={T.blue} strokeWidth="1"/>)}
          {[0,1,2,3,4,5].map(i => <line key={i} x1="0" y1={i*160} x2="1440" y2={i*160} stroke={T.blue} strokeWidth="1"/>)}
        </svg>
      </div>

      <div style={{ flex:'0 0 50%', display:'flex', flexDirection:'column', justifyContent:'center', padding:'80px 70px', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:48 }}>
          <div style={{ borderRadius:18, boxShadow:`0 0 40px ${T.blue}55` }}><AppLogo size={60} showBg id="login-l"/></div>
          <div>
            <div style={{ fontSize:26, fontWeight:800, color:T.tp }}>Laventra</div>
            <div style={{ fontSize:12, color:T.ts, marginTop:2, letterSpacing:'1px', textTransform:'uppercase' }}>Car Wash Intelligence</div>
          </div>
        </div>
        <div style={{ fontSize:44, fontWeight:800, color:T.tp, lineHeight:1.15, marginBottom:20 }}>
          Smart car wash<br/>
          <span style={{ background:`linear-gradient(135deg,${T.blue} 0%,${T.teal} 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>event detection</span>
        </div>
        <div style={{ fontSize:16, color:T.ts, lineHeight:1.7, marginBottom:48, maxWidth:420 }}>
          AI-powered license plate recognition across all your car wash locations. Real-time monitoring, instant alerts, smart analytics.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:400 }}>
          {[
            { v:'9,842', l:'Total Events',     c:T.blue   },
            { v:'96.4%', l:'AI Accuracy',      c:T.teal   },
            { v:'3',     l:'Active Locations', c:T.amber  },
            { v:'< 50ms',l:'Detection Speed',  c:T.purple },
          ].map((s, i) => (
            <div key={i} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:12, color:T.ts, marginTop:3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex:'0 0 50%', display:'flex', alignItems:'center', justifyContent:'center', padding:60, position:'relative', zIndex:1 }}>
        <div style={{ width:'100%', maxWidth:440, background:T.bgCard, border:`1px solid ${T.borderL}`, borderRadius:28, padding:44, boxShadow:'0 40px 120px rgba(0,0,0,.7)' }}>
          <div style={{ fontSize:26, fontWeight:800, color:T.tp, marginBottom:6 }}>Welcome back</div>
          <div style={{ fontSize:14, color:T.ts, marginBottom:32 }}>Sign in to your management portal</div>

          {error && (
            <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}33`, borderRadius:12, padding:'10px 14px', fontSize:13, color:T.red, marginBottom:20 }}>{error}</div>
          )}

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:700, color:T.ts, marginBottom:8, display:'block', textTransform:'uppercase', letterSpacing:'0.7px' }}>Email Address</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              autoComplete="email"
              style={{ width:'100%', background:focused==='email' ? 'rgba(43,127,255,.08)' : T.bgEl, border:`1.5px solid ${focused==='email' ? T.blue : T.border}`, borderRadius:14, padding:'14px 18px', color:T.tp, fontSize:15, outline:'none', transition:'all .2s', boxSizing:'border-box' }}
            />
          </div>

          <div style={{ marginBottom:28 }}>
            <label style={{ fontSize:11, fontWeight:700, color:T.ts, marginBottom:8, display:'block', textTransform:'uppercase', letterSpacing:'0.7px' }}>Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showP ? 'text' : 'password'}
                value={pass}
                onChange={e => setPass(e.target.value)}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === 'Enter' && handle()}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ width:'100%', background:focused==='pass' ? 'rgba(43,127,255,.08)' : T.bgEl, border:`1.5px solid ${focused==='pass' ? T.blue : T.border}`, borderRadius:14, padding:'14px 50px 14px 18px', color:T.tp, fontSize:15, outline:'none', transition:'all .2s', boxSizing:'border-box' }}
              />
              <button onClick={() => setShowP(!showP)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer' }}>
                {showP ? <IEyeOff s={18} c={T.ts}/> : <IEye s={18} c={T.ts}/>}
              </button>
            </div>
          </div>

          <button
            onClick={handle}
            disabled={loading}
            style={{ width:'100%', padding:'16px', background:loading ? T.bgEl : `linear-gradient(135deg,${T.blue} 0%,${T.blueL} 100%)`, border:`1px solid ${loading ? T.border : T.blue}`, borderRadius:16, color:'white', fontSize:16, fontWeight:800, cursor:loading ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:loading ? 'none' : `0 8px 32px ${T.blue}50`, transition:'all .2s' }}
          >
            {loading
              ? <><div style={{ width:18, height:18, border:'2.5px solid rgba(255,255,255,.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>Signing in…</>
              : 'Sign In to Portal'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
