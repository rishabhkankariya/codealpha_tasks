import { FileText, CheckCircle, Scale, AlertTriangle, HelpCircle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 min-h-screen py-16 px-4 sm:px-6 lg:px-8 font-['Outfit']">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-purple-100">
            <Scale className="h-8 w-8 text-[#6b13af]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Terms of Service</h1>
          <p className="text-gray-500 mt-2 text-sm">Last updated: May 26, 2026</p>
        </div>

        {/* Content Card */}
        <div className="glass-card bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 sm:p-12 shadow-sm space-y-10 text-gray-700">
          
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5.5 w-5.5 text-[#2e5bff]" /> 1. Acceptance of Terms
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              By accessing, registering, or purchasing digital passes and bus tickets via the SmartBus application, you agree to be bound by these Terms of Service. These terms govern the digital transit services provided in coordination with Pune Mahanagar Parivahan Mahamandal Limited (PMPML).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5.5 w-5.5 text-emerald-600" /> 2. Ticketing &amp; Digital Pass Validation
            </h2>
            <div className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>Commuters must adhere to validation requirements set by PMPML:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Validation:</strong> You must scan your active QR code at the bus ticket validator immediately upon boarding. Failure to scan constitutes travel without a valid ticket.</li>
                <li><strong>Non-Transferability:</strong> All student passes, monthly passes, and daily tickets are non-transferable and linked to your verified account. Sharing account credentials is strictly prohibited.</li>
                <li><strong>Inspection:</strong> Digital tickets and active passes must be presented to authorized PMPML inspectors or conductors upon demand on their electronic verification devices.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5.5 w-5.5 text-amber-600" /> 3. Fair Usage &amp; System Integrity
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              Users agree to access the transit system in a responsible manner. Forbidden activities include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>Manipulating GPS logs, system timestamp records, or routing headers.</li>
              <li>Attempting to forge, decrypt, or copy generated transit validation QR codes.</li>
              <li>Reverse-engineering the AI Assistant or database APIs to scrap bus schedules.</li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="h-5.5 w-5.5 text-[#6b13af]" /> 4. Customer Help &amp; Grievances
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              For billing errors, payment failures, route disruptions, or ticket disputes, please coordinate with Swargate operations or reach out to our grievance desk:
            </p>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-3">
              <div className="text-sm"><strong>Grievance Officer:</strong> Deputy Manager, PMPML IT Operations</div>
              <div className="text-sm"><strong>Helpdesk Hotline:</strong> 020-26058888 (5 AM — 11:30 PM)</div>
              <div className="text-sm"><strong>Support Email:</strong> legal-transit@smartbus.in</div>
            </div>
          </section>

        </div>

      </div>
    </div>
  )
}
