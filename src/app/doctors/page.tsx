"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

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

export default function DoctorsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("all")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedSpecialty !== "all") {
        params.append("specialty", selectedSpecialty)
      }
      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(`/api/doctors?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setDoctors(data.doctors)
        // Update specialties from API response
        if (data.specialties && data.specialties.length > 0) {
          setSpecialties(data.specialties)
        }
        setError(null)
      } else {
        setError(data.error || "Failed to fetch doctors")
      }
    } catch (err) {
      setError("Failed to fetch doctors")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedSpecialty, searchQuery])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchDoctors()
    }
  }, [status, fetchDoctors])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "authenticated") {
        fetchDoctors()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedSpecialty, status, fetchDoctors])

  if (status === "loading" || (status === "authenticated" && loading && doctors.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading doctors...</p>
        </div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    const parts = name.replace("Dr. ", "").split(" ")
    return parts.map(p => p[0]).join("").toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-lg">Find Doctors</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search & Filters */}
        <div className="mb-6">
          <div className="relative mb-4">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search doctors by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-5 bg-white shadow-sm border"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedSpecialty("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedSpecialty === "all"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                }`}
            >
              All Specialties
            </button>
            {specialties.map((specialty) => (
              <button
                key={specialty.id}
                onClick={() => setSelectedSpecialty(specialty.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${selectedSpecialty === specialty.name
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                  }`}
              >
                <span>{specialty.icon}</span>
                <span>{specialty.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedSpecialty === specialty.name ? "bg-white/20" : "bg-emerald-100 text-emerald-700"}`}>
                  {specialty.doctorCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border bg-red-50 shadow-sm mb-6">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchDoctors} className="mt-2">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          {loading ? "Searching..." : `${doctors.length} doctor${doctors.length !== 1 ? "s" : ""} found`}
        </p>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="border bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                      {doctor.profileImage ? (
                        <img src={doctor.profileImage} alt={doctor.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        getInitials(doctor.name)
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{doctor.name}</h3>
                          <p className="text-emerald-600 font-medium">{doctor.specialtyName}</p>
                          {doctor.city && <p className="text-sm text-gray-500">{doctor.city}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">₹{doctor.fee}</p>
                          <p className="text-xs text-gray-500">per visit</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-sm">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-medium">{(doctor.rating ?? 0).toFixed(1)}</span>
                          <span className="text-gray-400">({doctor.reviews})</span>
                        </span>
                        <span className="text-sm text-gray-500">{doctor.experience}</span>
                      </div>

                      {doctor.bio && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{doctor.bio}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${doctor.available ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                    <span className="text-sm text-gray-600">
                      {doctor.available ? "Available for booking" : "Currently unavailable"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600"
                    onClick={() => router.push(`/appointments/book?doctor=${doctor.id}`)}
                    disabled={!doctor.available}
                  >
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && doctors.length === 0 && (
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No doctors found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery || selectedSpecialty !== "all"
                  ? "Try adjusting your search or filters"
                  : "No doctors have registered yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
