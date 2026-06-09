import { Accessibility, Eye, Heart, Compass, CheckCircle } from 'lucide-react'

export default function AccessibilityPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 min-h-screen py-16 px-4 sm:px-6 lg:px-8 font-['Outfit']">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
            <Accessibility className="h-8 w-8 text-[#2e5bff]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Accessibility Statement</h1>
          <p className="text-gray-500 mt-2 text-sm">Last updated: May 26, 2026</p>
        </div>

        {/* Content Card */}
        <div className="glass-card bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 sm:p-12 shadow-sm space-y-10 text-gray-700">
          
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-5.5 w-5.5 text-red-500 fill-red-50/50" /> Our Commitment
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              We believe urban mobility and public transport services must be accessible to everyone. SmartBus is committed to ensuring digital accessibility for people with disabilities, conforming to international guidelines to deliver an inclusive ticketing and pass management system.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Compass className="h-5.5 w-5.5 text-[#6b13af]" /> Conformance Standards
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              To guarantee usability, we develop and optimize our web applications in accordance with the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 level AA</strong> standards. 
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-5.5 w-5.5 text-[#2e5bff]" /> Key Accessibility Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white/50 rounded-2xl border border-gray-100 shadow-sm flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Keyboard Navigation</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">All navigation headers, account details, routes, and transaction options are fully navigable via the keyboard using standard tab stops.</p>
                </div>
              </div>
              <div className="p-5 bg-white/50 rounded-2xl border border-gray-100 shadow-sm flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">High Contrast Themes</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">We enforce strict color contrast ratios for text labels and custom background elements, keeping pages readable for users with visual impairments.</p>
                </div>
              </div>
              <div className="p-5 bg-white/50 rounded-2xl border border-gray-100 shadow-sm flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Screen Reader Compatibility</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">Images have descriptive alt tags and forms use screen-reader-optimized labels for voice guidance software.</p>
                </div>
              </div>
              <div className="p-5 bg-white/50 rounded-2xl border border-gray-100 shadow-sm flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Responsive Text Scaling</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">We support browser-level font scaling and text zoom preferences, ensuring content reorganizes cleanly without layout breaking.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Feedback &amp; Contact</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              We actively monitor and improve accessibility features. If you encounter any usability issues or have feedback on how to make our digital bus pass services more accessible, please reach out:
            </p>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-2">
              <div className="text-sm"><strong>IT Accessibility Coordinator:</strong> accessibility-desk@smartbus.in</div>
              <div className="text-sm"><strong>Physical Access Assistance Swargate:</strong> 020-26058888</div>
            </div>
          </section>

        </div>

      </div>
    </div>
  )
}
