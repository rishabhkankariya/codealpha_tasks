import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  Bus, User, LogOut, Menu, X, Ticket, CreditCard, MapPin,
  LayoutDashboard, Bot, Home, BookOpen, Phone,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { to: '/routes', label: 'Routes', icon: MapPin },
  { to: '/book-ticket', label: 'Book Ticket', icon: Ticket, auth: true },
  { to: '/buy-pass', label: 'Buy Pass', icon: CreditCard, auth: true },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Bot, auth: true },
]

const USER_MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-bookings', label: 'My Bookings', icon: Ticket },
  { to: '/my-passes', label: 'My Passes', icon: CreditCard },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileOpen(false)
    setUserMenuOpen(false)
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const displayName = (user as any)?.full_name ||
    `${(user as any)?.first_name || ''}`.trim() ||
    user?.email?.split('@')[0] || 'User'

  const initials = displayName
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-[#2e5bff] to-[#6b13af] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-gray-900">SmartBus</span>
                <span className="text-xs text-gray-400 block leading-none -mt-0.5">PMPML Pune</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.filter(l => !l.auth || isAuthenticated).map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive(to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Dashboard quick link */}
                  <Link to="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/dashboard')
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>

                  {/* User dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2e5bff] to-[#6b13af] flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                      </div>
                      <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">
                        {displayName.split(' ')[0]}
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2.5 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        {USER_MENU.map(({ to, label, icon: Icon }) => (
                          <Link key={to} to={to}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              navigate(to);
                              setUserMenuOpen(false);
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <Icon className="h-4 w-4 text-gray-400" />
                            {label}
                          </Link>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                    Sign In
                  </Link>
                  <Link to="/register"
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#2e5bff] to-[#6b13af] hover:brightness-110 rounded-lg shadow-sm transition">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {/* User info */}
              {isAuthenticated && (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              )}

              {/* All nav links — NO admin link here */}
              {[
                { to: '/', label: 'Home', icon: Home },
                { to: '/routes', label: 'Routes', icon: MapPin },
                ...(isAuthenticated ? [
                  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { to: '/book-ticket', label: 'Book Ticket', icon: Ticket },
                  { to: '/buy-pass', label: 'Buy Pass', icon: CreditCard },
                  { to: '/my-bookings', label: 'My Bookings', icon: BookOpen },
                  { to: '/my-passes', label: 'My Passes', icon: CreditCard },
                  { to: '/ai-assistant', label: 'AI Assistant', icon: Bot },
                  { to: '/profile', label: 'Profile', icon: User },
                ] : []),
              ].map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive(to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}

              {isAuthenticated ? (
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition mt-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold transition">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">SmartBus</span>
                  <span className="text-xs text-gray-400 block leading-none">PMPML Pune</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Digital ticketing & pass management for Pune's PMPML bus network.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-300">Travel</h3>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                {[
                  { to: '/routes', label: 'Browse Routes', icon: MapPin },
                  { to: '/book-ticket', label: 'Book Ticket', icon: Ticket },
                  { to: '/buy-pass', label: 'Buy Pass', icon: CreditCard },
                  { to: '/ai-assistant', label: 'AI Assistant', icon: Bot },
                ].map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link to={to} className="hover:text-white transition flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-300">Account</h3>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                {[
                  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { to: '/my-bookings', label: 'My Bookings', icon: BookOpen },
                  { to: '/my-passes', label: 'My Passes', icon: CreditCard },
                  { to: '/profile', label: 'Profile', icon: User },
                ].map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link to={to} className="hover:text-white transition flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-300">Support</h3>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                <li><a href="tel:020-26058888" className="hover:text-white transition flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> 020-26058888</a></li>
                <li><a href="https://pmpml.pune.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition flex items-center gap-2"><Bus className="h-3.5 w-3.5" /> PMPML Website</a></li>
                <li><Link to="/ai-assistant" className="hover:text-white transition flex items-center gap-2"><Bot className="h-3.5 w-3.5" /> AI Help</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-sm">
            <p>© 2026 SmartBus · PMPML Pune. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-gray-300 transition">Privacy</Link>
              <Link to="/terms" className="hover:text-gray-300 transition">Terms</Link>
              <Link to="/accessibility" className="hover:text-gray-300 transition">Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
