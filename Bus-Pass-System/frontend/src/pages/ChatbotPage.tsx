import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
  Send, Bot, User, Sparkles, MapPin, Clock, Bus,
  RotateCcw, ChevronDown, Zap, Search
} from 'lucide-react'

interface Message {
  id: string
  text: string
  isBot: boolean
  time: string
  routes?: RouteCard[]
  suggestions?: string[]
}

interface RouteCard {
  id?: string
  route_number: string
  origin: string
  destination: string
  distance_km: number
  duration_minutes?: number
  fare?: number
}

const STARTERS = [
  { icon: '🚌', label: 'Katraj → Hinjewadi', query: 'Show routes from Katraj to Hinjewadi' },
  { icon: '🚏', label: 'Buses at Swargate', query: 'Which buses stop at Swargate?' },
  { icon: '⚡', label: 'Fastest to Wakad', query: 'Fastest route to Wakad' },
  { icon: '🎫', label: 'Pass prices', query: 'Show me all bus pass prices' },
  { icon: '🗺️', label: 'Pune Station routes', query: 'Routes from Pune Station' },
  { icon: '🏢', label: 'IT Park buses', query: 'Buses to Hinjewadi IT Park' },
]

function now() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatbotPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const displayName = (user as any)?.full_name ||
    `${(user as any)?.first_name || ''}`.trim() || 'there'

  // Init
  useEffect(() => {
    createSession()
    setMessages([{
      id: 'welcome',
      text: `Hi ${displayName}! 👋 I'm your PMPML route assistant.\n\nI can help you find bus routes, check timings, compare fares, and book tickets across Pune's 1030+ routes.\n\nWhat would you like to know?`,
      isBot: true,
      time: now(),
      suggestions: ['Routes from Katraj to Hinjewadi', 'Buses at Swargate', 'Fastest route to Wakad'],
    }])
  }, [])

  // Scroll detection
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollBtn(distFromBottom > 120)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (!showScrollBtn) scrollToBottom()
  }, [messages, loading])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const createSession = async () => {
    try {
      const res = await api.post('/api/v1/chatbot/session', { language: 'en' })
      setSessionId(res.data.session_id)
    } catch { /* silent */ }
  }

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    const userMsg: Message = { id: Date.now().toString(), text: msg, isBot: false, time: now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/api/v1/chatbot/message', {
        message: msg, session_id: sessionId, language: 'en',
      })
      const d = res.data
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: d.answer || 'I found some results for you.',
        isBot: true,
        time: now(),
        routes: d.routes?.length ? d.routes : undefined,
        suggestions: d.suggestions?.length ? d.suggestions : undefined,
      }
      setMessages(prev => [...prev, botMsg])
      if (d.session_id && d.session_id !== sessionId) setSessionId(d.session_id)
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process that. Please try again.",
        isBot: true, time: now(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, loading, sessionId])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const handleBookRoute = (route: RouteCard) => {
    navigate('/book-ticket', {
      state: {
        route: {
          id: route.id || '',
          route_number: route.route_number,
          origin: route.origin,
          destination: route.destination,
          distance_km: route.distance_km,
          fare: route.fare || Math.round(10 + route.distance_km * 1.5),
          base_fare: route.fare || Math.round(10 + route.distance_km * 1.5),
        }
      }
    })
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      text: `Chat cleared! Ask me anything about PMPML routes in Pune.`,
      isBot: true, time: now(),
      suggestions: ['Routes from Katraj to Hinjewadi', 'Buses at Swargate', 'Pass prices'],
    }])
    createSession()
  }

  const isEmpty = messages.length <= 1

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-tight">PMPML AI Assistant</h1>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                Online · 1030+ routes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearChat}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Clear chat">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={() => navigate('/routes')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition">
              <Search className="h-3.5 w-3.5" /> Browse Routes
            </button>
          </div>
        </div>
      </div>

      {/* ── MESSAGES ───────────────────────────────────────────────── */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

          {/* Starter cards — only when chat is empty */}
          {isEmpty && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {STARTERS.map((s, i) => (
                <button key={i} onClick={() => send(s.query)}
                  className="flex items-center gap-2 p-3 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-left transition group shadow-sm">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.isBot ? '' : 'flex-row-reverse'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                msg.isBot
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                  : 'bg-gradient-to-br from-gray-700 to-gray-900'
              }`}>
                {msg.isBot ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
              </div>

              <div className={`flex-1 max-w-2xl space-y-3 ${msg.isBot ? '' : 'flex flex-col items-end'}`}>
                {/* Bubble */}
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  msg.isBot
                    ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <p className={`text-xs text-gray-400 px-1 ${msg.isBot ? '' : 'text-right'}`}>{msg.time}</p>

                {/* Route Cards */}
                {msg.routes && msg.routes.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
                    {msg.routes.slice(0, 6).map((route, idx) => (
                      <div key={idx}
                        className="bg-white border border-gray-200 rounded-xl p-3.5 hover:border-blue-400 hover:shadow-md transition group">
                        {/* Route badge */}
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                            {route.route_number}
                          </span>
                          {idx === 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Best
                            </span>
                          )}
                        </div>

                        {/* Origin → Destination */}
                        <div className="space-y-1 mb-2.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="font-medium truncate">{route.origin}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
                            <span className="font-medium truncate">{route.destination}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Bus className="h-3 w-3" />
                            <span>{route.distance_km} km</span>
                          </div>
                          {route.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>~{route.duration_minutes} min</span>
                            </div>
                          )}
                          <span className="font-bold text-blue-600">
                            ₹{route.fare || Math.round(10 + route.distance_km * 1.5)}
                          </span>
                        </div>

                        <button onClick={() => handleBookRoute(route)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-xs font-semibold transition">
                          Book Ticket →
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestion chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.suggestions.map((s, i) => (
                      <button key={i} onClick={() => send(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full text-xs font-medium transition shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-9 h-9 bg-white border border-gray-300 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition z-10">
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>
      )}

      {/* ── INPUT ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-2xl px-4 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKey}
              placeholder="Ask about routes, stops, timings, passes…"
              disabled={loading}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 py-1 max-h-28"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition shadow-sm disabled:shadow-none mb-0.5">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1.5">
            ⚡ Powered by AI · Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
