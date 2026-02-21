import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { day, startTime, endTime } = await request.json();

    if (!day || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Day, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Here you would actually update working hours in your database
    // For now, we'll just return success
    // Example: await prisma.workingHours.upsert({ where: { doctorId_day }, data: { startTime, endTime } })

    return NextResponse.json({
      success: true,
      message: "Working hours updated successfully",
      data: { day, startTime, endTime },
    });
  } catch (error) {
    console.error("Error updating working hours:", error);
    return NextResponse.json(
      { error: "Failed to update working hours" },
      { status: 500 }
    );
  }
}
