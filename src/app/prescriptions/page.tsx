"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface PatientProfile {
  firstName: string
  lastName: string
  phone: string | null
  dateOfBirth: string | null
  bloodGroup: string | null
  allergies: string | null
}

interface DoctorProfile {
  firstName: string
  lastName: string
  specialization: string | null
  licenseNumber: string | null
}

interface Prescription {
  id: string
  title: string
  description: string | null
  status: string
  recordDate: string
  expiryDate: string | null
  medications: string
  notes: string | null
  patient: {
    id: string
    email: string
    profile: PatientProfile | null
  }
  doctor: {
    id: string
    email: string
    profile: DoctorProfile | null
  }
}

export default function PrescriptionsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"active" | "past">("active")
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null)

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/prescriptions")
      const data = await response.json()

      if (response.ok) {
        setPrescriptions(data.prescriptions || [])
      }
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchPrescriptions()
    }
  }, [status, router, fetchPrescriptions])

  // Parse medications and filter by status
  const activePrescriptions = prescriptions.filter(p => p.status === "ACTIVE")
  const pastPrescriptions = prescriptions.filter(p =>
    p.status === "COMPLETED" || p.status === "EXPIRED" || p.status === "CANCELLED"
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const parseMedications = (medicationsJson: string): Medication[] => {
    try {
      return JSON.parse(medicationsJson)
    } catch {
      return []
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading prescriptions...</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">My Prescriptions</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "active", label: "Active", count: activePrescriptions.length },
            { key: "past", label: "Past", count: pastPrescriptions.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.key
                ? "bg-orange-600 text-white shadow-lg"
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

        {/* Prescriptions List */}
        <div className="space-y-4">
          {(activeTab === "active" ? activePrescriptions : pastPrescriptions).length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium text-lg">No {activeTab} prescriptions</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your {activeTab} prescriptions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            (activeTab === "active" ? activePrescriptions : pastPrescriptions).map((rx) => {
              const medications = parseMedications(rx.medications)
              const patientName = rx.patient?.profile
                ? `${rx.patient.profile.firstName} ${rx.patient.profile.lastName}`
                : rx.patient?.email || "Unknown Patient"
              const doctorName = rx.doctor?.profile
                ? `Dr. ${rx.doctor.profile.firstName} ${rx.doctor.profile.lastName}`
                : rx.doctor?.email || "Unknown Doctor"

              return (
                <Card key={rx.id} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all overflow-hidden">
                  <CardContent className="p-0">
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedPrescription(expandedPrescription === rx.id ? null : rx.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-lg">{rx.title}</h3>
                              <p className="text-gray-600 mt-1">Patient: {patientName}</p>
                              <p className="text-sm text-gray-500 mt-1">{doctorName}</p>
                              {medications.length > 0 && (
                                <p className="text-sm text-gray-400 mt-1">{medications.length} medication{medications.length > 1 ? 's' : ''}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {rx.status === "ACTIVE" && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                  Active
                                </span>
                              )}
                              {rx.status === "PENDING_REVIEW" && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                  Draft
                                </span>
                              )}
                              {(rx.status === "COMPLETED" || rx.status === "EXPIRED") && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  {rx.status === "COMPLETED" ? "Completed" : "Expired"}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mt-3 flex-wrap">
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm">
                                Issued: {formatDate(rx.recordDate)}
                                {rx.expiryDate && ` • Expires: ${formatDate(rx.expiryDate)}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedPrescription === rx.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {expandedPrescription === rx.id && (
                      <div className="px-6 pb-6 pt-0">
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="font-medium text-gray-900 mb-3">Medications</h4>
                          <div className="space-y-3">
                            {medications.map((med, index) => (
                              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{index + 1}. {med.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      <span className="font-medium">Dosage:</span> {med.dosage}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Frequency:</span> {med.frequency}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Duration:</span> {med.duration}
                                    </p>
                                    {med.instructions && (
                                      <p className="text-sm text-gray-500 mt-2 italic">
                                        Instructions: {med.instructions}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {rx.notes && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm font-medium text-yellow-800">Additional Notes</p>
                              <p className="text-sm text-yellow-700 mt-1">{rx.notes}</p>
                            </div>
                          )}

                          {rx.patient?.profile?.allergies && (
                            <div className="mt-4 p-3 bg-red-50 rounded-lg">
                              <p className="text-sm font-medium text-red-800">Patient Allergies</p>
                              <p className="text-sm text-red-700 mt-1">{rx.patient.profile.allergies}</p>
                            </div>
                          )}

                          <div className="flex gap-3 mt-4">
                            <Button variant="outline" className="flex-1">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download PDF
                            </Button>
                            <Button variant="outline" className="flex-1">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
