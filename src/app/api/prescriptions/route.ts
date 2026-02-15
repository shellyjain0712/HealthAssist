import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

// GET - Fetch prescriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const status = searchParams.get("status")

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    // Build where clause
    const whereClause: Record<string, unknown> = {
      category: "PRESCRIPTION"
    }

    if (user?.role === "DOCTOR") {
      // Doctors can see prescriptions they created
      whereClause.doctorId = session.user.id
      if (patientId) {
        whereClause.patientId = patientId
      }
    } else {
      // Patients can only see their own prescriptions
      whereClause.patientId = session.user.id
    }

    if (status) {
      whereClause.status = status
    }

    const prescriptions = await prisma.healthRecord.findMany({
      where: whereClause,
      include: {
        patient: {
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
              }
            }
          }
        },
        doctor: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                specialization: true,
                licenseNumber: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ prescriptions })

  } catch (error) {
    console.error("Error fetching prescriptions:", error)
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    )
  }
}

// POST - Create new prescription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only doctors can create prescriptions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "DOCTOR") {
      return NextResponse.json({ error: "Only doctors can create prescriptions" }, { status: 403 })
    }

    const body = await request.json()
    const { patientId, medications, notes, isDraft } = body

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    if (!medications || medications.length === 0) {
      return NextResponse.json({ error: "At least one medication is required" }, { status: 400 })
    }

    // Verify patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Create prescription as a health record
    const prescription = await prisma.healthRecord.create({
      data: {
        patientId,
        doctorId: session.user.id,
        title: `Prescription for ${patient.profile?.firstName || "Patient"} ${patient.profile?.lastName || ""}`.trim(),
        description: notes || null,
        category: "PRESCRIPTION",
        status: isDraft ? "PENDING_REVIEW" : "ACTIVE",
        medications: JSON.stringify(medications),
        notes: notes || null,
        recordDate: new Date(),
        expiryDate: calculateExpiryDate(medications),
      },
      include: {
        patient: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        doctor: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                specialization: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: isDraft ? "Draft saved successfully" : "Prescription created successfully",
      prescription
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating prescription:", error)
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    )
  }
}

// Helper function to calculate expiry date based on longest medication duration
function calculateExpiryDate(medications: Array<{ duration: string }>): Date {
  const durationMap: Record<string, number> = {
    "5 days": 5,
    "7 days": 7,
    "10 days": 10,
    "14 days": 14,
    "21 days": 21,
    "1 month": 30,
    "2 months": 60,
    "3 months": 90,
    "6 months": 180,
    "Ongoing": 365,
  }

  let maxDays = 7 // Default 7 days

  for (const med of medications) {
    const days = durationMap[med.duration] || 7
    if (days > maxDays) {
      maxDays = days
    }
  }

  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + maxDays)
  return expiryDate
}
