"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PatientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const filters = [
    { id: "all", name: "All Patients" },
    { id: "active", name: "Active" },
    { id: "critical", name: "Critical" },
    { id: "stable", name: "Stable" },
    { id: "new", name: "New Patients" },
  ]

  const patients = [
    { id: 1, name: "Rahul Sharma", age: 45, gender: "Male", phone: "+91 98765-43210", email: "rahul.sharma@email.com", condition: "Hypertension", status: "stable", lastVisit: "Jan 10, 2026", nextVisit: "Feb 10, 2026", bloodGroup: "A+", insurance: "Star Health" },
    { id: 2, name: "Priyanka Verma", age: 32, gender: "Female", phone: "+91 98765-43211", email: "priyanka.verma@email.com", condition: "Type 2 Diabetes", status: "active", lastVisit: "Jan 8, 2026", nextVisit: "Jan 22, 2026", bloodGroup: "O+", insurance: "ICICI Lombard" },
    { id: 3, name: "Amit Kumar", age: 58, gender: "Male", phone: "+91 98765-43212", email: "amit.kumar@email.com", condition: "Coronary Artery Disease", status: "critical", lastVisit: "Jan 12, 2026", nextVisit: "Jan 15, 2026", bloodGroup: "B+", insurance: "HDFC ERGO" },
    { id: 4, name: "Sunita Devi", age: 28, gender: "Female", phone: "+91 98765-43213", email: "sunita.devi@email.com", condition: "Arrhythmia", status: "new", lastVisit: "Jan 11, 2026", nextVisit: "Jan 25, 2026", bloodGroup: "AB+", insurance: "Max Bupa" },
    { id: 5, name: "Vikash Gupta", age: 67, gender: "Male", phone: "+91 98765-43214", email: "vikash.gupta@email.com", condition: "Heart Failure", status: "critical", lastVisit: "Jan 9, 2026", nextVisit: "Jan 14, 2026", bloodGroup: "A-", insurance: "Ayushman Bharat" },
    { id: 6, name: "Meera Nair", age: 52, gender: "Female", phone: "+91 98765-43215", email: "meera.nair@email.com", condition: "Hypertension", status: "stable", lastVisit: "Jan 5, 2026", nextVisit: "Feb 5, 2026", bloodGroup: "O-", insurance: "Star Health" },
    { id: 7, name: "Deepak Joshi", age: 41, gender: "Male", phone: "+91 98765-43216", email: "deepak.joshi@email.com", condition: "Atrial Fibrillation", status: "active", lastVisit: "Jan 7, 2026", nextVisit: "Jan 21, 2026", bloodGroup: "B-", insurance: "ICICI Lombard" },
    { id: 8, name: "Kavitha Menon", age: 35, gender: "Female", phone: "+91 98765-43217", email: "kavitha.menon@email.com", condition: "Heart Murmur", status: "stable", lastVisit: "Dec 28, 2025", nextVisit: "Mar 28, 2026", bloodGroup: "AB-", insurance: "HDFC ERGO" },
  ]

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all" || p.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading patients...</p>
        </div>
      </div>
    )
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
            <div>
              <span className="font-bold text-gray-800 text-lg">My Patients</span>
              <span className="text-xs text-emerald-600 block">Doctor Portal</span>
            </div>
          </div>

          <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{patients.filter(p => p.status === "active").length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{patients.filter(p => p.status === "critical").length}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </CardContent>
          </Card>
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{patients.filter(p => p.status === "stable").length}</p>
              <p className="text-sm text-gray-500">Stable</p>
            </CardContent>
          </Card>
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{patients.filter(p => p.status === "new").length}</p>
              <p className="text-sm text-gray-500">New</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="mb-6">
          <div className="relative mb-4">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search patients by name, condition, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-5 bg-white shadow-sm border"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedFilter === filter.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                  }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="border bg-white shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {patient.name.split(" ").map(n => n[0]).join("")}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{patient.name}</h3>
                        <p className="text-gray-500">{patient.age} years • {patient.gender} • {patient.bloodGroup}</p>
                        <p className="text-sm text-emerald-600 font-medium mt-1">{patient.condition}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${patient.status === "stable" ? "bg-emerald-100 text-emerald-700" :
                        patient.status === "active" ? "bg-blue-100 text-blue-700" :
                          patient.status === "critical" ? "bg-red-100 text-red-700" :
                            "bg-purple-100 text-purple-700"
                        }`}>
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Last Visit</p>
                        <p className="text-sm font-medium text-gray-900">{patient.lastVisit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Next Visit</p>
                        <p className="text-sm font-medium text-gray-900">{patient.nextVisit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{patient.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Insurance</p>
                        <p className="text-sm font-medium text-gray-900">{patient.insurance}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Button size="sm" variant="outline">View Records</Button>
                      <Button size="sm" variant="outline">Write Prescription</Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        Schedule Follow-up
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <Card className="border bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No patients found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
