"use client"

import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  symptoms?: string[]
  analysis?: {
    conditions: string[]
    specialists: string[]
    urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY"
  }
  createdAt?: string
}

interface ChatSession {
  id: string
  title: string
  summary: string | null
  urgencyLevel: string | null
  createdAt: string
  messages?: ChatMessage[]
}

// Animated typing effect component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
  )
}

// AI Avatar component
function AIAvatar({ isTyping = false }: { isTyping?: boolean }) {
  return (
    <div className={`relative shrink-0 ${isTyping ? "animate-pulse" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
    </div>
  )
}

// User Avatar component
function UserAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  )
}

export default function ChatbotPage() {
  const { status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true)
      const response = await fetch("/api/chat")
      const data = await response.json()
      if (response.ok) {
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`)
      const data = await response.json()
      if (response.ok && data.session) {
        setCurrentSessionId(sessionId)
        setMessages(data.session.messages || [])
      }
    } catch (error) {
      console.error("Failed to load session:", error)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchSessions()
    }
  }, [status, fetchSessions])

  const startNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setInputMessage("")
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: inputMessage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setSending(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: currentSessionId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (!currentSessionId) {
          setCurrentSessionId(data.sessionId)
          fetchSessions() // Refresh session list
        }

        const aiMessage: ChatMessage = {
          id: data.message.id,
          role: "assistant",
          content: data.message.content,
          symptoms: data.message.symptoms,
          analysis: data.message.analysis,
        }

        setMessages((prev) => [...prev, aiMessage])
      } else {
        // Remove the user message if request failed
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
        alert(data.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
    } finally {
      setSending(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) return

    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        if (currentSessionId === sessionId) {
          startNewChat()
        }
        fetchSessions()
      }
    } catch (error) {
      console.error("Error deleting session:", error)
    }
  }

  const quickSymptoms = [
    { text: "I have a headache", icon: "🤕" },
    { text: "Feeling feverish", icon: "🤒" },
    { text: "Stomach pain", icon: "😣" },
    { text: "Feeling tired", icon: "😴" },
    { text: "Sore throat", icon: "😷" },
    { text: "Chest discomfort", icon: "💔" },
  ]

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar - Chat History */}
      <div className={`${showSidebar ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col h-full shrink-0`}>
        <div className="p-3 shrink-0">
          <Button onClick={startNewChat} className="w-full bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg h-11 transition-all flex items-center justify-center gap-2 font-medium shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5">
          {loadingSessions ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-sm">Loading...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-3">
              <p className="text-gray-500 text-sm">No conversations yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all group flex items-center justify-between ${currentSessionId === session.id
                  ? "bg-gray-100"
                  : "hover:bg-gray-50"
                  }`}
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-sm text-gray-700 truncate">{session.title}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all shrink-0"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 shrink-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-all text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900">HealthBot</h1>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 pb-24">
              <div className="max-w-3xl w-full text-center space-y-10">
                {/* Header Section */}
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-xl shadow-teal-500/20 ring-4 ring-teal-50">
                    <svg className="w-11 h-11 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">How can I help you today?</h1>
                  <p className="text-gray-600 text-lg max-w-xl mx-auto leading-relaxed">I&apos;m your AI health assistant. Tell me about your symptoms and I&apos;ll help you understand them better.</p>
                </div>

                {/* Quick Symptoms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {quickSymptoms.map((symptom, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputMessage(symptom.text)
                        inputRef.current?.focus()
                      }}
                      className="group relative p-4 bg-white hover:bg-gray-50 rounded-2xl text-left transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-2xl">{symptom.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{symptom.text}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl p-5 text-left max-w-2xl mx-auto shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-amber-900 leading-relaxed">
                        <span className="font-bold">Disclaimer:</span> This AI assistant provides informational guidance only and is not a substitute for professional medical advice, diagnosis, or treatment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`w-full ${message.role === "assistant" ? "bg-gray-50" : "bg-white"} border-b border-gray-100`}
                >
                  <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex gap-4 items-start">
                      {message.role === "assistant" ? <AIAvatar /> : <UserAvatar />}

                      <div className="flex-1 space-y-2 overflow-hidden">
                        {message.role === "assistant" ? (
                          <div className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-gray-900 leading-relaxed">{message.content}</p>
                        )}

                        {/* Urgent booking CTA for MEDIUM+ urgency */}
                        {message.role === "assistant" && index === messages.length - 1 && (() => {
                          // More flexible urgency detection
                          let urgency: string | null = null;
                          const content = message.content.toUpperCase();

                          if (content.includes('EMERGENCY')) {
                            urgency = 'EMERGENCY';
                          } else if (content.includes('HIGH URGENCY') || content.includes('HIGH PRIORITY')) {
                            urgency = 'HIGH';
                          } else if (content.includes('MEDIUM URGENCY') || content.includes('MEDIUM PRIORITY')) {
                            urgency = 'MEDIUM';
                          }

                          if (urgency === "MEDIUM" || urgency === "HIGH" || urgency === "EMERGENCY") {
                            // Extract specialist from message - prioritize by medical context
                            let specialist = "doctor";

                            // Pregnancy/gynecological issues -> Gynecologist
                            if (/pregnan(t|cy)|prenatal|birth|labor|contraction|gynecolog|obstetric|miscarriage|bleeding.*pregnan/i.test(message.content)) {
                              specialist = "gynecologist";
                            }
                            // Heart/cardiac issues -> Cardiologist
                            else if (/heart|cardiac|chest.*pain|cardiovascular|angina/i.test(message.content)) {
                              specialist = "cardiologist";
                            } else {
                              const specialistMatch = message.content.match(/(gynecologist|cardiologist|neurologist|dermatologist|orthopedist|pediatrician|psychiatrist|general physician|ent specialist|pulmonologist|gastroenterologist|endocrinologist|rheumatologist|urologist|ophthalmologist)/i);
                              specialist = specialistMatch?.[1] || "emergency medicine";
                            }

                            return (
                              <div className={`mt-6 p-4 rounded-xl border-2 ${urgency === "EMERGENCY"
                                  ? "bg-red-50 border-red-300"
                                  : urgency === "HIGH"
                                    ? "bg-orange-50 border-orange-300"
                                    : "bg-amber-50 border-amber-300"
                                }`}>
                                <div className="flex items-start gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${urgency === "EMERGENCY"
                                      ? "bg-red-100"
                                      : urgency === "HIGH"
                                        ? "bg-orange-100"
                                        : "bg-amber-100"
                                    }`}>
                                    {urgency === "EMERGENCY" ? (
                                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                    ) : (
                                      <svg className={`w-5 h-5 ${urgency === "HIGH" ? "text-orange-600" : "text-amber-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm font-semibold mb-2 ${urgency === "EMERGENCY"
                                        ? "text-red-900"
                                        : urgency === "HIGH"
                                          ? "text-orange-900"
                                          : "text-amber-900"
                                      }`}>
                                      {urgency === "EMERGENCY"
                                        ? "🚨 CALL EMERGENCY SERVICES (911) IMMEDIATELY!"
                                        : urgency === "HIGH"
                                          ? "⚠️ This needs prompt medical attention"
                                          : "Consider scheduling a consultation soon"}
                                    </p>
                                    {urgency === "EMERGENCY" && (
                                      <p className="text-xs text-red-800 mb-3 font-medium">
                                        If unable to get emergency care immediately, you can also book an urgent appointment:
                                      </p>
                                    )}
                                    <Button
                                      onClick={() => {
                                        // Gather conversation context
                                        const symptoms = messages
                                          .filter(m => m.role === "user")
                                          .map(m => m.content)
                                          .join(" | ");

                                        const params = new URLSearchParams({
                                          specialty: specialist,
                                          urgency: urgency,
                                          symptoms: symptoms.slice(0, 500),
                                          context: message.content.slice(0, 500),
                                        });

                                        router.push(`/appointments/book?${params.toString()}`);
                                      }}
                                      className={`w-full sm:w-auto text-base py-3 px-6 ${urgency === "EMERGENCY"
                                          ? "bg-red-600 hover:bg-red-700 animate-pulse"
                                          : urgency === "HIGH"
                                            ? "bg-orange-600 hover:bg-orange-700"
                                            : "bg-amber-600 hover:bg-amber-700"
                                        } text-white font-bold shadow-lg hover:shadow-xl transition-all`}
                                    >
                                      <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {urgency === "EMERGENCY"
                                        ? "Find Emergency Care / Book Urgent Appointment"
                                        : `Book ${specialist.charAt(0).toUpperCase() + specialist.slice(1)} Appointment`}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Show quick actions for AI messages */}
                        {message.role === "assistant" && message.analysis && message.analysis.specialists.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Suggested Actions</p>
                            <div className="flex flex-wrap gap-2">
                              {message.analysis.specialists.slice(0, 2).map((specialist, i) => (
                                <Button
                                  key={i}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/appointments/book?specialty=${encodeURIComponent(specialist)}`)}
                                  className="text-teal-600 border-teal-200 hover:bg-teal-50 rounded-lg text-xs h-8 font-medium"
                                >
                                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Book {specialist}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="w-full bg-gray-50 border-b border-gray-100">
                  <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex gap-4 items-start">
                      <AIAvatar isTyping />
                      <div className="flex-1">
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 shrink-0">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Message HealthBot..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-all placeholder:text-gray-400 text-sm shadow-sm"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || sending}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 rounded-lg transition-all disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              HealthBot can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
