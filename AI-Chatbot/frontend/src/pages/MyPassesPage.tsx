import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { CreditCard, Calendar, QrCode, X, AlertCircle, CheckCircle, Clock, MapPin, Tag } from 'lucide-react'

interface Pass {
  id: string
  pass_number: string
  pass_type_id: string
  start_date: string
  end_date: string
  valid_from: string
  valid_to: string
  status: string
  pass_status: string
  qr_code_data: string | null
  created_at: string
  pass_type?: {
    name: string
    duration_days: number
    price: number
    category?: string
    travel_area?: string
    time_validity?: string
    discount_info?: string
  }
}

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  expired:   'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

function fmtDate(d?: string) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeft(end?: string) {
  if (!end) return 0
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)
  return Math.max(0, diff)
}

export default function MyPassesPage() {
  const [passes, setPasses] = useState<Pass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null)

  useEffect(() => { fetchPasses() }, [])

  const fetchPasses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/passes/')
      setPasses(res.data)
    } catch { setError('Failed to load passes') }
    finally { setLoading(false) }
  }

  const statusKey = (p: Pass) => (p.pass_status || p.status || '').toLowerCase()
  const endDate = (p: Pass) => p.end_date || p.valid_to
  const startDate = (p: Pass) => p.start_date || p.valid_from

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
      <p className="text-gray-500">Loading your passes…</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Passes</h1>
          <p className="text-gray-500 mt-1">{passes.length} pass{passes.length !== 1 ? 'es' : ''}</p>
        </div>
        <Link to="/buy-pass" className="btn btn-primary">+ Buy Pass</Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {passes.length === 0 ? (
        <div className="card text-center py-16">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No passes yet</h3>
          <p className="text-gray-500 mb-6">Purchase a pass for unlimited travel!</p>
          <Link to="/buy-pass" className="btn btn-primary inline-block">Buy a Pass</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {passes.map(pass => {
            const sk = statusKey(pass)
            const isActive = sk === 'active'
            const remaining = daysLeft(endDate(pass))
            const pt = pass.pass_type

            return (
              <div key={pass.id}
                className={`rounded-2xl border-2 p-5 transition hover:shadow-lg ${
                  isActive ? 'border-green-400 bg-green-50/30' : 'border-gray-200 bg-white'
                }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[sk] || 'bg-gray-100 text-gray-700'}`}>
                    {sk}
                  </span>
                  {isActive && remaining > 0 && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      {remaining}d left
                    </span>
                  )}
                </div>

                {/* Pass name */}
                <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">
                  {pt?.name || 'Bus Pass'}
                </h3>
                {pt?.category && (
                  <span className="text-xs text-gray-500 font-medium">{pt.category}</span>
                )}

                {/* Price */}
                <p className="text-2xl font-bold text-primary-600 mt-2 mb-3">
                  {pt?.price === 0 ? <span className="text-green-600">FREE</span> : `₹${pt?.price}`}
                </p>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{fmtDate(startDate(pass))} – {fmtDate(endDate(pass))}</span>
                  </div>
                  {pt?.travel_area && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{pt.travel_area}</span>
                    </div>
                  )}
                  {pt?.time_validity && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{pt.time_validity}</span>
                    </div>
                  )}
                  {pt?.discount_info && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{pt.discount_info}</span>
                    </div>
                  )}
                  <div className="text-gray-400 font-mono text-xs pt-1">#{pass.pass_number}</div>
                </div>

                {isActive ? (
                  <button onClick={() => setSelectedPass(pass)}
                    className="w-full btn btn-primary flex items-center justify-center gap-2 text-sm">
                    <QrCode className="h-4 w-4" /> Show QR Code
                  </button>
                ) : (
                  <div className="text-center text-sm text-gray-400 py-2">
                    Expired on {fmtDate(endDate(pass))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* QR Modal */}
      {selectedPass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl">
            <button onClick={() => setSelectedPass(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Your Pass</h3>
              <p className="text-sm text-gray-500 mb-5">Show this QR code to the conductor</p>

              {/* QR Code */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                {selectedPass.qr_code_data ? (
                  <img src={selectedPass.qr_code_data} alt="QR Code"
                    className="w-56 h-56 mx-auto" />
                ) : (
                  <div className="w-56 h-56 mx-auto flex items-center justify-center text-gray-300">
                    <QrCode className="h-24 w-24" />
                  </div>
                )}
              </div>

              {/* Pass details */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-4 text-white text-left space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-primary-200">Pass</span>
                  <span className="font-semibold text-right max-w-[60%]">{selectedPass.pass_type?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-200">Valid From</span>
                  <span className="font-semibold">{fmtDate(startDate(selectedPass))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-200">Valid Until</span>
                  <span className="font-semibold">{fmtDate(endDate(selectedPass))}</span>
                </div>
                <div className="flex justify-between border-t border-primary-500 pt-2">
                  <span className="text-primary-200">Days Left</span>
                  <span className="font-bold text-lg">{daysLeft(endDate(selectedPass))}</span>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3 mb-4 flex items-center gap-2 justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Unlimited Travel</span>
              </div>

              <button onClick={() => setSelectedPass(null)} className="w-full btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
