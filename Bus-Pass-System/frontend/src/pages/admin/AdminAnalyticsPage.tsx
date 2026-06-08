import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { TrendingUp, AlertCircle, BarChart3, Calendar } from 'lucide-react'

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

interface RevenueDay { date: string; revenue: number }

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [revenueByDay, setRevenueByDay] = useState<RevenueDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(30)

  useEffect(() => { fetchData() }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [s, r] = await Promise.all([
        api.get(`/api/v1/admin/analytics/summary?days=${period}`),
        api.get(`/api/v1/admin/analytics/revenue?days=${period}`),
      ])
      setSummary(s.data)
      const days = Object.entries(r.data.revenue_by_day || {})
        .map(([date, revenue]) => ({ date, revenue: revenue as number }))
        .sort((a, b) => a.date.localeCompare(b.date))
      setRevenueByDay(days)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const maxRevenue = Math.max(...revenueByDay.map(d => d.revenue), 1)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">System performance metrics</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                period === d ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
          <p className="text-gray-500">Loading analytics…</p>
        </div>
      ) : summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Revenue', value: `₹${summary.total_revenue.toLocaleString('en-IN')}`, sub: `₹${summary.avg_booking_value.toFixed(0)} avg/booking`, color: 'border-green-200', icon: TrendingUp, iconColor: 'text-green-600 bg-green-100' },
              { label: 'Total Bookings', value: summary.total_bookings.toLocaleString(), sub: `Last ${period} days`, color: 'border-blue-200', icon: BarChart3, iconColor: 'text-blue-600 bg-blue-100' },
              { label: 'Active Passes', value: summary.active_passes.toLocaleString(), sub: 'Currently valid', color: 'border-purple-200', icon: Calendar, iconColor: 'text-purple-600 bg-purple-100' },
              { label: 'Active Users', value: summary.active_users.toLocaleString(), sub: `of ${summary.total_users} total`, color: 'border-orange-200', icon: TrendingUp, iconColor: 'text-orange-600 bg-orange-100' },
            ].map(({ label, value, sub, color, icon: Icon, iconColor }) => (
              <div key={label} className={`bg-white rounded-xl border-2 ${color} p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Revenue by Source</h2>
              <div className="space-y-4">
                {[
                  { label: 'Ticket Bookings', value: summary.booking_revenue, color: 'bg-blue-500' },
                  { label: 'Bus Passes', value: summary.pass_revenue, color: 'bg-purple-500' },
                ].map(({ label, value, color }) => {
                  const pct = summary.total_revenue > 0 ? (value / summary.total_revenue) * 100 : 0
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600 font-medium">{label}</span>
                        <span className="font-bold text-gray-900">₹{value.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% of total</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">System Overview</h2>
              <div className="space-y-3">
                {[
                  { label: 'Active Routes', value: summary.total_routes.toLocaleString(), pct: 100 },
                  { label: 'User Engagement', value: `${summary.active_users}/${summary.total_users}`, pct: summary.total_users > 0 ? (summary.active_users / summary.total_users) * 100 : 0 },
                  { label: 'Avg Booking Value', value: `₹${summary.avg_booking_value.toFixed(2)}`, pct: Math.min((summary.avg_booking_value / 200) * 100, 100) },
                ].map(({ label, value, pct }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-semibold text-gray-900">{value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Revenue Chart */}
          {revenueByDay.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Daily Revenue (Last {period} days)</h2>
              <div className="flex items-end gap-1 h-32">
                {revenueByDay.map(({ date, revenue }) => (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      ₹{revenue.toFixed(0)}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition cursor-pointer"
                      style={{ height: `${Math.max((revenue / maxRevenue) * 100, 4)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{revenueByDay[0]?.date}</span>
                <span>{revenueByDay[revenueByDay.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
