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

interface Prescription {
  id: string
  status: string
}

export default function PatientDashboard({ profile, onSignOut }: PatientDashboardProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [aptRes, recRes, rxRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/records"),
        fetch("/api/prescriptions")
      ])
      const aptData = await aptRes.json()
      const recData = await recRes.json()
      const rxData = await rxRes.json()
      if (aptRes.ok) setAppointments(aptData.appointments || [])
      if (recRes.ok) setRecords(recData.records || [])
      if (rxRes.ok) setPrescriptions(rxData.prescriptions || [])
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
    return aptDate >= today && apt.status !== "CANCELLED"
  }).slice(0, 3)

  const testReports = records.filter(r => r.category === "LAB_RESULT" || r.category === "TEST_REPORT")
  const activePrescriptions = prescriptions.filter(p => p.status === "ACTIVE")

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
            <a href="/records" className="text-gray-600 hover:text-gray-900">Records</a>
            <a href="/doctors" className="text-gray-600 hover:text-gray-900">Doctors</a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.profile?.firstName} {profile?.profile?.lastName}</p>
                <p className="text-xs text-gray-500">Patient</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onSignOut} className="text-sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.profile?.firstName || "Patient"}! 👋
          </h1>
          <p className="text-gray-500">Here&apos;s your health overview for today</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Info</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Total Records</p>
              <p className="text-3xl font-bold text-gray-900">{records.length}</p>
            </CardContent>
          </Card>

          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Test Reports</p>
              <p className="text-3xl font-bold text-gray-900">{testReports.length}</p>
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
              <p className="text-sm text-gray-500 mt-3">Prescriptions</p>
              <p className="text-3xl font-bold text-gray-900">{activePrescriptions.length}</p>
            </CardContent>
          </Card>

          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={() => router.push("/chat")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">AI Symptom Checker</p>
              <p className="text-xs text-gray-500 mt-0.5">Get AI-powered health insights</p>
            </button>

            <button
              onClick={() => router.push("/appointments/book")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Book Appointment</p>
              <p className="text-xs text-gray-500 mt-0.5">Schedule a visit with a doctor</p>
            </button>

            <button
              onClick={() => router.push("/records")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">My Records</p>
              <p className="text-xs text-gray-500 mt-0.5">View your medical history</p>
            </button>

            <button
              onClick={() => router.push("/lab-results")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Test Reports</p>
              <p className="text-xs text-gray-500 mt-0.5">Upload & view test results</p>
            </button>

            <button
              onClick={() => router.push("/doctors")}
              className="p-5 bg-white border rounded-xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Find Doctors</p>
              <p className="text-xs text-gray-500 mt-0.5">Browse available specialists</p>
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card className="border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
                <Button variant="link" size="sm" className="text-emerald-600 p-0 h-auto" onClick={() => router.push("/appointments")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500 py-6 text-center">Loading appointments...</p>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No upcoming appointments</p>
                  <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => router.push("/appointments/book")}>
                    Book Now
                  </Button>
                </div>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {apt.doctor.name.split(" ")[0]?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{apt.doctor.name}</p>
                      <p className="text-sm text-gray-500">{apt.doctor.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatDate(apt.date)}</p>
                      <p className="text-xs text-gray-500">{formatTime(apt.time)}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(apt.status)}`}>
                      {apt.status.toLowerCase()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Your Profile */}
          <Card className="border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-lg font-semibold">Your Profile</CardTitle>
                <p className="text-sm text-gray-500">Personal and medical information</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Card */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-semibold">
                    {profile?.profile?.firstName?.[0]}{profile?.profile?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{profile?.profile?.firstName} {profile?.profile?.lastName}</p>
                    <p className="text-white/80 text-sm">{profile?.email}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Blood Group</p>
                  <p className="text-base font-medium text-gray-900 mt-1">{profile?.profile?.bloodGroup || "Not set"}</p>
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
        </div>
      </main>
    </div>
  )
}
