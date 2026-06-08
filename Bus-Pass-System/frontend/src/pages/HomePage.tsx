import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, CreditCard, QrCode, Bot, Clock, Shield, CheckCircle, Send, Bus, ChevronRight, MapPin, Zap } from 'lucide-react'

const FEATURES = [
  { icon: Ticket, color: 'text-[#2e5bff] bg-blue-50', title: 'Easy Booking', desc: 'Seamless one-tap ticket booking with multiple payment options integrated directly.', offset: false },
  { icon: CreditCard, color: 'text-[#6b13af] bg-purple-50', title: 'Digital Passes', desc: 'Renewal and purchase of passes without ever visiting a depot counter.', offset: true },
  { icon: QrCode, color: 'text-amber-600 bg-amber-50', title: 'Instant QR Tickets', desc: 'Generate encrypted QR codes for fast boarding and contactless validation.', offset: false },
  { icon: Bot, color: 'text-[#2e5bff] bg-blue-50', title: 'AI Route Assistant', desc: 'Natural language processing helps you find the fastest route in seconds.', offset: true },
  { icon: Clock, color: 'text-[#6b13af] bg-purple-50', title: 'Real-time Schedules', desc: 'Live tracking and dynamic schedule updates for all 1000+ transit routes.', offset: false },
  { icon: Shield, color: 'text-emerald-600 bg-emerald-50', title: 'Secure & Reliable', desc: 'Enterprise-grade security for your transactions and travel data history.', offset: true },
]

const STEPS = [
  { n: '1', badge: 'bg-blue-100 text-[#2e5bff] shadow-[0_0_20px_rgba(46,91,255,0.1)]', title: 'Create Account', desc: 'Register with your phone number and verify your identity.' },
  { n: '2', badge: 'bg-purple-100 text-[#6b13af] shadow-[0_0_20px_rgba(107,19,175,0.1)]', title: 'Find Route', desc: 'Use search or AI to find the optimal bus for your destination.' },
  { n: '3', badge: 'bg-amber-100 text-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.1)]', title: 'Book & QR', desc: 'Pay instantly and receive your ticket as a dynamic QR code.' },
  { n: '4', badge: 'bg-emerald-100 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.1)]', title: 'Board & Travel', desc: 'Scan your QR at the bus validator and enjoy your ride.' },
]

const PASS_HIGHLIGHTS = [
  { name: 'Daily Pass', price: '₹70', desc: 'Unlimited travel across PMC & PCMC limits for 1 day.', category: 'POPULAR', badgeColor: 'bg-blue-100 text-blue-800', hoverColor: 'hover:border-blue-300' },
  { name: 'Monthly Pass', price: '₹1,500', desc: 'Full 30 days area-wise access. Save 45% vs daily tickets.', category: 'BEST VALUE', badgeColor: 'bg-purple-100 text-purple-800', hoverColor: 'hover:border-purple-300' },
  { name: 'Student Monthly', price: '₹750', desc: 'Specially subsidized monthly pass for PMPML routes.', category: 'VERIFIED', badgeColor: 'bg-amber-100 text-amber-800', hoverColor: 'hover:border-amber-300' },
]

const POPULAR_ROUTES = [
  { num: '91-U', from: 'Ma Na Pa', to: 'Ishanyanagari', km: 9.0, fare: 25, freq: 'Every 8 mins', type: 'Express', typeColor: 'bg-amber-100 text-amber-800' },
  { num: '373-D', from: 'Hinjawadi Maan Phase 3', to: 'Wakad Pul', km: 8.5, fare: 25, freq: 'Every 12 mins', type: 'High Demand', typeColor: 'bg-purple-100 text-purple-800' },
  { num: '94-D', from: 'Pune Station', to: 'Kothrud Depot', km: 11.4, fare: 25, freq: 'Every 15 mins', type: 'AC Bus', typeColor: 'bg-blue-100 text-blue-800' },
]

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  // Simulate loading state for skeleton loaders
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  // Monitor scroll for 3D card tilt effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate 3D card tilt transformations
  const rotateX = Math.min(15, scrollY * 0.04)
  const rotateY = -Math.min(12, scrollY * 0.02)
  const translateY = -Math.min(40, scrollY * 0.08)
  const tiltStyle = {
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}px)`,
    transition: 'transform 0.1s ease-out',
  }

  return (
    <div className="bg-white text-gray-800 font-['Outfit'] min-h-screen selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-6 lg:px-16 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 border-b border-gray-100 pt-16">
        <div className="absolute inset-0 glow-blue opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] glow-violet opacity-40 pointer-events-none" />
        
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-7 text-left space-y-6 sm:space-y-8">
            <span className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#2e5bff] bg-blue-50 px-4 py-2 rounded-full inline-block">
              <Zap className="h-4.5 w-4.5 inline-block -mt-1 mr-1.5 text-[#2e5bff] fill-[#2e5bff]/10 animate-bounce" />
              REDEFINING URBAN TRANSIT · 2026
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 tracking-tight">
              Book Tickets & Manage <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2e5bff] via-[#6b13af] to-indigo-600">Passes Digitally</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
              1030+ PMPML routes, instant QR tickets, 18 pass types, and AI-powered route finder designed for the modern commuter.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/book-ticket" className="px-7 py-4 rounded-full bg-gradient-to-r from-[#2e5bff] to-[#6b13af] text-white hover:shadow-lg hover:shadow-blue-500/20 font-bold text-sm sm:text-base transition-all flex items-center gap-2">
                <Ticket className="h-5 w-5" /> Book a Ticket
              </Link>
              <Link to="/buy-pass" className="px-7 py-4 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-sm sm:text-base shadow-sm transition-all flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Buy a Pass
              </Link>
              <Link to="/ai-assistant" className="px-7 py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm sm:text-base shadow-md transition-all flex items-center gap-2.5">
                <Bot className="h-5 w-5" /> AI Assistant
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Image Container */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div 
              style={tiltStyle}
              className="relative w-full max-w-[420px] aspect-[4/3] flex items-center justify-center group"
            >
              <img 
                src="/smart_bus_pass_3d.png" 
                alt="3D Smart Bus"
                className="w-full h-auto object-contain max-h-[320px] select-none filter drop-shadow-[0_20px_40px_rgba(46,91,255,0.15)] group-hover:scale-105 transition-transform duration-500" 
              />
              {/* Subtle ambient backglow */}
              <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-[#2e5bff] to-[#6b13af] rounded-full blur-3xl opacity-[0.05] -z-10 group-hover:opacity-[0.08] transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS BAR ──────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-12 max-w-7xl mx-auto">
        <div className="glass-card rounded-3xl p-8 sm:p-10 flex flex-wrap justify-around items-center gap-8 border border-gray-100 shadow-sm bg-white/50">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#2e5bff]">1,030+</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mt-2">Active Routes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#6b13af]">18</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mt-2">Pass Types</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">5 AM - 11:30 PM</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mt-2">Service Hours</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">FREE</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mt-2">AI Assistant</div>
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-24 max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#2e5bff] block">FEATURES</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">Curated Transit Experience</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, color, title, desc, offset }) => (
            <div key={title} className={`glass-card p-10 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200/50 transition-all duration-300 group ${offset ? 'lg:mt-8' : ''}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform ${color}`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS (WORKFLOW) ──────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-24 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#6b13af] block">WORKFLOW</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">Journey in Four Steps</h2>
          </div>
          <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 mt-16">
            <div className="hidden md:block absolute top-10 left-0 w-full h-[2px] bg-gradient-to-r from-blue-200 to-purple-200 opacity-60 -z-10" />
            {STEPS.map((step) => (
              <div key={step.n} className="flex-1 text-center group">
                <div className={`w-20 h-20 rounded-full ${step.badge} flex items-center justify-center font-extrabold text-2xl mx-auto mb-6 group-hover:scale-108 transition-transform`}>
                  {step.n}
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-900">{step.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PMPML FLEET & OPERATIONS ─────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-24 max-w-7xl mx-auto border-b border-gray-100">
        <div className="text-center mb-16">
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#2e5bff] block">PMPML FLEET & OPERATIONS</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">Connecting Pune Efficiently</h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto mt-3 leading-relaxed">
            Experience the next generation of public transit. PMPML is rapidly expanding its green footprint with a modern fleet of high-capacity electric and clean-energy buses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Side: Modern E-Bus Vector Graphic */}
          <div className="lg:col-span-7 glass-card rounded-3xl bg-white border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md hover:border-blue-200/50 transition-all duration-300 group">
            <div className="overflow-hidden rounded-2xl aspect-[3/2] bg-slate-50 flex items-center justify-center border border-gray-50 relative">
              <img 
                src="/kailassutar-official-pmpml-e-bus-vector.jpg" 
                alt="PMPML E-Bus Vector" 
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-emerald-500 text-white font-bold text-[10px] tracking-wider px-3 py-1 rounded-full shadow-sm">
                100% ELECTRIC
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Olectra Green Tech E-Bus</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our zero-emission pure electric buses feature advanced battery technology, silent operations, and full air conditioning for a premium commuting experience. Designed and optimized for Pune's heavy transit corridors.
              </p>
            </div>
          </div>

          {/* Right Side: Active Commute Photo */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="glass-card rounded-3xl bg-white border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md hover:border-purple-200/50 transition-all duration-300 group flex-1">
              <div className="overflow-hidden rounded-2xl aspect-square bg-slate-50 flex items-center justify-center border border-gray-50 relative">
                <img 
                  src="/PMPML BYS VECTOR, KailasSutar Official.jpg" 
                  alt="PMPML E-Bus Front View" 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#6b13af] text-white font-bold text-[10px] tracking-wider px-3 py-1 rounded-full shadow-sm">
                  OLECTRA K9 FRONT
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Olectra K9 Front Design</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Modern signature styling of the zero-emission electric buses operating in Pune. A symbol of environment-friendly mass transit solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PASS TYPES PREVIEW (WITH SKELETON LOADERS) ────────────────── */}
      <section className="px-6 lg:px-16 py-24 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-16">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-amber-700 block">PREMIUM PASSES</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">Tailored for Every Commuter</h2>
          </div>
          <Link to="/buy-pass" className="text-[#2e5bff] hover:underline text-[12px] font-bold tracking-wider flex items-center gap-1">
            VIEW ALL PASSES <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          /* Skeleton Loader Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-100/60 rounded-3xl p-8 relative overflow-hidden border border-gray-200/50 h-[300px] flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded-lg w-20" />
                    <div className="h-8 bg-gray-200 rounded-lg w-16" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mt-4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
                <div className="h-12 bg-gray-200 rounded-full w-full mt-4" />
              </div>
            ))}
          </div>
        ) : (
          /* Actual Passes Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PASS_HIGHLIGHTS.map(({ name, price, desc, category, badgeColor, hoverColor }) => (
              <div key={name} className={`glass-card rounded-3xl bg-white p-1 w-full overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all cursor-pointer border border-gray-100 ${hoverColor}`}>
                <div className="p-8 flex flex-col justify-between h-full space-y-6">
                  <div className="flex justify-between items-start">
                    <span className={`px-3 py-1 font-semibold text-[10px] tracking-wider rounded-md ${badgeColor}`}>{category}</span>
                    <span className="text-3xl font-extrabold text-gray-900">{price}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                  <Link to="/buy-pass" className="w-full mt-6 py-4 rounded-full bg-[#201f1f] hover:bg-[#2e5bff] text-center text-white hover:text-white font-bold transition-all block shadow-md">
                    Select Pass
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── AI ASSISTANT PROMO ───────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-24 relative z-0 overflow-hidden bg-slate-50 border-t border-gray-100">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] glow-blue opacity-30 -z-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
          <div className="flex-1 space-y-8">
            <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#2e5bff] block">SMART ASSISTANCE</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">The AI Transit <br />Expert in Your Pocket</h2>
            <p className="text-gray-600 text-base leading-relaxed">
              Forget complicated timetables. Just type where you want to go. Our AI assistant queries all 1030+ routes and instantly suggests the fastest options.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-[#2e5bff]" /> Natural Language Queries
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-[#2e5bff]" /> Fastest Route Logic
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-[#2e5bff]" /> Dynamic Route Suggestions
              </li>
            </ul>
            <Link to="/ai-assistant" className="inline-flex items-center gap-2.5 px-8 py-4 bg-amber-400 text-amber-950 hover:bg-amber-300 font-bold rounded-full transition-all shadow-md hover:scale-105">
              <Bot className="h-5 w-5" /> Try AI Assistant
            </Link>
          </div>
          <div className="flex-1 w-full max-w-md">
            <div className="glass-card rounded-3xl overflow-hidden p-6 shadow-xl border border-gray-100 bg-white transform rotate-1">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#2e5bff] flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">SmartBus AI</div>
                  <div className="text-xs text-[#2e5bff] flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping" /> Online &amp; Analyzing
                  </div>
                </div>
              </div>
              <div className="space-y-4 mb-6 h-60 overflow-y-auto">
                <div className="bg-gray-100 rounded-2xl rounded-tr-sm p-4 text-xs max-w-[85%] ml-auto text-gray-700 leading-relaxed shadow-sm">
                  "Hey, I need to get from Swargate to Hinjewadi Phase 3. What's the fastest way right now?"
                </div>
                <div className="bg-[#2e5bff]/5 rounded-2xl rounded-tl-sm p-4 text-xs max-w-[85%] text-gray-700 border border-blue-100/30 leading-relaxed shadow-sm">
                  "Found 3 routes! 91-U is fastest. Bus arrives in 4 mins at Platform 4. Estimated travel time: 52 mins."
                </div>
                <div className="bg-[#2e5bff]/5 rounded-2xl rounded-tl-sm p-4 text-xs max-w-[85%] text-gray-700 border border-blue-100/30 leading-relaxed shadow-sm">
                  "Would you like me to book a ticket for you?"
                </div>
              </div>
              <div className="relative">
                <input className="w-full bg-gray-50 border border-gray-100 text-gray-800 placeholder-gray-400 rounded-full py-3.5 pl-5 pr-12 text-xs focus:ring-1 focus:ring-[#2e5bff] transition-all outline-none" placeholder="Type your destination..." type="text" disabled />
                <button className="absolute right-2 top-2 text-[#2e5bff] p-1.5 hover:scale-105 transition-all">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── POPULAR ROUTES (WITH SKELETON LOADERS) ────────────────────── */}
      <section className="px-6 lg:px-16 py-24 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-16">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6b13af] block">NETWORK</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">Top Rated Routes</h2>
          </div>
          <Link to="/routes" className="text-[#2e5bff] hover:underline text-[12px] font-bold tracking-wider flex items-center gap-1">
            BROWSE ALL ROUTES <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          /* Skeleton Loader Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-100/60 rounded-3xl p-8 relative overflow-hidden border border-gray-200/50 h-[220px] flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded-lg w-20" />
                    <div className="h-6 bg-gray-200 rounded w-10" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mt-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          /* Actual Routes Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {POPULAR_ROUTES.map((route) => (
              <Link key={route.num} to="/book-ticket"
                state={{ route: { route_number: route.num, origin: route.from, destination: route.to, distance_km: route.km, fare: route.fare, base_fare: route.fare, id: '' } }}
                className="glass-card bg-white p-8 rounded-3xl group hover:bg-gray-50/50 hover:shadow-md transition-all flex flex-col justify-between h-full border border-gray-100 hover:border-blue-200/50">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="px-4 py-2 bg-[#2e5bff] text-white font-extrabold rounded-2xl text-lg">{route.num}</div>
                    <Bus className="h-5 w-5 text-gray-400 group-hover:text-[#2e5bff] transition-colors" />
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="font-bold text-lg text-gray-900">{route.from} — {route.to}</div>
                    <div className="text-xs text-gray-500">{route.km} km · Frequency: {route.freq}</div>
                  </div>
                </div>
                <div className="flex gap-2 items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className={`px-2 py-1 ${route.typeColor} text-[9px] font-extrabold rounded uppercase tracking-wider`}>{route.type}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[9px] font-extrabold rounded uppercase tracking-wider">AC Bus</span>
                  </div>
                  <span className="text-xs font-bold text-[#2e5bff] group-hover:translate-x-1 transition-transform flex items-center">
                    Book <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-16 py-24 max-w-7xl mx-auto">
        <div className="relative rounded-[3rem] overflow-hidden p-12 sm:p-20 text-center shadow-[0_25px_60px_rgba(46,91,255,0.18)] bg-gradient-to-br from-[#2e5bff] via-[#6b13af] to-indigo-900 border border-white/10 text-white hover:scale-[1.01] transition-all duration-500 group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">Ready to Modernize <br />Your Commute?</h2>
            <p className="text-blue-100 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">Join over 50,000 daily commuters who have made the switch to SmartBus.</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4">
              <Link to="/register" className="bg-white text-[#2e5bff] hover:bg-blue-50 px-10 py-4 rounded-full font-extrabold text-sm sm:text-base shadow-2xl transition-all duration-300 hover:scale-105 block">
                Create Free Account
              </Link>
              <Link to="/routes" className="border-2 border-white/30 hover:border-white/50 text-white px-10 py-4 rounded-full font-bold text-sm sm:text-base hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Browse Routes
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
