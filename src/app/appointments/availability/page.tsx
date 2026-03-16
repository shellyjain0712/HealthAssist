"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

interface TimeSlot {
  time: string
  isAvailable: boolean
  reason?: string
}

interface DailySchedule {
  date: string
  dayOfWeek: string
  slots: TimeSlot[]
  isWorkingDay: boolean
}

interface DoctorInfo {
  id: string
  name: string
  specialty: string
  fee: number
}

export default function DoctorAvailabilityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const doctorId = searchParams.get("doctor")
  const doctorName = searchParams.get("name")

  const [schedule, setSchedule] = useState<DailySchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")

  useEffect(() => {
    if (!doctorId) {
      router.push("/appointments/book")
      return
    }
    fetchAvailability()
  }, [doctorId, router])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/schedule/availability?doctorId=${doctorId}&daysAhead=30`
      )
      const data = await response.json()

      if (response.ok) {
        setSchedule(data.schedule)
        // Set default selected date to first available working day
        const firstWorkingDay = data.schedule.find(
          (d: DailySchedule) => d.isWorkingDay
        )
        if (firstWorkingDay) {
          setSelectedDate(firstWorkingDay.date)
        }
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err)
    } finally {
      setLoading(false)
    }
  }

  const selectedDateSchedule = schedule.find((s) => s.date === selectedDate)
  const availableSlots = selectedDateSchedule?.slots.filter(
    (s) => s.isAvailable
  ) || []

  const handleBookAppointment = () => {
    if (selectedTime && selectedDate) {
      router.push(
        `/appointments/book?doctor=${doctorId}&date=${selectedDate}&time=${selectedTime}`
      )
    }
  }

  const getStatusColor = (isAvailable: boolean, reason?: string) => {
    if (isAvailable) {
      return "bg-emerald-50 border-emerald-200 text-emerald-900"
    }
    if (reason?.includes("blocked")) {
      return "bg-red-50 border-red-200 text-red-900"
    }
    if (reason?.includes("Booked")) {
      return "bg-orange-50 border-orange-200 text-orange-900"
    }
    return "bg-gray-50 border-gray-200 text-gray-900"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 p-6 mb-8 sticky top-4 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Check Availability</h1>
            {doctorName && (
              <p className="text-gray-600 mt-1">Dr. {doctorName}</p>
            )}
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600">Loading availability...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Date Selection */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm sticky top-32">
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                  <CardDescription>Choose a date to see available times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {schedule.map((day) => (
                      <button
                        key={day.date}
                        onClick={() => setSelectedDate(day.date)}
                        disabled={!day.isWorkingDay}
                        className={`w-full p-3 rounded-lg text-left transition-all font-medium ${selectedDate === day.date
                            ? "bg-emerald-500 text-white ring-2 ring-emerald-600"
                            : !day.isWorkingDay
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200"
                          }`}
                      >
                        <div className="text-sm font-semibold">{day.dayOfWeek}</div>
                        <div className="text-xs mt-1">{day.date}</div>
                        {!day.isWorkingDay && (
                          <div className="text-xs mt-1">Not working</div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Slots */}
            <div className="lg:col-span-2">
              {selectedDateSchedule ? (
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Available Times</CardTitle>
                    <CardDescription>
                      {selectedDateSchedule.isWorkingDay
                        ? `${new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}`
                        : "Doctor is not working on this day"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedDateSchedule.isWorkingDay ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium">Doctor is not available</p>
                        <p className="text-gray-500 text-sm mt-1">
                          Please select another date
                        </p>
                      </div>
                    ) : selectedDateSchedule.slots.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium">No time slots available</p>
                        <p className="text-gray-500 text-sm mt-1">
                          Please try another date
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-8">
                          {selectedDateSchedule.slots.map((slot) => {
                            const statusColor = getStatusColor(
                              slot.isAvailable,
                              slot.reason
                            )
                            const isSelected =
                              selectedTime === slot.time && slot.isAvailable

                            return (
                              <button
                                key={slot.time}
                                onClick={() =>
                                  slot.isAvailable && setSelectedTime(slot.time)
                                }
                                disabled={!slot.isAvailable}
                                className={`p-4 rounded-xl border-2 transition-all font-semibold group ${isSelected
                                    ? "bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-400"
                                    : statusColor
                                  } ${slot.isAvailable
                                    ? "cursor-pointer hover:shadow-lg hover:-translate-y-1"
                                    : "cursor-not-allowed opacity-60"
                                  }`}
                              >
                                <div className="text-lg">{slot.time}</div>
                                {slot.reason && (
                                  <div className="text-xs mt-2 opacity-80">
                                    {slot.reason}
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {/* Legend */}
                        <div className="pt-6 border-t border-gray-200 space-y-2">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Legend:</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-100 border border-emerald-200 rounded"></div>
                            <span className="text-sm text-gray-600">Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-100 border border-orange-200 rounded"></div>
                            <span className="text-sm text-gray-600">Booked by another patient</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-100 border border-red-200 rounded"></div>
                            <span className="text-sm text-gray-600">Blocked by doctor</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded"></div>
                            <span className="text-sm text-gray-600">Outside working hours</span>
                          </div>
                        </div>

                        {selectedTime && (
                          <Button
                            className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 h-12 text-base"
                            onClick={handleBookAppointment}
                          >
                            Proceed to Book {selectedTime}
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <p className="text-gray-600">Select a date to view available times</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
