import { Outlet, Link } from 'react-router-dom'
import { Bus, ArrowLeft } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute -top-12 -left-12 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-300/25 rounded-full blur-3xl animate-float-delay pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-float-slow pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group transition select-none">
            <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
              SmartBus
            </span>
          </Link>
        </div>

        {/* Auth Form Card */}
        <div className="backdrop-blur-md bg-white/90 border border-white/50 rounded-3xl shadow-xl shadow-slate-200/30 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40">
          <Outlet />
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors duration-200 hover:underline group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
