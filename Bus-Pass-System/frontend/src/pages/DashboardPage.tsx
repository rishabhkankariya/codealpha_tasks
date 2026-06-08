import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Ticket, CreditCard, MapPin, Bot, Bus, Clock, CheckCircle, ChevronRight } from 'lucide-react'

interface Stats {
  totalBookings: number
  activeBookings: number
  activePasses: number
  totalSpent: number
}

interface RecentBooking {
  id: string
  route?: { origin: string; destination: string; route_number: string }
  booking_date: string
  journey_date: string
  total_amount: number
  status: string
  booking_status: string
}

interface ActivePass {
  id: string
  pass_type?: { name: string; price: number }
  end_date: string
  valid_to: string
  status: string
  pass_status: string
}

function fmtDate(d?: string) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeft(end?: string) {
  if (!end) return 0
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000))
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats>({ totalBookings: 0, activeBookings: 0, activePasses: 0, totalSpent: 0 })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [activePasses, setActivePasses] = useState<ActivePass[]>([])
  const [loading, setLoading] = useState(true)

  const displayName = (user as any)?.full_name || 
    `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() || 
    user?.email?.split('@')[0] || 'there'

  useEffect(() => {
    const load = async () => {
      try {
        const [bookRes, passRes] = await Promise.all([
          api.get('/api/v1/bookings/').catch(() => ({ data: [] })),
          api.get('/api/v1/passes/').catch(() => ({ data: [] })),
        ])
        const bookings: RecentBooking[] = bookRes.data || []
        const passes: ActivePass[] = passRes.data || []

        const active = bookings.filter(b => (b.booking_status || b.status) === 'confirmed')
        const activePss = passes.filter(p => (p.pass_status || p.status) === 'active')
        const spent = bookings
          .filter(b => (b.booking_status || b.status) === 'confirmed')
          .reduce((s, b) => s + (b.total_amount || 0), 0)

        setStats({
          totalBookings: bookings.length,
          activeBookings: active.length,
          activePasses: activePss.length,
          totalSpent: spent,
        })
        setRecentBookings(bookings.slice(0, 3))
        setActivePasses(activePss.slice(0, 3))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const STAT_CARDS = [
    { label: 'Total Bookings', value: stats.totalBookings, icon: Ticket, color: 'bg-blue-100 text-blue-600', link: '/my-bookings' },
    { label: 'Active Bookings', value: stats.activeBookings, icon: CheckCircle, color: 'bg-green-100 text-green-600', link: '/my-bookings' },
    { label: 'Active Passes', value: stats.activePasses, icon: CreditCard, color: 'bg-purple-100 text-purple-600', link: '/my-passes' },
    { label: 'Total Spent', value: `₹${stats.totalSpent.toFixed(0)}`, icon: Bus, color: 'bg-orange-100 text-orange-600', link: '/my-bookings' },
  ]

  const QUICK_ACTIONS = [
    { label: 'Book Ticket', desc: 'Reserve a seat on any route', icon: Ticket, color: 'bg-blue-600', link: '/book-ticket' },
    { label: 'Buy Pass', desc: 'Unlimited travel passes', icon: CreditCard, color: 'bg-green-600', link: '/buy-pass' },
    { label: 'Browse Routes', desc: '1030+ PMPML routes', icon: MapPin, color: 'bg-purple-600', link: '/routes' },
    { label: 'AI Assistant', desc: 'Find routes with AI', icon: Bot, color: 'bg-orange-600', link: '/ai-assistant' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your PMPML travel overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link}
            className="card hover:shadow-lg transition group">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(({ label, desc, icon: Icon, color, link }) => (
            <Link key={label} to={link}
              className="card hover:shadow-lg transition group text-center py-6">
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Bookings</h2>
            <Link to="/my-bookings" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No bookings yet</p>
              <Link to="/book-ticket" className="text-primary-600 text-sm hover:underline mt-1 inline-block">
                Book your first ticket →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map(b => {
                const sk = (b.booking_status || b.status || '').toLowerCase()
                const date = b.booking_date || b.journey_date
                return (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {b.route?.origin || 'N/A'} → {b.route?.destination || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">{fmtDate(date)}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-primary-600 text-sm">₹{b.total_amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        sk === 'confirmed' ? 'bg-green-100 text-green-700' :
                        sk === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{sk}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Active Passes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Active Passes</h2>
            <Link to="/my-passes" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : activePasses.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No active passes</p>
              <Link to="/buy-pass" className="text-primary-600 text-sm hover:underline mt-1 inline-block">
                Purchase a pass →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activePasses.map(p => {
                const end = p.end_date || p.valid_to
                const remaining = daysLeft(end)
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {p.pass_type?.name || 'Bus Pass'}
                      </p>
                      <p className="text-xs text-gray-500">Expires {fmtDate(end)}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-green-700 text-sm">{remaining}d left</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* PMPML Info Banner */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-blue-700">
          <Bus className="h-4 w-4" />
          <span><strong>1030+</strong> PMPML routes available</span>
        </div>
        <div className="flex items-center gap-2 text-blue-700">
          <Clock className="h-4 w-4" />
          <span>Service: <strong>5:00 AM – 11:30 PM</strong></span>
        </div>
        <div className="flex items-center gap-2 text-blue-700">
          <CheckCircle className="h-4 w-4" />
          <span><strong>18</strong> pass types available</span>
        </div>
      </div>
    </div>
  )
}
