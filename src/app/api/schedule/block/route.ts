import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, time } = await request.json();

    if (!date || !time) {
      return NextResponse.json(
        { error: "Date and time are required" },
        { status: 400 }
      );
    }

    // Here you would actually create a blocked time slot in your database
    // For now, we'll just return success
    // Example: await prisma.blockedSlot.create({ data: { doctorId: session.user.id, date, time } })

    return NextResponse.json({
      success: true,
      message: "Time slot blocked successfully",
      data: { date, time },
    });
  } catch (error) {
    console.error("Error blocking time slot:", error);
    return NextResponse.json(
      { error: "Failed to block time slot" },
      { status: 500 }
    );
  }
}
