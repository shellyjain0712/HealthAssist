import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch health records for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Build where clause based on user role
    const whereClause: Record<string, unknown> = {};

    if (session.user.role === "PATIENT") {
      whereClause.patientId = session.user.id;
    } else if (session.user.role === "DOCTOR") {
      whereClause.doctorId = session.user.id;
    }

    // Filter by category
    if (category && category !== "all") {
      const categoryMap: Record<string, string> = {
        lab: "LAB_REPORT",
        LAB_REPORT: "LAB_REPORT",
        prescription: "PRESCRIPTION",
        PRESCRIPTION: "PRESCRIPTION",
        imaging: "IMAGING",
        IMAGING: "IMAGING",
        vaccination: "VACCINATION",
        VACCINATION: "VACCINATION",
        diagnosis: "DIAGNOSIS",
        DIAGNOSIS: "DIAGNOSIS",
        surgery: "SURGERY",
        SURGERY: "SURGERY",
        consultation: "CONSULTATION",
        CONSULTATION: "CONSULTATION",
        other: "OTHER",
        OTHER: "OTHER",
      };
      if (categoryMap[category]) {
        whereClause.category = categoryMap[category];
      }
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { diagnosis: { contains: search, mode: "insensitive" } },
      ];
    }

    const records = await prisma.healthRecord.findMany({
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
              },
            },
          },
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
              },
            },
          },
        },
      },
      orderBy: { recordDate: "desc" },
    });

    // Format records for frontend
    const formattedRecords = records.map((record) => ({
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      status: record.status,
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      fileSize: record.fileSize
        ? `${(record.fileSize / (1024 * 1024)).toFixed(1)} MB`
        : null,
      fileType: record.fileType,
      diagnosis: record.diagnosis,
      medications: record.medications ? JSON.parse(record.medications) : null,
      testResults: record.testResults ? JSON.parse(record.testResults) : null,
      notes: record.notes,
      recordDate: record.recordDate.toISOString(),
      expiryDate: record.expiryDate?.toISOString() || null,
      patient: {
        id: record.patient.id,
        name: record.patient.profile
          ? `${record.patient.profile.firstName} ${record.patient.profile.lastName}`
          : record.patient.email,
        email: record.patient.email,
      },
      doctor: record.doctor
        ? {
            id: record.doctor.id,
            name: record.doctor.profile
              ? `Dr. ${record.doctor.profile.firstName} ${record.doctor.profile.lastName}`
              : record.doctor.email,
            specialty: record.doctor.profile?.specialization || "General",
          }
        : null,
      createdAt: record.createdAt.toISOString(),
    }));

    return NextResponse.json({ records: formattedRecords });
  } catch (error) {
    console.error("Error fetching records:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 },
    );
  }
}

// POST - Create a new health record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      status,
      fileName,
      fileUrl,
      fileData, // base64 file data
      fileSize,
      fileType,
      diagnosis,
      medications,
      testResults,
      notes,
      recordDate,
      expiryDate,
      patientId, // Only for doctors adding records
      doctorId: requestDoctorId, // For patients specifying which doctor to send to
    } = body;

    // Validate required fields
    if (!title || !category || !recordDate) {
      return NextResponse.json(
        { error: "Title, category, and record date are required" },
        { status: 400 },
      );
    }

    // Determine patient ID and doctor ID based on role
    let actualPatientId = session.user.id;
    let doctorId = null;

    if (session.user.role === "DOCTOR") {
      if (!patientId) {
        return NextResponse.json(
          { error: "Patient ID is required for doctors" },
          { status: 400 },
        );
      }
      actualPatientId = patientId;
      doctorId = session.user.id;
    } else if (session.user.role === "PATIENT") {
      // Patient can specify a doctor to send the report to
      if (requestDoctorId) {
        doctorId = requestDoctorId;
      }
    }

    // Use base64 fileData as fileUrl if no fileUrl provided
    const actualFileUrl = fileUrl || fileData || null;

    // Map category string to enum
    const categoryMap: Record<string, string> = {
      lab: "LAB_REPORT",
      labreport: "LAB_REPORT",
      lab_report: "LAB_REPORT",
      LAB_REPORT: "LAB_REPORT",
      prescription: "PRESCRIPTION",
      PRESCRIPTION: "PRESCRIPTION",
      imaging: "IMAGING",
      IMAGING: "IMAGING",
      vaccination: "VACCINATION",
      VACCINATION: "VACCINATION",
      diagnosis: "DIAGNOSIS",
      DIAGNOSIS: "DIAGNOSIS",
      surgery: "SURGERY",
      SURGERY: "SURGERY",
      consultation: "CONSULTATION",
      CONSULTATION: "CONSULTATION",
      other: "OTHER",
      OTHER: "OTHER",
    };

    const statusMap: Record<string, string> = {
      normal: "NORMAL",
      abnormal: "ABNORMAL",
      critical: "CRITICAL",
      pendingreview: "PENDING_REVIEW",
      pending_review: "PENDING_REVIEW",
      active: "ACTIVE",
      completed: "COMPLETED",
      expired: "EXPIRED",
    };

    const record = await prisma.healthRecord.create({
      data: {
        title,
        description,
        category: (categoryMap[category.toLowerCase()] ||
          categoryMap[category] ||
          "OTHER") as
          | "LAB_REPORT"
          | "PRESCRIPTION"
          | "IMAGING"
          | "VACCINATION"
          | "DIAGNOSIS"
          | "SURGERY"
          | "CONSULTATION"
          | "OTHER",
        status: status
          ? ((statusMap[status.toLowerCase()] || "PENDING_REVIEW") as
              | "NORMAL"
              | "ABNORMAL"
              | "CRITICAL"
              | "PENDING_REVIEW"
              | "ACTIVE"
              | "COMPLETED"
              | "EXPIRED")
          : "PENDING_REVIEW",
        fileName,
        fileUrl: actualFileUrl,
        fileSize: fileSize ? parseInt(fileSize) : null,
        fileType,
        diagnosis,
        medications: medications ? JSON.stringify(medications) : null,
        testResults: testResults ? JSON.stringify(testResults) : null,
        notes,
        recordDate: new Date(recordDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        patientId: actualPatientId,
        doctorId,
      },
      include: {
        patient: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        doctor: {
          select: {
            email: true,
            profile: {
              select: { firstName: true, lastName: true, specialization: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Record created successfully",
        record: {
          id: record.id,
          title: record.title,
          category: record.category,
          recordDate: record.recordDate,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating record:", error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 },
    );
  }
}
