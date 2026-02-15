import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// PATCH - Update appointment status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (status && !validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      appointment.patientId !== session.user.id &&
      appointment.doctorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Patients can only cancel
    if (
      session.user.role !== "DOCTOR" &&
      status &&
      status.toUpperCase() !== "CANCELLED"
    ) {
      return NextResponse.json(
        { error: "Patients can only cancel appointments" },
        { status: 403 }
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(
      {
        message: "Appointment updated successfully",
        appointment: {
          id: updatedAppointment.id,
          status: updatedAppointment.status.toLowerCase(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel an appointment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (
      appointment.patientId !== session.user.id &&
      appointment.doctorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json(
      { message: "Appointment cancelled" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
