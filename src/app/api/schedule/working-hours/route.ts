import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can set working hours" },
        { status: 403 },
      );
    }

    const { day, startTime, endTime, isWorkingDay } = await request.json();

    if (day === undefined || !startTime || !endTime) {
      return NextResponse.json(
        {
          error: "Day (0-6), startTime, and endTime are required",
        },
        { status: 400 },
      );
    }

    if (day < 0 || day > 6) {
      return NextResponse.json(
        { error: "Day must be between 0 (Sunday) and 6 (Saturday)" },
        { status: 400 },
      );
    }

    // Upsert working hours
    const workingHours = await prisma.workingHours.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId: session.user.id,
          dayOfWeek: day,
        },
      },
      update: {
        startTime,
        endTime,
        isWorkingDay: isWorkingDay ?? true,
      },
      create: {
        doctorId: session.user.id,
        dayOfWeek: day,
        startTime,
        endTime,
        isWorkingDay: isWorkingDay ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Working hours updated successfully",
        workingHours,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating working hours:", error);
    return NextResponse.json(
      { error: "Failed to update working hours" },
      { status: 500 },
    );
  }
}

// GET - Fetch working hours for a doctor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const session = await getServerSession(authOptions);

    if (!doctorId && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = doctorId || session?.user?.id;

    const workingHours = await prisma.workingHours.findMany({
      where: { doctorId: id },
      orderBy: { dayOfWeek: "asc" },
    });

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const formattedHours = days.map((day, index) => {
      const schedule = workingHours.find((wh) => wh.dayOfWeek === index);
      return {
        day,
        dayOfWeek: index,
        startTime: schedule?.startTime || "09:00",
        endTime: schedule?.endTime || "18:00",
        isWorkingDay: schedule?.isWorkingDay ?? true,
      };
    });

    return NextResponse.json({ workingHours: formattedHours }, { status: 200 });
  } catch (error) {
    console.error("Error fetching working hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch working hours" },
      { status: 500 },
    );
  }
}
