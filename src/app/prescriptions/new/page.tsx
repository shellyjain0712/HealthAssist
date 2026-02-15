"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

interface Patient {
  id: string
  patientId: string
  name: string
  email: string
  age: number | null
  phone: string | null
  bloodGroup: string | null
  allergies: string | null
  gender: string | null
}

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export default function NewPrescriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPatient, setSelectedPatient] = useState("")
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ])
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch patients from API
  const fetchPatients = useCallback(async () => {
    try {
      setLoadingPatients(true)
      const response = await fetch("/api/patients")
      const data = await response.json()
      if (response.ok) {
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error)
    } finally {
      setLoadingPatients(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
    if (status === "authenticated") {
      fetchPatients()
    }
  }, [status, router, fetchPatients])

  const commonMedications = [
    "Lisinopril", "Metformin", "Atorvastatin", "Amlodipine", "Omeprazole",
    "Metoprolol", "Losartan", "Gabapentin", "Hydrochlorothiazide", "Sertraline"
  ]

  const frequencies = [
    "Once daily", "Twice daily", "Three times daily", "Four times daily",
    "Every 4 hours", "Every 6 hours", "Every 8 hours", "Every 12 hours",
    "As needed", "Before meals", "After meals", "At bedtime"
  ]

  const durations = [
    "5 days", "7 days", "10 days", "14 days", "21 days",
    "1 month", "2 months", "3 months", "6 months", "Ongoing"
  ]

  // Quick templates
  const templates = [
    {
      name: "Hypertension Standard",
      meds: [
        { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "1 month", instructions: "Take in the morning" },
        { name: "Losartan", dosage: "50mg", frequency: "Once daily", duration: "1 month", instructions: "Monitor blood pressure regularly" },
      ]
    },
    {
      name: "Diabetes Type 2",
      meds: [
        { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "3 months", instructions: "Take with meals" },
        { name: "Glimepiride", dosage: "2mg", frequency: "Once daily", duration: "3 months", instructions: "Take before breakfast" },
        { name: "Atorvastatin", dosage: "10mg", frequency: "Once daily", duration: "3 months", instructions: "Take at bedtime" },
      ]
    },
    {
      name: "Respiratory Infection",
      meds: [
        { name: "Azithromycin", dosage: "500mg", frequency: "Once daily", duration: "5 days", instructions: "Take with or without food" },
        { name: "Montelukast", dosage: "10mg", frequency: "Once daily", duration: "14 days", instructions: "Take at bedtime" },
      ]
    },
    {
      name: "Pain Management",
      meds: [
        { name: "Ibuprofen", dosage: "400mg", frequency: "Three times daily", duration: "7 days", instructions: "Take after food" },
        { name: "Pantoprazole", dosage: "40mg", frequency: "Once daily", duration: "7 days", instructions: "Take before breakfast" },
      ]
    },
  ]

  const applyTemplate = (templateName: string) => {
    const template = templates.find(t => t.name === templateName)
    if (template) {
      setMedications(template.meds)
    }
  }

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }])
  }

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...medications]
    updated[index] = { ...updated[index], [field]: value }
    setMedications(updated)
  }

  const validateForm = () => {
    if (!selectedPatient) {
      alert("Please select a patient")
      return false
    }
    
    const validMeds = medications.filter(med => med.name && med.dosage && med.frequency && med.duration)
    if (validMeds.length === 0) {
      alert("Please add at least one medication with all required fields")
      return false
    }
    
    return true
  }

  const handleCreatePrescription = async (isDraft: boolean = false) => {
    if (!validateForm()) return

    try {
      setSubmitting(true)
      
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient,
          medications: medications.filter(med => med.name && med.dosage),
          notes: additionalNotes,
          isDraft,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(isDraft ? "Draft saved successfully!" : "Prescription created successfully!")
        router.push("/prescriptions")
      } else {
        alert(data.error || "Failed to create prescription")
      }
    } catch (error) {
      console.error("Error creating prescription:", error)
      alert("Failed to create prescription")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintPreview = () => {
    if (!validateForm()) return
    setShowPrintPreview(true)
  }

  const handlePrint = () => {
    window.print()
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const selectedPatientData = patients.find(p => p.id === selectedPatient)

  // Print preview modal component
  const PrintPreviewModal = () => {
    if (!showPrintPreview || !selectedPatientData) return null

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Print Preview</h2>
            <button onClick={() => setShowPrintPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div ref={printRef} className="p-8 print:p-4" id="prescription-print">
            {/* Header */}
            <div className="text-center border-b-2 border-emerald-500 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-emerald-700">Smart Health Companion</h1>
              <p className="text-gray-600">Digital Prescription</p>
            </div>

            {/* Doctor & Date Info */}
            <div className="flex justify-between mb-6">
              <div>
                <p className="font-semibold text-gray-900">Dr. {session?.user?.name || "Doctor"}</p>
                <p className="text-sm text-gray-600">License: MED-XXXXX</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Date: {today}</p>
                <p className="text-sm text-gray-600">Rx No: RX-{Date.now().toString().slice(-6)}</p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-semibold text-gray-900">{selectedPatientData.name}</p>
              <p className="text-sm text-gray-600">
                {selectedPatientData.age ? `Age: ${selectedPatientData.age} years` : ""} 
                {selectedPatientData.gender ? ` • ${selectedPatientData.gender}` : ""}
                {selectedPatientData.bloodGroup ? ` • Blood Group: ${selectedPatientData.bloodGroup}` : ""}
              </p>
              {selectedPatientData.allergies && (
                <p className="text-sm text-red-600 mt-1">⚠️ Allergies: {selectedPatientData.allergies}</p>
              )}
            </div>

            {/* Medications */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-emerald-600">℞</span> Medications
              </h3>
              <div className="space-y-3">
                {medications.filter(med => med.name).map((med, index) => (
                  <div key={index} className="border-l-4 border-emerald-500 pl-4 py-2">
                    <p className="font-semibold text-gray-900">{index + 1}. {med.name} - {med.dosage}</p>
                    <p className="text-sm text-gray-600">{med.frequency} for {med.duration}</p>
                    {med.instructions && (
                      <p className="text-sm text-gray-500 italic">Instructions: {med.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            {additionalNotes && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-2">Additional Notes</h3>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">{additionalNotes}</p>
              </div>
            )}

            {/* Signature */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="text-right">
                <div className="inline-block">
                  <div className="h-12 w-32 border-b border-gray-400 mb-1"></div>
                  <p className="text-sm text-gray-600">Doctor&apos;s Signature</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>This is a digitally generated prescription from Smart Health Companion</p>
              <p>For queries, contact: support@smarthealthcompanion.com</p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex gap-3">
            <Button onClick={handlePrint} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
            <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <PrintPreviewModal />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/prescriptions")} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">New Prescription</span>
                <span className="text-xs text-emerald-600 block">Create & Send</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Select Patient</CardTitle>
                <CardDescription>Choose the patient for this prescription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loadingPatients ? (
                    <div className="text-center py-8 text-gray-500">Loading patients...</div>
                  ) : patients.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No patients found</p>
                      <p className="text-sm text-gray-400 mt-1">Patients will appear here after they book appointments with you</p>
                    </div>
                  ) : (
                    patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedPatient === patient.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300 bg-white"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                              <span className="font-bold text-gray-600">{patient.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{patient.name}</p>
                              <p className="text-sm text-gray-500">{patient.patientId} • {patient.age ? `Age: ${patient.age}` : "Age: N/A"}</p>
                            </div>
                          </div>
                          {patient.allergies && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                              Has Allergies
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Medications</CardTitle>
                    <CardDescription>Add one or more medications</CardDescription>
                  </div>
                  <Button onClick={addMedication} variant="outline" size="sm" className="gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {medications.map((med, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl bg-white relative">
                    {medications.length > 1 && (
                      <button
                        onClick={() => removeMedication(index)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="text-emerald-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-700">Medication {index + 1}</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700">Medication Name</Label>
                        <Input
                          list={`medications-${index}`}
                          placeholder="Type or select..."
                          value={med.name}
                          onChange={(e) => updateMedication(index, "name", e.target.value)}
                          className="mt-1 bg-white"
                        />
                        <datalist id={`medications-${index}`}>
                          {commonMedications.map(m => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <Label className="text-gray-700">Dosage</Label>
                        <Input
                          placeholder="e.g., 10mg, 500mg"
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700">Frequency</Label>
                        <select
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                          className="mt-1 w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-gray-900"
                        >
                          <option value="">Select frequency...</option>
                          {frequencies.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700">Duration</Label>
                        <select
                          value={med.duration}
                          onChange={(e) => updateMedication(index, "duration", e.target.value)}
                          className="mt-1 w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-gray-900"
                        >
                          <option value="">Select duration...</option>
                          {durations.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-gray-700">Special Instructions</Label>
                        <Textarea
                          placeholder="e.g., Take with food, avoid dairy products..."
                          value={med.instructions}
                          onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                          className="mt-1 bg-white"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
                <CardDescription>Any special instructions or warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter any additional notes for the patient or pharmacist..."
                  className="bg-white"
                  rows={4}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Preview */}
          <div className="space-y-6">
            {/* Patient Summary */}
            {selectedPatientData && (
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Patient Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <span className="font-bold text-white text-lg">{selectedPatientData.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedPatientData.name}</p>
                      <p className="text-sm text-gray-500">{selectedPatientData.patientId}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Age</span>
                      <span className="font-medium text-gray-900">{selectedPatientData.age ? `${selectedPatientData.age} years` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Blood Group</span>
                      <span className="font-medium text-gray-900">{selectedPatientData.bloodGroup || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Allergies</span>
                      <span className={`font-medium ${selectedPatientData.allergies ? "text-red-600" : "text-gray-900"}`}>
                        {selectedPatientData.allergies || "None reported"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Templates */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => applyTemplate(template.name)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.meds.length} medications</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  onClick={() => handleCreatePrescription(false)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Create Prescription
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleCreatePrescription(true)}
                  disabled={submitting}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save as Draft
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handlePrintPreview}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Preview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
