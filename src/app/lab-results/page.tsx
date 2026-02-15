"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface TestReport {
  id: string
  title: string
  description: string
  category: string
  status: string
  fileName: string | null
  fileUrl: string | null
  fileType: string | null
  recordDate: string
  patient?: {
    id: string
    name: string
    email: string
  }
  doctor?: {
    id: string
    name: string
  }
  createdAt: string
}

interface Doctor {
  id: string
  name: string
  specialtyName: string
}

export default function TestReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "reviewed">("all")
  const [reports, setReports] = useState<TestReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "LAB_REPORT",
    recordDate: new Date().toISOString().split("T")[0],
    doctorId: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)

  const isDoctor = session?.user?.role === "DOCTOR"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchReports()
      if (session.user.role === "PATIENT") {
        fetchDoctors()
      }
    }
  }, [session])

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true)
      const response = await fetch("/api/doctors")
      if (response.ok) {
        const data = await response.json()
        setDoctors(data.doctors || [])
      }
    } catch (error) {
      console.error("Error fetching doctors:", error)
    } finally {
      setLoadingDoctors(false)
    }
  }

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/records?category=LAB_REPORT")
      if (response.ok) {
        const data = await response.json()
        setReports(data.records || [])
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }
      // Check file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF and image files (JPEG, PNG) are allowed")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title) {
      alert("Please select a file and enter a title")
      return
    }

    if (!uploadForm.doctorId) {
      alert("Please select a doctor to send the report to")
      return
    }

    setIsUploading(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.readAsDataURL(selectedFile)
      reader.onload = async () => {
        const base64 = reader.result as string

        const response = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...uploadForm,
            fileName: selectedFile.name,
            fileData: base64,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
          }),
        })

        if (response.ok) {
          setShowUploadModal(false)
          setSelectedFile(null)
          setUploadForm({
            title: "",
            description: "",
            category: "LAB_REPORT",
            recordDate: new Date().toISOString().split("T")[0],
            doctorId: "",
          })
          fetchReports()
        } else {
          const error = await response.json()
          alert(error.error || "Failed to upload report")
        }
        setIsUploading(false)
      }
    } catch (error) {
      console.error("Error uploading report:", error)
      alert("Failed to upload report")
      setIsUploading(false)
    }
  }

  const handleDownload = async (report: TestReport) => {
    if (!report.fileUrl) {
      alert("No file available for download")
      return
    }

    try {
      // Create a link and trigger download
      const link = document.createElement("a")
      link.href = report.fileUrl
      link.download = report.fileName || `report-${report.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading file:", error)
      alert("Failed to download file")
    }
  }

  const handleMarkAsReviewed = async (reportId: string) => {
    try {
      const response = await fetch(`/api/records/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "NORMAL" }),
      })

      if (response.ok) {
        fetchReports()
      }
    } catch (error) {
      console.error("Error updating report:", error)
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "pending" && report.status === "PENDING_REVIEW") ||
      (filterStatus === "reviewed" && report.status !== "PENDING_REVIEW")
    return matchesSearch && matchesFilter
  })

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading test reports...</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">Test Reports</span>
                <span className="text-xs text-emerald-600 block">
                  {isDoctor ? "View & Review Reports" : "Upload & Manage Reports"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isDoctor && (
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Report
                </Button>
              )}
              <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                {reports.filter((r) => r.status === "PENDING_REVIEW").length} Pending Review
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                  <p className="text-sm text-gray-600">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.status === "PENDING_REVIEW").length}
                  </p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.status !== "PENDING_REVIEW").length}
                  </p>
                  <p className="text-sm text-gray-600">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.fileUrl).length}
                  </p>
                  <p className="text-sm text-gray-600">With Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder={isDoctor ? "Search by patient name or test type..." : "Search by test type..."}
                  className="pl-10 bg-white border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className={filterStatus === "all" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  onClick={() => setFilterStatus("pending")}
                  className={filterStatus === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === "reviewed" ? "default" : "outline"}
                  onClick={() => setFilterStatus("reviewed")}
                  className={filterStatus === "reviewed" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  Reviewed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test Reports Found</h3>
              <p className="text-gray-500 mb-4">
                {isDoctor
                  ? "No patient reports to review at the moment."
                  : "Upload your first test report to get started."}
              </p>
              {!isDoctor && (
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600"
                >
                  Upload Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className={`border-0 shadow-lg bg-white/70 backdrop-blur-sm overflow-hidden ${report.status === "CRITICAL" ? "ring-2 ring-red-500" : ""
                  }`}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div
                      className={`w-2 ${report.status === "CRITICAL"
                        ? "bg-red-500"
                        : report.status === "ABNORMAL"
                          ? "bg-yellow-500"
                          : report.status === "PENDING_REVIEW"
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                    />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-full flex items-center justify-center">
                            {report.fileType?.includes("pdf") ? (
                              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{report.title}</h3>
                            {isDoctor && report.patient && (
                              <p className="text-sm text-gray-500">Patient: {report.patient.name}</p>
                            )}
                            {report.fileName && (
                              <p className="text-xs text-gray-400 mt-1">{report.fileName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === "PENDING_REVIEW"
                              ? "bg-yellow-100 text-yellow-700"
                              : report.status === "ABNORMAL"
                                ? "bg-orange-100 text-orange-700"
                                : report.status === "CRITICAL"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                          >
                            {report.status === "PENDING_REVIEW"
                              ? "Pending Review"
                              : report.status === "NORMAL"
                                ? "Reviewed - Normal"
                                : report.status}
                          </span>
                        </div>
                      </div>

                      {report.description && (
                        <p className="mt-3 text-sm text-gray-600">{report.description}</p>
                      )}

                      <div className="mt-4 flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(report.recordDate).toLocaleDateString()}</span>
                        </div>
                        {report.doctor && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{report.doctor.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => setSelectedReport(report)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                          View Details
                        </Button>
                        {report.fileUrl && (
                          <Button variant="outline" onClick={() => handleDownload(report)}>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                          </Button>
                        )}
                        {isDoctor && report.status === "PENDING_REVIEW" && (
                          <Button variant="outline" onClick={() => handleMarkAsReviewed(report.id)}>
                            Mark as Reviewed
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upload Test Report</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFile(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Complete Blood Count"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any notes or description..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="recordDate">Test Date *</Label>
                  <Input
                    id="recordDate"
                    type="date"
                    value={uploadForm.recordDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, recordDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="doctor">Send to Doctor *</Label>
                  <select
                    id="doctor"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    value={uploadForm.doctorId}
                    onChange={(e) => setUploadForm({ ...uploadForm, doctorId: e.target.value })}
                    disabled={loadingDoctors}
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialtyName}
                      </option>
                    ))}
                  </select>
                  {loadingDoctors && (
                    <p className="text-sm text-gray-500 mt-1">Loading doctors...</p>
                  )}
                  {!loadingDoctors && doctors.length === 0 && (
                    <p className="text-sm text-orange-500 mt-1">No doctors available</p>
                  )}
                </div>

                <div>
                  <Label>Upload File (PDF or Image, max 10MB)</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600">Click to select file</p>
                        <p className="text-sm text-gray-400 mt-1">PDF, JPEG, or PNG</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowUploadModal(false)
                      setSelectedFile(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile || !uploadForm.title || !uploadForm.doctorId}
                  >
                    {isUploading ? "Uploading..." : "Upload Report"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border-0 shadow-2xl max-h-[90vh] overflow-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {isDoctor && selectedReport.patient && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600 font-medium">Patient Information</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedReport.patient.name}</p>
                    <p className="text-sm text-gray-600">{selectedReport.patient.email}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Test Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedReport.recordDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-semibold ${selectedReport.status === "PENDING_REVIEW" ? "text-yellow-600" :
                      selectedReport.status === "NORMAL" ? "text-emerald-600" :
                        selectedReport.status === "ABNORMAL" ? "text-orange-600" :
                          "text-red-600"
                      }`}>
                      {selectedReport.status.replace("_", " ")}
                    </p>
                  </div>
                </div>

                {selectedReport.description && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-900">{selectedReport.description}</p>
                  </div>
                )}

                {selectedReport.fileUrl && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">Attached File</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{selectedReport.fileName}</p>
                        <p className="text-sm text-gray-500">{selectedReport.fileType}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedReport(null)}>
                    Close
                  </Button>
                  {selectedReport.fileUrl && (
                    <Button
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                      onClick={() => handleDownload(selectedReport)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
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
