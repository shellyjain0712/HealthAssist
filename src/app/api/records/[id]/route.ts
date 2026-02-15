import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch a single health record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const record = await prisma.healthRecord.findUnique({
      where: { id },
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
                bloodGroup: true,
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
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.role === "PATIENT" &&
      record.patientId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (session.user.role === "DOCTOR" && record.doctorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      record: {
        ...record,
        medications: record.medications ? JSON.parse(record.medications) : null,
        testResults: record.testResults ? JSON.parse(record.testResults) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching record:", error);
    return NextResponse.json(
      { error: "Failed to fetch record" },
      { status: 500 }
    );
  }
}

// PATCH - Update a health record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const record = await prisma.healthRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Check authorization - only the patient (owner) or assigned doctor can update
    if (
      record.patientId !== session.user.id &&
      record.doctorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      title,
      description,
      status,
      diagnosis,
      medications,
      testResults,
      notes,
      expiryDate,
    } = body;

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

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined)
      updateData.status = statusMap[status.toLowerCase()] || status;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (medications !== undefined)
      updateData.medications = JSON.stringify(medications);
    if (testResults !== undefined)
      updateData.testResults = JSON.stringify(testResults);
    if (notes !== undefined) updateData.notes = notes;
    if (expiryDate !== undefined)
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;

    const updatedRecord = await prisma.healthRecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Record updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating record:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a health record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const record = await prisma.healthRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Only the patient (owner) can delete their records
    if (record.patientId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the record owner can delete this record" },
        { status: 403 }
      );
    }

    await prisma.healthRecord.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}
