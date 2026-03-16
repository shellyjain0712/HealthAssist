import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 },
      );
    }

    // Get ALL appointments for this doctor (no filters)
    const allAppointments = await prisma.appointment.findMany({
      where: { doctorId },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        patientId: true,
      },
      orderBy: { date: "asc" },
    });

    console.log("\n=== ALL APPOINTMENTS FOR DOCTOR ===");
    console.log(`Doctor ID: ${doctorId}`);
    console.log(`Total appointments: ${allAppointments.length}`);
    allAppointments.forEach((apt) => {
      console.log(
        `  - Date: ${apt.date instanceof Date ? apt.date.toISOString() : apt.date} | Time: ${apt.time} | Status: ${apt.status}`,
      );
    });
    console.log("=== END ===\n");

    return NextResponse.json(
      {
        message: "Debug endpoint",
        doctorId,
        totalAppointments: allAppointments.length,
        appointments: allAppointments.map((apt) => ({
          id: apt.id,
          date: apt.date instanceof Date ? apt.date.toISOString() : apt.date,
          time: apt.time,
          status: apt.status,
          patientId: apt.patientId,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug endpoint error", details: String(error) },
      { status: 500 },
    );
  }
}
