import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { CreditCard, Search, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface AdminPass {
  id: string
  pass_number: string
  user_email: string
  pass_type: string
  valid_from: string
  valid_to: string
  status: string
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeft(end?: string) {
  if (!end) return 0
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000))
}

export default function AdminPassesPage() {
  const [passes, setPasses] = useState<AdminPass[]>([])
  const [filtered, setFiltered] = useState<AdminPass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchPasses() }, [])

  useEffect(() => {
    let list = passes
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.user_email.toLowerCase().includes(q) ||
        p.pass_number.toLowerCase().includes(q) ||
        p.pass_type.toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [passes, search, statusFilter])

  const fetchPasses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/admin/passes?limit=100')
      setPasses(res.data)
      setFiltered(res.data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load passes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Passes</h1>
        <p className="text-gray-500 text-sm mt-1">All bus passes issued across the system</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Issued', value: passes.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Active', value: passes.filter(p => p.status === 'active').length, color: 'bg-green-50 text-green-700' },
          { label: 'Expired', value: passes.filter(p => p.status === 'expired').length, color: 'bg-red-50 text-red-700' },
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
          <input type="text" placeholder="Search by email, pass number, type…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-gray-400"><X className="h-4 w-4" /></button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-gray-500 text-sm">Loading passes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No passes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Pass Number', 'User', 'Pass Type', 'Valid From', 'Valid To', 'Days Left', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const sk = p.status?.toLowerCase() || 'active'
                  const remaining = daysLeft(p.valid_to)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{p.pass_number}</td>
                      <td className="px-4 py-3 text-gray-900">{p.user_email}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{p.pass_type}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(p.valid_from)}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(p.valid_to)}</td>
                      <td className="px-4 py-3">
                        {sk === 'active' ? (
                          <span className={`font-semibold ${remaining <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                            {remaining}d
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          sk === 'active' ? 'bg-green-100 text-green-800' :
                          sk === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sk === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {sk}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
              Showing {filtered.length} of {passes.length} passes
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
