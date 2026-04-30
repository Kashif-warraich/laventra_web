import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { saveAuth } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/login', { user: { email, password } })
      const { token, user } = res.data.data
      saveAuth(token, user)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.errors?.[0] ?? 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-tp">Laventra</h1>
          <p className="text-ts mt-1">Sign in to the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 space-y-5">
          {error && (
            <div className="bg-red/10 border border-red/30 text-red rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ts mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-el border border-border rounded-lg text-tp placeholder:text-tm focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ts mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-el border border-border rounded-lg text-tp placeholder:text-tm focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue hover:bg-blue/90 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
