import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Ticket, Calendar, MapPin, Clock, QrCode, X, AlertCircle, CheckCircle, Receipt } from 'lucide-react'

interface Booking {
  id: string
  schedule_id: string
  booking_date: string
  journey_date: string
  num_seats: number
  seat_number: number
  total_amount: number
  status: string
  booking_status: string
  qr_code_data: string | null
  created_at: string
  route?: { route_number: string; origin: string; destination: string }
  schedule?: { departure_time: string; arrival_time: string }
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  pending:   'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  reserved:  'bg-orange-100 text-orange-800',
}

function fmtDate(d?: string) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDT(d?: string) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => { fetchBookings() }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/bookings/')
      setBookings(res.data)
    } catch { setError('Failed to load bookings') }
    finally { setLoading(false) }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await api.put(`/api/v1/bookings/${id}/cancel`)
      fetchBookings()
    } catch (e: any) { alert(e.response?.data?.detail || 'Failed to cancel') }
    finally { setCancelling(null) }
  }

  const statusKey = (b: Booking) => (b.booking_status || b.status || '').toLowerCase()

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
      <p className="text-gray-500">Loading your bookings…</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/book-ticket" className="btn btn-primary">+ Book Ticket</Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card text-center py-16">
          <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-500 mb-6">Book your first ticket to get started!</p>
          <Link to="/book-ticket" className="btn btn-primary inline-block">Book a Ticket</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => {
            const sk = statusKey(booking)
            const canShowQR = sk === 'confirmed' && booking.qr_code_data
            const canCancel = sk === 'confirmed' || sk === 'reserved'
            const date = booking.booking_date || booking.journey_date

            return (
              <div key={booking.id} className="card hover:shadow-lg transition">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[sk] || 'bg-gray-100 text-gray-700'}`}>
                        {sk}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDT(booking.created_at)}</span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">
                        {booking.route?.origin || 'N/A'}
                        <span className="text-primary-500 mx-2">→</span>
                        {booking.route?.destination || 'N/A'}
                      </span>
                      {booking.route?.route_number && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          Route {booking.route.route_number}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{fmtDate(date)}</span>
                      </div>
                      {booking.schedule && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{booking.schedule.departure_time} → {booking.schedule.arrival_time}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Seat:</span>
                        <span className="ml-1 font-medium">{booking.seat_number || 1}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <span className="ml-1 font-bold text-primary-600">₹{booking.total_amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                    {canShowQR && (
                      <button onClick={() => setSelectedBooking(booking)}
                        className="btn btn-primary flex items-center justify-center gap-2 text-sm">
                        <QrCode className="h-4 w-4" /> Show QR
                      </button>
                    )}
                    {sk === 'confirmed' && (
                      <Link to={`/my-bookings/receipt/${booking.id}`}
                        className="btn btn-secondary flex items-center justify-center gap-2 text-sm">
                        <Receipt className="h-4 w-4" /> Receipt
                      </Link>
                    )}
                    {canCancel && (
                      <button onClick={() => handleCancel(booking.id)}
                        disabled={cancelling === booking.id}
                        className="btn btn-secondary text-red-600 hover:bg-red-50 text-sm disabled:opacity-50">
                        {cancelling === booking.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* QR Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl">
            <button onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Your Ticket</h3>
              <p className="text-sm text-gray-500 mb-5">Show this QR code to the conductor</p>

              {/* QR Code */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                {selectedBooking.qr_code_data ? (
                  <img src={selectedBooking.qr_code_data} alt="QR Code"
                    className="w-56 h-56 mx-auto" />
                ) : (
                  <div className="w-56 h-56 mx-auto flex items-center justify-center text-gray-400">
                    <QrCode className="h-24 w-24" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="bg-primary-50 rounded-xl p-4 text-left space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Route</span>
                  <span className="font-medium text-right">
                    {selectedBooking.route?.origin} → {selectedBooking.route?.destination}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{fmtDate(selectedBooking.booking_date || selectedBooking.journey_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">{selectedBooking.schedule?.departure_time || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Total Paid</span>
                  <span className="font-bold text-primary-600">₹{selectedBooking.total_amount}</span>
                </div>
              </div>

              <button onClick={() => setSelectedBooking(null)} className="w-full btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
