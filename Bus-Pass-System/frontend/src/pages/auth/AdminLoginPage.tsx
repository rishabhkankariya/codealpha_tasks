import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Mail, Lock, AlertCircle, Shield, Eye, EyeOff, ArrowLeft, HelpCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  
  // Login form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  // Forgot Password modal states
  const [isForgotOpen, setIsForgotOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      const role = stored?.state?.user?.role?.toLowerCase()
      if (role === 'admin') {
        navigate('/admin')
      } else {
        useAuthStore.getState().logout()
        setError('Access denied. This portal is for administrators only.')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background abstract glowing orbs */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Admin View */}
        {!isForgotOpen ? (
          <div>
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl shadow-xl shadow-red-900/20 mb-4 animate-bounce-slow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Portal</h1>
              <p className="text-gray-400 text-sm mt-1">PMPML SmartBus Control Center</p>
            </div>

            {/* Glassmorphism Card */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl shadow-black/40">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Administrator Login</h2>
                <p className="text-gray-400 text-xs mt-1">Authorized personnel only. All actions are audited.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-950/40 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Admin Email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-red-500 transition" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@smartbus.com"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-red-500 transition" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-11 pr-11 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition shadow-inner"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition p-1"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button 
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                  >
                    Forgot Admin Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <Shield className="h-4.5 w-4.5" />
                      Sign In to Admin Panel
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-5 border-t border-slate-800/80 text-center">
                <p className="text-gray-500 text-sm">
                  Not an admin?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition flex items-center justify-center gap-1 mt-1 hover:underline">
                    Passenger Login Portal →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Forgot Password View for Admin */
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl shadow-black/40">
            <button 
              onClick={() => setIsForgotOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-200 transition flex items-center gap-1 text-xs font-semibold mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <div className="text-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <HelpCircle className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce-slow" />
              <h3 className="text-lg font-bold text-white mb-2">Reset Admin Password</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                To maintain system security, administrator password resets must be performed directly in the host shell or by contacting the system database administrator.
              </p>
              
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-left mb-6 text-xs text-slate-400 leading-relaxed font-mono">
                # Host command to reset password:<br/>
                sudo docker exec -it smart-bus-backend python -c "..."
              </div>

              <button
                onClick={() => setIsForgotOpen(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Security notice */}
        <p className="text-center text-slate-700 text-xs mt-6">
          🔒 Secure SSL connection · Access logs are archived for 90 days
        </p>
      </div>
    </div>
  )
}
