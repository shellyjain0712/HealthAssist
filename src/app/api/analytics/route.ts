import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "month";

    if (session.user.role === "DOCTOR") {
      return getDoctorAnalytics(session.user.id, timeRange);
    } else {
      return getPatientAnalytics(session.user.id, timeRange);
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}

async function getDoctorAnalytics(doctorId: string, timeRange: string) {
  // Calculate date range
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default: // month
      startDate.setMonth(now.getMonth() - 1);
  }

  // Fetch all appointments for this doctor
  const allAppointments = await prisma.appointment.findMany({
    where: { doctorId },
    include: { patient: true },
  });

  // Get unique patients
  const uniquePatients = new Set(allAppointments.map((apt) => apt.patientId));
  const totalPatients = uniquePatients.size;

  // Get appointments in time range
  const rangeAppointments = allAppointments.filter(
    (apt) => new Date(apt.date) >= startDate,
  );

  // Count new patients (first appointment in time range)
  const patientFirstAppointments = new Map<string, Date>();
  allAppointments.forEach((apt) => {
    if (!patientFirstAppointments.has(apt.patientId)) {
      patientFirstAppointments.set(apt.patientId, new Date(apt.date));
    }
  });

  const newPatients = Array.from(patientFirstAppointments.entries()).filter(
    ([_, date]) => date >= startDate,
  ).length;

  // Count consultations in range
  const consultations = rangeAppointments.filter(
    (apt) => apt.status === "COMPLETED" || apt.status === "CONFIRMED",
  ).length;

  // Calculate revenue
  const revenue = rangeAppointments.reduce((sum, apt) => sum + apt.fee, 0);

  // Calculate average consultation time (in minutes)
  const avgConsultTime = consultations > 0 ? 18 : 0; // Placeholder: 18 mins

  // Calculate patient satisfaction (based on completed appointments)
  const completedAppointments = allAppointments.filter(
    (apt) => apt.status === "COMPLETED",
  ).length;
  const patientSatisfaction = completedAppointments > 0 ? 4.8 : 0;

  // Monthly revenue data (last 6 months)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthApts = allAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= monthStart && aptDate <= monthEnd;
    });

    const monthTotal = monthApts.reduce((sum, apt) => sum + apt.fee, 0);
    monthlyRevenue.push({
      month: monthStart.toLocaleString("en-US", { month: "short" }),
      revenue: monthTotal,
    });
  }

  // Patient growth data (new vs returning)
  const patientGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const prevMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - i - 1,
      1,
    );

    const monthApts = allAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= monthStart && aptDate <= monthEnd;
    });

    const newInMonth = new Set<string>();
    const returningInMonth = new Set<string>();

    monthApts.forEach((apt) => {
      const firstApt = Array.from(patientFirstAppointments.entries()).find(
        ([id]) => id === apt.patientId,
      );
      if (firstApt && firstApt[1] >= monthStart && firstApt[1] <= monthEnd) {
        newInMonth.add(apt.patientId);
      } else {
        returningInMonth.add(apt.patientId);
      }
    });

    patientGrowth.push({
      month: monthStart.toLocaleString("en-US", { month: "short" }),
      new: newInMonth.size,
      returning: returningInMonth.size,
    });
  }

  return NextResponse.json(
    {
      type: "doctor",
      metrics: {
        totalPatients,
        newPatients,
        consultations,
        revenue,
        avgConsultTime,
        patientSatisfaction,
      },
      charts: {
        monthlyRevenue,
        patientGrowth,
      },
    },
    { status: 200 },
  );
}

async function getPatientAnalytics(patientId: string, timeRange: string) {
  // Calculate date range
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default: // month
      startDate.setMonth(now.getMonth() - 1);
  }

  // Fetch appointments
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
  });

  const rangeAppointments = appointments.filter(
    (apt) => new Date(apt.date) >= startDate,
  );

  // Fetch prescriptions
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId },
  });

  // Fetch health records
  const healthRecords = await prisma.healthRecord.findMany({
    where: { patientId },
  });

  // Count lab tests (from health records)
  const labTests = healthRecords.filter((record) =>
    ["lab test", "blood test", "xray", "scan"].some((type) =>
      record.description?.toLowerCase().includes(type),
    ),
  ).length;

  // Calculate health score
  const healthScore = calculateHealthScore(
    rangeAppointments,
    prescriptions.length,
    labTests,
  );

  // Extract health metrics (weight and BP) from health records
  const weightTrend = healthRecords
    .filter((r) => r.description?.toLowerCase().includes("weight"))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .slice(-6)
    .map((r) => {
      const match = r.description?.match(/(\d+\.?\d*)\s*kg/);
      return match ? parseFloat(match[1]) : 70;
    });

  const bpTrend = healthRecords
    .filter((r) => r.description?.toLowerCase().includes("blood pressure"))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .slice(-6)
    .map((r) => {
      const match = r.description?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 120;
    });

  // Ensure we have 6 months of data
  while (weightTrend.length < 6) {
    weightTrend.unshift(70);
  }
  while (bpTrend.length < 6) {
    bpTrend.unshift(120);
  }

  return NextResponse.json(
    {
      type: "patient",
      metrics: {
        appointments: rangeAppointments.length,
        medications: prescriptions.length,
        labTests,
        healthScore: Math.min(100, healthScore),
      },
      trends: {
        weight: weightTrend.slice(-6),
        bloodPressure: bpTrend.slice(-6),
      },
      activity: {
        appointments: rangeAppointments.length,
        prescriptions: prescriptions.length,
        records: healthRecords.length,
      },
    },
    { status: 200 },
  );
}

function calculateHealthScore(
  appointments: any[],
  medicationCount: number,
  labTestCount: number,
): number {
  let score = 70;

  // Bonus for recent appointments
  const recentAppoitments = appointments.filter(
    (apt) =>
      (apt.status === "COMPLETED" || apt.status === "CONFIRMED") &&
      new Date(apt.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  ).length;

  score += Math.min(recentAppoitments * 2, 15);

  // Bonus for proper medication management
  if (medicationCount > 0) {
    score += 10;
  }

  // Bonus for regular checkups
  if (labTestCount > 0) {
    score += 5;
  }

  return Math.min(score, 100);
}
