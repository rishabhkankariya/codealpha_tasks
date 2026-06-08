import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, MapPin, Ticket, CreditCard, Users,
  LogOut, Menu, ChevronRight, BarChart3, Settings,
  Shield, Bell
} from 'lucide-react'
import { useState } from 'react'

const SIDEBAR_LINKS = [
  {
    section: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  },
  {
    section: 'Management',
    items: [
      { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
      { to: '/admin/passes', label: 'Passes', icon: CreditCard },
      { to: '/admin/routes', label: 'Routes', icon: MapPin },
      { to: '/admin/users', label: 'Users', icon: Users },
    ]
  },
  {
    section: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (to: string, exact = false) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/')

  const displayName = (user as any)?.full_name ||
    `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() ||
    user?.email?.split('@')[0] || 'Admin'

  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">Admin Panel</p>
          <p className="text-gray-400 text-xs">PMPML SmartBus</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {SIDEBAR_LINKS.map(({ section, items }) => (
          <div key={section}>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-3 mb-2">{section}</p>
            <div className="space-y-0.5">
              {items.map(({ to, label, icon: Icon, exact }) => {
                const active = isActive(to, exact)
                return (
                  <Link key={to} to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-orange-400' : ''}`} />
                    {label}
                    {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-orange-400" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out only */}
      <div className="px-3 py-3 border-t border-gray-800">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{displayName}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-gray-900 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Admin</span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
              <span className="font-semibold text-gray-900 capitalize">
                {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Admin badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">Admin</span>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
