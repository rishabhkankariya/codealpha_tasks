import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { User, Shield, Database, CheckCircle } from 'lucide-react'

export default function AdminSettingsPage() {
  const { user } = useAuthStore()
  const [saved, setSaved] = useState(false)

  const displayName = (user as any)?.full_name ||
    `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() || 'Admin'

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">System configuration and preferences</p>
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4" /> Settings saved successfully
        </div>
      )}

      <div className="space-y-6">
        {/* Admin Profile */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Admin Profile</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input type="text" defaultValue={displayName}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" defaultValue={user?.email || ''} disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">System Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'System', value: 'PMPML SmartBus v1.0' },
              { label: 'Database', value: 'SQLite (Local)' },
              { label: 'Backend', value: 'FastAPI + Python 3.11' },
              { label: 'Frontend', value: 'React 18 + TypeScript' },
              { label: 'AI Engine', value: 'LangChain + ChromaDB' },
              { label: 'Routes Loaded', value: '1,030 PMPML routes' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'JWT Authentication', status: 'Enabled', ok: true },
              { label: 'Password Hashing (bcrypt)', status: 'Enabled', ok: true },
              { label: 'QR Code Fraud Detection', status: 'Enabled', ok: true },
              { label: 'Redis Caching', status: 'Optional (disabled)', ok: false },
            ].map(({ label, status, ok }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{label}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm">
          Save Settings
        </button>
      </div>
    </div>
  )
}
