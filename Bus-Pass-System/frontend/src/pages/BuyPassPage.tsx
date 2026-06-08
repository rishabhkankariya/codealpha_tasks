import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { CheckCircle, AlertCircle, Clock, MapPin, Tag, Users, ChevronRight, ArrowLeft, Zap } from 'lucide-react'

interface PassType {
  id: string
  name: string
  validity_days: number
  price: number
  description: string
  category: string
  travel_area: string
  time_validity: string
  discount_info: string
  eligibility: string
  is_free: boolean
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  'General':           { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  'Student':           { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
  'Senior Citizen':    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  'Divyang':           { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  'Journalist':        { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200',   badge: 'bg-pink-100 text-pink-700' },
  'Freedom Fighter':   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700' },
  'Municipal Employee':{ bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-700' },
}

const getCategoryStyle = (cat: string) =>
  CATEGORY_COLORS[cat] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' }

const validityLabel = (days: number) => {
  if (days === 1)   return '1 Day'
  if (days === 22)  return '22 Travel Days'
  if (days === 30)  return '1 Month'
  if (days === 90)  return '3 Months'
  if (days === 180) return '6 Months'
  if (days === 365) return '1 Year'
  return `${days} Days`
}

export default function BuyPassPage() {
  const navigate = useNavigate()
  const [passTypes, setPassTypes] = useState<PassType[]>([])
  const [selectedPass, setSelectedPass] = useState<PassType | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => { fetchPassTypes() }, [])

  const fetchPassTypes = async () => {
    try {
      setFetchLoading(true)
      const response = await api.get('/api/v1/passes/types')
      setPassTypes(response.data)
    } catch {
      setError('Failed to load pass types')
    } finally {
      setFetchLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedPass) return
    try {
      setLoading(true)
      setError('')
      await api.post('/api/v1/passes/', { pass_type_id: selectedPass.id })
      setSuccess(true)
      setTimeout(() => navigate('/my-passes'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['All', ...Array.from(new Set(passTypes.map(p => p.category)))]
  const filtered = activeCategory === 'All' ? passTypes : passTypes.filter(p => p.category === activeCategory)

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="card">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pass Purchased!</h2>
          <p className="text-gray-500">Redirecting to your passes…</p>
        </div>
      </div>
    )
  }

  /* ── CONFIRMATION VIEW ─────────────────────────────────────────────── */
  if (selectedPass) {
    const style = getCategoryStyle(selectedPass.category)
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => setSelectedPass(null)}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to passes
        </button>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pass Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hero card */}
            <div className={`rounded-2xl p-6 border-2 ${style.bg} ${style.border}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                    {selectedPass.category}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mt-2">{selectedPass.name}</h2>
                  <p className="text-gray-600 mt-1 text-sm">{selectedPass.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {selectedPass.is_free ? <span className="text-green-600">FREE</span> : `₹${selectedPass.price}`}
                  </p>
                  <p className="text-sm text-gray-500">{validityLabel(selectedPass.validity_days)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/70 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Travel Area</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedPass.travel_area || '—'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time Validity</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedPass.time_validity || '—'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedPass.discount_info || '—'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Eligibility</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedPass.eligibility || '—'}</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="card">
              <h3 className="font-semibold text-lg mb-3">Pass Benefits</h3>
              <ul className="space-y-2">
                {[
                  'Unlimited travel within the specified area',
                  'Digital QR code for easy verification',
                  'Valid for ' + validityLabel(selectedPass.validity_days),
                  'Instant activation upon purchase',
                  'No booking required – board and go',
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pass</span>
                  <span className="font-medium text-right max-w-[60%]">{selectedPass.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Validity</span>
                  <span className="font-medium">{validityLabel(selectedPass.validity_days)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Area</span>
                  <span className="font-medium text-right max-w-[60%]">{selectedPass.travel_area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Activation</span>
                  <span className="font-medium">Immediate</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-bold text-base">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {selectedPass.is_free ? <span className="text-green-600">FREE</span> : `₹${selectedPass.price}`}
                  </span>
                </div>
              </div>

              <button onClick={handlePurchase} disabled={loading}
                className="w-full btn btn-primary py-3 mb-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Processing…' : selectedPass.is_free ? 'Get Free Pass' : 'Purchase Pass'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Pass activates immediately after purchase
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── LISTING VIEW ──────────────────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Buy a Bus Pass</h1>
        <p className="text-gray-500">Choose from {passTypes.length} PMPML pass types — valid 2026 pricing</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* PMPML Schedule Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-800">Service Hours:</span>
          <span className="text-blue-700">5:00 AM – 11:30 PM daily</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-800">Peak Frequency:</span>
          <span className="text-blue-700">Every 5–15 mins</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-800">Normal Frequency:</span>
          <span className="text-blue-700">Every 15–30 mins</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              activeCategory === cat
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400 hover:text-primary-600'
            }`}>
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({passTypes.filter(p => p.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {fetchLoading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3"></div>
          <p className="text-gray-500">Loading pass types…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(pt => {
            const style = getCategoryStyle(pt.category)
            return (
              <div key={pt.id}
                onClick={() => setSelectedPass(pt)}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group ${style.bg} ${style.border}`}>
                {/* Category badge */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                    {pt.category}
                  </span>
                  {pt.is_free && (
                    <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      FREE
                    </span>
                  )}
                </div>

                {/* Name & Price */}
                <h3 className="font-bold text-gray-900 text-base mb-1 leading-tight">{pt.name}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-3">
                  {pt.is_free
                    ? <span className="text-green-600">FREE</span>
                    : <span>₹{pt.price.toLocaleString('en-IN')}</span>
                  }
                </p>

                {/* Key info */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{validityLabel(pt.validity_days)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{pt.travel_area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{pt.discount_info}</span>
                  </div>
                </div>

                <button className={`w-full flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-semibold transition ${style.text} bg-white/80 hover:bg-white group-hover:shadow`}>
                  {pt.is_free ? 'Get Free Pass' : 'Select Pass'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
