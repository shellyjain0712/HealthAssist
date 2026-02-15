"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface Appointment {
  id: string
  date: string
  time: string
  reason: string
  notes: string | null
  status: string
  fee: number
  patient: {
    id: string
    name: string
    email: string
    phone: string
  }
  doctor: {
    id: string
    name: string
    specialty: string
    hospital: string
    phone: string
  }
}

export default function SchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week">("day")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/appointments")
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id)
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        fetchAppointments()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update appointment")
      }
    } catch (error) {
      console.error("Update error:", error)
      alert("Failed to update appointment")
    } finally {
      setUpdatingId(null)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchAppointments()
    }
  }, [session, fetchAppointments])

  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const currentMonth = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i)
    }

    return days
  }

  const calendarDays = getDaysInMonth(selectedDate)

  // Get appointments for selected date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0]
      return aptDate === dateStr
    })
  }

  // Get appointment for specific time slot on selected date
  const getAppointmentForTime = (time: string) => {
    const dateAppointments = getAppointmentsForDate(selectedDate)
    return dateAppointments.find(apt => apt.time === time)
  }

  // Check if a day has appointments
  const dayHasAppointments = (day: number) => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
    return getAppointmentsForDate(date).length > 0
  }

  // Get counts for today's summary
  const todayAppointments = getAppointmentsForDate(selectedDate)
  const confirmedCount = todayAppointments.filter(a => a.status === "confirmed").length
  const pendingCount = todayAppointments.filter(a => a.status === "pending").length

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">My Schedule</span>
                <span className="text-xs text-emerald-600 block">Doctor Portal</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "day" ? "bg-white shadow text-gray-900" : "text-gray-600"}`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "week" ? "bg-white shadow text-gray-900" : "text-gray-600"}`}
                >
                  Week
                </button>
              </div>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Block Time
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{currentMonth}</CardTitle>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    disabled={day === null}
                    onClick={() => day && setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all relative ${day === null ? "" :
                      day === selectedDate.getDate()
                        ? "bg-emerald-600 text-white"
                        : day === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear()
                          ? "bg-emerald-100 text-emerald-700"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    {day}
                    {day && dayHasAppointments(day) && (
                      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${day === selectedDate.getDate() ? "bg-white" : "bg-emerald-500"
                        }`} />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <h4 className="font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Summary
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-emerald-600">{todayAppointments.length}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{confirmedCount}</p>
                    <p className="text-xs text-gray-600">Confirmed</p>
                  </div>
                </div>
                {pendingCount > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-yellow-600">{pendingCount} Pending</p>
                    <p className="text-xs text-gray-600">Awaiting confirmation</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Day Schedule */}
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </CardTitle>
                  <CardDescription>{todayAppointments.length} appointments scheduled</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedDate(new Date())}>Today</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeSlots.map((time) => {
                  const appointment = getAppointmentForTime(time)
                  return (
                    <div key={time} className="flex gap-4 items-start">
                      <div className="w-20 text-sm text-gray-500 pt-2 flex-shrink-0">{time}</div>
                      {appointment ? (
                        <div className={`flex-1 p-4 rounded-xl border-l-4 ${appointment.status === "confirmed"
                          ? "bg-emerald-50 border-emerald-500"
                          : appointment.status === "completed"
                            ? "bg-blue-50 border-blue-500"
                            : appointment.status === "cancelled"
                              ? "bg-red-50 border-red-300"
                              : "bg-yellow-50 border-yellow-500"
                          }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{appointment.patient.name}</h4>
                              <p className="text-sm text-gray-600">{appointment.reason || "Consultation"}</p>
                              {appointment.patient.phone && (
                                <p className="text-xs text-gray-500 mt-1">📞 {appointment.patient.phone}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${appointment.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-700"
                              : appointment.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : appointment.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}>
                              {appointment.status}
                            </span>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">&quot;{appointment.notes}&quot;</p>
                          )}
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs">View Patient</Button>
                            {(appointment.status === "confirmed" || appointment.status === "pending") && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  onClick={() => updateAppointmentStatus(appointment.id, "COMPLETED")}
                                  disabled={updatingId === appointment.id}
                                >
                                  {updatingId === appointment.id ? "..." : "Complete"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-red-50 text-red-700 hover:bg-red-100"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to cancel this appointment?")) {
                                      updateAppointmentStatus(appointment.id, "CANCELLED")
                                    }
                                  }}
                                  disabled={updatingId === appointment.id}
                                >
                                  {updatingId === appointment.id ? "..." : "Cancel"}
                                </Button>
                              </>
                            )}
                            {appointment.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                                onClick={() => updateAppointmentStatus(appointment.id, "CONFIRMED")}
                                disabled={updatingId === appointment.id}
                              >
                                {updatingId === appointment.id ? "..." : "Confirm"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 p-3 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400 hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all">
                          Available
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Appointments List */}
        {appointments.length > 0 && (
          <Card className="mt-6 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">All Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled appointments across all dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments
                  .filter(apt => new Date(apt.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 10)
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedDate(new Date(apt.date))
                      }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${apt.status === "confirmed" ? "bg-emerald-100" :
                        apt.status === "pending" ? "bg-yellow-100" :
                          apt.status === "completed" ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                        <svg className={`w-6 h-6 ${apt.status === "confirmed" ? "text-emerald-600" :
                          apt.status === "pending" ? "text-yellow-600" :
                            apt.status === "completed" ? "text-blue-600" : "text-gray-600"
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{apt.patient.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${apt.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            apt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              apt.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                            }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {apt.time}
                        </p>
                        <p className="text-xs text-gray-400">{apt.reason || "Consultation"}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Working Hours Settings */}
        <Card className="mt-6 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Working Hours</CardTitle>
            <CardDescription>Set your availability for appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-7 gap-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                <div key={day} className={`p-4 rounded-xl text-center ${index < 5 ? "bg-emerald-50" : "bg-gray-50"}`}>
                  <p className="font-medium text-gray-900">{day.slice(0, 3)}</p>
                  {index < 5 ? (
                    <p className="text-sm text-emerald-600 mt-1">9AM - 5PM</p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">Off</p>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4">Edit Working Hours</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
