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

  // Get recent patients (last 5 unique patients from appointments)
  const recentPatients = patients.slice(0, 4)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const formatTime = (time: string) => {
    return time
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-emerald-100 text-emerald-700"
      case "completed": return "bg-gray-100 text-gray-600"
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "cancelled": return "bg-red-100 text-red-700"
      default: return "bg-blue-100 text-blue-700"
    }
  }

  const getStatusLabel = (status: string) => {
    return status.toLowerCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-lg">Smart Health</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="/dashboard" className="text-emerald-600 font-medium">Dashboard</a>
            <a href="/appointments" className="text-gray-600 hover:text-gray-900">Appointments</a>
            <a href="/patients" className="text-gray-600 hover:text-gray-900">Patients</a>
            <a href="/schedule" className="text-gray-600 hover:text-gray-900">Schedule</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">Dr. {profile?.profile?.firstName} {profile?.profile?.lastName}</p>
                <p className="text-xs text-gray-500">Doctor</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onSignOut} className="text-sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, Dr. {profile?.profile?.lastName || "Doctor"}! 🩺
          </h1>
          <p className="text-gray-500">You have {upcomingToday.length} appointments remaining today</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Info</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
            </CardContent>
          </Card>

          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Today&apos;s Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{todayAppointments.length}</p>
            </CardContent>
          </Card>

          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{appointments.filter(a => a.status === "PENDING").length}</p>
            </CardContent>
          </Card>

          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900">{completedToday.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={() => router.push("/patients")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Patient Records</p>
              <p className="text-xs text-gray-500 mt-0.5">Access medical histories</p>
            </button>

            <button
              onClick={() => router.push("/prescriptions/new")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Write Prescription</p>
              <p className="text-xs text-gray-500 mt-0.5">Create new prescriptions</p>
            </button>

            <button
              onClick={() => router.push("/schedule")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">My Schedule</p>
              <p className="text-xs text-gray-500 mt-0.5">Manage your calendar</p>
            </button>

            <button
              onClick={() => router.push("/lab-results")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Test Reports</p>
              <p className="text-xs text-gray-500 mt-0.5">Review patient reports</p>
            </button>

            <button
              onClick={() => router.push("/appointments")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Appointments</p>
              <p className="text-xs text-gray-500 mt-0.5">View all appointments</p>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <Card className="border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Today&apos;s Appointments</CardTitle>
                  <CardDescription className="text-sm text-gray-500">{today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</CardDescription>
                </div>
                <Button variant="link" size="sm" className="text-emerald-600 p-0 h-auto" onClick={() => router.push("/schedule")}>View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingAppointments ? (
                <p className="text-sm text-gray-500 py-6 text-center">Loading appointments...</p>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No appointments scheduled for today</p>
                </div>
              ) : (
                todayAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {apt.patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{apt.patient.name}</p>
                      <p className="text-sm text-gray-500 lowercase">{apt.reason || "consultation"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatDate(apt.date)}</p>
                      <p className="text-xs text-gray-500">{formatTime(apt.time)}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Patients</CardTitle>
                <Button variant="link" size="sm" className="text-emerald-600 p-0 h-auto" onClick={() => router.push("/patients")}>View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingPatients ? (
                <p className="text-sm text-gray-500 py-6 text-center">Loading patients...</p>
              ) : recentPatients.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No patients yet</p>
                </div>
              ) : (
                recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                      <p className="text-xs text-gray-500">{patient.email}</p>
                    </div>
                  </div>
                ))
              )}

              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => router.push("/patients")}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                View All Patients
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Profile Card */}
        <Card className="mt-6 border bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-lg font-semibold">Your Profile</CardTitle>
              <p className="text-sm text-gray-500">Professional information</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 text-white mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-semibold">
                  {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-lg">Dr. {profile?.profile?.firstName} {profile?.profile?.lastName}</p>
                  <p className="text-white/80 text-sm">{profile?.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Specialization</p>
                <p className="text-base font-medium text-gray-900 mt-1">{profile?.profile?.specialization || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="text-base font-medium text-gray-900 mt-1">{profile?.profile?.phone || "Not set"}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => router.push("/profile")}>
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
