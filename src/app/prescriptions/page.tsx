"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PrescriptionsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"active" | "past">("active")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const prescriptions = {
    active: [
      {
        id: 1,
        name: "Metformin 500mg",
        dosage: "1 tablet twice daily",
        duration: "3 months",
        doctor: "Dr. Neha Reddy",
        hospital: "Medanta Hospital",
        startDate: "Jan 5, 2026",
        endDate: "Apr 5, 2026",
        refillsLeft: 2,
        instructions: "Take with meals. Avoid alcohol.",
        medications: [
          { name: "Metformin 500mg", quantity: "60 tablets", frequency: "Twice daily" },
        ]
      },
      {
        id: 2,
        name: "Blood Pressure Control",
        dosage: "1 tablet daily",
        duration: "Ongoing",
        doctor: "Dr. Priya Sharma",
        hospital: "Apollo Heart Centre",
        startDate: "Dec 15, 2025",
        endDate: "Ongoing",
        refillsLeft: 5,
        instructions: "Take in the morning. Monitor BP regularly.",
        medications: [
          { name: "Amlodipine 5mg", quantity: "30 tablets", frequency: "Once daily" },
          { name: "Losartan 50mg", quantity: "30 tablets", frequency: "Once daily" },
        ]
      },
      {
        id: 3,
        name: "Vitamin D Supplement",
        dosage: "1 capsule weekly",
        duration: "2 months",
        doctor: "Dr. Rajesh Patel",
        hospital: "Fortis Hospital",
        startDate: "Jan 1, 2026",
        endDate: "Mar 1, 2026",
        refillsLeft: 1,
        instructions: "Take with fatty food for better absorption.",
        medications: [
          { name: "Vitamin D3 60000 IU", quantity: "8 capsules", frequency: "Weekly" },
        ]
      },
    ],
    past: [
      {
        id: 4,
        name: "Antibiotic Course",
        dosage: "1 tablet thrice daily",
        duration: "7 days",
        doctor: "Dr. Neha Reddy",
        hospital: "Medanta Hospital",
        startDate: "Nov 10, 2025",
        endDate: "Nov 17, 2025",
        refillsLeft: 0,
        instructions: "Complete the full course.",
        medications: [
          { name: "Amoxicillin 500mg", quantity: "21 tablets", frequency: "Three times daily" },
        ]
      },
      {
        id: 5,
        name: "Pain Relief",
        dosage: "As needed",
        duration: "5 days",
        doctor: "Dr. Vikram Singh",
        hospital: "AIIMS Delhi",
        startDate: "Oct 20, 2025",
        endDate: "Oct 25, 2025",
        refillsLeft: 0,
        instructions: "Take only when needed. Max 3 tablets per day.",
        medications: [
          { name: "Ibuprofen 400mg", quantity: "15 tablets", frequency: "As needed" },
        ]
      },
    ]
  }

  const [expandedPrescription, setExpandedPrescription] = useState<number | null>(null)

  if (status === "loading") {
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
            { key: "active", label: "Active", count: prescriptions.active.length },
            { key: "past", label: "Past", count: prescriptions.past.length },
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
          {prescriptions[activeTab].map((rx) => (
            <Card key={rx.id} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedPrescription(expandedPrescription === rx.id ? null : rx.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{rx.name}</h3>
                          <p className="text-gray-500">{rx.dosage}</p>
                          <p className="text-sm text-gray-400 mt-1">{rx.doctor} • {rx.hospital}</p>
                        </div>
                        {activeTab === "active" && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mt-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">{rx.startDate} - {rx.endDate}</span>
                        </div>
                        {activeTab === "active" && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm">{rx.refillsLeft} refills left</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedPrescription === rx.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {expandedPrescription === rx.id && (
                  <div className="px-6 pb-6 pt-0">
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Medications</h4>
                      <div className="space-y-2">
                        {rx.medications.map((med, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{med.name}</p>
                              <p className="text-sm text-gray-500">{med.frequency}</p>
                            </div>
                            <span className="text-sm text-gray-600">{med.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800">Instructions</p>
                        <p className="text-sm text-yellow-700">{rx.instructions}</p>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="flex-1">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download PDF
                        </Button>
                        {activeTab === "active" && (
                          <Button className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Request Refill
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
