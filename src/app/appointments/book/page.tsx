"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"

interface Doctor {
  id: string
  name: string
  email: string
  specialty: string
  specialtyName: string
  experience: string
  education: string
  bio: string
  fee: number
  phone: string
  city: string
  profileImage: string | null
  available: boolean
  rating: number
  reviews: number
}

interface Specialty {
  id: string
  name: string
  icon: string
  doctorCount: number
}

function BookAppointmentContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedDoctorId = searchParams.get("doctor")
  const preselectedSpecialty = searchParams.get("specialty")
  const urgencyLevel = searchParams.get("urgency")
  const symptomsContext = searchParams.get("symptoms")
  const aiContext = searchParams.get("context")

  const [step, setStep] = useState(preselectedDoctorId ? 2 : preselectedSpecialty ? 2 : 1)
  const [selectedSpecialty, setSelectedSpecialty] = useState(preselectedSpecialty || "")
  const [selectedDoctor, setSelectedDoctor] = useState(preselectedDoctorId || "")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [reason, setReason] = useState(symptomsContext || "")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSpecialties, setLoadingSpecialties] = useState(true)
  const [booking, setBooking] = useState(false)
  const [previousRecords, setPreviousRecords] = useState<any[]>([])
  const [previousPrescriptions, setPreviousPrescriptions] = useState<any[]>([])

  // Fetch patient history (records & prescriptions)
  const fetchPatientHistory = useCallback(async () => {
    try {
      const [recordsRes, prescriptionsRes] = await Promise.all([
        fetch("/api/records"),
        fetch("/api/prescriptions"),
      ])

      const recordsData = await recordsRes.json()
      const prescriptionsData = await prescriptionsRes.json()

      if (recordsRes.ok) {
        setPreviousRecords(recordsData.records || [])
      }
      if (prescriptionsRes.ok) {
        setPreviousPrescriptions(prescriptionsData.prescriptions || [])
      }
    } catch (err) {
      console.error("Failed to fetch patient history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // Fetch specialties on mount
  const fetchSpecialties = useCallback(async () => {
    try {
      setLoadingSpecialties(true)
      const response = await fetch("/api/doctors")
      const data = await response.json()

      if (response.ok && data.specialties) {
        setSpecialties(data.specialties)
      }
    } catch (err) {
      console.error("Failed to fetch specialties:", err)
    } finally {
      setLoadingSpecialties(false)
    }
  }, [])

  const fetchDoctors = useCallback(async (specialty?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (specialty) {
        params.append("specialty", specialty)
      }

      const response = await fetch(`/api/doctors?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setDoctors(data.doctors)
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch specialties on component mount
  useEffect(() => {
    fetchSpecialties()
    fetchPatientHistory()
  }, [fetchSpecialties, fetchPatientHistory])

  // Auto-select specialty if provided via URL
  useEffect(() => {
    if (preselectedSpecialty && specialties.length > 0) {
      const matchingSpecialty = specialties.find(
        s => s.name.toLowerCase().includes(preselectedSpecialty.toLowerCase())
      )
      if (matchingSpecialty) {
        setSelectedSpecialty(matchingSpecialty.id)
        fetchDoctors(matchingSpecialty.id)
      } else {
        // If no exact match, still try to fetch doctors by the specialty name
        fetchDoctors(preselectedSpecialty)
      }
    }
  }, [preselectedSpecialty, specialties, fetchDoctors])

  // Fetch all doctors on mount if there's a preselected doctor
  useEffect(() => {
    if (preselectedDoctorId) {
      fetchDoctors()
    }
  }, [preselectedDoctorId, fetchDoctors])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Default specialties to show when no doctors are registered yet
  const defaultSpecialties = [
    { id: "cardiologist", name: "Cardiologist", icon: "❤️", doctorCount: 0 },
    { id: "gynecologist", name: "Gynecologist", icon: "🤰", doctorCount: 0 },
    { id: "pediatric", name: "Pediatric", icon: "👶", doctorCount: 0 },
    { id: "dermatology", name: "Dermatology", icon: "🩹", doctorCount: 0 },
    { id: "orthopedic", name: "Orthopedic", icon: "🦴", doctorCount: 0 },
    { id: "neurology", name: "Neurology", icon: "🧠", doctorCount: 0 },
    { id: "general-physician", name: "General Physician", icon: "👨‍⚕️", doctorCount: 0 },
    { id: "ent-specialist", name: "ENT Specialist", icon: "👂", doctorCount: 0 },
    { id: "ophthalmology", name: "Ophthalmology", icon: "👁️", doctorCount: 0 },
  ]

  // Merge dynamic specialties with defaults (dynamic ones first, then defaults that don't exist)
  const displaySpecialties = specialties.length > 0
    ? [
      ...specialties,
      ...defaultSpecialties.filter(ds =>
        !specialties.some(s => s.name.toLowerCase() === ds.name.toLowerCase())
      )
    ]
    : defaultSpecialties

  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  ]

  const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor)

  const getInitials = (name: string) => {
    const parts = name.replace("Dr. ", "").split(" ")
    return parts.map(p => p[0]).join("").toUpperCase()
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xl font-bold text-gray-800">Book Appointment</span>
            </div>
            <div className="text-sm text-gray-500">Step {step} of 4</div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full transition-all ${s <= step ? "bg-emerald-500" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Step 1: Select Specialty */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Specialty</h2>
            <p className="text-gray-600 mb-6">Choose the type of doctor you want to visit</p>

            {loadingSpecialties ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="p-6 bg-white rounded-2xl shadow-lg animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displaySpecialties.map((specialty) => (
                  <button
                    key={specialty.id}
                    onClick={() => {
                      setSelectedSpecialty(specialty.name)
                      fetchDoctors(specialty.name)
                      setStep(2)
                    }}
                    className={`p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center relative ${selectedSpecialty === specialty.name ? "ring-2 ring-emerald-500" : ""
                      }`}
                  >
                    {specialty.doctorCount > 0 && (
                      <span className="absolute top-2 right-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {specialty.doctorCount} {specialty.doctorCount === 1 ? "doctor" : "doctors"}
                      </span>
                    )}
                    <div className="text-4xl mb-3">{specialty.icon}</div>
                    <h3 className="font-semibold text-gray-900">{specialty.name}</h3>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Doctor</h2>
            <p className="text-gray-600 mb-6">Choose from available doctors</p>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">Loading doctors...</p>
              </div>
            ) : doctors.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No doctors available</h3>
                  <p className="text-gray-500 mt-1">No doctors registered for this specialty yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className={`border-0 shadow-lg bg-white/70 backdrop-blur-sm cursor-pointer transition-all hover:shadow-xl ${selectedDoctor === doctor.id ? "ring-2 ring-emerald-500" : ""
                      } ${!doctor.available ? "opacity-60" : ""}`}
                    onClick={() => doctor.available && setSelectedDoctor(doctor.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                          {doctor.profileImage ? (
                            <img src={doctor.profileImage} alt={doctor.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            getInitials(doctor.name)
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-lg">{doctor.name}</h3>
                            {!doctor.available && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Unavailable</span>
                            )}
                          </div>
                          <p className="text-emerald-600 font-medium">{doctor.specialtyName}</p>
                          {doctor.city && <p className="text-gray-500">{doctor.city}</p>}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {(doctor.rating ?? 0).toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-600">{doctor.experience}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">₹{doctor.fee}</p>
                          <p className="text-sm text-gray-500">per visit</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => { setStep(1); setDoctors([]); setSelectedDoctor(""); }}>Back</Button>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 flex-1"
                onClick={() => setStep(3)}
                disabled={!selectedDoctor}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date & Time</h2>
            <p className="text-gray-600 mb-6">Choose your preferred appointment slot</p>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Select Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${selectedTime === time
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Reason for Visit</CardTitle>
                <CardDescription>Briefly describe your symptoms or reason for appointment</CardDescription>
              </CardHeader>
              <CardContent>
                {urgencyLevel && (
                  <div className={`mb-4 p-3 rounded-lg border-2 flex items-center gap-3 ${urgencyLevel === "EMERGENCY"
                      ? "bg-red-50 border-red-300 text-red-900"
                      : urgencyLevel === "HIGH"
                        ? "bg-orange-50 border-orange-300 text-orange-900"
                        : "bg-amber-50 border-amber-300 text-amber-900"
                    }`}>
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Urgency Level: {urgencyLevel}</p>
                      <p className="text-xs opacity-80">Priority booking recommended based on AI assessment</p>
                    </div>
                  </div>
                )}
                <Textarea
                  placeholder="e.g., Regular checkup, chest pain, follow-up appointment..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
                {aiContext && (
                  <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-xs font-semibold text-teal-900 mb-1">AI Recommendation Context:</p>
                    <p className="text-xs text-teal-800">{aiContext.slice(0, 200)}...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Records & Prescriptions */}
            {(previousRecords.length > 0 || previousPrescriptions.length > 0) && (
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Your Medical History</CardTitle>
                  <CardDescription>Recent records and prescriptions (will be shared with doctor)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {previousRecords.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Recent Medical Records ({previousRecords.length})</p>
                      <div className="space-y-2">
                        {previousRecords.slice(0, 3).map((record: any) => (
                          <div key={record.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-900">{record.title}</p>
                            <p className="text-xs text-blue-700 mt-1">{new Date(record.uploadedAt).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {previousPrescriptions.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Recent Prescriptions ({previousPrescriptions.length})</p>
                      <div className="space-y-2">
                        {previousPrescriptions.slice(0, 3).map((prescription: any) => (
                          <div key={prescription.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm font-medium text-purple-900">
                              {prescription.medications?.[0]?.name || "Prescription"}
                              {prescription.medications?.length > 1 && ` + ${prescription.medications.length - 1} more`}
                            </p>
                            <p className="text-xs text-purple-700 mt-1">
                              Dr. {prescription.doctor?.name} • {new Date(prescription.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 flex-1"
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm Booking */}
        {step === 4 && selectedDoctorInfo && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Booking</h2>
            <p className="text-gray-600 mb-6">Review your appointment details</p>

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedDoctorInfo.profileImage ? (
                      <img src={selectedDoctorInfo.profileImage} alt={selectedDoctorInfo.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      getInitials(selectedDoctorInfo.name)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xl">{selectedDoctorInfo.name}</h3>
                    <p className="text-emerald-600 font-medium">{selectedDoctorInfo.specialtyName}</p>
                    {selectedDoctorInfo.city && <p className="text-gray-500">{selectedDoctorInfo.city}</p>}
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm text-gray-600">{(selectedDoctorInfo.rating ?? 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 py-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold text-gray-900">{selectedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold text-gray-900">{selectedTime}</p>
                    </div>
                  </div>
                </div>

                {reason && (
                  <div className="py-6 border-b border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Reason for Visit</p>
                    <p className="text-gray-900">{reason}</p>
                  </div>
                )}

                <div className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Consultation Fee</p>
                    <p className="text-3xl font-bold text-emerald-600">₹{selectedDoctorInfo.fee}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 flex-1"
                disabled={booking}
                onClick={async () => {
                  try {
                    setBooking(true)

                    // Prepare comprehensive appointment data
                    const appointmentData: any = {
                      doctorId: selectedDoctor,
                      date: selectedDate,
                      time: selectedTime,
                      reason: reason,
                    }

                    // Add urgency level if present
                    if (urgencyLevel) {
                      appointmentData.urgency = urgencyLevel
                    }

                    // Add AI context if present
                    if (aiContext) {
                      appointmentData.aiContext = aiContext
                    }

                    // Add patient history references
                    if (previousRecords.length > 0) {
                      appointmentData.relevantRecords = previousRecords.slice(0, 5).map((r: any) => r.id)
                    }

                    if (previousPrescriptions.length > 0) {
                      appointmentData.relevantPrescriptions = previousPrescriptions.slice(0, 5).map((p: any) => p.id)
                    }

                    const response = await fetch("/api/appointments", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(appointmentData),
                    })

                    const data = await response.json()

                    if (response.ok) {
                      alert("Appointment booked successfully!")
                      router.push("/appointments")
                    } else {
                      alert(data.error || "Failed to book appointment")
                    }
                  } catch (error) {
                    console.error("Booking error:", error)
                    alert("Failed to book appointment")
                  } finally {
                    setBooking(false)
                  }
                }}
              >
                {booking ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BookAppointmentContent />
    </Suspense>
  )
}
