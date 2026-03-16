"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface HealthRecord {
  id: string
  title: string
  category: string
  description?: string
  fileUrl?: string
  fileName?: string
  recordDate: string
  createdAt: string
}

interface Patient {
  id: string
  name: string
  email: string
  age?: number
  gender?: string
  bloodGroup?: string
}

export default function PatientRecordsPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (patientId) {
      fetchPatientAndRecords()
    }
  }, [patientId])

  const fetchPatientAndRecords = async () => {
    try {
      setLoading(true)

      // Fetch patient details
      const patientRes = await fetch(`/api/patients?patientId=${patientId}`)
      if (patientRes.ok) {
        const patientData = await patientRes.json()
        setPatient(patientData.patient)
      }

      // Fetch patient records
      const recordsRes = await fetch(`/api/records?patientId=${patientId}`)
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json()
        setRecords(recordsData.records || [])
      }
    } catch (error) {
      console.error("Error fetching patient data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      if (fileUrl.startsWith("data:")) {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = fileName
        link.click()
      } else {
        const response = await fetch(fileUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "LAB_RESULT":
        return "bg-blue-100 text-blue-700"
      case "PRESCRIPTION":
        return "bg-green-100 text-green-700"
      case "TEST_REPORT":
        return "bg-purple-100 text-purple-700"
      case "DIAGNOSIS":
        return "bg-orange-100 text-orange-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
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
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medical Records</h1>
              {patient && (
                <p className="text-sm text-gray-500">{patient.name}</p>
              )}
            </div>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => router.push(`/patients/${patientId}/records/upload`)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Record
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Patient Info Card */}
        {patient && (
          <Card className="border bg-white shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Name</p>
                  <p className="text-base font-medium text-gray-900 mt-1">{patient.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Email</p>
                  <p className="text-base font-medium text-gray-900 mt-1">{patient.email}</p>
                </div>
                {patient.age && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Age</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{patient.age} years</p>
                  </div>
                )}
                {patient.bloodGroup && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Blood Group</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{patient.bloodGroup}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records List */}
        <div className="space-y-4">
          {records.length === 0 ? (
            <Card className="border bg-white shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No records found</h3>
                <p className="text-gray-500 mt-1">Add medical records to get started</p>
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => router.push(`/patients/${patientId}/records/upload`)}
                >
                  Add First Record
                </Button>
              </CardContent>
            </Card>
          ) : (
            records.map((record) => (
              <Card key={record.id} className="border bg-white shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{record.title}</h3>
                          {record.description && (
                            <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryColor(record.category)}`}>
                              {record.category.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(record.recordDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {record.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(record.fileUrl!, record.fileName || record.title)}
                        className="ml-4 flex-shrink-0"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
