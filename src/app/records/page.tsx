"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface HealthRecord {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  fileName: string | null
  fileUrl: string | null
  fileSize: string | null
  fileType: string | null
  diagnosis: string | null
  medications: string[] | null
  testResults: Record<string, string> | null
  notes: string | null
  recordDate: string
  expiryDate: string | null
  patient: {
    id: string
    name: string
  }
  doctor: {
    id: string
    name: string
    specialty: string
  } | null
  createdAt: string
}

export default function RecordsPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: "authenticated" | "loading" | "unauthenticated" }
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)

  // New record form state
  const [newRecord, setNewRecord] = useState({
    title: "",
    description: "",
    category: "lab",
    status: "normal",
    diagnosis: "",
    notes: "",
    recordDate: new Date().toISOString().split("T")[0],
  })

  const categories = [
    { id: "all", name: "All Records", icon: "📋" },
    { id: "labreport", name: "Lab Reports", icon: "🧪" },
    { id: "prescription", name: "Prescriptions", icon: "💊" },
    { id: "imaging", name: "Imaging", icon: "🩻" },
    { id: "vaccination", name: "Vaccinations", icon: "💉" },
    { id: "diagnosis", name: "Diagnosis", icon: "📝" },
    { id: "surgery", name: "Surgery", icon: "🏥" },
  ]

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeCategory !== "all") params.append("category", activeCategory)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/records?${params.toString()}`)
      const data = await response.json()
      if (response.ok) {
        setRecords(data.records)
      }
    } catch (error) {
      console.error("Failed to fetch records:", error)
    } finally {
      setLoading(false)
    }
  }, [activeCategory, searchQuery])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchRecords()
    }
  }, [status, fetchRecords])

  const handleUploadRecord = async () => {
    if (!newRecord.title || !newRecord.recordDate) {
      alert("Please fill in required fields")
      return
    }

    try {
      setUploading(true)
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRecord,
          patientId: session?.user?.role === "DOCTOR" ? undefined : session?.user?.id,
        }),
      })

      if (response.ok) {
        setShowUploadModal(false)
        setNewRecord({
          title: "",
          description: "",
          category: "lab",
          status: "normal",
          diagnosis: "",
          notes: "",
          recordDate: new Date().toISOString().split("T")[0],
        })
        fetchRecords()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create record")
      }
    } catch (error) {
      console.error("Error creating record:", error)
      alert("Failed to create record")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const response = await fetch(`/api/records/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchRecords()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete record")
      }
    } catch (error) {
      console.error("Error deleting record:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      labreport: "🧪",
      prescription: "💊",
      imaging: "🩻",
      vaccination: "💉",
      diagnosis: "📝",
      surgery: "🏥",
      consultation: "👨‍⚕️",
      other: "📋",
    }
    return icons[category] || "📋"
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      labreport: { bg: "bg-blue-100", text: "text-blue-600" },
      prescription: { bg: "bg-emerald-100", text: "text-emerald-600" },
      imaging: { bg: "bg-purple-100", text: "text-purple-600" },
      vaccination: { bg: "bg-orange-100", text: "text-orange-600" },
      diagnosis: { bg: "bg-pink-100", text: "text-pink-600" },
      surgery: { bg: "bg-red-100", text: "text-red-600" },
      consultation: { bg: "bg-teal-100", text: "text-teal-600" },
      other: { bg: "bg-gray-100", text: "text-gray-600" },
    }
    return colors[category] || colors.other
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      normal: "bg-emerald-100 text-emerald-700",
      abnormal: "bg-red-100 text-red-700",
      critical: "bg-red-200 text-red-800",
      pendingreview: "bg-yellow-100 text-yellow-700",
      active: "bg-blue-100 text-blue-700",
      completed: "bg-gray-100 text-gray-700",
      expired: "bg-gray-200 text-gray-500",
    }
    return styles[status] || "bg-gray-100 text-gray-700"
  }

  // Stats calculations
  const stats = {
    total: records.length,
    lab: records.filter((r) => r.category === "labreport").length,
    imaging: records.filter((r) => r.category === "imaging").length,
    prescription: records.filter((r) => r.category === "prescription").length,
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading records...</p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">Medical Records</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Button onClick={() => setShowUploadModal(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Record
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeCategory === cat.id
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
                }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.lab}</p>
              <p className="text-sm text-gray-500">Lab Reports</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.imaging}</p>
              <p className="text-sm text-gray-500">Imaging</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{stats.prescription}</p>
              <p className="text-sm text-gray-500">Prescriptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {records.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No records found</h3>
                <p className="text-gray-500 mt-1">Start by adding your first medical record</p>
                <Button onClick={() => setShowUploadModal(true)} className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                  Add Your First Record
                </Button>
              </CardContent>
            </Card>
          ) : (
            records.map((record) => {
              const categoryColors = getCategoryColor(record.category)
              return (
                <Card key={record.id} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${categoryColors.bg}`}>
                        {getCategoryIcon(record.category)}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{record.title}</h3>
                        <p className="text-sm text-gray-500">
                          {record.doctor ? record.doctor.name : "Self-uploaded"} • {formatDate(record.recordDate)}
                        </p>
                        {record.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">{record.description}</p>
                        )}
                        {record.diagnosis && (
                          <p className="text-sm text-emerald-600 mt-1">
                            <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                          </p>
                        )}
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace("review", " Review")}
                      </span>

                      {record.fileSize && (
                        <span className="text-sm text-gray-400">{record.fileSize}</span>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedRecord(record)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                        {record.fileUrl && (
                          <Button size="sm" variant="outline">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRecord(record.id)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg border-0 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Medical Record</h2>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Blood Test Report"
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={newRecord.category}
                      onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
                      className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                    >
                      <option value="lab">Lab Report</option>
                      <option value="prescription">Prescription</option>
                      <option value="imaging">Imaging</option>
                      <option value="vaccination">Vaccination</option>
                      <option value="diagnosis">Diagnosis</option>
                      <option value="surgery">Surgery</option>
                      <option value="consultation">Consultation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={newRecord.status}
                      onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                      className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="abnormal">Abnormal</option>
                      <option value="critical">Critical</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="recordDate">Date *</Label>
                  <Input
                    id="recordDate"
                    type="date"
                    value={newRecord.recordDate}
                    onChange={(e) => setNewRecord({ ...newRecord, recordDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="diagnosis">Diagnosis / Test Results</Label>
                  <Input
                    id="diagnosis"
                    placeholder="e.g., Normal blood sugar levels"
                    value={newRecord.diagnosis}
                    onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional details about this record..."
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Doctor's notes or recommendations..."
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowUploadModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleUploadRecord} disabled={uploading} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600">
                    {uploading ? "Saving..." : "Save Record"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getCategoryColor(selectedRecord.category).bg}`}>
                    {getCategoryIcon(selectedRecord.category)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedRecord.title}</h2>
                    <p className="text-sm text-gray-500">{formatDate(selectedRecord.recordDate)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedRecord.status)}`}>
                    {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Category: {selectedRecord.category.charAt(0).toUpperCase() + selectedRecord.category.slice(1)}
                  </span>
                </div>

                {selectedRecord.doctor && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Doctor</p>
                    <p className="font-medium text-gray-900">{selectedRecord.doctor.name}</p>
                    <p className="text-sm text-gray-500">{selectedRecord.doctor.specialty}</p>
                  </div>
                )}

                {selectedRecord.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-900">{selectedRecord.description}</p>
                  </div>
                )}

                {selectedRecord.diagnosis && (
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-emerald-600 mb-1">Diagnosis / Results</p>
                    <p className="font-medium text-emerald-800">{selectedRecord.diagnosis}</p>
                  </div>
                )}

                {selectedRecord.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-900">{selectedRecord.notes}</p>
                  </div>
                )}

                {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Medications</p>
                    <div className="space-y-2">
                      {selectedRecord.medications.map((med, i) => (
                        <div key={i} className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-medium text-blue-900">{med.name} - {med.dosage}</p>
                          <p className="text-sm text-blue-700">{med.frequency} for {med.duration}</p>
                          {med.instructions && (
                            <p className="text-xs text-blue-600 mt-1">{med.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedRecord(null)} className="flex-1">
                    Close
                  </Button>
                  {selectedRecord.fileUrl && (
                    <Button className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600">
                      Download File
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
