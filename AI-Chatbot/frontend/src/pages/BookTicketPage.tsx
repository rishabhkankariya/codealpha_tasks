import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import { MapPin, Clock, Users, AlertCircle, CheckCircle, Search, X, Zap } from 'lucide-react'

interface Route {
  id: string
  route_number: string
  origin: string
  destination: string
  distance_km: number
  base_fare: number
  fare: number
}

interface Schedule {
  id: string
  departure_time: string
  arrival_time: string
  available_seats: number
  is_peak?: boolean
  bus_type?: string
}

export default function BookTicketPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Pre-selected route passed via navigation state (from RoutesPage or Chatbot)
  const preSelected: Route | null = (location.state as any)?.route ?? null

  const [step, setStep] = useState(preSelected ? 2 : 1)
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(preSelected)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [numSeats, setNumSeats] = useState(1)

  const searchRef = useRef<HTMLInputElement>(null)

  const fetchRoutes = async (query: string) => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/routes/', {
        params: {
          page: 1,
          page_size: 50,
          search: query || undefined
        }
      })
      const items = res.data.items || []
      setFilteredRoutes(items)
    } catch {
      setError('Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  // Fetch routes with debounce on search query change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoutes(searchQuery)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // If a route was pre-selected, load its schedules immediately
  useEffect(() => {
    if (preSelected) {
      loadSchedules(preSelected.id)
    }
  }, [])

  const loadSchedules = async (routeId: string) => {
    setScheduleLoading(true)
    setError('')
    setSchedules([])
    try {
      const res = await api.get(`/api/v1/routes/${routeId}/schedules`)
      if (res.data && res.data.length > 0) {
        setSchedules(res.data)
      } else {
        setError('No schedules found for this route.')
      }
    } catch (err: any) {
      console.error('Schedule error:', err)
      setError(`Could not load schedules: ${err?.response?.data?.detail || err.message}`)
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route)
    setSelectedSchedule(null)
    setStep(2)
    loadSchedules(route.id)
  }

  const handleScheduleSelect = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setStep(3)
  }

  const handleBooking = async () => {
    if (!selectedRoute || !selectedSchedule) return
    try {
      setLoading(true)
      setError('')
      await api.post('/api/v1/bookings/', {
        schedule_id: selectedSchedule.id,
        booking_date: selectedDate,
        num_seats: numSeats,
      })
      setSuccess(true)
      setTimeout(() => navigate('/my-bookings'), 2000)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((e: any) => e.msg || e).join(', ')
          : 'Booking failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fare = selectedRoute ? (selectedRoute.fare || selectedRoute.base_fare) : 0

  /* ── SUCCESS ─────────────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="card">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-1">Your ticket has been booked successfully.</p>
          <p className="text-sm text-gray-400">Redirecting to your bookings…</p>
        </div>
      </div>
    )
  }

  /* ── STEP INDICATOR ──────────────────────────────────────────────── */
  const StepBar = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[
        { n: 1, label: 'Select Route' },
        { n: 2, label: 'Select Schedule' },
        { n: 3, label: 'Confirm' },
      ].map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= n ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{n}</div>
            <span className={`font-medium text-sm hidden sm:block ${step >= n ? 'text-primary-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < 2 && <div className={`w-12 h-0.5 ${step > n ? 'bg-primary-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Book a Ticket</h1>
      <StepBar />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── STEP 1: SELECT ROUTE ─────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Select Your Route</h2>
            <span className="text-sm text-gray-500">{filteredRoutes.length} routes</span>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by route number, origin or destination…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3" />
              <p className="text-gray-500">Loading routes…</p>
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="card text-center py-12">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery ? 'No routes match your search.' : 'No routes available.'}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="mt-3 text-primary-600 hover:underline text-sm font-medium">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRoutes.map(route => (
                <button key={route.id} onClick={() => handleRouteSelect(route)}
                  className="card text-left hover:shadow-lg hover:border-primary-500 border-2 border-transparent transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                      Route {route.route_number}
                    </span>
                    <span className="text-lg font-bold text-primary-600">
                      ₹{route.fare || route.base_fare}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="font-medium truncate">{route.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      <span className="font-medium truncate">{route.destination}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {route.distance_km} km
                    </span>
                    <span className="text-primary-600 font-semibold group-hover:underline">
                      Select →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: SELECT SCHEDULE ──────────────────────────────────── */}
      {step === 2 && selectedRoute && (
        <div>
          <button onClick={() => { setStep(1); setError('') }}
            className="mb-5 text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium">
            ← Back to routes
          </button>

          {/* Selected route banner */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Selected Route</p>
              <p className="font-bold text-gray-900 text-lg">
                {selectedRoute.origin}
                <span className="text-primary-500 mx-2">→</span>
                {selectedRoute.destination}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Route {selectedRoute.route_number} · {selectedRoute.distance_km} km
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">₹{fare}</p>
              <p className="text-xs text-gray-500">per seat</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose a Departure Time</h2>

          {/* PMPML timing info */}
          <div className="flex flex-wrap gap-3 mb-5 text-xs text-gray-600">
            <span className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
              <Clock className="h-3.5 w-3.5 text-blue-500" /> Service: 5:00 AM – 11:30 PM
            </span>
            <span className="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
              <Zap className="h-3.5 w-3.5 text-orange-500" /> Peak: every 5–15 mins
            </span>
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              Normal: every 15–30 mins
            </span>
          </div>

          {scheduleLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3" />
              <p className="text-gray-500">Loading schedules…</p>
            </div>
          ) : schedules.length === 0 && !error ? (
            <div className="card text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No schedules available for this route.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedules.map(schedule => (
                <button key={schedule.id}
                  onClick={() => handleScheduleSelect(schedule)}
                  disabled={schedule.available_seats === 0}
                  className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                    schedule.is_peak
                      ? 'border-orange-200 bg-orange-50 hover:border-orange-400'
                      : 'border-gray-200 bg-white hover:border-primary-500'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">{schedule.departure_time}</span>
                      {schedule.is_peak && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Peak
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <span>→ Arrives</span>
                    <span className="font-semibold text-gray-700">{schedule.arrival_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      <span className={schedule.available_seats < 15 ? 'text-orange-600 font-semibold' : ''}>
                        {schedule.available_seats} seats
                      </span>
                    </div>
                    {schedule.available_seats === 0
                      ? <span className="text-xs text-red-500 font-semibold">Full</span>
                      : <span className="text-xs text-primary-600 font-semibold">Select →</span>
                    }
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: CONFIRM ──────────────────────────────────────────── */}
      {step === 3 && selectedRoute && selectedSchedule && (
        <div>
          <button onClick={() => { setStep(2); setError('') }}
            className="mb-5 text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium">
            ← Back to schedules
          </button>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Confirm Your Booking</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Route + Schedule summary */}
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">Journey Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-0.5">Route</p>
                    <p className="font-semibold">Route {selectedRoute.route_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Distance</p>
                    <p className="font-semibold">{selectedRoute.distance_km} km</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">From</p>
                    <p className="font-semibold">{selectedRoute.origin}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">To</p>
                    <p className="font-semibold">{selectedRoute.destination}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Departure</p>
                    <p className="font-semibold text-primary-600">{selectedSchedule.departure_time}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Arrival</p>
                    <p className="font-semibold">{selectedSchedule.arrival_time}</p>
                  </div>
                </div>
              </div>

              {/* Booking options */}
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">Booking Options</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Travel Date</label>
                    <input type="date" value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Seats</label>
                    <select value={numSeats} onChange={e => setNumSeats(Number(e.target.value))}
                      className="input w-full">
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n} disabled={n > selectedSchedule.available_seats}>
                          {n} {n === 1 ? 'seat' : 'seats'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Price summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-4">
                <h3 className="font-semibold text-gray-800 mb-4">Price Summary</h3>
                <div className="space-y-3 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fare per seat</span>
                    <span className="font-medium">₹{fare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seats</span>
                    <span className="font-medium">× {numSeats}</span>
                  </div>
                  {selectedSchedule.is_peak && (
                    <div className="flex justify-between text-orange-600">
                      <span>Peak hour</span>
                      <span className="font-medium text-xs mt-0.5">Limited seats</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold text-base">Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ₹{(fare * numSeats).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button onClick={handleBooking} disabled={loading}
                  className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
                  {loading ? 'Processing…' : 'Confirm Booking'}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Seat reserved for 10 minutes after booking
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
