import { Outlet, Link } from 'react-router-dom'
import { Bus } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <Bus className="h-10 w-10 text-primary-600" />
          <span className="text-2xl font-bold text-gray-900">SmartBus</span>
        </Link>

        {/* Auth Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Outlet />
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-primary-600 hover:text-primary-700 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
