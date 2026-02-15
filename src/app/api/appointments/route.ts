import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET - Fetch appointments for the logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build where clause based on user role
    const where: { patientId?: string; doctorId?: string } = {};

    if (session.user.role === "DOCTOR") {
      where.doctorId = session.user.id;
    } else {
      where.patientId = session.user.id;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: { profile: true },
        },
        doctor: {
          include: { profile: true },
        },
      },
      orderBy: { date: "desc" },
    });

    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      date: apt.date.toISOString(),
      time: apt.time,
      reason: apt.reason,
      notes: apt.notes,
      status: apt.status.toLowerCase(),
      fee: apt.fee,
      doctor: {
        id: apt.doctor.id,
        name: `Dr. ${apt.doctor.profile?.firstName || ""} ${
          apt.doctor.profile?.lastName || ""
        }`.trim(),
        specialty: apt.doctor.profile?.specialization || "General Physician",
        hospital: apt.doctor.profile?.city || "",
        phone: apt.doctor.profile?.phone || "",
      },
      patient: {
        id: apt.patient.id,
        name: `${apt.patient.profile?.firstName || ""} ${
          apt.patient.profile?.lastName || ""
        }`.trim(),
        email: apt.patient.email,
        phone: apt.patient.profile?.phone || "",
      },
      createdAt: apt.createdAt.toISOString(),
    }));

    return NextResponse.json(
      { appointments: formattedAppointments },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST - Create a new appointment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { doctorId, date, time, reason } = body;

    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { error: "Doctor, date, and time are required" },
        { status: 400 }
      );
    }

    // Get doctor info
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: { profile: true },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check for existing appointment at same time
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: new Date(date),
        time,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: session.user.id,
        doctorId,
        date: new Date(date),
        time,
        reason: reason || null,
        fee: doctor.profile?.consultationFee || 500,
        status: "PENDING",
      },
      include: {
        doctor: { include: { profile: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Appointment booked successfully",
        appointment: {
          id: appointment.id,
          date: appointment.date.toISOString(),
          time: appointment.time,
          status: appointment.status.toLowerCase(),
          fee: appointment.fee,
          doctor: {
            name: `Dr. ${appointment.doctor.profile?.firstName || ""} ${
              appointment.doctor.profile?.lastName || ""
            }`.trim(),
            specialty:
              appointment.doctor.profile?.specialization || "General Physician",
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
