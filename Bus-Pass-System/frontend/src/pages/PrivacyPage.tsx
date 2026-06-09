import { Shield, Eye, Lock, Globe, Mail, Phone, MapPin } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 min-h-screen py-16 px-4 sm:px-6 lg:px-8 font-['Outfit']">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
            <Shield className="h-8 w-8 text-[#2e5bff]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 mt-2 text-sm">Last updated: May 26, 2026</p>
        </div>

        {/* Content Card */}
        <div className="glass-card bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 sm:p-12 shadow-sm space-y-10 text-gray-700">
          
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-5.5 w-5.5 text-[#2e5bff]" /> 1. Information We Collect
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              To provide a seamless digital ticketing and pass booking experience, we collect specific personal information. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li><strong>Account Credentials:</strong> Mobile number, full name, and email address collected during registration.</li>
              <li><strong>Transit Activity:</strong> Route queries, search history, ticket purchases, pass renewals, and travel dates.</li>
              <li><strong>Location Data:</strong> With your permission, we collect precise location data to help locate nearby bus stops and optimize routes using our AI Assistant.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Lock className="h-5.5 w-5.5 text-[#6b13af]" /> 2. How We Secure Your Data
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              We prioritize the security of your transit activity and payment transactions. We utilize enterprise-grade security protocols, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li><strong>Encrypted QR Validation:</strong> QR codes generated for boarding are encrypted and dynamically updated to prevent unauthorized copying.</li>
              <li><strong>Secure Transactions:</strong> All ticket bookings and pass renewals are routed through certified, highly secure, and compliant payment gateways.</li>
              <li><strong>Data Storage:</strong> Database credentials and travel records are stored in fully compliant environments protected by robust firewalls.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="h-5.5 w-5.5 text-amber-600" /> 3. Data Usage &amp; Third-Party Sharing
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              Your personal data is solely used to deliver public transit services inside Pune. We do not sell or lease your information to advertisers. Sharing occurs exclusively under the following terms:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li><strong>PMPML Transit Authorities:</strong> Selected details are shared with Pune Mahanagar Parivahan Mahamandal Limited for ticket verification and occupancy analysis.</li>
              <li><strong>Legal Compliance:</strong> When required by municipal authorities, law enforcement, or administrative bodies to satisfy regulatory guidelines.</li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">4. Contact Our Privacy Office</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              If you have any questions or feedback regarding our privacy controls, please contact our support department:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-xs font-semibold text-gray-400">EMAIL SUPPORT</div>
                  <div className="text-sm font-bold text-gray-900">privacy@smartbus.in</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-xs font-semibold text-gray-400">PHONE SUPPORT</div>
                  <div className="text-sm font-bold text-gray-900">020-26058888</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 sm:col-span-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-xs font-semibold text-gray-400">HEADQUARTERS ADDRESS</div>
                  <div className="text-sm font-bold text-gray-900">PMPML Central Office, Swargate, Pune - 411042</div>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  )
}
