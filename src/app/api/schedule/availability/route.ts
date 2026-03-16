import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  reason?: string;
}

interface DailySchedule {
  date: string;
  dayOfWeek: string;
  slots: TimeSlot[];
  isWorkingDay: boolean;
}

// Helper to convert time string (HH:MM) to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper to convert minutes to time string (HH:MM)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

// Helper to format time 12-hour
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const daysAhead = parseInt(searchParams.get("daysAhead") || "30");

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 },
      );
    }

    // Verify doctor exists
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, role: true },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const timeSlots = [
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
    ];

    const schedule: DailySchedule[] = [];
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);

    // Fetch doctor's working hours - use any to bypass type checking issue
    const workingHours = (await (prisma as any).workingHours.findMany({
      where: { doctorId },
    })) as any[];

    // Get all appointments (no date filter yet - we'll filter in code to handle timezone issues)
    const allAppointments = (await prisma.appointment.findMany({
      where: {
        doctorId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: { date: true, time: true, status: true },
      orderBy: { date: "asc" },
    })) as any[];

    console.log(`\n=== AVAILABILITY DEBUG ===`);
    console.log(`Doctor ID: ${doctorId}`);
    console.log(`Request date param: ${date}`);
    console.log(`Start date: ${startDate.toISOString()}`);
    console.log(`Days ahead: ${daysAhead}`);
    console.log(
      `Found ${allAppointments.length} PENDING/CONFIRMED appointments`,
    );

    // Helper to format date as YYYY-MM-DD
    const formatDate = (d: Date | string): string => {
      let dateObj: Date;
      if (d instanceof Date) {
        dateObj = d;
      } else {
        dateObj = new Date(d);
      }
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    allAppointments.forEach((apt: any) => {
      const aptDate = formatDate(apt.date);
      console.log(`  ✓ ${aptDate} @ ${apt.time} (${apt.status})`);
    });
    console.log(`=== END DEBUG ===\n`);

    // Filter and map appointments to the date range, converting dates to YYYY-MM-DD format for comparison
    const appointmentsByDate = new Map<string, any[]>();
    allAppointments.forEach((apt: any) => {
      const aptDateStr = formatDate(apt.date);

      if (!appointmentsByDate.has(aptDateStr)) {
        appointmentsByDate.set(aptDateStr, []);
      }
      appointmentsByDate.get(aptDateStr)!.push(apt);
    });

    // Fetch blocked slots - gracefully handle if model doesn't exist
    let blockedSlots: any[] = [];
    try {
      blockedSlots = await (prisma as any).blockedSlot.findMany({
        where: { doctorId },
      });
    } catch (error) {
      console.warn("BlockedSlot query failed, using empty array:", error);
      blockedSlots = [];
    }

    // Generate schedule for each day
    for (let i = 0; i < daysAhead; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      const dayOfWeek = currentDate.getDay();
      const dateString = formatDate(currentDate);
      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      // Check if doctor works on this day
      const daySchedule = workingHours.find(
        (wh: any) => wh.dayOfWeek === dayOfWeek,
      );
      const isWorkingDay = daySchedule?.isWorkingDay ?? true;

      // Skip if not a working day
      if (!isWorkingDay) {
        schedule.push({
          date: dateString,
          dayOfWeek: dayName,
          slots: [],
          isWorkingDay: false,
        });
        continue;
      }

      // Check for blocked slots on this date
      const dayBlockedSlots = blockedSlots.filter((bs: any) => {
        const bsDateStr = formatDate(bs.date);
        return bsDateStr === dateString;
      });

      // Get appointments for this specific date using string matching
      const dayAppointments = appointmentsByDate.get(dateString) || [];

      console.log(`\nDate: ${dateString}`);
      console.log(`  Booked appointments: ${dayAppointments.length}`);
      dayAppointments.forEach((apt: any) => {
        console.log(`    - ${apt.time} (${apt.status})`);
      });

      const bookedTimes = dayAppointments.map((apt: any) => apt.time);

      // Generate time slots with availability
      const slots: TimeSlot[] = timeSlots.map((slot) => {
        const slotTime24 = convertTo24Hour(slot);
        const slotMinutes = timeToMinutes(slotTime24);

        // Check if booked
        if (bookedTimes.includes(slot)) {
          return {
            time: slot,
            isAvailable: false,
            reason: "Booked by another patient",
          };
        }

        // Check if blocked
        const isBlocked = dayBlockedSlots.some((bs: any) => {
          const startMin = timeToMinutes(bs.startTime);
          const endMin = timeToMinutes(bs.endTime);
          return slotMinutes >= startMin && slotMinutes < endMin;
        });

        if (isBlocked) {
          const blockedReason = dayBlockedSlots.find((bs: any) => {
            const startMin = timeToMinutes(bs.startTime);
            const endMin = timeToMinutes(bs.endTime);
            return slotMinutes >= startMin && slotMinutes < endMin;
          })?.reason;

          return {
            time: slot,
            isAvailable: false,
            reason: `Doctor blocked time (${blockedReason || "Unavailable"})`,
          };
        }

        // Check working hours
        if (daySchedule) {
          const workStartMin = timeToMinutes(daySchedule.startTime);
          const workEndMin = timeToMinutes(daySchedule.endTime);

          if (slotMinutes < workStartMin || slotMinutes >= workEndMin) {
            return {
              time: slot,
              isAvailable: false,
              reason: "Outside working hours",
            };
          }
        }

        return { time: slot, isAvailable: true };
      });

      schedule.push({
        date: dateString,
        dayOfWeek: dayName,
        slots,
        isWorkingDay: true,
      });
    }

    return NextResponse.json({ schedule }, { status: 200 });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}

// Helper function to convert 12-hour format to 24-hour
function convertTo24Hour(time12: string): string {
  const [time, period] = time12.split(" ");
  const [hoursNum, minutes] = time.split(":").map(Number);
  let hours = hoursNum;

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}
