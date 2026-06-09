import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Ticket, Search, X, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'

interface AdminBooking {
  id: string
  user_email: string
  route: string
  journey_date: string
  price: number
  status: string
  created_at: string
}

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: any }> = {
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  cancelled:  { bg: 'bg-red-100',   text: 'text-red-800',   icon: XCircle },
  completed:  { bg: 'bg-blue-100',  text: 'text-blue-800',  icon: CheckCircle },
  reserved:   { bg: 'bg-yellow-100',text: 'text-yellow-800',icon: Clock },
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [filtered, setFiltered] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchBookings() }, [])

  useEffect(() => {
    let list = bookings
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        b.user_email.toLowerCase().includes(q) ||
        b.route.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [bookings, search, statusFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/admin/bookings?limit=100')
      setBookings(res.data)
      setFiltered(res.data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = filtered.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.price, 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">All ticket bookings across the system</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: bookings.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'bg-green-50 text-green-700' },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'bg-red-50 text-red-700' },
          { label: 'Revenue', value: `₹${totalRevenue.toFixed(0)}`, color: 'bg-purple-50 text-purple-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm font-medium opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by email, route, ID…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-gray-400"><X className="h-4 w-4" /></button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-gray-500 text-sm">Loading bookings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Booking ID', 'User', 'Route', 'Date', 'Amount', 'Status', 'Booked On'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(b => {
                  const sk = b.status?.toLowerCase() || 'reserved'
                  const style = STATUS_STYLE[sk] || STATUS_STYLE.reserved
                  const Icon = style.icon
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{b.user_email}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{b.route}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(b.journey_date)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">₹{b.price}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.bg} ${style.text}`}>
                          <Icon className="h-3 w-3" /> {sk}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(b.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
              Showing {filtered.length} of {bookings.length} bookings
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
