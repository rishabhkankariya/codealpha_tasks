import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import {
  Download, Printer, ArrowLeft, CheckCircle, Bus,
  Calendar, Clock, User, QrCode, Hash, CreditCard
} from 'lucide-react'

interface BookingReceipt {
  id: string
  booking_date: string
  journey_date: string
  seat_number: number
  total_amount: number
  status: string
  booking_status: string
  qr_code_data: string | null
  created_at: string
  route?: { route_number: string; origin: string; destination: string }
  schedule?: { departure_time: string; arrival_time: string }
}

function fmtDate(d?: string) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}
function fmtDT(d?: string) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ReceiptPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const printRef = useRef<HTMLDivElement>(null)
  const [booking, setBooking] = useState<BookingReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingId) return
    api.get(`/api/v1/bookings/${bookingId}`)
      .then(r => setBooking(r.data))
      .catch(() => setError('Receipt not found or you do not have access.'))
      .finally(() => setLoading(false))
  }, [bookingId])

  const handlePrint = () => window.print()

  const handleDownload = () => {
    // Use browser print-to-PDF
    window.print()
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
      <p className="text-gray-500">Loading receipt…</p>
    </div>
  )

  if (error || !booking) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="card">
        <p className="text-red-600 mb-4">{error || 'Receipt not found'}</p>
        <Link to="/my-bookings" className="btn btn-primary">← My Bookings</Link>
      </div>
    </div>
  )

  const date = booking.booking_date || booking.journey_date
  const receiptNo = `RCP-${booking.id.slice(0, 8).toUpperCase()}`

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Action bar — hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => navigate('/my-bookings')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </button>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Receipt Card */}
      <div ref={printRef} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 print:shadow-none print:border-0">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Bus className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">PMPML</h1>
                <p className="text-blue-200 text-sm">Pune Mahanagar Parivahan Mahamandal Ltd.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs uppercase tracking-wide">Booking Receipt</p>
              <p className="text-xl font-bold font-mono">{receiptNo}</p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`px-8 py-3 flex items-center gap-2 text-sm font-semibold ${
          (booking.booking_status || booking.status) === 'confirmed'
            ? 'bg-green-50 text-green-800 border-b border-green-200'
            : 'bg-red-50 text-red-800 border-b border-red-200'
        }`}>
          <CheckCircle className="h-4 w-4" />
          Booking {(booking.booking_status || booking.status).toUpperCase()} · Issued {fmtDT(booking.created_at)}
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Journey Details */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Journey Details</h2>
            <div className="bg-gray-50 rounded-xl p-4">
              {/* Route visual */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
                  <div className="w-0.5 h-8 bg-gray-300" />
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">From</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.route?.origin || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">To</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.route?.destination || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                    Route {booking.route?.route_number || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Travel Date</p>
                    <p className="text-sm font-semibold text-gray-900">{fmtDate(date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Departure</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {booking.schedule?.departure_time || 'N/A'}
                      {booking.schedule?.arrival_time && ` → ${booking.schedule.arrival_time}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ticket Details</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Hash, label: 'Booking ID', value: booking.id.slice(0, 12).toUpperCase() + '…' },
                { icon: User, label: 'Seat Number', value: `Seat ${booking.seat_number || 1}` },
                { icon: CreditCard, label: 'Payment', value: 'Paid Online' },
                { icon: CheckCircle, label: 'Status', value: (booking.booking_status || booking.status).toUpperCase() },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code + Amount */}
          <div className="flex gap-4">
            {/* QR */}
            <div className="flex-shrink-0 bg-gray-50 rounded-xl p-3 border border-gray-200">
              {booking.qr_code_data ? (
                <img src={booking.qr_code_data} alt="QR Code" className="w-28 h-28" />
              ) : (
                <div className="w-28 h-28 flex items-center justify-center text-gray-300">
                  <QrCode className="h-16 w-16" />
                </div>
              )}
              <p className="text-center text-xs text-gray-500 mt-1">Scan to verify</p>
            </div>

            {/* Amount */}
            <div className="flex-1 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-200 flex flex-col justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Amount Paid</p>
                <p className="text-4xl font-bold text-primary-600 mt-1">₹{booking.total_amount}</p>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Base Fare</span>
                  <span className="font-medium">₹{booking.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST / Taxes</span>
                  <span className="font-medium text-green-600">Included</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{booking.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-800 mb-2">Important Instructions</h3>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Show this QR code or receipt to the conductor before boarding</li>
              <li>This ticket is valid only for the date and route mentioned above</li>
              <li>Arrive at the bus stop at least 5 minutes before departure</li>
              <li>Keep this receipt for your records</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-between text-xs text-gray-500">
          <span>PMPML Smart Bus Pass System · pmpml.pune.gov.in</span>
          <span>Generated: {fmtDT(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
