import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

// GET - Fetch patients for doctors
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only doctors can view patient list
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "DOCTOR") {
      return NextResponse.json({ error: "Only doctors can view patient list" }, { status: 403 })
    }

    // Get patients who have had appointments with this doctor
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: session.user.id },
      select: { patientId: true },
      distinct: ["patientId"]
    })

    const patientIds = appointments.map(a => a.patientId)

    // If no appointments, get all patients (for demo purposes)
    const patients = await prisma.user.findMany({
      where: patientIds.length > 0 
        ? { id: { in: patientIds }, role: "PATIENT" }
        : { role: "PATIENT" },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            bloodGroup: true,
            allergies: true,
            gender: true,
          }
        }
      },
      take: 20
    })

    // Format response with additional computed fields
    const formattedPatients = patients.map((patient, index) => {
      const age = patient.profile?.dateOfBirth 
        ? Math.floor((new Date().getTime() - new Date(patient.profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null

      return {
        id: patient.id,
        patientId: `P-${1234 + index}`, // Display ID
        name: patient.profile 
          ? `${patient.profile.firstName} ${patient.profile.lastName}`
          : patient.email.split("@")[0],
        email: patient.email,
        age,
        phone: patient.profile?.phone || null,
        bloodGroup: patient.profile?.bloodGroup || null,
        allergies: patient.profile?.allergies || null,
        gender: patient.profile?.gender || null,
      }
    })

    return NextResponse.json({ patients: formattedPatients })

  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    )
  }
}
