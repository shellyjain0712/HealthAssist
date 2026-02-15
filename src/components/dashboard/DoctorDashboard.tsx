"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface DoctorDashboardProps {
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
  patient: {
    id: string
    name: string
    email: string
    age?: number
  }
}

interface Patient {
  id: string
  name: string
  email: string
  lastVisit?: string
  condition?: string
}

export default function DoctorDashboard({ profile, onSignOut }: DoctorDashboardProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [loadingPatients, setLoadingPatients] = useState(true)

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

  // Fetch patients from API
  const fetchPatients = useCallback(async () => {
    try {
      setLoadingPatients(true)
      const response = await fetch("/api/patients")
      const data = await response.json()
      if (response.ok) {
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error)
    } finally {
      setLoadingPatients(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
    fetchPatients()
  }, [fetchAppointments, fetchPatients])

  // Calculate stats from real data
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    aptDate.setHours(0, 0, 0, 0)
    return aptDate.getTime() === today.getTime()
  })

  const upcomingToday = todayAppointments.filter(apt => apt.status === "PENDING" || apt.status === "CONFIRMED")
  const completedToday = todayAppointments.filter(apt => apt.status === "COMPLETED")

  const stats = [
    { label: "Total Patients", value: patients.length.toString(), change: "", icon: "👥", color: "from-blue-500 to-blue-600" },
    { label: "Today's Appointments", value: todayAppointments.length.toString(), change: `${upcomingToday.length} remaining`, icon: "📅", color: "from-emerald-500 to-teal-600" },
    { label: "Pending Reviews", value: appointments.filter(a => a.status === "PENDING").length.toString(), change: "", icon: "📋", color: "from-orange-500 to-orange-600" },
    { label: "Completed", value: completedToday.length.toString(), change: "Today", icon: "✅", color: "from-purple-500 to-purple-600" },
  ]

  // Get recent patients (last 5 unique patients from appointments)
  const recentPatients = patients.slice(0, 4)

  const quickActions = [
    {
      title: "Patient Records",
      description: "Access medical histories",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
      href: "/patients",
    },
    {
      title: "Write Prescription",
      description: "Create new prescriptions",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: "from-emerald-500 to-teal-600",
      href: "/prescriptions/new",
    },
    {
      title: "Schedule",
      description: "Manage your calendar",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "from-purple-500 to-purple-600",
      href: "/schedule",
    },
    {
      title: "Test Reports",
      description: "Review patient reports",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "from-cyan-500 to-cyan-600",
      href: "/lab-results",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
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
              <div>
                <span className="text-xl font-bold text-gray-800">Smart Health</span>
                <span className="text-xs text-emerald-600 block">Doctor Portal</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-emerald-600 font-medium">Dashboard</a>
              <a href="/patients" className="text-gray-600 hover:text-gray-900 transition-colors">Patients</a>
              <a href="/appointments" className="text-gray-600 hover:text-gray-900 transition-colors">Appointments</a>
              <a href="/schedule" className="text-gray-600 hover:text-gray-900 transition-colors">Schedule</a>
              <a href="/reports" className="text-gray-600 hover:text-gray-900 transition-colors">Reports</a>
            </nav>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Dr. {profile?.profile?.lastName}</p>
                  <p className="text-xs text-gray-500">{profile?.profile?.specialization || "Specialist"}</p>
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
            Good morning, Dr. {profile?.profile?.lastName || "Doctor"}! 🩺
          </h1>
          <p className="text-gray-600 mt-1">You have {upcomingToday.length} appointments remaining today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-emerald-600 mt-1">{stat.change}</p>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">Today&apos;s Appointments</CardTitle>
                  <CardDescription className="text-gray-500">{today.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => router.push("/schedule")}>View Schedule</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingAppointments ? (
                <div className="text-center py-8 text-gray-500">Loading appointments...</div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No appointments scheduled for today</div>
              ) : (
                todayAppointments.map((apt) => (
                  <div key={apt.id} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${apt.status === "CONFIRMED"
                    ? "bg-emerald-50 border border-emerald-200"
                    : apt.status === "COMPLETED"
                      ? "bg-gray-50"
                      : "bg-gray-50 hover:bg-gray-100"
                    }`}>
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {apt.patient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{apt.patient.name}</p>
                      </div>
                      <p className="text-sm text-gray-500">{apt.reason || "Consultation"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{apt.time}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${apt.status === "COMPLETED"
                      ? "bg-gray-200 text-gray-600"
                      : apt.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                      }`}>
                      {apt.status === "CONFIRMED" ? "Confirmed" : apt.status === "COMPLETED" ? "Done" : "Pending"}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">Recent Patients</CardTitle>
                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => router.push("/patients")}>View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPatients ? (
                <div className="text-center py-8 text-gray-500">Loading patients...</div>
              ) : recentPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No patients yet</div>
              ) : (
                recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                      <p className="text-xs text-gray-500">{patient.email}</p>
                    </div>
                  </div>
                ))
              )}

              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={() => router.push("/patients")}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                View All Patients
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Profile Card */}
        <Card className="mt-6 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Dr. {profile?.profile?.firstName} {profile?.profile?.lastName}</h3>
                <p className="text-emerald-600">{profile?.profile?.specialization || "Specialist"}</p>
                <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile?.profile?.licenseNumber && (
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">License: {profile?.profile?.licenseNumber}</span>
                  )}
                  {profile?.profile?.experience && (
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">{profile?.profile?.experience} Years Exp.</span>
                  )}
                  <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">Verified ✓</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push("/profile")}>
                  Edit Profile
                </Button>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={() => router.push("/schedule")}>
                  Manage Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
