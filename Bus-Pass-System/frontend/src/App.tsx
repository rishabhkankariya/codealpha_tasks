import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import AuthLayout from './layouts/AuthLayout'

// Public pages
import HomePage from './pages/HomePage'
import RoutesPage from './pages/RoutesPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import AccessibilityPage from './pages/AccessibilityPage'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AdminLoginPage from './pages/auth/AdminLoginPage'

// Passenger pages
import DashboardPage from './pages/DashboardPage'
import BookTicketPage from './pages/BookTicketPage'
import MyBookingsPage from './pages/MyBookingsPage'
import ReceiptPage from './pages/ReceiptPage'
import BuyPassPage from './pages/BuyPassPage'
import MyPassesPage from './pages/MyPassesPage'
import ProfilePage from './pages/ProfilePage'
import ChatbotPage from './pages/ChatbotPage'

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminPassesPage from './pages/admin/AdminPassesPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import ManageRoutesPage from './pages/admin/ManageRoutesPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

// ── Guards ────────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const hasToken = !!localStorage.getItem('access_token')

  if (isLoading || (hasToken && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          <p className="mt-3 text-sm text-gray-500 font-medium">Verifying session...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const hasToken = !!localStorage.getItem('access_token')

  if (isLoading || (hasToken && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          <p className="mt-3 text-sm text-gray-500 font-medium">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  const role = (user as any)?.role?.toLowerCase()
  if (role !== 'admin') return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchUser()
    }
  }, [fetchUser])

  return (
    <Router>
      <Routes>

        {/* ── PUBLIC (MainLayout with footer) ─────────────────────── */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="accessibility" element={<AccessibilityPage />} />
        </Route>

        {/* ── AUTH ────────────────────────────────────────────────── */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        </Route>

        {/* ── ADMIN LOGIN (standalone, no layout wrapper) ──────────── */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ── PASSENGER (MainLayout, auth required) ───────────────── */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard"   element={<DashboardPage />} />
          <Route path="book-ticket" element={<BookTicketPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="my-bookings/receipt/:bookingId" element={<ReceiptPage />} />
          <Route path="buy-pass"    element={<BuyPassPage />} />
          <Route path="my-passes"   element={<MyPassesPage />} />
          <Route path="profile"     element={<ProfilePage />} />
          <Route path="ai-assistant" element={<ChatbotPage />} />
        </Route>

        {/* ── ADMIN (AdminLayout, admin role required) ─────────────── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index          element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="bookings"  element={<AdminBookingsPage />} />
          <Route path="passes"    element={<AdminPassesPage />} />
          <Route path="routes"    element={<ManageRoutesPage />} />
          <Route path="users"     element={<AdminUsersPage />} />
          <Route path="settings"  element={<AdminSettingsPage />} />
        </Route>

        {/* ── 404 ─────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  )
}

export default App
