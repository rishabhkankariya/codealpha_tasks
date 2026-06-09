import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Mail, Lock, AlertCircle, Eye, EyeOff, Bus, ArrowLeft, Send, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  
  // Login form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  // Forgot Password modal states
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isForgotLoading, setIsForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState('')

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
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    }
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setIsForgotLoading(true)

    // Simulate sending email
    setTimeout(() => {
      if (!forgotEmail.includes('@')) {
        setForgotError('Please enter a valid email address.')
        setIsForgotLoading(false);
        return;
      }
      setIsForgotLoading(false)
      setForgotSuccess(true)
    }, 1500)
  }

  const resetForgotState = () => {
    setIsForgotOpen(false)
    setForgotEmail('')
    setForgotSuccess(false)
    setForgotError('')
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login View */}
      {!isForgotOpen ? (
        <div className="relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-4 animate-bounce-slow">
              <Bus className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to PMPML SmartBus System</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 animate-shake">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-11"
                  placeholder="name@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-11 pr-11"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 transition cursor-pointer" />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold transition">
                Create account
              </Link>
            </p>
            <div className="border-t border-gray-100 pt-4">
              <Link to="/admin/login"
                className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition flex items-center justify-center gap-1.5 hover:scale-[1.02]"
              >
                <Lock className="h-3.5 w-3.5" /> Admin Portal Login
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Forgot Password View */
        <div className="relative">
          <button 
            onClick={resetForgotState}
            className="absolute top-0 left-0 p-1 text-gray-400 hover:text-gray-600 transition flex items-center gap-1 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="text-center mb-8 mt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-orange-500/20 mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Recover Password</h2>
            <p className="text-gray-500 text-sm mt-1">We'll send you a link to reset your password</p>
          </div>

          {forgotError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{forgotError}</p>
            </div>
          )}

          {!forgotSuccess ? (
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition" />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="input pl-11 focus:ring-orange-500"
                    placeholder="name@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isForgotLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending link…
                  </span>
                ) : (
                  <>
                    <Send className="h-4.5 w-4.5" />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100 animate-scale-in">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4 animate-bounce-slow" />
              <h3 className="text-lg font-bold text-emerald-900 mb-2">Check Your Inbox!</h3>
              <p className="text-emerald-700 text-sm leading-relaxed mb-6">
                We've sent a password reset link to <span className="font-semibold">{forgotEmail}</span>. The link will expire in 15 minutes.
              </p>
              <button
                onClick={resetForgotState}
                className="btn bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 w-full py-3 rounded-xl transition"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
