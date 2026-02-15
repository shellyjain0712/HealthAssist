"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const isDoctor = session?.user?.role === "DOCTOR"

  // Doctor metrics
  const doctorMetrics = {
    totalPatients: 156,
    newPatients: 12,
    consultations: 89,
    revenue: 245000,
    avgConsultTime: 18,
    patientSatisfaction: 4.8,
  }

  // Patient metrics
  const patientMetrics = {
    appointments: 8,
    medications: 3,
    labTests: 5,
    healthScore: 85,
    weight: [72, 71.5, 71, 70.8, 70.5, 70.2],
    bloodPressure: [120, 118, 122, 119, 117, 118]
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading reports...</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">Reports & Analytics</span>
                <span className="text-xs text-emerald-600 block">{isDoctor ? "Practice Insights" : "Health Insights"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(["week", "month", "quarter", "year"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${timeRange === range ? "bg-white shadow text-gray-900" : "text-gray-600"
                      }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <Button variant="outline" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isDoctor ? (
          // Doctor Reports
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{doctorMetrics.totalPatients}</p>
                  <p className="text-sm text-gray-600">Total Patients</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">+{doctorMetrics.newPatients}</p>
                  <p className="text-sm text-gray-600">New Patients</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{doctorMetrics.consultations}</p>
                  <p className="text-sm text-gray-600">Consultations</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">₹{doctorMetrics.revenue.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{doctorMetrics.avgConsultTime}m</p>
                  <p className="text-sm text-gray-600">Avg Consult Time</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{doctorMetrics.patientSatisfaction}⭐</p>
                  <p className="text-sm text-gray-600">Satisfaction</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {[65, 72, 80, 75, 85, 92].map((height, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all hover:from-emerald-600 hover:to-teal-500"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-gray-500 mt-2">
                          {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Patient Growth */}
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Patient Growth</CardTitle>
                  <CardDescription>New vs returning patients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {[
                      { new: 8, returning: 25 },
                      { new: 12, returning: 28 },
                      { new: 10, returning: 32 },
                      { new: 15, returning: 30 },
                      { new: 11, returning: 35 },
                      { new: 14, returning: 38 },
                    ].map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col gap-1" style={{ height: "80%" }}>
                          <div
                            className="w-full bg-blue-400 rounded-t-lg"
                            style={{ height: `${(data.new / 50) * 100}%` }}
                          />
                          <div
                            className="w-full bg-emerald-400 rounded-b-lg"
                            style={{ height: `${(data.returning / 50) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-2">
                          {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded" />
                      <span className="text-sm text-gray-600">New</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded" />
                      <span className="text-sm text-gray-600">Returning</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Consultation Types & Demographics */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Consultation Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: "Follow-up", count: 45, color: "bg-emerald-500" },
                      { type: "New Patient", count: 28, color: "bg-blue-500" },
                      { type: "Routine Check-up", count: 22, color: "bg-purple-500" },
                      { type: "Emergency", count: 8, color: "bg-red-500" },
                      { type: "Telemedicine", count: 15, color: "bg-yellow-500" },
                    ].map((item) => (
                      <div key={item.type} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${item.color}`} />
                        <span className="flex-1 text-gray-700">{item.type}</span>
                        <span className="font-semibold text-gray-900">{item.count}</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${(item.count / 45) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Top Conditions Treated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { condition: "Hypertension", count: 32, trend: "+5%" },
                      { condition: "Type 2 Diabetes", count: 28, trend: "+2%" },
                      { condition: "Respiratory Infections", count: 24, trend: "-8%" },
                      { condition: "Anxiety/Depression", count: 18, trend: "+12%" },
                      { condition: "Musculoskeletal Pain", count: 15, trend: "+3%" },
                    ].map((item) => (
                      <div key={item.condition} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{item.condition}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{item.count}</span>
                          <span className={`text-sm ${item.trend.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>
                            {item.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          // Patient Reports
          <>
            {/* Health Overview */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-2 relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="url(#healthGradient)"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${85 * 1.76} 176`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-emerald-600">
                      {patientMetrics.healthScore}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Health Score</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{patientMetrics.appointments}</p>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-xs text-emerald-600 mt-1">This {timeRange}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{patientMetrics.medications}</p>
                  <p className="text-sm text-gray-600">Active Medications</p>
                  <p className="text-xs text-gray-400 mt-1">All on schedule</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-cyan-600">{patientMetrics.labTests}</p>
                  <p className="text-sm text-gray-600">Lab Tests</p>
                  <p className="text-xs text-emerald-600 mt-1">All normal</p>
                </CardContent>
              </Card>
            </div>

            {/* Health Trends */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Weight Trend</CardTitle>
                  <CardDescription>Last 6 months (kg)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end justify-between gap-4">
                    {patientMetrics.weight.map((weight, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                          style={{ height: `${((weight - 68) / 6) * 100}%` }}
                        />
                        <span className="text-xs font-medium text-gray-700 mt-2">{weight}</span>
                        <span className="text-xs text-gray-500">
                          {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-700">
                      <span className="font-semibold">-1.8 kg</span> over 6 months. Great progress! 🎉
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Blood Pressure Trend</CardTitle>
                  <CardDescription>Systolic (mmHg)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end justify-between gap-4">
                    {patientMetrics.bloodPressure.map((bp, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full rounded-t-lg transition-all ${bp > 120 ? "bg-gradient-to-t from-yellow-500 to-yellow-400" : "bg-gradient-to-t from-emerald-500 to-emerald-400"
                            }`}
                          style={{ height: `${((bp - 100) / 40) * 100}%` }}
                        />
                        <span className="text-xs font-medium text-gray-700 mt-2">{bp}</span>
                        <span className="text-xs text-gray-500">
                          {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Average: <span className="font-semibold">119 mmHg</span> - Within normal range
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity & Goals */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Health Goals Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { goal: "Daily Steps (10,000)", progress: 85, color: "bg-emerald-500" },
                      { goal: "Water Intake (8 glasses)", progress: 100, color: "bg-blue-500" },
                      { goal: "Sleep (8 hours)", progress: 75, color: "bg-purple-500" },
                      { goal: "Medication Adherence", progress: 95, color: "bg-cyan-500" },
                    ].map((item) => (
                      <div key={item.goal}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-700">{item.goal}</span>
                          <span className="text-sm font-medium text-gray-900">{item.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: "Blood test completed", date: "Dec 18", icon: "🧪", type: "test" },
                      { action: "Medication refilled", date: "Dec 15", icon: "💊", type: "med" },
                      { action: "Virtual consultation", date: "Dec 12", icon: "📹", type: "consult" },
                      { action: "Weight logged", date: "Dec 10", icon: "⚖️", type: "log" },
                      { action: "Prescription uploaded", date: "Dec 8", icon: "📄", type: "doc" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.action}</p>
                          <p className="text-xs text-gray-500">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
