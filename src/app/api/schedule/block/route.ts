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
        { error: "Only doctors can block time slots" },
        { status: 403 },
      );
    }

    const { date, startTime, endTime, reason } = await request.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Date, startTime, and endTime are required" },
        { status: 400 },
      );
    }

    // Create blocked slot in database
    const blockedSlot = await prisma.blockedSlot.create({
      data: {
        doctorId: session.user.id,
        date: new Date(date),
        startTime,
        endTime,
        reason: reason || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Time slot blocked successfully",
        blockedSlot,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error blocking time slot:", error);
    return NextResponse.json(
      { error: "Failed to block time slot" },
      { status: 500 },
    );
  }
}

// GET - Fetch blocked slots for the doctor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId") || session.user.id;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { doctorId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const blockedSlots = await prisma.blockedSlot.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ blockedSlots }, { status: 200 });
  } catch (error) {
    console.error("Error fetching blocked slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked slots" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a blocked slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get("blockId");

    if (!blockId) {
      return NextResponse.json(
        { error: "Block ID is required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const block = await prisma.blockedSlot.findUnique({
      where: { id: blockId },
    });

    if (!block || block.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Blocked slot not found or unauthorized" },
        { status: 404 },
      );
    }

    await prisma.blockedSlot.delete({
      where: { id: blockId },
    });

    return NextResponse.json(
      { message: "Blocked slot deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting blocked slot:", error);
    return NextResponse.json(
      { error: "Failed to delete blocked slot" },
      { status: 500 },
    );
  }
}
