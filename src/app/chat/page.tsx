"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

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
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
    </div>
  )
}

// AI Avatar component
function AIAvatar({ isTyping = false }: { isTyping?: boolean }) {
  return (
    <div className={`relative shrink-0 ${isTyping ? "animate-pulse" : ""}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></div>
    </div>
  )
}

// User Avatar component
function UserAvatar() {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
      MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
      HIGH: "bg-orange-100 text-orange-700 border-orange-200",
      EMERGENCY: "bg-red-100 text-red-700 border-red-200",
    }
    return colors[urgency] || "bg-gray-100 text-gray-700"
  }

  const formatMessageContent = (content: string) => {
    // Convert markdown-like formatting to styled HTML
    return content
      .split("\n")
      .map((line, i) => {
        // Bold headers
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-gray-800 mt-4 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {line.replace(/\*\*/g, "")}
            </p>
          )
        }
        // Bullet points
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <p key={i} className="ml-4 text-gray-600 py-0.5 flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0"></span>
              <span>{line.replace(/^[•-]\s/, "")}</span>
            </p>
          )
        }
        // Warning/urgent messages
        if (line.includes("⚠️") || line.toLowerCase().includes("important")) {
          return (
            <div key={i} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 p-3 rounded-xl my-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">{line.replace("⚠️", "").trim()}</span>
            </div>
          )
        }
        // Italics / disclaimer
        if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
          return (
            <p key={i} className="text-xs text-gray-400 italic mt-4 pt-3 border-t border-gray-100">
              {line.replace(/\*/g, "")}
            </p>
          )
        }
        // Urgency level display
        if (line.includes("Urgency Level:")) {
          const level = line.split(":")[1]?.trim() || ""
          return (
            <div key={i} className="my-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getUrgencyColor(level)}`}>
                {level === "EMERGENCY" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {level === "HIGH" && "🔴"} {level === "MEDIUM" && "🟡"} {level === "LOW" && "🟢"}
                <span>Urgency: {level}</span>
              </span>
            </div>
          )
        }
        return line ? (
          <p key={i} className="text-gray-600 leading-relaxed">
            {line}
          </p>
        ) : (
          <div key={i} className="h-2" />
        )
      })
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center animate-pulse shadow-2xl shadow-emerald-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium">Starting health assistant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 flex overflow-hidden">
      {/* Sidebar - Chat History */}
      <div className={`${showSidebar ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col h-full shrink-0`}>
        <div className="p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">HealthBot</span>
                <p className="text-xs text-gray-500">Your AI Health Companion</p>
              </div>
            </div>
          </div>

          <Button onClick={startNewChat} className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 rounded-xl h-11 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-3">Recent Chats</p>
          {loadingSessions ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-sm">Loading chats...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No conversations yet</p>
              <p className="text-gray-400 text-xs mt-1">Start chatting about your health!</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3.5 rounded-xl cursor-pointer transition-all group ${currentSessionId === session.id
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm"
                  : "hover:bg-gray-50 border border-transparent"
                  }`}
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate text-sm">{session.title}</p>
                    {session.urgencyLevel && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs mt-1.5 font-medium border ${getUrgencyColor(session.urgencyLevel)}`}>
                        {session.urgencyLevel}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(session.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3 flex-1">
            <AIAvatar />
            <div>
              <h1 className="text-lg font-bold text-gray-800">AI Health Assistant</h1>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Online • Ready to help
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            For informational purposes only
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              {/* Welcome Card */}
              <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm mb-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
                <CardContent className="p-8 text-center relative">
                  <div className="relative inline-block mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform rotate-3 hover:rotate-0 transition-transform">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-2xl -z-10"></div>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                    Hey there! 👋 I&apos;m your Health Companion
                  </h2>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
                    Tell me how you&apos;re feeling today, and I&apos;ll help you understand your symptoms 
                    and suggest what steps you might take next.
                  </p>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 text-left max-w-md mx-auto">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-amber-800 text-sm">
                        <span className="font-semibold">Remember:</span> I&apos;m here to help you understand symptoms, but I&apos;m not a replacement for professional medical care.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Symptoms */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4 text-center font-medium">Quick start — tell me if you have:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickSymptoms.map((symptom, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputMessage(symptom.text)
                        inputRef.current?.focus()
                      }}
                      className="px-4 py-2.5 bg-white rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm border border-gray-200 flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span>{symptom.icon}</span>
                      <span>{symptom.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {message.role === "assistant" && <AIAvatar />}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 ${message.role === "user"
                      ? "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20"
                      : "bg-white shadow-xl shadow-gray-200/50 border border-gray-100"
                      }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="space-y-1">{formatMessageContent(message.content)}</div>
                    ) : (
                      <p className="leading-relaxed">{message.content}</p>
                    )}

                    {/* Show quick actions for AI messages */}
                    {message.role === "assistant" && message.analysis && message.analysis.specialists.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Suggested Actions</p>
                        <div className="flex flex-wrap gap-2">
                          {message.analysis.specialists.slice(0, 2).map((specialist, i) => (
                            <Button
                              key={i}
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/appointments/book?specialty=${encodeURIComponent(specialist)}`)}
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg text-xs h-8"
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

                  {message.role === "user" && <UserAvatar />}
                </div>
              ))}

              {sending && (
                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                  <AIAvatar isTyping />
                  <div className="bg-white shadow-xl shadow-gray-200/50 border border-gray-100 rounded-2xl overflow-hidden">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
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
                  placeholder="Tell me how you're feeling... (e.g., I've been having headaches lately)"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 bg-white/80 transition-all placeholder:text-gray-400"
                  disabled={sending}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || sending}
                className="px-5 h-14 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {sending ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center flex items-center justify-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">Enter</kbd>
              <span>to send</span>
              <span className="text-gray-300">•</span>
              <span>Your health data is private & secure</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
