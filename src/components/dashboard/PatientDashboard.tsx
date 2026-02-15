"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface PatientDashboardProps {
  profile: any
  onSignOut: () => void
}

interface Appointment {
  id: string
  date: string
  time: string
  reason: string | null
  status: string
  fee: number
  doctor: {
    id: string
    name: string
    specialty: string
    hospital: string | null
  }
}

interface HealthRecord {
  id: string
  title: string
  category: string
  status: string
  recordDate: string
  doctor: {
    name: string
    specialty: string
  } | null
}

export default function PatientDashboard({ profile, onSignOut }: PatientDashboardProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(true)

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    try {
      setLoadingAppointments(true)
      const response = await fetch("/api/appointments")
      const data = await response.json()
      if (response.ok) {
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setLoadingAppointments(false)
    }
  }, [])

  // Fetch health records from API
  const fetchRecords = useCallback(async () => {
    try {
      setLoadingRecords(true)
      const response = await fetch("/api/records")
      const data = await response.json()
      if (response.ok) {
        setRecords(data.records || [])
      }
    } catch (error) {
      console.error("Failed to fetch records:", error)
    } finally {
      setLoadingRecords(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
    fetchRecords()
  }, [fetchAppointments, fetchRecords])

  // Calculate stats from real data
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return aptDate >= today && apt.status !== "cancelled"
  }).slice(0, 3)

  const appointmentStats = {
    total: appointments.length,
    completed: appointments.filter(apt => apt.status === "completed").length,
    upcoming: appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return aptDate >= today && apt.status !== "cancelled"
    }).length,
    cancelled: appointments.filter(apt => apt.status === "cancelled").length,
  }

  const recordStats = {
    total: records.length,
    labReports: records.filter(r => r.category === "LAB_REPORT" || r.category === "labreport").length,
    prescriptions: records.filter(r => r.category === "PRESCRIPTION" || r.category === "prescription").length,
    imaging: records.filter(r => r.category === "IMAGING" || r.category === "imaging").length,
  }

  // Health score based on recent appointments and records
  const healthScore = Math.min(100, Math.max(60, 85 + (appointmentStats.completed * 2) - (appointmentStats.cancelled * 5)))

  const quickActions = [
    {
      title: "AI Symptom Checker",
      description: "Get AI-powered health insights",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      color: "from-pink-500 to-rose-600",
      bgLight: "bg-pink-50",
      href: "/chat",
    },
    {
      title: "Book Appointment",
      description: "Schedule a visit with a doctor",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      href: "/appointments/book",
    },
    {
      title: "My Records",
      description: "View your medical history",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
      href: "/records",
    },
    {
      title: "Test Reports",
      description: "Upload & view test results",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      color: "from-cyan-500 to-cyan-600",
      bgLight: "bg-cyan-50",
      href: "/lab-results",
    },
    {
      title: "Find Doctors",
      description: "Browse available specialists",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: "from-purple-500 to-purple-600",
      bgLight: "bg-purple-50",
      href: "/doctors",
    },
  ]

  // Dynamic health metrics based on records
  const healthMetrics = [
    { label: "Total Records", value: recordStats.total.toString(), unit: "", status: "info", icon: "📋" },
    { label: "Test Reports", value: recordStats.labReports.toString(), unit: "", status: "normal", icon: "🧪" },
    { label: "Prescriptions", value: recordStats.prescriptions.toString(), unit: "", status: "normal", icon: "💊" },
    { label: "Appointments", value: appointmentStats.total.toString(), unit: "", status: "normal", icon: "📅" },
  ]

  // Sample health trends data for visualization (in a real app, this would come from health records/measurements)
  const healthTrends = [
    { month: "Jul", bp: 118, hr: 72, sugar: 95 },
    { month: "Aug", bp: 120, hr: 74, sugar: 98 },
    { month: "Sep", bp: 117, hr: 71, sugar: 94 },
    { month: "Oct", bp: 122, hr: 75, sugar: 100 },
    { month: "Nov", bp: 119, hr: 73, sugar: 96 },
    { month: "Dec", bp: 121, hr: 72, sugar: 97 },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">Smart Health</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-emerald-600 font-medium">Dashboard</a>
              <a href="/appointments" className="text-gray-600 hover:text-gray-900">Appointments</a>
              <a href="/records" className="text-gray-600 hover:text-gray-900">Records</a>
              <a href="/doctors" className="text-gray-600 hover:text-gray-900">Doctors</a>
            </nav>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{profile?.profile?.firstName} {profile?.profile?.lastName}</p>
                  <p className="text-xs text-gray-500">Patient</p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={onSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.profile?.firstName || "Patient"}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here&apos;s your health overview for today</p>
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {healthMetrics.map((metric, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{metric.icon}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${metric.status === "info" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                    {metric.status === "info" ? "Info" : "Active"}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value} <span className="text-sm font-normal text-gray-500">{metric.unit}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-left border-0"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => router.push("/appointments")}>View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingAppointments ? (
                <div className="text-center py-8 text-gray-500">Loading appointments...</div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No upcoming appointments</p>
                </div>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {apt.doctor.name.split(" ").pop()?.[0] || "D"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{apt.doctor.name}</p>
                      <p className="text-sm text-gray-500">{apt.doctor.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatDate(apt.date)}</p>
                      <p className="text-xs text-gray-500">{apt.time}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${apt.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-700"
                      : apt.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                      }`}>
                      {apt.status}
                    </span>
                  </div>
                ))
              )}

              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={() => router.push("/appointments/book")}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Book New Appointment
              </Button>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
              <CardDescription>Personal and medical information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-lg">{profile?.profile?.firstName} {profile?.profile?.lastName}</p>
                  <p className="text-blue-100">{profile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Blood Group</p>
                  <p className="font-semibold text-gray-900">{profile?.profile?.bloodGroup || "Not set"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="font-semibold text-gray-900">{profile?.profile?.phone || "Not set"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                  <p className="font-semibold text-gray-900">{profile?.profile?.gender || "Not set"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Emergency Contact</p>
                  <p className="font-semibold text-gray-900">{profile?.profile?.emergencyContact || "Not set"}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => router.push("/profile")}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analytics & Reports Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics & Reports</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Health Score */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Health Score</CardTitle>
                <CardDescription>Based on your recent vitals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#healthGradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${healthScore * 3.52} 352`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
                      <span className="text-xs text-gray-500">{healthScore >= 85 ? "Excellent" : healthScore >= 70 ? "Good" : healthScore >= 50 ? "Fair" : "Needs Attention"}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-gray-500">BP</p>
                    <p className="font-semibold text-emerald-600">✓</p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-gray-500">Heart</p>
                    <p className="font-semibold text-emerald-600">✓</p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-gray-500">Sugar</p>
                    <p className="font-semibold text-emerald-600">✓</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Trends Chart */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Health Trends</CardTitle>
                    <CardDescription>6 months overview</CardDescription>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> BP</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-500 rounded-full"></span> Heart Rate</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-full"></span> Sugar</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end justify-between gap-2 pt-4">
                  {healthTrends.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex justify-center gap-1 h-36">
                        <div
                          className="w-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all hover:opacity-80"
                          style={{ height: `${(data.bp / 130) * 100}%` }}
                          title={`BP: ${data.bp}`}
                        ></div>
                        <div
                          className="w-3 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-sm transition-all hover:opacity-80"
                          style={{ height: `${(data.hr / 80) * 100}%` }}
                          title={`HR: ${data.hr}`}
                        ></div>
                        <div
                          className="w-3 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-sm transition-all hover:opacity-80"
                          style={{ height: `${(data.sugar / 110) * 100}%` }}
                          title={`Sugar: ${data.sugar}`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{data.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointment Analytics */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Appointment Summary</CardTitle>
                <CardDescription>This year&apos;s appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#10b981" strokeWidth="12"
                        strokeDasharray={`${(appointmentStats.completed / appointmentStats.total) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#3b82f6" strokeWidth="12"
                        strokeDasharray={`${(appointmentStats.upcoming / appointmentStats.total) * 251.2} 251.2`}
                        strokeDashoffset={`-${(appointmentStats.completed / appointmentStats.total) * 251.2}`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#ef4444" strokeWidth="12"
                        strokeDasharray={`${(appointmentStats.cancelled / appointmentStats.total) * 251.2} 251.2`}
                        strokeDashoffset={`-${((appointmentStats.completed + appointmentStats.upcoming) / appointmentStats.total) * 251.2}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{appointmentStats.total}</span>
                      <span className="text-xs text-gray-500">Total</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-600">{appointmentStats.completed}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{appointmentStats.upcoming}</p>
                    <p className="text-xs text-gray-500">Upcoming</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-600">{appointmentStats.cancelled}</p>
                    <p className="text-xs text-gray-500">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Reports */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Reports</CardTitle>
                    <CardDescription>Your medical reports</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => router.push("/records")}>View All</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingRecords ? (
                  <div className="text-center py-8 text-gray-500">Loading records...</div>
                ) : records.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No health records yet</p>
                  </div>
                ) : (
                  records.slice(0, 4).map((record) => (
                    <div key={record.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => router.push("/records")}>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{record.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(record.recordDate)} • {record.category.replace("_", " ")}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${record.status === "NORMAL" ? "bg-emerald-100 text-emerald-700"
                        : record.status === "ABNORMAL" ? "bg-yellow-100 text-yellow-700"
                          : record.status === "CRITICAL" ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                        {record.status.replace("_", " ")}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
