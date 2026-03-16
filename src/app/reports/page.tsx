"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface DoctorAnalytics {
  metrics: {
    totalPatients: number
    newPatients: number
    consultations: number
    revenue: number
    avgConsultTime: number
    patientSatisfaction: number
  }
  charts: {
    monthlyRevenue: { month: string; revenue: number }[]
    patientGrowth: { month: string; new: number; returning: number }[]
  }
}

interface PatientAnalytics {
  metrics: {
    appointments: number
    medications: number
    labTests: number
    healthScore: number
  }
  trends: {
    weight: number[]
    bloodPressure: number[]
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month")
  const [analytics, setAnalytics] = useState<DoctorAnalytics | PatientAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const isDoctor = session?.user?.role === "DOCTOR"

  // Fallback metrics
  const doctorMetrics = (analytics as DoctorAnalytics)?.metrics || {
    totalPatients: 156,
    newPatients: 12,
    consultations: 89,
    revenue: 245000,
    avgConsultTime: 18,
    patientSatisfaction: 4.8,
  }

  const patientMetrics = (analytics as PatientAnalytics)?.metrics || {
    appointments: 8,
    medications: 3,
    labTests: 5,
    healthScore: 85,
  }

  const doctorCharts = (analytics as DoctorAnalytics)?.charts || {
    monthlyRevenue: Array(6).fill(0).map((_, i) => ({
      month: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
      revenue: 0,
    })),
    patientGrowth: Array(6).fill(0).map((_, i) => ({
      month: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
      new: 0,
      returning: 0,
    })),
  }

  const patientTrends = (analytics as PatientAnalytics)?.trends || {
    weight: [72, 71.5, 71, 70.8, 70.5, 70.2],
    bloodPressure: [120, 118, 122, 119, 117, 118],
  }

  const handleExport = () => {
    if (!analytics) {
      alert("No data to export yet")
      return
    }

    const timestamp = new Date().toLocaleDateString('en-IN')
    let csvContent = "data:text/csv;charset=utf-8,"

    if (isDoctor) {
      const doctorData = analytics as DoctorAnalytics
      csvContent += `Reports & Analytics - Doctor Dashboard\n`
      csvContent += `Exported: ${timestamp}\n`
      csvContent += `Time Range: ${timeRange}\n\n`

      // Metrics
      csvContent += `Key Metrics\n`
      csvContent += `Total Patients,${doctorData.metrics.totalPatients}\n`
      csvContent += `New Patients,${doctorData.metrics.newPatients}\n`
      csvContent += `Consultations,${doctorData.metrics.consultations}\n`
      csvContent += `Revenue (₹),${doctorData.metrics.revenue}\n`
      csvContent += `Avg Consultation Time (mins),${doctorData.metrics.avgConsultTime}\n`
      csvContent += `Patient Satisfaction,${doctorData.metrics.patientSatisfaction}\n\n`

      // Monthly Revenue
      csvContent += `Monthly Revenue Trend\n`
      csvContent += `Month,Revenue (₹)\n`
      doctorData.charts.monthlyRevenue.forEach(data => {
        csvContent += `${data.month},${data.revenue}\n`
      })
      csvContent += `\n`

      // Patient Growth
      csvContent += `Patient Growth (Monthly)\n`
      csvContent += `Month,New Patients,Returning Patients\n`
      doctorData.charts.patientGrowth.forEach(data => {
        csvContent += `${data.month},${data.new},${data.returning}\n`
      })
    } else {
      const patientData = analytics as PatientAnalytics
      csvContent += `Reports & Analytics - Health Dashboard\n`
      csvContent += `Exported: ${timestamp}\n`
      csvContent += `Time Range: ${timeRange}\n\n`

      // Metrics
      csvContent += `Health Metrics\n`
      csvContent += `Appointments,${patientData.metrics.appointments}\n`
      csvContent += `Active Medications,${patientData.metrics.medications}\n`
      csvContent += `Lab Tests,${patientData.metrics.labTests}\n`
      csvContent += `Health Score,${patientData.metrics.healthScore}\n\n`

      // Weight Trend
      csvContent += `Weight Trend (kg)\n`
      csvContent += `Month,Weight\n`
      const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      patientData.trends.weight.forEach((weight, index) => {
        csvContent += `${months[index]},${weight}\n`
      })
      csvContent += `\n`

      // Blood Pressure Trend
      csvContent += `Blood Pressure Trend (mmHg - Systolic)\n`
      csvContent += `Month,BP\n`
      patientData.trends.bloodPressure.forEach((bp, index) => {
        csvContent += `${months[index]},${bp}\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `analytics_${timeRange}_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchAnalytics()
    }
  }, [session, timeRange])

  if (status === "loading" || loading) {
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
              <Button variant="outline" className="gap-2" onClick={handleExport}>
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
                  <p className="text-3xl font-bold text-yellow-600">{doctorMetrics.patientSatisfaction}</p>
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
                    {doctorCharts.monthlyRevenue.map((data, index) => {
                      const maxRevenue = Math.max(...doctorCharts.monthlyRevenue.map(d => d.revenue), 100)
                      const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 5
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all hover:from-emerald-600 hover:to-teal-500"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`₹${data.revenue.toLocaleString('en-IN')}`}
                          />
                          <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                          <span className="text-xs font-medium text-gray-600 mt-0.5">
                            ₹{(data.revenue / 1000).toFixed(0)}K
                          </span>
                        </div>
                      )
                    })}
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
                    {doctorCharts.patientGrowth.map((data, index) => {
                      const maxPatients = Math.max(...doctorCharts.patientGrowth.flatMap(d => [d.new, d.returning]), 10)
                      const newHeight = maxPatients > 0 ? (data.new / maxPatients) * 100 : 5
                      const returningHeight = maxPatients > 0 ? (data.returning / maxPatients) * 100 : 5
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col gap-1" style={{ height: "80%" }}>
                            <div
                              className="w-full bg-blue-400 rounded-t-lg transition-all hover:bg-blue-500"
                              style={{ height: `${Math.max(newHeight, 3)}%` }}
                              title={`New: ${data.new}`}
                            />
                            <div
                              className="w-full bg-emerald-400 rounded-b-lg transition-all hover:bg-emerald-500"
                              style={{ height: `${Math.max(returningHeight, 3)}%` }}
                              title={`Returning: ${data.returning}`}
                            />
                          </div>
                          <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                          <span className="text-xs font-medium text-gray-600 mt-0.5">
                            {data.new + data.returning}
                          </span>
                        </div>
                      )
                    })}
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
                      { action: "Blood test completed", date: "Dec 18", type: "test" },
                      { action: "Medication refilled", date: "Dec 15", type: "med" },
                      { action: "Virtual consultation", date: "Dec 12", type: "consult" },
                      { action: "Weight logged", date: "Dec 10", type: "log" },
                      { action: "Prescription uploaded", date: "Dec 8",type: "doc" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      
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
                    {patientTrends.weight.map((weight, index) => {
                      const minWeight = Math.min(...patientTrends.weight);
                      const maxWeight = Math.max(...patientTrends.weight);
                      const range = maxWeight - minWeight || 1;
                      const height = ((weight - minWeight) / range) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                            style={{ height: `${Math.max(height, 10)}%` }}
                          />
                          <span className="text-xs font-medium text-gray-700 mt-2">{weight}</span>
                          <span className="text-xs text-gray-500">
                            {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-700">
                      <span className="font-semibold">{(patientTrends.weight[0] - patientTrends.weight[patientTrends.weight.length - 1]).toFixed(1)} kg</span> change over 6 months. {patientTrends.weight[patientTrends.weight.length - 1] < patientTrends.weight[0] ? "Great progress! 🎉" : "Keep going! 💪"}
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
                    {patientTrends.bloodPressure.map((bp, index) => {
                      const minBP = Math.min(...patientTrends.bloodPressure);
                      const maxBP = Math.max(...patientTrends.bloodPressure);
                      const range = maxBP - minBP || 1;
                      const height = ((bp - minBP) / range) * 100;
                      const isElevated = bp > 120;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className={`w-full rounded-t-lg transition-all ${isElevated ? "bg-gradient-to-t from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500" : "bg-gradient-to-t from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500"}`}
                            style={{ height: `${Math.max(height, 10)}%` }}
                          />
                          <span className="text-xs font-medium text-gray-700 mt-2">{bp}</span>
                          <span className="text-xs text-gray-500">
                            {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Average: <span className="font-semibold">{(patientTrends.bloodPressure.reduce((a, b) => a + b) / patientTrends.bloodPressure.length).toFixed(0)} mmHg</span> - {Math.max(...patientTrends.bloodPressure) > 120 ? "Some readings elevated" : "Within normal range"}
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
