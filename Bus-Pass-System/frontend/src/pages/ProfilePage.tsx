import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { User, Mail, Phone, Shield, Edit2, Save, X, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const displayName = (user as any)?.full_name ||
    `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() ||
    user?.email?.split('@')[0] || ''

  const [form, setForm] = useState({
    first_name: (user as any)?.first_name || displayName.split(' ')[0] || '',
    last_name: (user as any)?.last_name || displayName.split(' ').slice(1).join(' ') || '',
    phone: (user as any)?.phone || '',
  })

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.put('/api/v1/users/me', form)
      if (setUser) setUser(res.data)
      setSuccess('Profile updated successfully!')
      setEditing(false)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'U').toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Avatar + Name */}
      <div className="card mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{displayName || user?.email}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
              (user as any)?.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {(user as any)?.role || 'user'}
            </span>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="btn btn-secondary flex items-center gap-2 text-sm">
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-5">Personal Information</h3>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input type="text" value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="input w-full" placeholder="First name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input type="text" value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  className="input w-full" placeholder="Last name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input w-full" placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="input w-full bg-gray-50 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditing(false); setError('') }}
                className="btn btn-secondary flex items-center gap-2">
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { icon: User, label: 'Full Name', value: displayName || '—' },
              { icon: Mail, label: 'Email', value: user?.email || '—' },
              { icon: Phone, label: 'Phone', value: (user as any)?.phone || 'Not provided' },
              { icon: Shield, label: 'Account Role', value: (user as any)?.role || 'user' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <Icon className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-medium text-gray-900 capitalize">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="card mt-6">
        <h3 className="font-semibold text-gray-800 mb-4">Account Security</h3>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium text-gray-900 text-sm">Password</p>
            <p className="text-xs text-gray-500">Last changed: Unknown</p>
          </div>
          <button className="btn btn-secondary text-sm" disabled>
            Change Password
          </button>
        </div>
      </div>
    </div>
  )
}
