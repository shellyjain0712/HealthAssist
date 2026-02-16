"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  doctor: {
    id: string
    name: string
    specialty: string
  }
}

interface HealthRecord {
  id: string
  title: string
  category: string
  status: string
  recordDate: string
}

export default function PatientDashboard({ profile, onSignOut }: PatientDashboardProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [aptRes, recRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/records")
      ])
      const aptData = await aptRes.json()
      const recData = await recRes.json()
      if (aptRes.ok) setAppointments(aptData.appointments || [])
      if (recRes.ok) setRecords(recData.records || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return aptDate >= today && apt.status !== "cancelled"
  }).slice(0, 3)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800">Smart Health</span>
          </div>

          <nav className="hidden md:flex items-center gap-4 text-sm">
            <a href="/dashboard" className="text-emerald-600 font-medium">Dashboard</a>
            <a href="/appointments" className="text-gray-600 hover:text-gray-900">Appointments</a>
            <a href="/records" className="text-gray-600 hover:text-gray-900">Records</a>
            <a href="/doctors" className="text-gray-600 hover:text-gray-900">Doctors</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
              {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
            </div>
            <Button variant="ghost" size="sm" onClick={onSignOut} className="text-sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome, {profile?.profile?.firstName || "Patient"}
          </h1>
          <p className="text-sm text-gray-500">Your health overview</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Appointments</p>
              <p className="text-2xl font-semibold">{appointments.length}</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold">{upcomingAppointments.length}</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Records</p>
              <p className="text-2xl font-semibold">{records.length}</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-semibold">{appointments.filter(a => a.status === "completed").length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { title: "AI Chat", href: "/chat", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
            { title: "Book Appointment", href: "/appointments/book", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            { title: "My Records", href: "/records", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            { title: "Find Doctors", href: "/doctors", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
          ].map((action) => (
            <button
              key={action.title}
              onClick={() => router.push(action.href)}
              className="p-4 bg-white border rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
              <p className="text-sm font-medium text-gray-900">{action.title}</p>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Upcoming Appointments */}
          <Card className="border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Upcoming</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => router.push("/appointments")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-sm text-gray-500 py-4 text-center">Loading...</p>
              ) : upcomingAppointments.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No upcoming appointments</p>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {apt.doctor.name.split(" ").pop()?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{apt.doctor.name}</p>
                      <p className="text-xs text-gray-500">{apt.doctor.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{formatDate(apt.date)}</p>
                      <p className="text-xs text-gray-500">{apt.time}</p>
                    </div>
                  </div>
                ))
              )}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm h-9" onClick={() => router.push("/appointments/book")}>
                Book Appointment
              </Button>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-medium">
                  {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium">{profile?.profile?.firstName} {profile?.profile?.lastName}</p>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="text-sm font-medium">{profile?.profile?.bloodGroup || "-"}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{profile?.profile?.phone || "-"}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full h-9 text-sm" onClick={() => router.push("/profile")}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

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
