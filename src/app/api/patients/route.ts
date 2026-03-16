import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch patients for doctors or single patient details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors can view patient list
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can view patient list" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    // If patientId is provided, fetch single patient details
    if (patientId) {
      const patient = await prisma.user.findUnique({
        where: { id: patientId, role: "PATIENT" },
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              age: true,
              gender: true,
              bloodGroup: true,
              phone: true,
              allergies: true,
            },
          },
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        patient: {
          id: patient.id,
          name: `${patient.profile?.firstName || ""} ${patient.profile?.lastName || ""}`.trim(),
          email: patient.email,
          age: patient.profile?.age,
          gender: patient.profile?.gender,
          bloodGroup: patient.profile?.bloodGroup,
          phone: patient.profile?.phone,
          allergies: patient.profile?.allergies,
        },
      });
    }

    // Original list patients logic
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: session.user.id },
      select: { patientId: true },
      distinct: ["patientId"],
    });

    const patientIds = appointments.map(
      (a: { patientId: string }) => a.patientId,
    );

    // If no appointments, get all patients (for demo purposes)
    // Removed demo logic for fetching all patients
    const patients = await prisma.user.findMany({
      where:
        patientIds.length > 0
          ? { id: { in: patientIds }, role: "PATIENT" }
          : { role: "PATIENT" },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            bloodGroup: true,
            allergies: true,
            gender: true,
          },
        },
      },
      take: 20,
    });

    // Format response with additional computed fields
    const formattedPatients = patients.map((patient: any, index: number) => {
      const age = patient.profile?.dateOfBirth
        ? Math.floor(
            (new Date().getTime() -
              new Date(patient.profile.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null;

      return {
        id: patient.id,
        patientId: `P-${1234 + index}`, // Display ID
        name: patient.profile
          ? `${patient.profile.firstName} ${patient.profile.lastName}`
          : patient.email.split("@")[0],
        email: patient.email,
        age,
        phone: patient.profile?.phone || null,
        bloodGroup: patient.profile?.bloodGroup || null,
        allergies: patient.profile?.allergies || null,
        gender: patient.profile?.gender || null,
      };
    });

    return NextResponse.json({ patients: formattedPatients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 },
    );
  }
}
