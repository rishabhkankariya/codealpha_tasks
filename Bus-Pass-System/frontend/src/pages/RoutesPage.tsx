import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { MapPin, Clock, Bus, AlertCircle, Search, X } from 'lucide-react'

interface Route {
  id: string
  route_number: string
  origin: string
  destination: string
  distance_km: number
  base_fare: number
  fare: number
  is_active: boolean
}

export default function RoutesPage() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)

  const fetchRoutes = async (currentPage: number, currentPageSize: number, currentSearch: string) => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/routes/', {
        params: {
          page: currentPage,
          page_size: currentPageSize,
          search: currentSearch || undefined
        }
      })
      setRoutes(response.data.items || [])
      setTotal(response.data.total || 0)
      setPages(response.data.pages || 0)
    } catch (err: any) {
      setError('Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoutes(page, pageSize, searchTerm)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [page, pageSize, searchTerm])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setPage(1)
  }

  const isInitialLoad = routes.length === 0 && loading

  if (isInitialLoad) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading routes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bus Routes</h1>
        <p className="text-gray-600">Browse all available bus routes and plan your journey</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by route number, origin, or destination..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input w-full pl-11 pr-10"
          />
          {searchTerm && (
            <button onClick={handleClearSearch}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {loading && !isInitialLoad && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span>Updating...</span>
          </div>
        )}
      </div>

      {routes.length === 0 ? (
        <div className="card text-center py-12">
          <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No routes found' : 'No routes available'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try a different search term' : 'Routes will be added soon'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {routes.length} {routes.length === 1 ? 'route' : 'routes'} of {total} total
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {routes.map((route) => (
              <div key={route.id} className="card hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    Route {route.route_number}
                  </span>
                  {route.is_active ? (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">From</p>
                      <p className="font-semibold text-gray-900">{route.origin}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">To</p>
                      <p className="font-semibold text-gray-900">{route.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{route.distance_km} km</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-primary-600">₹{route.fare || route.base_fare}</span>
                    </div>
                  </div>
                </div>

                {route.is_active && (
                  <button
                    onClick={() => navigate('/book-ticket', { state: { route } })}
                    className="mt-4 w-full btn btn-primary text-center block"
                  >
                    Book Ticket
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * pageSize, total)}
                    </span>{' '}
                    of <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
                      className="rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      {[12, 24, 48, 96].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      &lsaquo;
                    </button>
                    {Array.from({ length: pages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 2)
                      .map((p, idx, arr) => {
                        const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <span key={p} className="flex">
                            {showEllipsisBefore && (
                              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setPage(p)}
                              aria-current={p === page ? "page" : undefined}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                                p === page
                                  ? "z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                  : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                              }`}
                            >
                              {p}
                            </button>
                          </span>
                        );
                      })}
                    <button
                      disabled={page >= pages}
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      &rsaquo;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
            <Bus className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="font-semibold mb-2">Frequent Service</h3>
          <p className="text-sm text-gray-600">Buses run every 15-30 minutes on all routes</p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <Clock className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold mb-2">On-Time Performance</h3>
          <p className="text-sm text-gray-600">95% of our buses arrive within 5 minutes of schedule</p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-2">Wide Coverage</h3>
          <p className="text-sm text-gray-600">Connecting all major areas of the city</p>
        </div>
      </div>
    </div>
  )
}
