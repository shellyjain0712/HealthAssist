"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Session } from "next-auth"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface ExtendedSession extends Session {
  user: Session["user"] & {
    id: string
    role: string
  }
}

interface Appointment {
  id: string
  date: string
  time: string
  reason: string | null
  notes: string | null
  status: string
  fee: number
  doctor: {
    id: string
    name: string
    specialty: string
    hospital: string
    phone: string
  }
  patient: {
    id: string
    name: string
    email: string
    phone: string
  }
  createdAt: string
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: "authenticated" | "loading" | "unauthenticated" }
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/appointments")
      const data = await response.json()
      if (response.ok) {
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAppointments()
    }
  }, [status, fetchAppointments])

  const cancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return
    try {
      setCancelling(id)
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
      if (response.ok) {
        fetchAppointments()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to cancel")
      }
    } catch (error) {
      console.error("Cancel error:", error)
      alert("Failed to cancel appointment")
    } finally {
      setCancelling(null)
    }
  }

  // Filter appointments
  const now = new Date()
  const upcomingAppointments = appointments.filter(apt =>
    (apt.status === "pending" || apt.status === "confirmed") && new Date(apt.date) >= now
  )
  const pastAppointments = appointments.filter(apt =>
    apt.status === "completed" || (new Date(apt.date) < now && apt.status !== "cancelled")
  )
  const cancelledAppointments = appointments.filter(apt => apt.status === "cancelled")

  const filteredAppointments = activeTab === "upcoming"
    ? upcomingAppointments
    : activeTab === "past"
      ? pastAppointments
      : cancelledAppointments

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", year: "numeric"
    })
  }

  const getInitials = (name: string) => {
    const parts = name.replace("Dr. ", "").split(" ")
    return parts.map(p => p[0]).join("").toUpperCase()
  }

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">My Appointments</span>
            </div>

            <Button onClick={() => router.push("/appointments/book")} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Book Appointment
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "upcoming", label: "Upcoming", count: upcomingAppointments.length },
            { key: "past", label: "Past", count: pastAppointments.length },
            { key: "cancelled", label: "Cancelled", count: cancelledAppointments.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.key
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? "bg-white/20" : "bg-gray-100"
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <Card key={apt.id} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {session?.user?.role === "DOCTOR"
                      ? getInitials(apt.patient.name || "P")
                      : getInitials(apt.doctor.name)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {session?.user?.role === "DOCTOR" ? apt.patient.name : apt.doctor.name}
                        </h3>
                        <p className="text-gray-500">
                          {session?.user?.role === "DOCTOR" ? apt.patient.email : apt.doctor.specialty}
                        </p>
                        {session?.user?.role !== "DOCTOR" && apt.doctor.hospital && (
                          <p className="text-sm text-gray-400 mt-1">{apt.doctor.hospital}</p>
                        )}
                        {apt.reason && (
                          <p className="text-sm text-gray-500 mt-2"><span className="font-medium">Reason:</span> {apt.reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                          apt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            apt.status === "completed" ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-700"
                          }`}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                        <p className="text-lg font-bold text-emerald-600 mt-2">₹{apt.fee}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{formatDate(apt.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{apt.time}</span>
                      </div>
                    </div>

                    {activeTab === "upcoming" && (
                      <div className="flex gap-3 mt-4">
                        {session?.user?.role === "DOCTOR" && apt.status === "pending" && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-emerald-600 to-teal-600"
                            onClick={async () => {
                              const res = await fetch(`/api/appointments/${apt.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "CONFIRMED" }),
                              })
                              if (res.ok) fetchAppointments()
                            }}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={cancelling === apt.id}
                          onClick={() => cancelAppointment(apt.id)}
                        >
                          {cancelling === apt.id ? "Cancelling..." : "Cancel"}
                        </Button>
                        {apt.status === "confirmed" && (
                          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">Join Video Call</Button>
                        )}
                      </div>
                    )}

                    {activeTab === "past" && session?.user?.role !== "DOCTOR" && (
                      <div className="flex gap-3 mt-4">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-emerald-600 to-teal-600"
                          onClick={() => router.push(`/appointments/book?doctor=${apt.doctor.id}`)}
                        >
                          Book Again
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAppointments.length === 0 && (
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No {activeTab} appointments</h3>
                <p className="text-gray-500 mt-1">You don&apos;t have any {activeTab} appointments at the moment.</p>
                {activeTab === "upcoming" && (
                  <Button
                    className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600"
                    onClick={() => router.push("/appointments/book")}
                  >
                    Book an Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
