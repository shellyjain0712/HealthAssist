import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface Notification {
  id: string;
  type: "confirmed" | "cancelled" | "pending" | "completed";
  title: string;
  message: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  createdAt: Date;
}

// GET - Fetch all notifications for the logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For patients, show notifications from their appointments
    // For doctors, show notifications from their patient appointments
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
      orderBy: { updatedAt: "desc" },
    });

    // Generate notifications from appointments
    const notifications: Notification[] = appointments.map((apt) => {
      let type: "confirmed" | "cancelled" | "pending" | "completed" = "pending";
      let title = "";
      let message = "";

      const doctorName = `Dr. ${apt.doctor.profile?.firstName || ""} ${
        apt.doctor.profile?.lastName || ""
      }`.trim();

      const appointmentDate = new Date(apt.date).toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      if (apt.status === "CONFIRMED") {
        type = "confirmed";
        if (session.user.role === "DOCTOR") {
          title = "Appointment Confirmed";
          message = `You confirmed appointment with ${apt.patient.profile?.firstName || "Patient"} ${apt.patient.profile?.lastName || ""}`;
        } else {
          title = "Appointment Confirmed";
          message = `Your appointment with ${doctorName} has been confirmed`;
        }
      } else if (apt.status === "CANCELLED") {
        type = "cancelled";
        if (session.user.role === "DOCTOR") {
          title = "Appointment Cancelled";
          message = `You cancelled appointment with ${apt.patient.profile?.firstName || "Patient"} ${apt.patient.profile?.lastName || ""}`;
        } else {
          title = "Appointment Cancelled";
          message = `Your appointment with ${doctorName} has been cancelled`;
        }
      } else if (apt.status === "COMPLETED") {
        type = "completed";
        if (session.user.role === "DOCTOR") {
          title = "Appointment Completed";
          message = `Appointment with ${apt.patient.profile?.firstName || "Patient"} ${apt.patient.profile?.lastName || ""} completed`;
        } else {
          title = "Appointment Completed";
          message = `Your appointment with ${doctorName} has been completed`;
        }
      } else if (apt.status === "PENDING") {
        type = "pending";
        if (session.user.role === "DOCTOR") {
          title = "New Appointment Request";
          message = `${apt.patient.profile?.firstName || "Patient"} ${apt.patient.profile?.lastName || ""} booked an appointment`;
        } else {
          title = "Appointment Pending";
          message = `Your appointment with ${doctorName} is pending confirmation`;
        }
      }

      return {
        id: apt.id,
        type,
        title,
        message,
        doctorName:
          session.user.role === "DOCTOR"
            ? apt.patient.profile?.firstName || "Patient"
            : doctorName,
        appointmentDate,
        appointmentTime: apt.time,
        createdAt: apt.updatedAt,
      };
    });

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
