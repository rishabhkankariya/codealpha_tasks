import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import {
  BarChart3, TrendingUp, Users, Bus, Ticket, CreditCard,
  AlertCircle, MapPin, ArrowRight, Activity
} from 'lucide-react'

interface Summary {
  total_bookings: number
  active_passes: number
  total_revenue: number
  booking_revenue: number
  pass_revenue: number
  active_users: number
  total_users: number
  total_routes: number
  avg_booking_value: number
  period_days: number
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/admin/analytics/summary?days=30')
      setSummary(res.data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const STAT_CARDS = summary ? [
    { label: 'Total Revenue', value: `₹${summary.total_revenue.toLocaleString('en-IN')}`, sub: `₹${summary.avg_booking_value.toFixed(0)} avg/booking`, icon: CreditCard, light: 'bg-green-50 text-green-700' },
    { label: 'Total Bookings', value: summary.total_bookings.toLocaleString(), sub: 'Last 30 days', icon: Ticket, light: 'bg-blue-50 text-blue-700' },
    { label: 'Active Passes', value: summary.active_passes.toLocaleString(), sub: 'Currently valid', icon: CreditCard, light: 'bg-purple-50 text-purple-700' },
    { label: 'Total Users', value: summary.total_users.toLocaleString(), sub: `${summary.active_users} active`, icon: Users, light: 'bg-orange-50 text-orange-700' },
    { label: 'Active Routes', value: summary.total_routes.toLocaleString(), sub: 'PMPML routes', icon: MapPin, light: 'bg-teal-50 text-teal-700' },
    { label: 'Pass Revenue', value: `₹${summary.pass_revenue.toLocaleString('en-IN')}`, sub: 'From passes', icon: BarChart3, light: 'bg-pink-50 text-pink-700' },
  ] : []

  const QUICK_LINKS = [
    { to: '/admin/bookings', label: 'View All Bookings', icon: Ticket, desc: 'Manage ticket bookings' },
    { to: '/admin/passes', label: 'View All Passes', icon: CreditCard, desc: 'Manage bus passes' },
    { to: '/admin/users', label: 'Manage Users', icon: Users, desc: 'View registered users' },
    { to: '/admin/routes', label: 'Manage Routes', icon: Bus, desc: 'Edit PMPML routes' },
    { to: '/admin/analytics', label: 'Full Analytics', icon: BarChart3, desc: 'Revenue & trends' },
    { to: '/admin/settings', label: 'Settings', icon: Activity, desc: 'System configuration' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          System overview · Last 30 days · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
          <p className="text-gray-500">Loading dashboard…</p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {STAT_CARDS.map(({ label, value, sub, icon: Icon, light }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${light}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue split */}
          {summary && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
              <div className="flex gap-4 mb-3">
                <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-blue-700">₹{summary.booking_revenue.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-blue-600 font-medium mt-0.5">Ticket Bookings</p>
                </div>
                <div className="flex-1 bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-purple-700">₹{summary.pass_revenue.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-purple-600 font-medium mt-0.5">Bus Passes</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-green-700">₹{summary.total_revenue.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-green-600 font-medium mt-0.5">Total Revenue</p>
                </div>
              </div>
              {/* Bar */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="bg-blue-500 h-full transition-all"
                  style={{ width: `${summary.total_revenue > 0 ? (summary.booking_revenue / summary.total_revenue) * 100 : 50}%` }} />
                <div className="bg-purple-500 h-full transition-all flex-1" />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Bookings</span><span>Passes</span>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUICK_LINKS.map(({ to, label, icon: Icon, desc }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition group">
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 transition">
                    <Icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
