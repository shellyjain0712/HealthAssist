"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface WorkingHours {
  day: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isWorkingDay: boolean
}

interface BlockedSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  reason?: string
}

export default function DoctorSchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"hours" | "blocked">("hours")

  // Form states for blocked slots
  const [blockDate, setBlockDate] = useState("")
  const [blockStartTime, setBlockStartTime] = useState("09:00")
  const [blockEndTime, setBlockEndTime] = useState("17:00")
  const [blockReason, setBlockReason] = useState("")
  const [blockingSlot, setBlockingSlot] = useState(false)

  // Form states for working hours
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editStartTime, setEditStartTime] = useState("09:00")
  const [editEndTime, setEditEndTime] = useState("17:00")
  const [editIsWorkingDay, setEditIsWorkingDay] = useState(true)
  const [savingHours, setSavingHours] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user?.role !== "DOCTOR") {
      router.push("/dashboard")
    } else {
      fetchSchedule()
    }
  }, [status, session, router])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const [hoursRes, blockedRes] = await Promise.all([
        fetch("/api/schedule/working-hours"),
        fetch("/api/schedule/block"),
      ])

      if (hoursRes.ok) {
        const data = await hoursRes.json()
        setWorkingHours(data.workingHours || [])
      }

      if (blockedRes.ok) {
        const data = await blockedRes.json()
        setBlockedSlots(data.blockedSlots || [])
      }
    } catch (err) {
      console.error("Failed to fetch schedule:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleBlockSlot = async () => {
    if (!blockDate || !blockStartTime || !blockEndTime) {
      alert("Please fill in all required fields")
      return
    }

    if (blockStartTime >= blockEndTime) {
      alert("Start time must be before end time")
      return
    }

    try {
      setBlockingSlot(true)
      const response = await fetch("/api/schedule/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: blockDate,
          startTime: blockStartTime,
          endTime: blockEndTime,
          reason: blockReason || "Not available",
        }),
      })

      if (response.ok) {
        alert("Time slot blocked successfully!")
        setBlockDate("")
        setBlockStartTime("09:00")
        setBlockEndTime("17:00")
        setBlockReason("")
        fetchSchedule()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to block slot")
      }
    } catch (err) {
      console.error("Error blocking slot:", err)
      alert("Failed to block slot")
    } finally {
      setBlockingSlot(false)
    }
  }

  const handleSaveWorkingHours = async (dayOfWeek: number) => {
    if (editStartTime >= editEndTime) {
      alert("Start time must be before end time")
      return
    }

    try {
      setSavingHours(true)
      const response = await fetch("/api/schedule/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: dayOfWeek,
          startTime: editStartTime,
          endTime: editEndTime,
          isWorkingDay: editIsWorkingDay,
        }),
      })

      if (response.ok) {
        alert("Working hours updated!")
        setEditingDay(null)
        fetchSchedule()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update working hours")
      }
    } catch (err) {
      console.error("Error saving working hours:", err)
      alert("Failed to save working hours")
    } finally {
      setSavingHours(false)
    }
  }

  const handleDeleteBlockedSlot = async (blockId: string) => {
    if (!confirm("Are you sure you want to remove this blocked slot?")) return

    try {
      const response = await fetch(`/api/schedule/block?blockId=${blockId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Blocked slot removed!")
        fetchSchedule()
      } else {
        alert("Failed to remove blocked slot")
      }
    } catch (err) {
      console.error("Error deleting blocked slot:", err)
      alert("Failed to remove blocked slot")
    }
  }

  const startEditing = (day: WorkingHours) => {
    setEditingDay(day.dayOfWeek)
    setEditStartTime(day.startTime)
    setEditEndTime(day.endTime)
    setEditIsWorkingDay(day.isWorkingDay)
  }

  if (status === "loading" || (status === "authenticated" && !workingHours.length && !blockedSlots.length && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 mb-8 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Schedule</h1>
            <p className="text-gray-600 mt-1">Set your working hours and block unavailable times</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab("hours")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${tab === "hours"
              ? "bg-emerald-600 text-white shadow-lg"
              : "bg-white/70 text-gray-700 hover:bg-white border border-gray-200"
              }`}
          >
            Working Hours
          </button>
          <button
            onClick={() => setTab("blocked")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${tab === "blocked"
              ? "bg-emerald-600 text-white shadow-lg"
              : "bg-white/70 text-gray-700 hover:bg-white border border-gray-200"
              }`}
          >
            Blocked Times
          </button>
        </div>

        {/* Working Hours Tab */}
        {tab === "hours" && (
          <div className="space-y-4">
            {workingHours.map((day) => (
              <Card key={day.dayOfWeek} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  {editingDay === day.dayOfWeek ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-lg">{day.day}</h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editIsWorkingDay}
                            onChange={(e) => setEditIsWorkingDay(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label className="text-sm text-gray-700">Working day</label>
                        </div>
                      </div>

                      {editIsWorkingDay && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Start Time
                            </label>
                            <Input
                              type="time"
                              value={editStartTime}
                              onChange={(e) => setEditStartTime(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              End Time
                            </label>
                            <Input
                              type="time"
                              value={editEndTime}
                              onChange={(e) => setEditEndTime(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleSaveWorkingHours(day.dayOfWeek)}
                          disabled={savingHours}
                        >
                          {savingHours ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingDay(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{day.day}</h3>
                        {day.isWorkingDay ? (
                          <p className="text-emerald-600 font-medium">
                            {day.startTime} - {day.endTime}
                          </p>
                        ) : (
                          <p className="text-red-600 font-medium">Not working</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => startEditing(day)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Blocked Times Tab */}
        {tab === "blocked" && (
          <div className="space-y-6">
            {/* Block Slot Form */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Block a Time Slot</CardTitle>
                <CardDescription>Prevent patients from booking during this time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Leave, Emergency, Personal"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Button
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={handleBlockSlot}
                  disabled={blockingSlot}
                >
                  {blockingSlot ? "Blocking..." : "Block Time Slot"}
                </Button>
              </CardContent>
            </Card>

            {/* Blocked Slots List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Blocked Slots</h3>
              {blockedSlots.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-600">No blocked slots yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {blockedSlots.map((slot) => (
                    <Card key={slot.id} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {new Date(slot.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </h4>
                          <p className="text-gray-600 mt-1">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          {slot.reason && (
                            <p className="text-sm text-gray-500 mt-1">{slot.reason}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteBlockedSlot(slot.id)}
                        >
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
